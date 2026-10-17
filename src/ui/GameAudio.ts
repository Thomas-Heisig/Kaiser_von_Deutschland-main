export type GameSoundEffect = 'click' | 'success' | 'build' | 'trade' | 'battle' | 'month';

/**
 * Short user-interface effects only. The soundtrack is played exclusively as
 * real audio files by MusicJukebox; there is no procedural music engine.
 */
export class GameAudio {
  public readonly supported = typeof window !== 'undefined' && typeof window.AudioContext === 'function';
  public effectsEnabled = true;
  private context?: AudioContext;

  constructor(private readonly onError: (error: unknown) => void) {}

  public toggleEffects(): void {
    this.effectsEnabled = !this.effectsEnabled;
  }

  public playEffect(effect: GameSoundEffect): void {
    if (!this.supported || !this.effectsEnabled) return;
    try {
      this.context ??= new window.AudioContext();
      const context = this.context;
      void context.resume().then((): void => {
        const notes: Record<GameSoundEffect, number[]> = {
          click: [659.25], success: [523.25, 659.25, 783.99],
          build: [196, 293.66], trade: [440, 659.25],
          battle: [110, 146.83], month: [392, 523.25]
        };
        const duration = effect === 'click' ? 0.12 : effect === 'battle' ? 0.32 : 0.2;
        const volume = effect === 'click' ? 0.025 : effect === 'battle' ? 0.045 : 0.035;
        notes[effect].forEach((frequency, index) => {
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          const at = context.currentTime + index * 0.09;
          oscillator.type = effect === 'battle' ? 'triangle' : 'sine';
          oscillator.frequency.setValueAtTime(frequency, at);
          gain.gain.setValueAtTime(0.0001, at);
          gain.gain.linearRampToValueAtTime(volume, at + 0.025);
          gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
          oscillator.connect(gain);
          gain.connect(context.destination);
          oscillator.start(at);
          oscillator.stop(at + duration);
          oscillator.onended = () => {
            oscillator.disconnect();
            gain.disconnect();
          };
        });
      }).catch(this.onError);
    } catch (error) {
      this.onError(error);
    }
  }

  public dispose(): void {
    if (this.context && this.context.state !== 'closed')
      void this.context.close().catch(this.onError);
  }
}
