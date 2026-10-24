import { readFile } from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import musicCatalog from '../data/json/music-catalog.json';
import { AUTHENTICITY_NOTE, BUNDLED_TRACKS, GENERIC_COVER, MAIN_THEME_ID, MusicJukebox, trackForYear, tracksForYear } from './MusicJukebox';

describe('Official soundtrack assets', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('contains all 23 uniquely named recordings with covers', () => {
    expect(BUNDLED_TRACKS).toHaveLength(23);
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
  it('gives every era its own track and never spills an era into the next', () => {
    const eras: Array<[number, string]> = [
      [-1999, 'schleier-der-vorzeit'], [-500, 'schleier-der-vorzeit'],
      [-499, 'anbeginn-der-zeit'], [0, 'anbeginn-der-zeit'], [500, 'anbeginn-der-zeit'],
      [843, 'anbeginn-der-zeit'], [1199, 'anbeginn-der-zeit'],
      [1200, 'leitmotiv-1200'], [1299, 'leitmotiv-1200'], [1300, 'stauferkrone-1300'],
      [1400, 'leitmotiv-1400'], [1500, 'pavane-1500'], [1600, 'fanfare-1600'],
      [1750, 'ouvertuere-1750'], [1820, 'romantik-1820'], [1890, 'eiserne-kronen-1890'],
      [1945, 'truemmerstaaten-1945'], [1970, 'kaisersynthesia-1970'], [2000, 'kaiserreich-erwachen-2000']
    ];
    for (const [year, expected] of eras) {
      expect(trackForYear(BUNDLED_TRACKS, year)?.id, `year ${year}`).toBe(expected);
    }
  });
  it('uses the earliest era before the earliest track instead of a later one', () => {
    // Before the prehistoric range, prehistory must not fall back to antiquity.
    for (const year of [-5000, -3000, -2000]) {
      const track = trackForYear(BUNDLED_TRACKS, year);
      expect(track).not.toBeNull();
      expect(track!.year ?? 0).toBeLessThan(-499);
    }
  });
  it('marks every recording as a modern composition, not historical music', () => {
    expect(AUTHENTICITY_NOTE).toMatch(/moderne/i);
    expect(AUTHENTICITY_NOTE).toMatch(/kein überliefertes/i);
    const catalog = musicCatalog as { authenticityNote?: string; tracks: Array<{ authenticity?: string }> };
    expect(catalog.authenticityNote).toBeTruthy();
    for (const track of catalog.tracks) expect(track.authenticity).toBe('modern');
  });
  it('provides a generic placeholder cover that is not borrowed from a track', () => {
    expect(GENERIC_COVER.startsWith('data:image/svg+xml')).toBe(true);
    expect(decodeURIComponent(GENERIC_COVER)).toContain('Kein Cover');
    for (const track of BUNDLED_TRACKS) expect(GENERIC_COVER).not.toContain(track.id);
  });
  it('resolves every catalogued cover and audio file on disk', async () => {
    for (const track of musicCatalog.tracks) {
      const cover = 'public' + track.cover;
      const audio = 'public/music/' + track.filename;
      await expect(readFile(cover), `cover ${track.id}`).resolves.toBeTruthy();
      await expect(readFile(audio), `audio ${track.id}`).resolves.toBeTruthy();
    }
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
