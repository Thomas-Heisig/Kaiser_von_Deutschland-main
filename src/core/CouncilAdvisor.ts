export type AdvisorBackend = 'rules' | 'webgpu';
export interface AdvisorConfig { backend: AdvisorBackend; model: string; }
const KEY = 'kaiser-ai-settings-v1';
export const DEFAULT_ADVISOR_CONFIG: AdvisorConfig = { backend: 'rules', model: 'SmolLM2-360M-Instruct-q4f16_1-MLC' };
export function readAdvisorConfig(): AdvisorConfig {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || '{}') as Partial<AdvisorConfig>;
    return { backend: data.backend === 'webgpu' ? 'webgpu' : 'rules',
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
        const library = await import(/* @vite-ignore */ 'https://esm.run/@mlc-ai/web-llm@0.2.80') as {
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
    if (config.backend === 'rules')
      return { id, explanation: 'Regelberater: priorisiert eine bezahlbare, möglichst sichere Maßnahme.', backend: 'rules' };
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
