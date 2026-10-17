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
export type AdvisorLoadState = 'idle' | 'loading' | 'ready' | 'error';
export interface AdvisorProgress { state: AdvisorLoadState; percent: number; message: string; }
export class CouncilAdvisor {
  private engine?: WebLlmEngine;
  private modelName?: string;
  private loadState: AdvisorProgress = { state: 'idle', percent: 0, message: 'Modell noch nicht geladen.' };
  public getStatus(): AdvisorProgress { return { ...this.loadState }; }
  private loading?: Promise<WebLlmEngine>;
  public static isWebGpuAvailable(): boolean {
    return typeof navigator !== 'undefined' && 'gpu' in navigator && isSecureContext;
  }
  public static chooseByRules(choices: readonly { id: string; affordable: boolean; probability: number | null }[]): string {
    const affordable = choices.filter(choice => choice.affordable);
    if (!affordable.length) throw new Error('Keine finanzierbare Entscheidung.');
    return [...affordable].sort((a,b) => (b.probability ?? 1) - (a.probability ?? 1))[0].id;
  }

  /** Explicitly start the optional WebGPU model, reporting download and initialization. */
  public async loadModel(config: AdvisorConfig, onProgress?: (state: AdvisorProgress) => void): Promise<void> {
    if (config.backend !== 'webgpu') throw new Error('Bitte zuerst WebGPU als KI-Modus auswählen.');
    await this.getEngine(config.model, onProgress);
  }
  private report(state: AdvisorProgress, callback?: (state: AdvisorProgress) => void): void {
    this.loadState = state;
    callback?.({ ...state });
  }
  private async getEngine(model: string, onProgress?: (state: AdvisorProgress) => void): Promise<WebLlmEngine> {
    if (this.engine && this.modelName === model) {
      this.report({ state: 'ready', percent: 100, message: 'KI-Modell geladen und bereit.' }, onProgress);
      return this.engine;
    }
    if (!CouncilAdvisor.isWebGpuAvailable()) {
      this.report({ state: 'error', percent: 0, message: 'WebGPU nicht verfügbar. HTTPS und GPU-Browserunterstützung prüfen.' }, onProgress);
      throw new Error(this.loadState.message);
    }
    if (this.loading) return this.loading;
    this.report({ state: 'loading', percent: 0, message: 'WebGPU-Laufzeit wird geladen …' }, onProgress);
    this.loading = (async () => {
      const moduleUrl = 'https://esm.run/@mlc-ai/web-llm@0.2.80';
      const library = await import(/* @vite-ignore */ moduleUrl) as {
        CreateMLCEngine: (model: string, options?: {
          initProgressCallback?: (report: { progress: number; text: string }) => void;
        }) => Promise<WebLlmEngine>;
      };
      this.report({ state: 'loading', percent: 1, message: 'KI-Modell wird heruntergeladen und initialisiert …' }, onProgress);
      const loaded = await library.CreateMLCEngine(model, {
        initProgressCallback: progress => {
          const percent = Math.max(0, Math.min(99, Math.round(progress.progress * 100)));
          this.report({ state: 'loading', percent, message: progress.text || 'Modellinitialisierung …' }, onProgress);
        }
      });
      this.engine = loaded;
      this.modelName = model;
      this.report({ state: 'ready', percent: 100, message: 'KI-Modell geladen und bereit.' }, onProgress);
      return loaded;
    })();
    try { return await this.loading; }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.report({ state: 'error', percent: 0, message: 'KI-Laden fehlgeschlagen: ' + message }, onProgress);
      throw error;
    } finally { this.loading = undefined; }
  }
  public async testInference(config: AdvisorConfig): Promise<string> {
    if (config.backend !== 'webgpu') throw new Error('WebGPU auswählen.');
    const engine = await this.getEngine(config.model);
    const result = await engine.chat.completions.create({
      messages: [{ role: 'user', content: 'Antworte mit genau einem Wort: Bereit' }],
      temperature: 0, max_tokens: 16
    });
    const text = result.choices?.[0]?.message?.content?.trim() ?? '';
    if (!text) throw new Error('Das Modell lieferte keine Antwort.');
    return text;
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
