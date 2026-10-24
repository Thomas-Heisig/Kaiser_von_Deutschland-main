/**
 * Projektstatus für die In-Game-Anzeige („Über"-Bildschirm).
 * Die Liste spiegelt den belegten Ist-Zustand aus docs/00-meta/status.md wider
 * und schafft realistische Erwartungen gegenüber Spielern.
 */
export type FeatureStatus = 'fertig' | 'in_arbeit' | 'geplant';

export interface FeatureEntry {
  readonly name: string;
  readonly status: FeatureStatus;
  readonly detail: string;
}

export const FEATURE_STATUS_LABELS: Record<FeatureStatus, string> = {
  fertig: 'Fertig',
  in_arbeit: 'In Arbeit',
  geplant: 'Geplant'
};

/**
 * Belegte Funktionsliste (Stand 24.10.2026).
 * „Fertig" bedeutet: im Hauptspiel verfügbar und automatisiert geprüft.
 */
export const FEATURE_STATUS_LIST: readonly FeatureEntry[] = [
  { name: 'Aufbaukampagne (Wirtschaft, Bauen, Forschung, Handel)', status: 'fertig', detail: 'Monats-Engine mit Steuer, Ernte, Infrastruktur und Kampagnenziele.' },
  { name: 'Start ab 2000 v. Chr. bis 2000 n. Chr.', status: 'fertig', detail: 'Epochen, Datumsanzeige und Zeitbilder mit Quellen.' },
  { name: 'Strategiewelt mit Reisen und Verträgen', status: 'fertig', detail: '20 Nachbarn, Handelsverträge, Schutzbündnisse und reaktive Rivalen.' },
  { name: 'Bürgerleben: Familien, Geburten, Berufe', status: 'fertig', detail: 'Reale Kinder, Eltern-Kind-Relationen und historische Vornamen.' },
  { name: 'Erbschaften', status: 'fertig', detail: 'Vermögensaufteilung mit Haupterbe bei jedem Tod.' },
  { name: 'Ratsdilemmata und Bürgeraufträge', status: 'fertig', detail: 'Delegation mit Erinnerung an frühere Delegierte; mehrmonatige Aufträge.' },
  { name: 'Krieg, Feldzüge und Niederlagen', status: 'fertig', detail: 'Feldzüge, Überfälle, Bankrott/Hungersnot/Anarchie mit Erholung.' },
  { name: 'Interaktives Tutorial', status: 'fertig', detail: 'Bauen → Handeln → Forschen → Reichsrat → Speichern.' },
  { name: 'Soundtrack (20 Titel) und fünf Intro-Videos', status: 'fertig', detail: 'Jukebox, Covergalerie, alternative Intros/Outros.' },
  { name: 'PWA: Installation, Offline-Modus, ZIP-Download', status: 'fertig', detail: 'Service Worker und lokales Offline-Paket.' },
  { name: 'Hotseat (2–4 Herrscher)', status: 'fertig', detail: 'Lokaler Mehrspieler an einem Gerät, Zug um Zug.' },
  { name: 'Religions- und Migrationsübersicht', status: 'in_arbeit', detail: 'Im Lagebericht sichtbar; getrennte Reichs-Verwaltung fehlt noch.' },
  { name: 'Langzeit-Balance (Jahrhunderte)', status: 'in_arbeit', detail: 'Erster 100-Jahre-Lauf geprüft; Katastrophenbalance offen.' },
  { name: 'Regionale Stilunterarten und lückenlose Weltchronik', status: 'in_arbeit', detail: 'Weitere Karten und Jahresabdeckung folgen.' },
  { name: 'Detaillierte Familien und Generationenbalance', status: 'geplant', detail: 'Komplexe Partnervermittlung und langfristige Dynastien.' },
  { name: 'Online-Mehrspieler', status: 'geplant', detail: 'Kein Cloud-Backup; Spielstände bleiben lokal.' },
  { name: '3D-Schlachtfelder und freie Bebauung', status: 'geplant', detail: 'Im Backlog; aktuelle Karte bleibt 2D/isometrisch.' }
] as const;

/**
 * Gruppiert die Funktionsliste nach Status für die Anzeige.
 * @returns Gruppen in der Reihenfolge fertig, in Arbeit, geplant.
 */
export function groupFeaturesByStatus(): Array<{ status: FeatureStatus; label: string; entries: readonly FeatureEntry[] }>: Array<{ status: FeatureStatus; label: string; entries: readonly FeatureEntry[] }> {
  const order: readonly FeatureStatus[] = ['fertig', 'in_arbeit', 'geplant'];
  return order.map(status => ({
    status,
    label: FEATURE_STATUS_LABELS[status],
    entries: FEATURE_STATUS_LIST.filter(entry => entry.status === status)
  }));
}
