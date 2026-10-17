import { describe, it, expect } from 'vitest';
import { musicEpoch, musicArrangement, soundtrackBars, MUSIC_BPM, LEITMOTIF_MINOR, LEITMOTIF_MAJOR } from './RoyalMusicScore';
describe('Krone und Land original procedural soundtrack', () => {
  it('uses 76 BPM and same motif contour for minor and major', () => {
    expect(MUSIC_BPM).toBe(76);
    expect(LEITMOTIF_MINOR).toHaveLength(7);
    expect(LEITMOTIF_MAJOR).toHaveLength(7);
    expect(LEITMOTIF_MINOR[0]).toBe(LEITMOTIF_MAJOR[0]);
    expect(soundtrackBars('menu')).toBe(48);
  });
  it('evolves over historical centuries, including Hanse and future', () => {
    expect(musicEpoch({year:900,scene:'menu'})).toBe('early-medieval');
    expect(musicEpoch({year:1200,scene:'city'})).toBe('high-medieval');
    expect(musicEpoch({year:1300,scene:'trade',campaignId:'hanse'})).toBe('hanse');
    expect(musicEpoch({year:1630,scene:'court'})).toBe('early-modern');
    expect(musicEpoch({year:1850,scene:'city'})).toBe('industrial');
    expect(musicEpoch({year:1985,scene:'city'})).toBe('modern');
    expect(musicEpoch({year:2100,scene:'city'})).toBe('future');
  });
  it('keeps crises restrained and celebrations in major', () => {
    expect(musicArrangement({year:1200,scene:'war'}).major).toBe(false);
    expect(musicArrangement({year:1200,scene:'victory'}).major).toBe(true);
    expect(musicArrangement({year:1850,scene:'war'}).percussion).toBe(true);
  });
});
