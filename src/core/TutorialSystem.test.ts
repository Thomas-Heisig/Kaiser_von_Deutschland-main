import { describe, expect, it } from 'vitest';
import { TUTORIAL_STEPS, TutorialStepId, TutorialSystem } from './TutorialSystem';

describe('TutorialSystem', (): void => {
  it('is inactive by default and activates on demand', (): void => {
    const system = new TutorialSystem();
    expect(system.isEnabled()).toBe(false);
    expect(system.getCurrentStep()).toBeNull();
    system.activate();
    expect(system.isEnabled()).toBe(true);
    expect(system.getCurrentStep()?.id).toBe('build');
  });

  it('defines the five steps in the binding order build → trade → research → council → save', (): void => {
    const order: TutorialStepId[] = ['build', 'trade', 'research', 'council', 'save'];
    expect(TUTORIAL_STEPS.map((step) => step.id)).toEqual(order);
    for (const step of TUTORIAL_STEPS) {
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.description.length).toBeGreaterThan(0);
      expect(step.view.length).toBeGreaterThan(0);
      expect(step.help.length).toBeGreaterThan(0);
    }
  });

  it('advances only in the correct sequence', (): void => {
    const system = new TutorialSystem();
    system.activate();
    // Falscher Schritt (zu früh) wird ignoriert.
    expect(system.markStep('save')).toBeNull();
    expect(system.markStep('trade')).toBeNull();
    expect(system.getCurrentStep()?.id).toBe('build');
    expect(system.markStep('build')).toBe('build');
    expect(system.getCurrentStep()?.id).toBe('trade');
  });

  it('completes after all five steps and reports progress', (): void => {
    const system = new TutorialSystem();
    system.activate();
    expect(system.getProgress()).toEqual({ done: 0, total: 5 });
    for (const id of ['build', 'trade', 'research', 'council', 'save'] as TutorialStepId[]) {
      system.markStep(id);
    }
    expect(system.isCompleted()).toBe(true);
    expect(system.isEnabled()).toBe(false);
    expect(system.getCurrentStep()).toBeNull();
    expect(system.getProgress()).toEqual({ done: 5, total: 5 });
  });

  it('ignores further steps once completed', (): void => {
    const system = new TutorialSystem();
    system.activate();
    for (const id of ['build', 'trade', 'research', 'council', 'save'] as TutorialStepId[]) {
      system.markStep(id);
    }
    expect(system.markStep('build')).toBeNull();
    expect(system.isCompleted()).toBe(true);
  });

  it('skips the tutorial and stays inactive', (): void => {
    const system = new TutorialSystem();
    system.activate();
    system.markStep('build');
    system.skip();
    expect(system.isEnabled()).toBe(false);
    expect(system.isSkipped()).toBe(true);
    expect(system.isCompleted()).toBe(false);
    expect(system.markStep('trade')).toBeNull();
  });

  it('can be reactivated after skip or completion', (): void => {
    const system = new TutorialSystem();
    system.activate();
    system.skip();
    system.activate();
    expect(system.isEnabled()).toBe(true);
    expect(system.isSkipped()).toBe(false);
    expect(system.getCurrentStep()?.id).toBe('build');
  });

  it('round-trips its state through serialize/deserialize', (): void => {
    const system = new TutorialSystem();
    system.activate();
    system.markStep('build');
    system.markStep('trade');
    const data = system.serialize();

    const restored = new TutorialSystem();
    restored.deserialize(data);
    expect(restored.isEnabled()).toBe(true);
    expect(restored.getCurrentStep()?.id).toBe('research');
    expect(restored.getProgress()).toEqual({ done: 2, total: 5 });
  });

  it('restores a completed tutorial state', (): void => {
    const system = new TutorialSystem();
    system.activate();
    for (const id of ['build', 'trade', 'research', 'council', 'save'] as TutorialStepId[]) {
      system.markStep(id);
    }
    const restored = new TutorialSystem();
    restored.deserialize(system.serialize());
    expect(restored.isCompleted()).toBe(true);
    expect(restored.isEnabled()).toBe(false);
    expect(restored.getCurrentStep()).toBeNull();
  });

  it('ignores malformed or missing save data safely', (): void => {
    const system = new TutorialSystem();
    expect(() => system.deserialize(undefined)).not.toThrow();
    expect(() => system.deserialize('nonsense')).not.toThrow();
    expect(() => system.deserialize({ enabled: 'yes', currentStep: 99, completed: 1 })).not.toThrow();
    expect(system.isEnabled()).toBe(false);
    expect(system.getCurrentStep()).toBeNull();
  });

  it('clamps out-of-range step indices on restore', (): void => {
    const system = new TutorialSystem();
    system.deserialize({ enabled: true, currentStep: 42, completed: false, skipped: false });
    expect(system.isCompleted()).toBe(true);
    expect(system.isEnabled()).toBe(false);
  });
});
