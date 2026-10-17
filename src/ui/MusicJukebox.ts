import localforage from 'localforage';
export interface JukeboxTrack { id: string; title: string; era: string; source: 'library' | 'import'; url?: string; }
const KEY = 'kaiser-music-tracks-v1';
const STORAGE = localforage.createInstance({ name: 'KaiserMusik', storeName: 'tracks' });
export const BUNDLED_TRACKS: readonly JukeboxTrack[] = [
  { id: 'krone-und-land', title: 'Krone und Land – Ein Reich, viele Zeiten', era: 'Mittelalter', source: 'library',
    url: '/music/krone-und-land.mp3' }
];
export class MusicJukebox {
  private audio: HTMLAudioElement | null = null;
  private objectUrl: string | null = null;
  private currentId: string | null = null;
  private volume = 0.28;
  private enabled = false;
  private tracks: JukeboxTrack[] = [...BUNDLED_TRACKS];
  private onChange: () => void = () => {};
  public constructor(onChange?: () => void) { if (onChange) this.onChange = onChange; }
  public getTracks(): JukeboxTrack[] { return this.tracks.map(t=>({...t})); }
  public getCurrentId(): string | null { return this.currentId; }
  public isPlaying(): boolean { return this.enabled && !!this.audio && !this.audio.paused; }
  public async initialize(): Promise<void> {
    const list = (await STORAGE.getItem<JukeboxTrack[]>(KEY)) ?? [];
    const valid = list.filter(x => x && x.source === 'import' && typeof x.id === 'string' && typeof x.title === 'string');
    const available: JukeboxTrack[] = [];
    for (const item of BUNDLED_TRACKS) {
      try { if ((await fetch(item.url!, {method:'HEAD'})).ok) available.push(item); } catch { /* optional asset absent */ }
    }
    this.tracks = [...available, ...valid];
    this.onChange();
  }
  public async importFile(file: File, era = 'Mittelalter'): Promise<JukeboxTrack> {
    if (!['audio/mpeg','audio/mp3','audio/ogg','audio/wav','audio/x-wav'].includes(file.type) &&
        !/\.(mp3|ogg|wav)$/i.test(file.name)) throw new Error('Bitte MP3, OGG oder WAV verwenden.');
    if (file.size < 1024 || file.size > 30 * 1024 * 1024) throw new Error('Audiodatei muss zwischen 1 KB und 30 MB groß sein.');
    const id = 'user-' + crypto.randomUUID();
    const track: JukeboxTrack = { id, title: file.name.replace(/\.[^.]+$/, ''), era, source: 'import' };
    await STORAGE.setItem('audio-' + id, file);
    const next = [...this.tracks.filter(t=>t.source==='import'),track];
    await STORAGE.setItem(KEY,next);
    this.tracks=[...this.tracks.filter(t=>t.source==='library'),...next]; this.onChange();
    return track;
  }
  public async remove(id: string): Promise<void> {
    const t=this.tracks.find(x=>x.id===id);
    if (!t || t.source!=='import') throw new Error('Nur importierte Titel lassen sich entfernen.');
    if (this.currentId===id) this.stop();
    await STORAGE.removeItem('audio-'+id);
    this.tracks=this.tracks.filter(x=>x.id!==id);
    await STORAGE.setItem(KEY,this.tracks.filter(x=>x.source==='import'));
    this.onChange();
  }
  public async play(id: string): Promise<void> {
    const track=this.tracks.find(t=>t.id===id);
    if(!track) throw new Error('Musiktitel nicht gefunden.');
    this.stop();
    let src=track.url;
    if(track.source==='import') {
      const blob=await STORAGE.getItem<Blob>('audio-'+id);
      if(!blob) throw new Error('Audiodatei nicht mehr im Browser gespeichert.');
      this.objectUrl=URL.createObjectURL(blob); src=this.objectUrl;
    }
    if(!src) throw new Error('Audiodatei fehlt.');
    const audio=new Audio(src);
    audio.loop=true; audio.volume=this.volume;
    this.audio=audio; this.currentId=id;
    try {
      await audio.play();
      this.enabled=true;
      this.onChange();
    } catch(error) {
      this.stop();
      throw error;
    }
  }
  public pause(): void { this.audio?.pause(); this.enabled=false; this.onChange(); }
  public setVolume(value: number): void {
    if(!Number.isFinite(value)) return;
    this.volume=Math.max(0,Math.min(1,value));
    if(this.audio) this.audio.volume=this.volume;
  }
  public stop(): void {
    const old=this.audio; this.audio=null; this.currentId=null; this.enabled=false;
    if(old) { old.pause(); old.removeAttribute('src'); old.load(); }
    if(this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl=null; this.onChange();
  }
  public dispose(): void { this.stop(); }
}
