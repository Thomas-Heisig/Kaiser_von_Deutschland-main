import { MusicContext, MusicArrangement, MusicVoice, musicArrangement, BEAT_SECONDS, BAR_SECONDS, soundtrackBars, midiFrequency } from './RoyalMusicScore';
export type GameSoundEffect = 'click' | 'success' | 'build' | 'trade' | 'battle' | 'month';

/**
 * Generates original, lightweight music and interface sounds with the Web Audio API.
 */
export class GameAudio {
  public readonly supported: boolean = typeof window !== 'undefined' && typeof window.AudioContext === 'function';
  public musicEnabled: boolean = false;
  public effectsEnabled: boolean = true;
  private context?: AudioContext;
  private musicTimer?: number;
  private musicStep: number = 0;
  private musicContext: MusicContext = { year: 1200, scene: 'menu' };
  private arrangement: MusicArrangement = musicArrangement(this.musicContext);
  private musicGain?: GainNode;
  private musicVolume = 0.28;
  private activeVoices = new Set<OscillatorNode>();
  private readonly visibility = (): void => { if (this.musicEnabled) this.resetMusicSchedule(); };
  private musicStarting: boolean = false;

  /**
   * Creates the audio controller.
   * @param onError Reports errors from browser audio operations.
   * @returns Nothing.
   */
  public constructor(private readonly onError: (error: unknown) => void) {
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', this.visibility);
  }

  public setMusicContext(next: MusicContext): void {
    const arrangement = musicArrangement(next);
    if (JSON.stringify(arrangement) === JSON.stringify(this.arrangement)) return;
    this.musicContext = next;
    this.arrangement = arrangement;
    if (this.musicEnabled) this.resetMusicSchedule();
  }

  public setMusicVolume(value: number): void {
    if (!Number.isFinite(value)) return;
    this.musicVolume = Math.max(0, Math.min(1, value));
    if (this.musicGain && this.context) this.musicGain.gain.setTargetAtTime(this.musicVolume * 0.32, this.context.currentTime, 0.1);
  }
  public getMusicVolume(): number { return this.musicVolume; }
  public getMusicLabel(): string { return this.arrangement.epoch + ' · ' + this.arrangement.scene; }


  /**
   * Toggles the looping background music.
   * @returns A promise that resolves after the browser audio context resumes.
   * @throws If the browser cannot start audio playback.
   */
  public async toggleMusic(): Promise<void> {
    if (this.musicEnabled) {
      this.musicEnabled = false;
      this.resetMusicSchedule();
      return;
    }
    if (this.musicStarting) return;

    this.musicStarting = true;
    try {
      const context = this.getContext();
      await context.resume();
      this.musicEnabled = true;
      this.musicStep = 0;
      this.musicGain ??= context.createGain();
      this.musicGain.connect(context.destination);
      this.musicGain.gain.setValueAtTime(this.musicVolume * 0.32, context.currentTime);
      this.playMusicStep();
    } finally {
      this.musicStarting = false;
    }
  }

  /**
   * Toggles button and gameplay sound effects.
   * @returns Nothing.
   */
  public toggleEffects(): void {
    this.effectsEnabled = !this.effectsEnabled;
  }

  /**
   * Plays a short synthesized gameplay sound.
   * @param effect The sound associated with the completed action.
   * @returns Nothing.
   */
  public playEffect(effect: GameSoundEffect): void {
    if (!this.supported || !this.effectsEnabled) return;

    try {
      const context = this.getContext();
      void context.resume()
        .then((): void => this.playEffectNotes(context, effect))
        .catch((error: unknown): void => this.onError(error));
    } catch (error) {
      this.onError(error);
    }
  }

  /**
   * Stops scheduled music and releases the browser audio context.
   * @returns Nothing.
   */
  public dispose(): void {
    this.musicEnabled = false;
    this.resetMusicSchedule();
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', this.visibility);
    if (this.context && this.context.state !== 'closed') {
      void this.context.close().catch((error: unknown): void => this.onError(error));
    }
  }

  private getContext(): AudioContext {
    if (!this.supported) throw new Error('Dieser Browser unterstützt Web Audio nicht.');
    this.context ??= new window.AudioContext();
    return this.context;
  }

  private resetMusicSchedule(): void {
    window.clearTimeout(this.musicTimer);
    this.musicTimer = undefined;
    if (this.context && this.musicGain) {
      this.musicGain.gain.setTargetAtTime(0, this.context.currentTime, 0.16);
    }
    for (const voice of this.activeVoices) { try { voice.stop(); } catch { /* already stopped */ } }
    this.activeVoices.clear();
    if (this.musicEnabled && typeof document !== 'undefined' && !document.hidden) {
      this.musicStep = 0;
      this.musicTimer = window.setTimeout(() => {
        if (this.musicGain && this.context) this.musicGain.gain.setTargetAtTime(this.musicVolume * 0.32, this.context.currentTime, 0.3);
        this.playMusicStep();
      }, 400);
    }
  }

  private playMusicStep(): void {
    if (!this.musicEnabled || !this.context || (typeof document !== 'undefined' && document.hidden)) return;
    const step = this.musicStep++;
    const beat = step % 4;
    const bar = Math.floor(step / 4) % soundtrackBars(this.arrangement.scene);
    const now = this.context.currentTime + 0.02;
    const minor = [0, 2, 3, 5, 3, 2, 0];
    const major = [0, 2, 4, 5, 4, 2, 0];
    const motif = this.arrangement.major ? major : minor;
    const root = [50, 46, 43, 48][Math.floor(bar / 4) % 4];
    const phrase = (bar * 4 + beat) % 16;
    if (phrase < 7 && (bar % 4 !== 3 || beat < 2)) {
      this.playMusicNote(root + 12 + motif[phrase % 7], this.arrangement.lead,
        BEAT_SECONDS * (beat === 3 ? 1.9 : 0.85), now, 0.2 * this.arrangement.density);
    }
    if (beat === 0) {
      this.playMusicNote(root - 12, this.arrangement.bass, BAR_SECONDS * 0.92, now, 0.12);
      this.playMusicNote(root + 7, this.arrangement.accompaniment, BEAT_SECONDS * 2.7, now + 0.08, 0.06);
    }
    if (this.arrangement.density > 0.65 && beat === 2)
      this.playMusicNote(root + (this.arrangement.major ? 4 : 3), this.arrangement.accompaniment,
        BEAT_SECONDS * 1.4, now, 0.045);
    if (this.arrangement.percussion && beat === 0)
      this.playMusicNote(36, 'drone', 0.25, now, 0.055);
    this.musicTimer = window.setTimeout(() => this.playMusicStep(), BEAT_SECONDS * 1000);
  }

  private playMusicNote(note: number, voice: MusicVoice, duration: number, at: number, gainValue: number): void {
    if (!this.context || !this.musicGain) return;
    const context = this.context;
    const osc = context.createOscillator();
    const env = context.createGain();
    const types: Record<MusicVoice, OscillatorType> = {
      drone: 'triangle', fiddle: 'sawtooth', flute: 'sine', lute: 'triangle',
      keys: 'triangle', strings: 'sawtooth', horn: 'triangle', pad: 'sine'
    };
    osc.type = types[voice];
    osc.frequency.setValueAtTime(midiFrequency(note), at);
    const slow = voice === 'pad' || voice === 'strings' || voice === 'drone';
    const attack = slow ? 0.2 : 0.035;
    const end = at + duration;
    env.gain.setValueAtTime(0.00001, at);
    env.gain.linearRampToValueAtTime(gainValue, at + attack);
    env.gain.setValueAtTime(gainValue * 0.7, Math.max(at + attack, end - 0.19));
    env.gain.exponentialRampToValueAtTime(0.00001, end);
    osc.connect(env);
    env.connect(this.musicGain);
    this.activeVoices.add(osc);
    osc.onended = () => { this.activeVoices.delete(osc); osc.disconnect(); env.disconnect(); };
    osc.start(at); osc.stop(end + 0.01);
  }

  private playEffectNotes(context: AudioContext, effect: GameSoundEffect): void {
    const now = context.currentTime;
    const notes: ReadonlyArray<number> = {
      click: [659.25],
      success: [523.25, 659.25, 783.99],
      build: [196, 293.66],
      trade: [440, 659.25],
      battle: [110, 146.83],
      month: [392, 523.25]
    }[effect];
    const duration = effect === 'click' ? 0.12 : effect === 'battle' ? 0.32 : 0.2;
    const volume = effect === 'click' ? 0.025 : effect === 'battle' ? 0.045 : 0.035;

    notes.forEach((frequency: number, index: number): void => {
      this.playTone(context, frequency, duration, volume, effect === 'battle' ? 'triangle' : 'sine',
        now + index * 0.09);
    });
  }

  private playTone(
    context: AudioContext,
    frequency: number,
    duration: number,
    volume: number,
    type: OscillatorType,
    startTime: number = context.currentTime
  ): void {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }
}
