import { describe, expect, it } from 'vitest';
import { journalMessageHtml } from './JournalFormatting';
describe('Readable chronicle messages', () => {
  it('separates accounting items and paragraphs without interpreting stored HTML', () => {
    const html = journalMessageHtml('Kassenabschluss: 1.000 → 900 Gold; Unterhalt: −150; Handel: +50\n<script>alert(1)</script>');
    expect(html).toContain('<strong>Kassenabschluss:</strong>');
    expect(html).toContain('<li>Unterhalt: −150</li>');
    expect(html).toContain('<li>Handel: +50</li>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });
});
