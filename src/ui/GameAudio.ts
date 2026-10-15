export type GameSoundEffect = 'click' | 'success' | 'build' | 'trade' | 'battle' | 'month';

const MUSIC_CHORDS: ReadonlyArray<ReadonlyArray<number>> = [
  [146.83, 220, 293.66, 369.99],
  [130.81, 196, 261.63, 329.63],
  [174.61, 261.63, 349.23, 440],
  [146.83, 220, 293.66, 369.99]
];

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
  private musicStarting: boolean = false;

  /**
   * Creates the audio controller.
   * @param onError Reports errors from browser audio operations.
   * @returns Nothing.
   */
  public constructor(private readonly onError: (error: unknown) => void) {}

  /**
   * Toggles the looping background music.
   * @returns A promise that resolves after the browser audio context resumes.
   * @throws If the browser cannot start audio playback.
   */
  public async toggleMusic(): Promise<void> {
    if (this.musicEnabled) {
      this.musicEnabled = false;
      window.clearTimeout(this.musicTimer);
      this.musicTimer = undefined;
      return;
    }
    if (this.musicStarting) return;

    this.musicStarting = true;
    try {
      const context = this.getContext();
      await context.resume();
      this.musicEnabled = true;
      this.musicStep = 0;
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
    window.clearTimeout(this.musicTimer);
    this.musicTimer = undefined;
    if (this.context && this.context.state !== 'closed') {
      void this.context.close().catch((error: unknown): void => this.onError(error));
    }
  }

  private getContext(): AudioContext {
    if (!this.supported) throw new Error('Dieser Browser unterstützt Web Audio nicht.');
    this.context ??= new window.AudioContext();
    return this.context;
  }

  private playMusicStep(): void {
    if (!this.musicEnabled || !this.context) return;

    const chord = MUSIC_CHORDS[Math.floor(this.musicStep / 4) % MUSIC_CHORDS.length];
    const note = chord[this.musicStep % chord.length];
    this.playTone(this.context, note, 1.8, 0.018, 'sine');
    if (this.musicStep % 4 === 0) {
      this.playTone(this.context, chord[0] / 2, 2.8, 0.025, 'triangle');
    }
    this.musicStep++;
    this.musicTimer = window.setTimeout((): void => this.playMusicStep(), 1500);
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
