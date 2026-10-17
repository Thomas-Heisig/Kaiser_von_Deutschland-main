import { describe, expect, it } from 'vitest';
import musicCatalog from '../data/json/music-catalog.json';
import { BUNDLED_TRACKS, MAIN_THEME_ID, trackForYear } from './MusicJukebox';

describe('Official soundtrack assets', () => {
  it('contains all 15 uniquely named recordings with covers', () => {
    expect(BUNDLED_TRACKS).toHaveLength(15);
    expect(new Set(BUNDLED_TRACKS.map(track => track.url)).size).toBe(15);
    for (const track of BUNDLED_TRACKS) {
      expect(track.url).toMatch(/^\/music\/[a-z0-9-]+\.mp3$/);
      expect(track.coverUrl).toMatch(/^\/covers\/[a-z0-9-]+\.webp$/);
    }
  });
  it('starts with Zeit vergeht and follows chronological eras', () => {
    expect(MAIN_THEME_ID).toBe('zeit-vergeht');
    expect(musicCatalog.openingTrackId).toBe(MAIN_THEME_ID);
    expect(trackForYear(BUNDLED_TRACKS, 1850)?.title).toBe('Eiserne Krone');
    expect(trackForYear(BUNDLED_TRACKS, 2000)?.title).toBe('Kaiserreich Erwachen');
  });
});
