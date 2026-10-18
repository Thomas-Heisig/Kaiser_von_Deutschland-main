/** Statisches Messmodell, vollständig getrennt von GameEngine und Spielständen. */
export interface WerkstattKachel { readonly spalte: number; readonly zeile: number; readonly x: number; readonly y: number }
export const SZENE = { spalten: 12, zeilen: 12, breite: 64, hoehe: 32, gebaeude: 1, lichter: 1, rauch: 24, jahr: 1200, zielFps: 30 } as const;
/** Berechnet die Position einer isometrischen Kachel ohne Spielsimulation. */
export function kachelPosition(spalte: number, zeile: number): {x:number;y:number} {
  return {x:(spalte-zeile)*SZENE.breite/2,y:(spalte+zeile)*SZENE.hoehe/2};
}
/** Liefert exakt 144 unveränderliche logische Kacheln. */
export function werkstattKacheln(): readonly WerkstattKachel[] {
  return Array.from({length:SZENE.spalten*SZENE.zeilen},(_,i)=>{
    const spalte=i%SZENE.spalten,zeile=Math.floor(i/SZENE.spalten);
    return {spalte,zeile,...kachelPosition(spalte,zeile)};
  });
}
