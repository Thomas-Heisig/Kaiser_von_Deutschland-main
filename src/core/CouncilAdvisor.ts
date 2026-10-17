import { miniCouncilChoice } from './EmbeddedMiniModel';
export type AdvisorBackend = 'off' | 'mini' | 'rules' | 'webgpu' | 'ollama';
export interface AdvisorConfig { backend: AdvisorBackend; model: string; ollamaUrl?: string; ollamaModel?: string; }
const KEY = 'kaiser-ai-settings-v1';
export const DEFAULT_ADVISOR_CONFIG: AdvisorConfig = { backend: 'off', model: 'SmolLM2-360M-Instruct-q4f16_1-MLC' };
export function readAdvisorConfig(): AdvisorConfig {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || '{}') as Partial<AdvisorConfig>;
    return { backend: (['off','mini','rules','webgpu','ollama'] as string[]).includes(data.backend ?? '') ? data.backend as AdvisorBackend : 'off',
      ollamaUrl: typeof data.ollamaUrl === 'string' ? data.ollamaUrl : 'http://localhost:11434',
      ollamaModel: typeof data.ollamaModel === 'string' ? data.ollamaModel : 'gemma3:1b',
      model: typeof data.model === 'string' && /^[a-zA-Z0-9_.-]+$/.test(data.model) ? data.model : DEFAULT_ADVISOR_CONFIG.model };
  } catch { return { ...DEFAULT_ADVISOR_CONFIG }; }
}
export function saveAdvisorConfig(value: AdvisorConfig): void {
  localStorage.setItem(KEY, JSON.stringify(value));
}
interface WebLlmEngine {
  chat: { completions: { create: (input: {
    messages: Array<{ role: string; content: string }>; temperature?: number; max_tokens?: number
  }) => Promise<{ choices?: Array<{message?: { content?: string }}> }> } };
}
export class CouncilAdvisor {
  private engine?: WebLlmEngine;
  private loading?: Promise<WebLlmEngine>;
  public static isWebGpuAvailable(): boolean {
    return typeof navigator !== 'undefined' && 'gpu' in navigator && isSecureContext;
  }
  public static chooseByRules(choices: readonly { id: string; affordable: boolean; probability: number | null }[]): string {
    const affordable = choices.filter(choice => choice.affordable);
    if (!affordable.length) throw new Error('Keine finanzierbare Entscheidung.');
    return [...affordable].sort((a,b) => (b.probability ?? 1) - (a.probability ?? 1))[0].id;
  }
  private async getEngine(model: string): Promise<WebLlmEngine> {
    if (this.engine) return this.engine;
    if (!CouncilAdvisor.isWebGpuAvailable()) throw new Error('WebGPU braucht einen unterstützten Browser und HTTPS.');
    if (!this.loading) {
      this.loading = (async () => {
        // Lazy runtime: downloads model weights locally only after explicit opt-in.
        const moduleUrl = 'https://esm.run/@mlc-ai/web-llm@0.2.80';
        const library = await import(/* @vite-ignore */ moduleUrl) as {
          CreateMLCEngine: (model: string) => Promise<WebLlmEngine>;
        };
        const engine = await library.CreateMLCEngine(model);
        this.engine = engine;
        return engine;
      })();
    }
    try { return await this.loading; }
    catch (error) { this.loading = undefined; throw error; }
  }
  public async suggest(
    config: AdvisorConfig, context: { year: number; title: string; story: string },
    choices: readonly { id: string; title: string; affordable: boolean; probability: number | null }[]
  ): Promise<{ id: string; explanation: string; backend: AdvisorBackend }> {
    const id = CouncilAdvisor.chooseByRules(choices);
    if (config.backend === 'off') throw new Error('KI-Unterstützung ist deaktiviert. Aktiviere sie in den Einstellungen.');
    if (config.backend === 'mini') return { id: miniCouncilChoice({ year: context.year },choices), explanation: 'Integriertes lokales Mininetz: Vorschlag ohne Download und ohne Internet.', backend: 'mini' };
    if (config.backend === 'rules')
      return { id, explanation: 'Regelberater: priorisiert eine bezahlbare, möglichst sichere Maßnahme.', backend: 'rules' };
    if (config.backend === 'ollama') {
      const url = (config.ollamaUrl ?? 'http://localhost:11434').replace(/\/$/, '');
      const allowed = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d{2,5})?$/i.test(url);
      if (!allowed) throw new Error('Ollama wird nur lokal auf localhost zugelassen.');
      const response = await fetch(url + '/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({ model: config.ollamaModel ?? 'gemma3:1b', stream: false,
          messages: [{ role: 'system', content: 'Wähle genau eine der genannten IDs und antworte ausschließlich mit dieser ID.' },
            { role: 'user', content: 'Jahr ' + context.year + ', ' + context.title + ': ' +
              choices.filter(c => c.affordable).map(c => c.id + ':' + c.title).join('; ') }] })
      });
      if (!response.ok) throw new Error('Ollama antwortet nicht: ' + response.status);
      const body = await response.json() as { message?: {content?: string} };
      const picked = choices.find(c => c.affordable && body.message?.content?.trim() === c.id);
      return { id: picked?.id ?? id, explanation: picked ? 'Lokales Ollama-Modell: ' + picked.title : 'Ollama-Antwort ungültig, sichere Regelwahl.', backend: picked ? 'ollama' : 'rules' };
    }
    const engine = await this.getEngine(config.model);
    const options = choices.filter(choice => choice.affordable).map(c => c.id + ': ' + c.title);
    const result = await engine.chat.completions.create({
      messages: [
        { role: 'system', content: 'Du berätst ein historisches Strategiespiel. Gib ausschließlich eine der angebotenen ID-Kennungen zurück. Erfinde keine Spielaktionen. ' },
        { role: 'user', content: 'Jahr ' + context.year + ', ' + context.title + ': ' + context.story.slice(0,450) + '\nOptionen:\n' + options.join('\n') }
      ], temperature: 0.1, max_tokens: 64
    });
    const answer = result.choices?.[0]?.message?.content ?? '';
    const proposed = choices.find(c => c.affordable && new RegExp('(?:^|[^a-z0-9_])' + c.id.replace(/[.*+?^$\{\}()|[\]\\]/g, '\\$&') + '(?:$|[^a-z0-9_])','i').test(answer));
    return { id: proposed?.id ?? id, explanation: proposed ? 'Lokales WebGPU-Modell empfiehlt: ' + proposed.title : 'Ungültige Modellantwort: sicherer Regelvorschlag verwendet.', backend: proposed ? 'webgpu' : 'rules' };
  }
}
