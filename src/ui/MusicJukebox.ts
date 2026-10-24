import localforage from 'localforage';
import musicCatalog from '../data/json/music-catalog.json';

export interface JukeboxTrack {
  id: string;
  title: string;
  era: string;
  source: 'library' | 'import';
  year?: number;
  endYear?: number;
  url?: string;
  coverUrl?: string;
  description?: string;
}

const KEY = 'kaiser-music-tracks-v1';
const STORAGE = localforage.createInstance({ name: 'KaiserMusik', storeName: 'tracks' });

/** Original recordings tracked as versioned static assets, without HEAD/MIME gating. */
export const BUNDLED_TRACKS: readonly JukeboxTrack[] = musicCatalog.tracks.map(track => ({
  id: track.id,
  title: track.title,
  era: track.era,
  ...(typeof track.year === 'number' ? { year: track.year } : {}),
  ...('endYear' in track && typeof track.endYear === 'number' ? { endYear: track.endYear } : {}),
  source: 'library' as const,
  url: import.meta.env.BASE_URL + 'music/' + track.filename,
  coverUrl: import.meta.env.BASE_URL + track.cover.replace(/^\//, ''),
  description: track.description
}));

export const MAIN_THEME_ID = musicCatalog.openingTrackId;
export const MAIN_THEME = BUNDLED_TRACKS.find(track => track.id === MAIN_THEME_ID)!;

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
  2000: { title: 'Kaiserreich Erwachen', era: 'Digitalzeitalter' }
};

/** Select a recording for the current game year, not an unrelated bonus theme. */
export function trackForYear(tracks: readonly JukeboxTrack[], year: number): JukeboxTrack | null {
  return tracksForYear(tracks, year)[0] ?? null;
}

/** Equal start dates form an era playlist; an ending date prevents spill into later eras. */
export function tracksForYear(tracks: readonly JukeboxTrack[], year: number): JukeboxTrack[] {
  const dated = tracks.filter((track): track is JukeboxTrack & { year: number } =>
    typeof track.year === 'number' && Number.isFinite(track.year))
    .sort((a, b) => a.year - b.year);
  if (!dated.length) return tracks.length ? [tracks.find(track => track.id === MAIN_THEME_ID) ?? tracks[0]] : [];
  const date = Number.isFinite(year) ? year : dated[0].year;
  const eligible = dated.filter(track => track.year <= date && (track.endYear === undefined || date <= track.endYear));
  const start = eligible.at(-1)?.year;
  if (start === undefined) return [tracks.find(track => track.id === 'anbeginn-der-zeit') ?? dated[0]];
  return eligible.filter(track => track.year === start);
}

/** Infer useful titles for optional private browser imports. */
export function musicMetadataFromFilename(filename: string): Pick<JukeboxTrack, 'title' | 'era' | 'year'> {
  const year = Object.keys(YEAR_NAMES).map(Number)
    .find(candidate => new RegExp('(?:^|\\D)' + candidate + '(?:\\D|$)').test(filename));
  if (year !== undefined) {
    const metadata = YEAR_NAMES[year];
    return { title: metadata.title, era: year + ' · ' + metadata.era, year };
  }
  return {
    title: filename.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim(),
    era: 'Eigene Aufnahme'
  };
}

export type PlaylistMode = 'era' | 'sequential' | 'shuffle';
export type RepeatMode = 'all' | 'one' | 'off';

export class MusicJukebox {
  private audio: HTMLAudioElement | null = null;
  private objectUrl: string | null = null;
  private currentId: string | null = null;
  private volume = 0.28;
  private enabled = false;
  private tracks: JukeboxTrack[] = [...BUNDLED_TRACKS];
  private onChange: () => void = () => {};
  private autoplayBlocked = false;
  private playlistMode: PlaylistMode = 'era';
  private repeatMode: RepeatMode = 'all';
  private currentYear = 1200;
  private openingPlayback = false;
  private playbackSerial = 0;
  private lastError = '';
  public getLastError(): string { return this.lastError; }

  constructor(onChange?: () => void) { if (onChange) this.onChange = onChange; }
  public getPlaylistMode(): PlaylistMode { return this.playlistMode; }
  public getRepeatMode(): RepeatMode { return this.repeatMode; }
  public setPlaylistMode(mode: PlaylistMode): void {
    this.playlistMode = mode;
    if (this.audio) this.audio.loop = this.repeatMode === 'one';
    localStorage.setItem('kaiser-playlist-mode', mode);
    this.onChange();
  }
  public setRepeatMode(mode: RepeatMode): void {
    this.repeatMode = mode;
    localStorage.setItem('kaiser-repeat-mode', mode);
    if (this.audio) this.audio.loop = mode === 'one';
    this.onChange();
  }
  public setCurrentYear(year: number): void { this.currentYear = year; this.openingPlayback = false; }
  public async syncYear(year: number): Promise<void> {
    this.setCurrentYear(year);
    if (this.playlistMode !== 'era') return;
    const match = this.getEraTracks(year).find(track => track.id === this.currentId) ?? this.getTrackForYear(year);
    if (match && match.id !== this.currentId) await this.play(match.id);
  }
  public getTracks(): JukeboxTrack[] { return this.tracks.map(track => ({ ...track })); }
  public getCurrentId(): string | null { return this.currentId; }
  public getTrackInfo(id: string) { return musicCatalog.tracks.find(track => track.id === id); }
  public getDownloadUrl(id: string): string | null {
    const track = this.tracks.find(item => item.id === id);
    return track?.source === 'library' ? track.url ?? null : null;
  }
  public getVolume(): number { return this.volume; }
  public hasAutoplayBlock(): boolean { return this.autoplayBlocked; }
  public isPlaying(): boolean { return this.enabled && !!this.audio && !this.audio.paused; }
  public getTrackForYear(year: number): JukeboxTrack | null { return trackForYear(this.tracks, year); }
  public getEraTracks(year: number): JukeboxTrack[] { return tracksForYear(this.tracks, year); }

  public async initialize(): Promise<void> {
    const savedMode = localStorage.getItem('kaiser-playlist-mode');
    if (savedMode === 'era' || savedMode === 'shuffle' || savedMode === 'sequential') this.playlistMode = savedMode;
    const savedRepeat = localStorage.getItem('kaiser-repeat-mode');
    if (savedRepeat === 'one' || savedRepeat === 'all' || savedRepeat === 'off') this.repeatMode = savedRepeat;
    const list = (await STORAGE.getItem<JukeboxTrack[]>(KEY)) ?? [];
    const imported = Array.isArray(list) ? list.filter(track => track && track.source === 'import' &&
      typeof track.id === 'string' && typeof track.title === 'string')
      .map(track => ({
        ...track,
        ...(typeof track.year === 'number' ? {} : musicMetadataFromFilename(track.title))
      })) : [];
    this.tracks = [...BUNDLED_TRACKS, ...imported];
    this.onChange();
  }

  public async playOpening(): Promise<boolean> {
    this.openingPlayback = true;
    try {
      await this.play(MAIN_THEME_ID);
      this.autoplayBlocked = false;
      return true;
    } catch {
      this.autoplayBlocked = true;
      return false;
    }
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
    const imported = [...this.tracks.filter(item => item.source === 'import'), track];
    try {
      await STORAGE.setItem(KEY, imported);
    } catch (error) {
      await STORAGE.removeItem('audio-' + id);
      throw error;
    }
    this.tracks = [...BUNDLED_TRACKS, ...imported];
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
    if (!track) throw new Error('Der Musiktitel ist nicht verfügbar.');
    this.stop();
    this.lastError = '';
    const serial = ++this.playbackSerial;
    let source = track.url;
    if (track.source === 'import') {
      const blob = await STORAGE.getItem<Blob>('audio-' + id);
      if (!blob) throw new Error('Audiodatei nicht mehr im Browser gespeichert.');
      this.objectUrl = URL.createObjectURL(blob);
      source = this.objectUrl;
    }
    if (!source) throw new Error('Audiodatei fehlt.');
    const audio = new Audio(source);
    audio.addEventListener('error', () => { this.lastError = 'Audio nicht abrufbar oder nicht lesbar: ' + (track.title || id) + '. Prüfe die Serverdatei und den Offline-Cache.'; this.onChange(); });
    audio.loop = this.repeatMode === 'one';
    audio.addEventListener('ended', () => { if (this.playbackSerial === serial) void this.advancePlaylist().catch(() => this.onChange()); });
    audio.preload = 'auto';
    audio.volume = this.volume;
    this.audio = audio;
    this.currentId = id;
    try {
      await audio.play();
      this.enabled = true;
      this.autoplayBlocked = false;
      this.onChange();
    } catch (error) {
      const code = audio.error?.code;
      this.lastError = code === 4 ? 'Quelle nicht unterstützt oder Dateipfad falsch: ' + track.title :
        code === 3 ? 'MP3-Decodierung fehlgeschlagen: ' + track.title :
          code === 2 ? 'Netzwerkfehler beim Laden: ' + track.title :
            error instanceof Error ? error.message : 'Titel konnte nicht geladen werden.';
      this.stop();
      this.onChange();
      throw new Error(this.lastError);
    }
  }

  public async diagnoseTracks(onProgress: (done: number, total: number, title: string) => void): Promise<string[]> {
    const failures: string[] = [];
    const bundled = this.tracks.filter(track => track.source === 'library');
    for (let i = 0; i < bundled.length; i++) {
      const track = bundled[i];
      try {
        const response = await fetch(track.url!, { headers: { Range: 'bytes=0-4095' }, cache: 'no-store' });
        if (!response.ok || (response.status !== 206 && response.status !== 200))
          throw new Error('HTTP ' + response.status);
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (bytes.length < 4) throw new Error('Leere Audiodatei');
        const mp3 = (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) ||
          (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
        if (!mp3) throw new Error('Kein MP3-Header; mögliche HTML-Fehlerseite');
      } catch (error) {
        failures.push(track.title + ': ' + (error instanceof Error ? error.message : String(error)));
      }
      onProgress(i + 1, bundled.length, track.title);
    }
    return failures;
  }

  public async advancePlaylist(): Promise<void> {
    if (this.openingPlayback) {
      if (this.repeatMode === 'off') this.stop();
      else await this.play(MAIN_THEME_ID);
      return;
    }
    if (this.repeatMode === 'one' && this.currentId) { await this.play(this.currentId); return; }
    if (this.playlistMode === 'era') {
      const pool = this.getEraTracks(this.currentYear);
      const index = pool.findIndex(track => track.id === this.currentId);
      if (this.repeatMode === 'off' && index === pool.length - 1) { this.stop(); return; }
      const track = pool[(index + 1) % pool.length];
      if (track) await this.play(track.id);
      return;
    }
    if (this.repeatMode === 'one' && this.currentId) { await this.play(this.currentId); return; }
    const tracks = this.tracks;
    const currentIndex = tracks.findIndex(t => t.id === this.currentId);
    if (this.repeatMode === 'off' && currentIndex === tracks.length - 1) { this.stop(); return; }
    let next = (currentIndex + 1) % tracks.length;
    if (this.playlistMode === 'shuffle' && tracks.length > 1) {
      next = Math.floor(Math.random() * (tracks.length - 1));
      if (next >= currentIndex && currentIndex >= 0) next++;
    }
    if (tracks[next]) await this.play(tracks[next].id);
  }

  public setVolume(value: number): void {
    if (!Number.isFinite(value)) return;
    this.volume = Math.max(0, Math.min(1, value));
    if (this.audio) this.audio.volume = this.volume;
  }

  public stop(): void {
    this.playbackSerial++;
    const old = this.audio;
    this.audio = null;
    this.currentId = null;
    this.enabled = false;
    if (old) {
      old.pause();
      old.removeAttribute('src');
      old.load();
    }
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = null;
    this.onChange();
  }
  public dispose(): void { this.stop(); }
}
