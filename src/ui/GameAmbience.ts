export type Soundscape = 'village' | 'market' | 'battle' | 'winter';

/** Opt-in, synthesized atmosphere with no copyrighted samples or remote assets. */
export class GameAmbience {
  public readonly supported = typeof window !== 'undefined' && typeof window.AudioContext === 'function';
  public enabled = false;
  private context?: AudioContext;
  private timer?: number;
  private scene: Soundscape = 'village';
  private disposed = false;
  private readonly visibility = (): void => {
    this.stopTimer();
    if (this.enabled && !document.hidden) this.schedule();
  };

  constructor() {
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', this.visibility);
  }

  public setScene(scene: Soundscape): void {
    if (this.scene === scene) return;
    this.scene = scene;
    if (this.enabled) this.schedule();
  }

  public async toggle(): Promise<void> {
    if (this.enabled) {
      this.enabled = false;
      this.stopTimer();
      return;
    }
    if (!this.supported || this.disposed) throw new Error('Geräuschkulisse wird nicht unterstützt.');
    this.context ??= new window.AudioContext();
    await this.context.resume();
    if (this.disposed) return;
    this.enabled = true;
    this.schedule(true);
  }

  private stopTimer(): void {
    if (this.timer !== undefined) window.clearTimeout(this.timer);
    this.timer = undefined;
  }

  private schedule(now = false): void {
    this.stopTimer();
    if (!this.enabled || this.disposed || document.hidden) return;
    const delay = now ? 0 : this.scene === 'battle' ? 2200 : this.scene === 'market' ? 3100 : 4500;
    this.timer = window.setTimeout((): void => {
      if (!this.enabled || !this.context) return;
      this.playCue(this.context);
      this.schedule();
    }, delay);
  }

  private playCue(context: AudioContext): void {
    const at = context.currentTime;
    const notes: Record<Soundscape, readonly [number, number, number, OscillatorType][]> = {
      village: [[784, 0.2, 0.006, 'sine'], [1046.5, 0.18, 0.004, 'sine']],
      market: [[220, 0.13, 0.008, 'triangle'], [330, 0.11, 0.006, 'triangle']],
      battle: [[80, 0.3, 0.012, 'triangle'], [110, 0.25, 0.008, 'triangle']],
      winter: [[95, 1.7, 0.004, 'sine'], [110, 1.2, 0.003, 'triangle']]
    };
    notes[this.scene].forEach(([frequency, duration, loudness, wave], i) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = at + i * (this.scene === 'winter' ? 0.18 : 0.36);
      oscillator.type = wave;
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(loudness, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + duration);
    });
  }

  public dispose(): void {
    this.disposed = true;
    this.enabled = false;
    this.stopTimer();
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', this.visibility);
    if (this.context && this.context.state !== 'closed') void this.context.close().catch((): void => {});
  }
}
