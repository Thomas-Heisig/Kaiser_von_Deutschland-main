/** Backward-compatible storage envelope. Old v2 plain objects remain readable. */
export interface CompressedSave {
  encoding: 'gzip-base64-v2';
  payload: string;
}
export async function encodeSave(value: unknown): Promise<unknown> {
  if (typeof CompressionStream === 'undefined' || typeof TextEncoder === 'undefined') return value;
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  // Compression is useful for larger saves, but the copy costs more on tiny saves.
  if (bytes.byteLength < 32_768) return value;
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));
  const packed = new Uint8Array(await new Response(stream).arrayBuffer());
  if (packed.byteLength >= bytes.byteLength * 0.9) return value;
  // JSON-safe compact storage also works with localforage's localStorage fallback.
  // A number[] otherwise needs several times the compressed data size in memory.
  const chunks: string[] = [];
  for (let offset = 0; offset < packed.length; offset += 8192)
    chunks.push(String.fromCharCode(...packed.subarray(offset,offset + 8192)));
  return { encoding: 'gzip-base64-v2', payload: btoa(chunks.join('')) } satisfies CompressedSave;
}
export async function decodeSave(value: unknown): Promise<unknown> {
  if (!value || typeof value !== 'object' || !('encoding' in value)) return value;
  const envelope = value as {encoding?: unknown;payload?:unknown};
  const legacy = envelope.encoding === 'gzip-json-v1' && Array.isArray(envelope.payload) &&
    envelope.payload.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255);
  const compact = envelope.encoding === 'gzip-base64-v2' && typeof envelope.payload === 'string';
  if (!legacy && !compact) {
    throw new Error('Unbekanntes oder beschädigtes Speicherformat.');
  }
  if (typeof DecompressionStream === 'undefined') throw new Error('Der Browser kann diesen komprimierten Spielstand nicht lesen.');
  try {
    let source: Uint8Array<ArrayBuffer>;
    if (legacy) source = new Uint8Array(envelope.payload as number[]);
    else {
      const binary = atob(envelope.payload as string);
      source = new Uint8Array(binary.length);
      for (let i=0;i<binary.length;i++) source[i] = binary.charCodeAt(i);
    }
    const stream = new Blob([source]).stream().pipeThrough(new DecompressionStream('gzip'));
    const output = await new Response(stream).text();
    return JSON.parse(output);
  } catch {
    throw new Error('Der komprimierte Spielstand ist beschädigt.');
  }
}
