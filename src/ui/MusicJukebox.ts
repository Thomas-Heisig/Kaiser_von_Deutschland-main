import localforage from 'localforage';

export interface JukeboxTrack {
  id: string;
  title: string;
  era: string;
  source: 'library' | 'import';
  year?: number;
  url?: string;
}

const KEY = 'kaiser-music-tracks-v1';
const STORAGE = localforage.createInstance({ name: 'KaiserMusik', storeName: 'tracks' });

/** These titles appear only after their matching MP3 actually exists on the server. */
export const BUNDLED_TRACKS: readonly JukeboxTrack[] = [
  { id: 'leitmotiv-1200', title: 'Kaiserliches Leitmotiv', era: '1200 · Mittelalter', year: 1200,
    source: 'library', url: '/music/kaiserliches-leitmotiv-1200.mp3' },
  { id: 'stauferkrone-1300', title: 'Stauferkrone', era: '1300 · Hochmittelalter', year: 1300,
    source: 'library', url: '/music/stauferkrone-1300.mp3' },
  { id: 'leitmotiv-1400', title: 'Kaisers Leitmotiv', era: '1400 · Spätmittelalter', year: 1400,
    source: 'library', url: '/music/kaisers-leitmotiv-1400.mp3' },
  { id: 'pavane-1500', title: 'Kaiserhof Pavane', era: '1500 · Frühe Neuzeit', year: 1500,
    source: 'library', url: '/music/kaiserhof-pavane-1500.mp3' },
  { id: 'fanfare-1600', title: 'Imperiale Fanfare', era: '1600 · Frühe Neuzeit', year: 1600,
    source: 'library', url: '/music/imperiale-fanfare-1600.mp3' },
  { id: 'ouvertuere-1750', title: 'Kaiserliche Ouvertüre', era: '1750 · Aufklärung', year: 1750,
    source: 'library', url: '/music/kaiserliche-ouvertuere-1750.mp3' },
  { id: 'romantik-1820', title: 'Eiserne Krone', era: '1820 · Romantik', year: 1820, source: 'library',
    url: '/music/eiserne-krone-1820.mp3' },
  { id: 'eiserne-kronen-1890', title: 'Eiserne Kronen', era: '1890 · Spätromantik & Moderne', year: 1890,
    source: 'library', url: '/music/eiserne-kronen-1890.mp3' },
  { id: 'truemmerstaaten-1945', title: 'Trümmerstaaten', era: '1945 · Nachkriegsmoderne', year: 1945,
    source: 'library', url: '/music/truemmerstaaten-1945.mp3' },
  { id: 'kaisersynthesia-1970', title: 'Kaisersynthesia', era: '1970 · Elektronik', year: 1970,
    source: 'library', url: '/music/kaisersynthesia-1970.mp3' },
  { id: 'kaiserreich-erwachen-2000', title: 'Kaiserreich erwachen', era: '2000 · Digitalzeitalter', year: 2000,
    source: 'library', url: '/music/kaiserreich-erwachen-2000.mp3' },
  { id: 'krone-und-land', title: 'Krone und Land – Ein Reich, viele Zeiten',
    era: 'Mittelalter · Bonus', source: 'library', url: '/music/krone-und-land.mp3' }
];

const YEAR_NAMES: Record<number, { title: string; era: string }> = {
  1200: { title: 'Kaiserliches Leitmotiv', era: 'Mittelalter' },
  1300: { title: 'Stauferkrone', era: 'Hochmittelalter' },
  1400: { title: 'Kaisers Leitmotiv', era: 'Spätmittelalter' },
  1500: { title: 'Kaiserhof Pavane', era: 'Frühe Neuzeit' },
  1600: { title: 'Imperiale Fanfare', era: 'Frühe Neuzeit' },
  1750: { title: 'Kaiserliche Ouvertüre', era: 'Aufklärung' },
  1820: { title: 'Eiserne Krone', era: 'Romantik' },
  1890: { title: 'Eiserne Kronen', era: 'Spätromantik & Moderne' },
  1945: { title: 'Trümmerstaaten', era: 'Nachkriegsmoderne' },
  1970: { title: 'Kaisersynthesia', era: 'Elektronik' },
  2000: { title: 'Kaiserreich erwachen', era: 'Digitalzeitalter' }
};

/** A dated recording suitable for the present game year; never invent an unavailable track. */
export function trackForYear(tracks: readonly JukeboxTrack[], year: number): JukeboxTrack | null {
  if (!tracks.length) return null;
  const dated = tracks.filter((track): track is JukeboxTrack & { year: number } =>
    typeof track.year === 'number' && Number.isFinite(track.year))
    .sort((a, b) => a.year - b.year);
  if (!dated.length) return tracks[0];
  if (!Number.isFinite(year)) return dated[0];
  return [...dated].reverse().find(track => track.year <= year) ?? dated[0];
}

/** Uploaded filenames such as "(3) Kaisers Leitmotiv 1400.mp3" get readable names. */
export function musicMetadataFromFilename(filename: string): Pick<JukeboxTrack, 'title' | 'era' | 'year'> {
  const year = Object.keys(YEAR_NAMES).map(Number)
    .find(candidate => new RegExp('(?:^|\\D)' + candidate + '(?:\\D|$)').test(filename));
  if (year !== undefined) {
    const metadata = YEAR_NAMES[year];
    return { title: metadata.title, era: year + ' · ' + metadata.era, year };
  }
  return { title: filename.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim(),
    era: 'Eigene Aufnahme' };
}

export class MusicJukebox {
  private audio: HTMLAudioElement | null = null;
  private objectUrl: string | null = null;
  private currentId: string | null = null;
  private volume = 0.28;
  private enabled = false;
  private tracks: JukeboxTrack[] = [];
  private onChange: () => void = () => {};

  public constructor(onChange?: () => void) { if (onChange) this.onChange = onChange; }
  public getTracks(): JukeboxTrack[] { return this.tracks.map(track => ({ ...track })); }
  public getCurrentId(): string | null { return this.currentId; }
  public getTrackForYear(year: number): JukeboxTrack | null { return trackForYear(this.tracks, year); }
  public isPlaying(): boolean { return this.enabled && !!this.audio && !this.audio.paused; }

  public async initialize(): Promise<void> {
    const list = (await STORAGE.getItem<JukeboxTrack[]>(KEY)) ?? [];
    const valid = Array.isArray(list) ? list.filter(track => track && track.source === 'import' &&
      typeof track.id === 'string' && typeof track.title === 'string')
      .map(track => ({ ...track, ...(
        typeof track.year === 'number' ? {} : musicMetadataFromFilename(track.title)
      ) })) : [];
    const available: JukeboxTrack[] = [];
    for (const track of BUNDLED_TRACKS) {
      try {
        const response = await fetch(track.url!, { method: 'HEAD' });
        if (response.ok && (response.headers.get('content-type') ?? '').startsWith('audio/'))
          available.push(track);
      } catch { /* no audio file yet, don't present a broken track */ }
    }
    this.tracks = [...available, ...valid];
    this.onChange();
  }

  public async importFile(file: File): Promise<JukeboxTrack> {
    if (!['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/x-wav'].includes(file.type) &&
      !/\.(mp3|ogg|wav)$/i.test(file.name))
      throw new Error('Bitte MP3, OGG oder WAV verwenden.');
    if (file.size < 1024 || file.size > 30 * 1024 * 1024)
      throw new Error('Jede Audiodatei muss zwischen 1 KB und 30 MB groß sein.');
    const id = 'user-' + crypto.randomUUID();
    const track: JukeboxTrack = { id, ...musicMetadataFromFilename(file.name), source: 'import' };
    await STORAGE.setItem('audio-' + id, file);
    const imported = [...this.tracks.filter(track => track.source === 'import'), track];
    try {
      await STORAGE.setItem(KEY, imported);
    } catch (error) {
      await STORAGE.removeItem('audio-' + id);
      throw error;
    }
    this.tracks = [...this.tracks.filter(track => track.source === 'library'), ...imported];
    this.onChange();
    return track;
  }

  public async remove(id: string): Promise<void> {
    const track = this.tracks.find(item => item.id === id);
    if (!track || track.source !== 'import') throw new Error('Nur importierte Titel lassen sich entfernen.');
    if (this.currentId === id) this.stop();
    await STORAGE.removeItem('audio-' + id);
    this.tracks = this.tracks.filter(item => item.id !== id);
    await STORAGE.setItem(KEY, this.tracks.filter(item => item.source === 'import'));
    this.onChange();
  }

  public async play(id: string): Promise<void> {
    const track = this.tracks.find(item => item.id === id);
    if (!track) throw new Error('Kein Musiktitel verfügbar. Bitte zuerst MP3-Dateien importieren.');
    this.stop();
    let source = track.url;
    if (track.source === 'import') {
      const blob = await STORAGE.getItem<Blob>('audio-' + id);
      if (!blob) throw new Error('Audiodatei nicht mehr im Browser gespeichert.');
      this.objectUrl = URL.createObjectURL(blob);
      source = this.objectUrl;
    }
    if (!source) throw new Error('Audiodatei fehlt.');
    const audio = new Audio(source);
    audio.loop = true;
    audio.volume = this.volume;
    this.audio = audio;
    this.currentId = id;
    try {
      await audio.play();
      this.enabled = true;
      this.onChange();
    } catch (error) {
      this.stop();
      throw error;
    }
  }

  public setVolume(value: number): void {
    if (!Number.isFinite(value)) return;
    this.volume = Math.max(0, Math.min(1, value));
    if (this.audio) this.audio.volume = this.volume;
  }

  public stop(): void {
    const old = this.audio;
    this.audio = null;
    this.currentId = null;
    this.enabled = false;
    if (old) { old.pause(); old.removeAttribute('src'); old.load(); }
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = null;
    this.onChange();
  }

  public dispose(): void { this.stop(); }
}
