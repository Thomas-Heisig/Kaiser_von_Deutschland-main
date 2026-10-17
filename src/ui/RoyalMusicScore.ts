/**
 * "Ein Reich, viele Zeiten" / "Krone und Land".
 * Original procedural leitmotif: D-E-F-G, F-E, D (major changes F to F#).
 * All sound is generated locally. Instrument labels are timbral inspiration,
 * not historical recordings or claims of period-perfect orchestration.
 */
export type MusicEpoch =
  | 'early-medieval' | 'high-medieval' | 'hanse'
  | 'early-modern' | 'industrial' | 'modern' | 'future';
export type MusicScene = 'menu' | 'city' | 'trade' | 'court' | 'crisis' | 'war' | 'victory';
export type MusicVoice = 'drone' | 'fiddle' | 'flute' | 'lute' | 'keys' | 'strings' | 'horn' | 'pad';
export interface MusicContext {
  year: number;
  campaignId?: string;
  scene: MusicScene;
}
export interface MusicArrangement {
  epoch: MusicEpoch;
  scene: MusicScene;
  lead: MusicVoice;
  accompaniment: MusicVoice;
  bass: MusicVoice;
  major: boolean;
  density: number;
  percussion: boolean;
}
export const MUSIC_BPM = 76;
export const BEATS_PER_BAR = 4;
export const BEAT_SECONDS = 60 / MUSIC_BPM;
export const BAR_SECONDS = BEAT_SECONDS * BEATS_PER_BAR;
export const LEITMOTIF_BEATS = [0, 1, 2, 3, 4, 5, 6] as const;
export const LEITMOTIF_MINOR = [0, 2, 3, 5, 3, 2, 0] as const;
export const LEITMOTIF_MAJOR = [0, 2, 4, 5, 4, 2, 0] as const;
export const MUSIC_EPOCH_NAMES: Record<MusicEpoch, string> = {
  'early-medieval': 'Frühmittelalter', 'high-medieval': 'Hochmittelalter',
  hanse: 'Hansezeit', 'early-modern': 'Frühe Neuzeit',
  industrial: 'Industriezeitalter', modern: 'Moderne', future: 'Zukunft'
};
export const MUSIC_SCENE_NAMES: Record<MusicScene, string> = {
  menu: 'Krone und Land', city: 'Siedlung und Aufbau', trade: 'Handel und Wege',
  court: 'Hof und Politik', crisis: 'Krise und Versorgung',
  war: 'Feldzug und Belagerung', victory: 'Sieg und Reichswende'
};

export function musicEpoch(context: MusicContext): MusicEpoch {
  const { year, campaignId, scene } = context;
  if (!Number.isFinite(year)) return 'high-medieval';
  if (year < 1100) return 'early-medieval';
  if (year < 1500) {
    if (campaignId === 'hanse' || (year >= 1300 && scene === 'trade')) return 'hanse';
    return 'high-medieval';
  }
  if (year < 1800) return 'early-modern';
  if (year < 1914) return 'industrial';
  if (year <= 2026) return 'modern';
  return 'future';
}

/** Pure arrangement selection, so era and moment changes are easy to test. */
export function musicArrangement(context: MusicContext): MusicArrangement {
  const epoch = musicEpoch(context);
  const scene = context.scene;
  const timbres: Record<MusicEpoch, readonly [MusicVoice, MusicVoice, MusicVoice]> = {
    'early-medieval': ['flute', 'drone', 'drone'],
    'high-medieval': ['fiddle', 'lute', 'drone'],
    hanse: ['flute', 'lute', 'fiddle'],
    'early-modern': ['fiddle', 'keys', 'strings'],
    industrial: ['strings', 'horn', 'strings'],
    modern: ['strings', 'pad', 'strings'],
    future: ['pad', 'flute', 'pad']
  };
  const [baseLead, baseAccompaniment, baseBass] = timbres[epoch];
  const solemn = scene === 'war' || scene === 'crisis';
  const major = scene === 'victory' || scene === 'trade' || scene === 'city' ||
    (scene === 'menu' && epoch === 'future');
  return {
    epoch, scene,
    lead: scene === 'court' && epoch !== 'early-medieval' ? 'keys' : baseLead,
    accompaniment: scene === 'war' && epoch !== 'early-medieval' ? 'horn' : baseAccompaniment,
    bass: baseBass,
    major: solemn ? false : major,
    density: scene === 'menu' ? 0.72 : scene === 'trade' ? 0.82 : solemn ? 0.6 : 0.68,
    percussion: (scene === 'war' || scene === 'crisis' || epoch === 'industrial') && scene !== 'menu'
  };
}

/** 48 bars at 76 bpm = ~151.6s of varied menu form before looping. */
export function soundtrackBars(scene: MusicScene): number {
  return scene === 'menu' ? 48 : 16;
}

export function midiFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}
