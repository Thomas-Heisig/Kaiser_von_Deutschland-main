/**
 * Campaign Defeat System – reale Niederlagebedingungen für die Standardkampagne.
 *
 * Das System beobachtet pro Spieler drei existenzbedrohende Zustände über
 * aufeinanderfolgende Monate hinweg und meldet den Untergang, sobald eine
 * Schwelle dauerhaft erreicht wird:
 *
 *  - Bankrott:   Das Reich führt dauerhaft kein Gold (Gold == 0).
 *  - Hungersnot: Das Reich hat dauerhaft keine Nahrung (Nahrung == 0).
 *  - Anarchie:   Die Zufriedenheit des Volkes bricht dauerhaft ein.
 *
 * Gold und Nahrung werden monatlich auf null geklemmt, daher ist „kein Gold"
 * exakt der Wert 0 und wird über die `atMost`-Schwelle erkannt. Ein einmal
 * ausgeprägter Untergang bleibt für die laufende Kampagne bestehen, damit die
 * Sandbox-Fortsetzung nicht erneut in einer Niederlage endet. Die Schwellen
 * liegen deutlich über den Minimum-Werten normaler, gesunder Läufe und sind
 * konfigurierbar (siehe {@link DefeatThresholds}).
 *
 * @version 2.5.2
 * @author Kaiser von Deutschland Team
 */

export type DefeatReason = 'bankruptcy' | 'famine' | 'anarchy';

/** Menschenlesbarer Titel pro Niederlage-Grund (für UI und Chronik). */
export const DEFEAT_TITLES: Record<DefeatReason, string> = {
  bankruptcy: 'Bankrott',
  famine: 'Hungersnot',
  anarchy: 'Anarchie'
};

/**
 * Konfigurierbare Schwellen für die drei Niederlagebedingungen.
 * `atMost` ist der höchste kritische Wert (inklusive); `months` die nötigen
 * aufeinanderfolgenden Monate, in denen der Wert diese Schwelle nicht übersteigt.
 */
export interface DefeatThresholds {
  bankruptcy: { atMost: number; months: number };
  famine: { atMost: number; months: number };
  anarchy: { atMost: number; months: number };
}

/**
 * Standard-Schwellen. Sie liegen deutlich unter den Minimum-Werten normaler,
 * gesunder Simulationen (Gold ~4.700, Nahrung ~11.000, Zufriedenheit ~8),
 * sodass ein stabiles Reich nie fälschlich untergeht.
 */
export const DEFAULT_DEFEAT_THRESHOLDS: DefeatThresholds = {
  bankruptcy: { atMost: 0, months: 3 },
  famine: { atMost: 0, months: 2 },
  anarchy: { atMost: 5, months: 6 }
};

interface DefeatState {
  /** Aufeinanderfolgende Monate unterhalb der jeweiligen Schwelle. */
  counts: Record<DefeatReason, number>;
  /** Endgültiger Untergangsgrund, sobald eine Schwelle dauerhaft erreicht wurde. */
  defeated: DefeatReason | null;
}

const REASONS: readonly DefeatReason[] = ['bankruptcy', 'famine', 'anarchy'];

/**
 * Verwaltet die Niederlagezähler und -zustände aller Spieler.
 *
 * @example
 * ```ts
 * const defeat = new CampaignDefeatSystem();
 * const reason = defeat.checkDefeat(player.id, gold, food, happiness);
 * if (reason) { /* Reich untergegangen *\/ }
 * ```
 */
export class CampaignDefeatSystem {
  private states = new Map<string, DefeatState>();
  private thresholds: DefeatThresholds;

  /**
   * @param thresholds Optionale, eigene Schwellen. Standard: {@link DEFAULT_DEFEAT_THRESHOLDS}.
   */
  constructor(thresholds: DefeatThresholds = DEFAULT_DEFEAT_THRESHOLDS) {
    this.thresholds = {
      bankruptcy: { ...thresholds.bankruptcy },
      famine: { ...thresholds.famine },
      anarchy: { ...thresholds.anarchy }
    };
  }

  private state(playerId: string): DefeatState {
    let state = this.states.get(playerId);
    if (!state) {
      state = { counts: { bankruptcy: 0, famine: 0, anarchy: 0 }, defeated: null };
      this.states.set(playerId, state);
    }
    return state;
  }

  /**
   * Prüft am Ende eines Monats, ob der Spieler untergeht.
   *
   * Die Zähler werden monatlich aktualisiert: Solange ein Wert unterhalb der
   * Schwelle bleibt, steigt der Zähler; eine Erholung setzt ihn auf null zurück.
   * Erreicht ein Zähler die nötige Monatsanzahl, wird der Untergang gemeldet und
   * dauerhaft festgehalten.
   *
   * @param playerId Spieler, dessen Reich geprüft wird.
   * @param gold     Aktueller Goldbestand.
   * @param food     Aktueller Nahrungsbestand.
   * @param happiness Aktuelle Zufriedenheit (0–100).
   * @returns Der Untergangsgrund, falls das Reich diesen Monat fällt, sonst `null`.
   */
  checkDefeat(playerId: string, gold: number, food: number, happiness: number): DefeatReason | null {
    const state = this.state(playerId);
    if (state.defeated) return null;

    state.counts.bankruptcy = gold <= this.thresholds.bankruptcy.atMost
      ? state.counts.bankruptcy + 1 : 0;
    state.counts.famine = food <= this.thresholds.famine.atMost
      ? state.counts.famine + 1 : 0;
    state.counts.anarchy = happiness <= this.thresholds.anarchy.atMost
      ? state.counts.anarchy + 1 : 0;

    // Feste Priorität: Nahrungsmangel schlägt Anarchie, Anarchie den Bankrott.
    if (state.counts.famine >= this.thresholds.famine.months) {
      state.defeated = 'famine';
      return 'famine';
    }
    if (state.counts.anarchy >= this.thresholds.anarchy.months) {
      state.defeated = 'anarchy';
      return 'anarchy';
    }
    if (state.counts.bankruptcy >= this.thresholds.bankruptcy.months) {
      state.defeated = 'bankruptcy';
      return 'bankruptcy';
    }
    return null;
  }

  /** Liefert die aktuellen Zähler (für UI-Warnungen und Tests). */
  getCounts(playerId: string): Record<DefeatReason, number> {
    const state = this.states.get(playerId);
    if (!state) return { bankruptcy: 0, famine: 0, anarchy: 0 };
    return { ...state.counts };
  }

  /** Ist der Spieler bereits endgültig untergegangen? */
  isDefeated(playerId: string): boolean {
    return this.getDefeatReason(playerId) !== null;
  }

  /** Liefert den festgehaltenen Untergangsgrund oder `null`. */
  getDefeatReason(playerId: string): DefeatReason | null {
    return this.states.get(playerId)?.defeated ?? null;
  }

  /** Entfernt alle Zustände eines Spielers (z. B. bei Spielerentfernung). */
  removePlayer(playerId: string): void {
    this.states.delete(playerId);
  }

  /** Leert alle Zustände (z. B. beim Start einer neuen Kampagne). */
  reset(): void {
    this.states.clear();
  }

  /** Serialisiert den Zustand als einfache, version-2-kompatible Datenliste. */
  serialize(): Array<[string, { counts: Record<DefeatReason, number>; defeated: DefeatReason | null }]> {
    return Array.from(this.states, ([id, s]) => [
      id,
      { counts: { ...s.counts }, defeated: s.defeated }
    ]);
  }

  /**
   * Stellt den Zustand aus einem Spielstand wieder her.
   * Ungültige oder fehlende Einträge werden sicher ignoriert.
   * @param value Serialisierte Datenliste aus {@link serialize}.
   */
  deserialize(value: unknown): void {
    this.states.clear();
    if (!Array.isArray(value)) return;
    for (const entry of value) {
      if (!Array.isArray(entry) || entry.length !== 2) continue;
      const [id, raw] = entry as [unknown, unknown];
      if (typeof id !== 'string' || typeof raw !== 'object' || raw === null) continue;
      const record = raw as { counts?: Partial<Record<DefeatReason, number>>; defeated?: unknown };
      const counts: Record<DefeatReason, number> = { bankruptcy: 0, famine: 0, anarchy: 0 };
      for (const reason of REASONS) {
        const v = record.counts?.[reason];
        counts[reason] = Number.isSafeInteger(v) && (v as number) >= 0 ? (v as number) : 0;
      }
      const defeated: DefeatReason | null =
        record.defeated === 'bankruptcy' || record.defeated === 'famine' || record.defeated === 'anarchy'
          ? record.defeated : null;
      this.states.set(id, { counts, defeated });
    }
  }
}
