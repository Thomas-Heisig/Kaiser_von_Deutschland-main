/** Presentation only: one visual language, with period-specific materials and vocabulary. */
export function eraPresentation(year: number) {
  if (year >= 2000) return { id: 'digital', title: 'Das vernetzte Land', desk: 'Planungsstudio', tool: '▦', object: 'Daten & Verbindungen', council: 'Kabinett', court: 'Verwaltung', war: 'Sicherheit', realm: 'Dein Land', material: 'Interaktive Karte', date: year };
  if (year >= 1945) return { id: 'modern', title: 'Ein neuer Anfang', desk: 'Regierungsbüro', tool: '▤', object: 'Aufbau & Gesellschaft', council: 'Kabinett', court: 'Verwaltung', war: 'Verteidigung', realm: 'Dein Land', material: 'Kartografischer Atlas', date: year };
  if (year >= 1800) return { id: 'industrial', title: 'Im Zeitalter der Maschinen', desk: 'Arbeitszimmer', tool: '⚙', object: 'Industrie & Fortschritt', council: 'Staatsrat', court: 'Staatsverwaltung', war: 'Militär', realm: 'Dein Reich', material: 'Vermessungskarte', date: year };
  if (year >= 1500) return { id: 'early-modern', title: 'Neue Horizonte', desk: 'Kartenkabinett', tool: '✧', object: 'Entdeckungen & Wissen', council: 'Geheimer Rat', court: 'Hofverwaltung', war: 'Feldzüge', realm: 'Dein Reich', material: 'Kolorierter Atlas', date: year };
  return { id: 'medieval', title: 'Land, Flüsse und Herrschaft', desk: 'Schreibstube', tool: '✒', object: 'Urkunden & Chroniken', council: 'Reichsrat', court: 'Hofverwaltung', war: 'Feldzüge', realm: 'Dein Lehen', material: 'Karte auf Pergament', date: year };
}

export function deskMarkup() {
  return `<div class="desk-scene" aria-label="Virtueller Schreibtisch">
    <div class="desk-light" aria-hidden="true"></div>
    <div class="desk-caption"><span class="eyebrow" data-presentation-desk>Schreibstube</span><h2 data-presentation-motto>Land, Flüsse und Herrschaft</h2><p>Die Welt liegt vor dir.</p></div>
    <button type="button" class="desk-map" data-map-level="zentraleuropa" aria-label="Landkarte entfalten"><span class="paper-heading">CENTRAL EUROPA <small data-presentation-year>1200</small></span><span class="paper-landscape"></span><span class="paper-footer"><span data-presentation-material>Karte auf Pergament</span><strong>Karte entfalten ↗</strong></span></button>
    <div class="desk-compass" aria-hidden="true"><span>N</span>✥</div>
    <button type="button" class="desk-ledger" data-view="chronicle"><span data-presentation-tool>✒</span><strong data-presentation-object>Urkunden & Chroniken</strong><small>Chronik öffnen →</small></button>
    <div class="desk-seal" aria-hidden="true">K</div>
    <div class="desk-instruction">SCHREIBTISCH <span>→</span> LANDKARTE <span>→</span> SIEDLUNG</div>
  </div>`;
}
