const escapeText = (value: string): string => value.replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));

/** Plain stored messages remain plain data; only this renderer adds safe markup. */
export function journalMessageHtml(message: string): string {
  const paragraphs = message.split(/\r?\n/).map(part => part.trim()).filter(Boolean);
  return paragraphs.map(paragraph => {
    const items = paragraph.split(/;\s+/);
    const lead = items.shift() ?? '';
    const colon = lead.indexOf(':');
    const first = colon > 0 && colon < 90 && !lead.slice(colon).startsWith('://')
      ? `<strong>${escapeText(lead.slice(0, colon + 1))}</strong>${escapeText(lead.slice(colon + 1))}`
      : escapeText(lead);
    return `<p>${first}</p>` + (items.length ? `<ul>${items.map(item => `<li>${escapeText(item)}</li>`).join('')}</ul>` : '');
  }).join('');
}
