/**
 * Vasallen und direkt kontrolliertes Gebiet.
 *
 * Ergänzt das bestehende `RivalRealm`-Modell um zwei klar getrennte Folgen
 * einer Eroberung:
 *
 *  A. **Eingegliedertes Gebiet** (`annexed`): gehört zum direkt verwalteten
 *     Reich. Es liefert Einnahmen und Bevölkerung, verursacht aber
 *     Verwaltungsaufwand und muss militärisch gesichert werden.
 *  B. **Unterworfener Vasall** (`vassal`): behält eine eigene politische
 *     Identität, gehört zum Einflussbereich, zahlt vereinbarte Abgaben und
 *     stellt nach klaren Regeln Hilfstruppen.
 *
 * Begriffe: Geldzahlungen sind **Abgaben** oder **Tribut**. Ein Lehen ist eine
 * Herrschaftsbeziehung und selbst keine Geldzahlung. Für die Antike und andere
 * vorlehnsrechtliche Zeiten werden bewusst epochenneutrale Begriffe verwendet;
 * Lehnsvokabular gilt nur für Zeiten, in denen es belegt ist.
 *
 * Buchungsgrundsatz: Abgaben werden beim Vasallen abgebucht und beim Oberherrn
 * gutgeschrieben. Es entsteht kein Geld aus dem Nichts.
 */

import type { RivalRealm } from './CampaignWarfareSystem';

/** Art der Herrschaft über einen unterworfenen Akteur. */
export type VassalStatus = 'annexed' | 'vassal';

/** Grund einer ausgebliebenen Abgabe. */
export type TributeFailure = 'none' | 'empty_treasury' | 'disloyal' | 'contested';

/** Zustand eines unterworfenen Akteurs. */
export interface VassalState {
  /** Stabiler Verweis auf die RivalRealm-ID, nicht auf den Anzeigenamen. */
  rivalId: string;
  /** Besitzender Spieler. */
  playerId: string;
  /** Eingegliedert oder Vasall. */
  status: VassalStatus;
  /** Vereinbarte monatliche Abgabe in Gold. */
  agreedTribute: number;
  /** Im laufenden Monat tatsächlich gezahlter Betrag. */
  paidThisMonth: number;
  /** Noch nicht gezahlte Beträge aus früheren Monaten. */
  arrears: number;
  /** Grund der letzten ausgebliebenen Zahlung. */
  lastFailure: TributeFailure;
  /** Loyalität 0–100; sinkt durch Belastung, steigt durch Schutz. */
  loyalty: number;
  /** Monate, in denen die Abgabe ganz oder teilweise ausblieb. */
  missedMonths: number;
  /** Für die Garnison abgestellte Hilfstruppen (vom Vasallen getragen). */
  auxiliarySoldiers: number;
  /** Jahr der Unterwerfung, für epochenpassende Benennung. */
  sinceYear: number;
}

/** Epochenpassender Begriff für die Abgabe. */
export function tributeLabel(year: number): string {
  if (year < 500) return 'Abgabe';
  if (year < 1500) return 'Lehnsabgabe';
  return 'Kontribution';
}

/** Epochenpassender Begriff für die Herrschaftsbeziehung. */
export function suzeraintyLabel(year: number): string {
  if (year < 500) return 'Abhängigkeit';
  if (year < 1500) return 'Lehensverhältnis';
  return 'Schutzverhältnis';
}

/** Standardabgabe: ein Monatswert aus der vorhandenen Beute, gedeckelt. */
export function defaultTribute(rival: RivalRealm): number {
  return Math.max(10, Math.floor(rival.loot / 24));
}

/** Hilfstruppen: ein klar begrenzter Anteil, nie die gesamte Streitmacht. */
export function auxiliaryQuota(rival: RivalRealm): number {
  return Math.floor(rival.soldiers * 0.25);
}

/**
 * Monatliche Unterhaltskosten der Hilfstruppen.
 * Wer die Truppen stellt, trägt auch ihren Unterhalt.
 */
export function auxiliaryUpkeep(soldiers: number): { gold: number; food: number } {
  return { gold: Math.ceil(soldiers * 0.5), food: Math.ceil(soldiers * 0.25) };
}

/**
 * Verwaltungskosten eingegliederten Gebiets.
 * Direkte Herrschaft ist teurer als ein Vasall, liefert aber mehr.
 */
export function annexationCost(settlers: number): number {
  return Math.ceil(settlers * 0.02);
}

/**
 * Verwaltet alle unterworfenen Akteure eines Spiels.
 * Alle Änderungen laufen über stabile RivalRealm-IDs.
 */
export class VassalSystem {
  private states = new Map<string, VassalState>();

  /** Schlüssel aus Spieler und Rival-ID; Anzeigenamen sind nie Schlüssel. */
  private static key(playerId: string, rivalId: string): string {
    return `${playerId}::${rivalId}`;
  }

  /** Nimmt einen unterworfenen Akteur auf oder gibt seinen Zustand zurück. */
  public subjugate(playerId: string, rival: RivalRealm, year: number, status: VassalStatus): VassalState {
    const key = VassalSystem.key(playerId, rival.id);
    const existing = this.states.get(key);
    if (existing) {
      existing.status = status;
      return { ...existing };
    }
    const state: VassalState = {
      rivalId: rival.id,
      playerId,
      status,
      agreedTribute: defaultTribute(rival),
      paidThisMonth: 0,
      arrears: 0,
      lastFailure: 'none',
      loyalty: status === 'annexed' ? 45 : 60,
      missedMonths: 0,
      auxiliarySoldiers: status === 'vassal' ? auxiliaryQuota(rival) : 0,
      sinceYear: year
    };
    this.states.set(key, state);
    return { ...state };
  }

  /**
   * Führt eine geprüfte Zustandsänderung aus.
   * Einzige Schreibschnittstelle, damit `get`/`forPlayer` Kopien liefern können.
   * @param playerId Spieler.
   * @param rivalId Stabile ID.
   * @param change Veränderung am gespeicherten Zustand.
   * @returns true, wenn der Akteur gefunden wurde.
   */
  public mutateVassal(playerId: string, rivalId: string, change: (state: VassalState) => void): boolean {
    const state = this.states.get(VassalSystem.key(playerId, rivalId));
    if (!state) return false;
    change(state);
    return true;
  }

  /** Zustand eines Akteurs oder `null`. */
  public get(playerId: string, rivalId: string): VassalState | null {
    const state = this.states.get(VassalSystem.key(playerId, rivalId));
    return state ? { ...state } : null;
  }

  /** Alle unterworfenen Akteure eines Spielers. */
  public forPlayer(playerId: string): VassalState[] {
    return [...this.states.values()]
      .filter(state => state.playerId === playerId)
      .map(state => ({ ...state }));
  }

  /** Setzt die Monatsbuchung zurück, bevor ein neuer Monat gebucht wird. */
  public beginMonth(): void {
    for (const state of this.states.values()) state.paidThisMonth = 0;
  }

  /** Entfernt alle Akteure eines Spielers. */
  public removePlayer(playerId: string): void {
    for (const key of [...this.states.keys()]) {
      if (this.states.get(key)?.playerId === playerId) this.states.delete(key);
    }
  }

  /** Leert den gesamten Zustand. */
  public reset(): void {
    this.states.clear();
  }

  /** Serialisierbarer Zustand für den Spielstand. */
  public serialize(): VassalState[] {
    return [...this.states.values()].map(state => ({ ...state }));
  }

  /**
   * Stellt einen gespeicherten Zustand wieder her.
   * Alte Spielstände ohne Vasallendaten bleiben ladbar.
   */
  public restore(value: unknown): void {
    this.states.clear();
    if (!Array.isArray(value)) return;
    for (const entry of value) {
      const state = entry as Partial<VassalState>;
      if (!state || typeof state.rivalId !== 'string' || typeof state.playerId !== 'string') continue;
      if (state.status !== 'annexed' && state.status !== 'vassal') continue;
      this.states.set(VassalSystem.key(state.playerId, state.rivalId), {
        rivalId: state.rivalId,
        playerId: state.playerId,
        status: state.status,
        agreedTribute: Number.isFinite(state.agreedTribute) ? Number(state.agreedTribute) : 0,
        paidThisMonth: Number.isFinite(state.paidThisMonth) ? Number(state.paidThisMonth) : 0,
        arrears: Number.isFinite(state.arrears) ? Number(state.arrears) : 0,
        lastFailure: state.lastFailure ?? 'none',
        loyalty: Number.isFinite(state.loyalty) ? Math.max(0, Math.min(100, Number(state.loyalty))) : 60,
        missedMonths: Number.isFinite(state.missedMonths) ? Number(state.missedMonths) : 0,
        auxiliarySoldiers: Number.isFinite(state.auxiliarySoldiers) ? Number(state.auxiliarySoldiers) : 0,
        sinceYear: Number.isFinite(state.sinceYear) ? Number(state.sinceYear) : 1200
      });
    }
  }
}
