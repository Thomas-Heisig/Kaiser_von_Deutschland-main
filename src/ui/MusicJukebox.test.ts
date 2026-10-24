import { afterEach, describe, expect, it, vi } from 'vitest';
import musicCatalog from '../data/json/music-catalog.json';
import { BUNDLED_TRACKS, MAIN_THEME_ID, MusicJukebox, trackForYear, tracksForYear } from './MusicJukebox';

describe('Official soundtrack assets', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('contains all 20 uniquely named recordings with covers', () => {
    expect(BUNDLED_TRACKS).toHaveLength(20);
    expect(new Set(BUNDLED_TRACKS.map(track => track.url)).size).toBe(20);
    for (const track of BUNDLED_TRACKS) {
      expect(track.url).toMatch(/^\/music\/[a-z0-9-]+\.mp3$/);
      expect(track.coverUrl).toMatch(/^\/covers\/[a-z0-9-]+\.webp$/);
    }
  });
  it('starts with Ancient Veil and keeps prehistoric tracks in their era', () => {
    expect(MAIN_THEME_ID).toBe('schleier-der-vorzeit');
    expect(musicCatalog.openingTrackId).toBe(MAIN_THEME_ID);
    expect(trackForYear(BUNDLED_TRACKS, 1850)?.title).toBe('Eiserne Krone');
    expect(trackForYear(BUNDLED_TRACKS, 2000)?.title).toBe('Kaiserreich Erwachen');
    expect(tracksForYear(BUNDLED_TRACKS, -1999)).toHaveLength(5);
    expect(tracksForYear(BUNDLED_TRACKS, -500)).toHaveLength(5);
    expect(trackForYear(BUNDLED_TRACKS, -499)?.id).toBe('anbeginn-der-zeit');
    expect(trackForYear(BUNDLED_TRACKS, 800)?.id).toBe('anbeginn-der-zeit');
    expect(trackForYear(BUNDLED_TRACKS, 1200)?.id).toBe('leitmotiv-1200');
  });
  it('cycles all five era tracks without restarting on year sync and respects repeat modes', async () => {
    class AudioMock {
      paused = true; loop = false; volume = 0; preload = '';
      addEventListener() {} removeAttribute() {} load() {}
      async play() { this.paused = false; }
      pause() { this.paused = true; }
    }
    vi.stubGlobal('Audio', AudioMock);
    vi.stubGlobal('localStorage', { setItem() {} });
    const jukebox = new MusicJukebox();
    jukebox.setCurrentYear(-1999);
    await jukebox.playOpening();
    expect(jukebox.getCurrentId()).toBe(MAIN_THEME_ID);
    await jukebox.advancePlaylist();
    expect(jukebox.getCurrentId()).toBe(MAIN_THEME_ID);
    jukebox.setCurrentYear(-1999);
    for (const track of tracksForYear(BUNDLED_TRACKS, -1999).slice(1)) {
      await jukebox.advancePlaylist();
      expect(jukebox.getCurrentId()).toBe(track.id);
      await jukebox.syncYear(-1998);
      expect(jukebox.getCurrentId()).toBe(track.id);
    }
    jukebox.setRepeatMode('one');
    await jukebox.advancePlaylist();
    expect(jukebox.getCurrentId()).toBe('erz-und-gemeinschaft');
    jukebox.setRepeatMode('all');
    await jukebox.advancePlaylist();
    expect(jukebox.getCurrentId()).toBe(MAIN_THEME_ID);
    jukebox.setRepeatMode('off');
    for (let i=0;i<5;i++) await jukebox.advancePlaylist();
    expect(jukebox.getCurrentId()).toBeNull();
    await jukebox.syncYear(1200);
    expect(jukebox.getCurrentId()).toBe('leitmotiv-1200');
    jukebox.dispose();
  });
});
