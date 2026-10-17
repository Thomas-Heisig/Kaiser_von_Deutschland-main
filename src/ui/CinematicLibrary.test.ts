import { describe, it, expect, vi, beforeEach } from 'vitest';
import { filmForRole, filmPreferences, saveFilmPreferences, loadCinematicLibrary } from './CinematicLibrary';
const clips = [
  { id: 'intro-original.mp4', title:'Langes Intro', url:'/video/intro-original.mp4' },
  { id: 'intro.mp4', title:'Kurzes Intro', url:'/video/intro.mp4' },
  { id: 'epoche.webm', title:'Epoche', url:'/video/epoche.webm' }
];
beforeEach(() => {
  const values = new Map<string,string>();
  vi.stubGlobal('localStorage', { getItem:(key:string)=>values.get(key)??null,
    setItem:(key:string,value:string)=>{values.set(key,value);} });
});
describe('Videothek', () => {
  it('preserves the default long intro and short outro', () => {
    const preferences = filmPreferences();
    expect(filmForRole(clips,'intro',preferences)?.id).toBe('intro-original.mp4');
    expect(filmForRole(clips,'outro',preferences)?.id).toBe('intro.mp4');
    expect(filmForRole(clips,'interlude',preferences)).toBeNull();
  });
  it('allows saved selections without enabling interludes by default', () => {
    saveFilmPreferences({...filmPreferences(),intro:'intro.mp4',interlude:'epoche.webm'});
    expect(filmForRole(clips,'intro',filmPreferences())?.id).toBe('intro.mp4');
    expect(filmPreferences().interludesEnabled).toBe(false);
  });
  it('discards external URLs from generated JSON', async () => {
    vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({videos:[...clips,
      {id:'bad',title:'Bad',url:'https://external.example/spy.mp4'}]})})));
    expect((await loadCinematicLibrary()).length).toBe(3);
    vi.unstubAllGlobals();
  });
});
