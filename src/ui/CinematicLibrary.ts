/** The film catalogue is generated at build time from files genuinely present in public/video/. */
export interface CinematicClip { id: string; title: string; url: string; }
export type FilmRole = 'intro' | 'outro' | 'interlude';
export interface FilmPreferences {
  intro: string;
  outro: string;
  interlude: string;
  interludesEnabled: boolean;
}
const KEY = 'kaiser-cinema-preferences-v1';
const DEFAULT: FilmPreferences = {
  intro: 'intro-original.mp4', outro: 'intro.mp4', interlude: '',
  interludesEnabled: false
};
export function filmPreferences(): FilmPreferences {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<FilmPreferences>;
    return {
      intro: typeof raw.intro === 'string' ? raw.intro : DEFAULT.intro,
      outro: typeof raw.outro === 'string' ? raw.outro : DEFAULT.outro,
      interlude: typeof raw.interlude === 'string' ? raw.interlude : DEFAULT.interlude,
      interludesEnabled: raw.interludesEnabled === true
    };
  } catch { return { ...DEFAULT }; }
}
export function saveFilmPreferences(prefs: FilmPreferences): void {
  localStorage.setItem(KEY, JSON.stringify(prefs));
}
export function filmForRole(clips: readonly CinematicClip[], role: FilmRole, prefs: FilmPreferences): CinematicClip | null {
  const selected = prefs[role];
  const chosen = clips.find(clip => clip.id === selected);
  if (chosen) return chosen;
  if (role === 'interlude') return null; // Never substitute a long intro for a historical cutscene.
  const fallback = role === 'intro' ? DEFAULT.intro : DEFAULT.outro;
  return clips.find(clip => clip.id === fallback) ?? clips[0] ?? null;
}
export async function loadCinematicLibrary(): Promise<CinematicClip[]> {
  const response = await fetch('/video-catalog.json', { cache: 'no-cache' });
  if (!response.ok) throw Error('Filmkatalog nicht erreichbar (HTTP ' + response.status + ')');
  const data: unknown = await response.json();
  if (!data || typeof data !== 'object' || !('videos' in data) || !Array.isArray(data.videos)) throw Error('Filmkatalog ungültig.');
  return data.videos.filter((v: unknown): v is CinematicClip => {
    if (!v || typeof v !== 'object') return false;
    const clip = v as Partial<CinematicClip>;
    return typeof clip.id === 'string' && typeof clip.title === 'string' &&
      typeof clip.url === 'string' && /^\/video\/[a-zA-Z0-9_.%+-]+$/.test(clip.url);
  });
}
