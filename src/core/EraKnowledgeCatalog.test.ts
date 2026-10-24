import { describe, expect, it } from 'vitest';
import { ERA_KNOWLEDGE, KNOWLEDGE_TOPICS, knowledgeForDate, knowledgeSpotlight } from './EraKnowledgeCatalog';

describe('sourced era knowledge', () => {
  it('offers all four cultural topics for each campaign starting year', () => {
    for (const year of [-1999,-1499,-1199,-489,-43,0,1,1200, 1300, 1400, 1500, 1600, 1750, 1820, 1890, 1945, 1970, 2000]) {
      const available = new Set(knowledgeForDate(year, 1).map(item => item.topic));
      expect([...available].sort(), String(year)).toEqual(Object.keys(KNOWLEDGE_TOPICS).sort());
    }
  });
  it('keeps postwar life out of January 1945 and switches in May', () => {
    const january = knowledgeForDate(1945, 1), may = knowledgeForDate(1945, 5);
    expect(january.some(item => item.id.startsWith('postwar-'))).toBe(false);
    expect(january.filter(item => item.id.startsWith('ns-control'))).toHaveLength(4);
    expect(may.some(item => item.id.startsWith('ns-control'))).toBe(false);
    expect(may.filter(item => item.id.startsWith('postwar-'))).toHaveLength(4);
    expect(new Set(may.map(item => item.topic)).size).toBe(4);
    expect(knowledgeForDate(1999, 3).some(item => item.id.startsWith('reichstag'))).toBe(false);
    expect(knowledgeForDate(1999, 4).some(item => item.id.startsWith('reichstag'))).toBe(true);
  });
  it('filters topics without moving dates, and varies the monthly reading deterministically', () => {
    expect(knowledgeForDate(1820, 6, 'architecture').every(item => item.topic === 'architecture')).toBe(true);
    const first = knowledgeSpotlight(1820, 1);
    expect(knowledgeSpotlight(1820, 1)).toEqual(first);
    expect(knowledgeSpotlight(1820, 2)?.id).not.toBe(first?.id);
    expect(knowledgeForDate(-3000, 1)).toEqual([]);
    expect(knowledgeSpotlight(2050, 1)).toBeUndefined();
  });
  it('has unique stable IDs, explicit regions and institutional sources', () => {
    expect(new Set(ERA_KNOWLEDGE.map(item => item.id)).size).toBe(ERA_KNOWLEDGE.length);
    for (const item of ERA_KNOWLEDGE) {
      expect(item.from).toBeLessThanOrEqual(item.to);
      expect(item.to).toBeLessThanOrEqual(2026);
      expect(item.place.length).toBeGreaterThan(0);
      expect(item.sourceTitle.length).toBeGreaterThan(0);
      expect(new URL(item.sourceUrl).protocol).toBe('https:');
    }
  });
  it('shows overlapping styles in their regions rather than replacing one global style', () => {
    const titles = knowledgeForDate(1925, 6).map(item=>item.title);
    expect(titles).toContain('Neue Sachlichkeit');
    expect(titles).toContain('Expressionismus');
    expect(titles).toContain('Bauhaus: Kunst, Handwerk und Gestaltung');
    expect(titles).toContain('Surrealismus');
    expect(knowledgeForDate(1900,1).some(item=>item.id==='style-cubism')).toBe(false);
  });
});
