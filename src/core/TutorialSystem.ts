/**
 * Tutorial System – interaktive Tutorial-Kampagne für neue Herrschaften.
 *
 * Das System führt den Spieler durch fünf aufeinanderfolgende, verbindliche
 * Schritte, die die Kernschleife der Standardkampagne abdecken:
 *
 *   1. Bauen    – ein Gebäude aus den Vorräten errichten
 *   2. Handeln  – eine Ressource am Markt kaufen oder verkaufen
 *   3. Forschen – ein Forschungsprojekt starten
 *   4. Reichsrat– eine Ratsangelegenheit entscheiden
 *   5. Speichern– die Herrschaft sichern
 *
 * Die Schritte sind strikt geordnet: Ein Schritt gilt nur dann als erledigt,
 * wenn er der aktuelle ist. Damit bleibt die Reihenfolge Bauen → Handeln →
 * Forschen → Reichsrat → Speichern verbindlich. Das Tutorial ist global pro
 * Engine (nicht pro Spieler), wird über die Konfiguration aktiviert und ist
 * jederzeit überspringbar. Der Zustand ist serialisierbar und Teil des
 * Spielstands, damit ein laufendes Tutorial nach einem Laden fortgesetzt wird.
 *
 * @version 2.5.2
 * @author Kaiser von Deutschland Team
 */

export type TutorialStepId = 'build' | 'trade' | 'research' | 'council' | 'save';

/** Beschreibung eines einzelnen Tutorial-Schritts. */
export interface TutorialStep {
  id: TutorialStepId;
  /** Kurzer Titel, z. B. „Bauen". */
  title: string;
  /** Was der Spieler tun muss. */
  description: string;
  /** UI-Ansicht, in der die Aktion stattfindet (entspricht KingdomGameUI `View`). */
  view: string;
  /** Hilfe, die angeboten wird, wenn die Aktion nicht möglich ist. */
  help: string;
}

/**
 * Die fünf verbindlichen Tutorial-Schritte in fester Reihenfolge.
 * Die `view`-Werte entsprechen den Navigationsbereichen der Spieloberfläche.
 */
export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  {
    id: 'build',
    title: 'Bauen',
    description: 'Errichte ein Gebäude aus deinen Vorräten, z. B. einen Bauernhof.',
    view: 'build',
    help: 'Fehlt Material? Prüfe die Monatsbilanz: Nahrung und Holz wachsen durch Felder, Straßen und Wälder. Verkaufe am Markt, um Gold freizusetzen.'
  },
  {
    id: 'trade',
    title: 'Handeln',
    description: 'Kaufe oder verkaufe eine Ressource am Markt.',
    view: 'economy',
    help: 'Zu wenig Gold? Verkaufe zuerst eine überschüssige Ressource (z. B. Nahrung oder Holz) und kaufe dann, was du brauchst.'
  },
  {
    id: 'research',
    title: 'Forschen',
    description: 'Starte ein Forschungsprojekt aus der aktuellen Epoche.',
    view: 'research',
    help: 'Forschung kostet Gold und Forschungspunkte. Schulen und Universitäten erhöhen den Punktezuwachs; beginne mit einer günstigen Technologie.'
  },
  {
    id: 'council',
    title: 'Reichsrat',
    description: 'Entscheide die offene Ratsangelegenheit.',
    view: 'council',
    help: 'Wähle die Option, die deine Vorräte erlaubt. Der Rat berät dich in der rechten Spalte.'
  },
  {
    id: 'save',
    title: 'Speichern',
    description: 'Sichere deine Herrschaft, um später fortsetzen zu können.',
    view: 'overview',
    help: 'Nutze „Speichern" in der Kopfzeile. Dein Fortschritt wird lokal im Browser abgelegt.'
  }
];

/** Serialisierbarer Tutorial-Zustand. */
export interface TutorialState {
  enabled: boolean;
  /** Index in {@link TUTORIAL_STEPS} des aktuellen Schritts. */
  currentStep: number;
  completed: boolean;
  skipped: boolean;
}

/**
 * Verwaltet den Fortschritt der interaktiven Tutorial-Kampagne.
 *
 * @example
 * ```ts
 * const tutorial = new TutorialSystem();
 * tutorial.activate();
 * tutorial.markStep('build'); // -> 'build' (Schritt 1 erledigt)
 * tutorial.markStep('save');  // -> null (falsche Reihenfolge)
 * ```
 */
export class TutorialSystem {
  private state: TutorialState = { enabled: false, currentStep: 0, completed: false, skipped: false };

  /** Startet ein neues Tutorial beim ersten Schritt. */
  activate(): void {
    this.state = { enabled: true, currentStep: 0, completed: false, skipped: false };
  }

  /** Überspringt das laufende Tutorial ohne Abschluss. */
  skip(): void {
    if (this.state.enabled && !this.state.completed) {
      this.state = { enabled: false, currentStep: this.state.currentStep, completed: false, skipped: true };
    }
  }

  /** Läuft das Tutorial gerade (aktiv und noch nicht abgeschlossen)? */
  isEnabled(): boolean {
    return this.state.enabled && !this.state.completed;
  }

  /** Wurde das Tutorial vollständig abgeschlossen? */
  isCompleted(): boolean {
    return this.state.completed;
  }

  /** Wurde das Tutorial übersprungen? */
  isSkipped(): boolean {
    return this.state.skipped;
  }

  /** Liefert den aktuellen Schritt oder `null`, wenn keiner aktiv ist. */
  getCurrentStep(): TutorialStep | null {
    if (!this.isEnabled()) return null;
    return TUTORIAL_STEPS[this.state.currentStep] ?? null;
  }

  /** Fortschritt als erledigte/gesamte Schritte. */
  getProgress(): { done: number; total: number } {
    const done = this.state.completed ? TUTORIAL_STEPS.length : this.state.currentStep;
    return { done, total: TUTORIAL_STEPS.length };
  }

  /**
   * Markiert einen Schritt als erledigt, falls er der aktuelle ist.
   * @param stepId Der zu markierende Schritt.
   * @returns Die Schritt-ID, falls dadurch Fortschritt entstand, sonst `null`.
   */
  markStep(stepId: TutorialStepId): TutorialStepId | null {
    if (!this.isEnabled()) return null;
    const current = TUTORIAL_STEPS[this.state.currentStep];
    if (!current || current.id !== stepId) return null;
    this.state.currentStep += 1;
    if (this.state.currentStep >= TUTORIAL_STEPS.length) {
      this.state.currentStep = TUTORIAL_STEPS.length;
      this.state.completed = true;
      this.state.enabled = false;
    }
    return stepId;
  }

  /** Serialisiert den Zustand als einfache, version-2-kompatible Datenliste. */
  serialize(): TutorialState {
    return { ...this.state };
  }

  /**
   * Stellt den Zustand aus einem Spielstand wieder her.
   * Ungültige oder fehlende Daten werden sicher ignoriert.
   * @param value Serialisierter Zustand aus {@link serialize}.
   */
  deserialize(value: unknown): void {
    if (typeof value !== 'object' || value === null) return;
    const v = value as Partial<TutorialState>;
    const currentStep = Number.isSafeInteger(v.currentStep)
      ? Math.max(0, Math.min(TUTORIAL_STEPS.length, v.currentStep as number)) : 0;
    this.state = {
      enabled: v.enabled === true,
      currentStep,
      completed: v.completed === true,
      skipped: v.skipped === true
    };
    if (this.state.currentStep >= TUTORIAL_STEPS.length) {
      this.state.completed = true;
      this.state.enabled = false;
    }
  }
}
