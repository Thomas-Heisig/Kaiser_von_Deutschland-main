import { describe, expect, it } from 'vitest';
import { decodeSave, encodeSave } from './SaveCodec';
describe('SaveCodec', () => {
  it('keeps old plain v2 saves readable', async () => {
    const legacy = { version: 2, players: [{ id: 'x' }] };
    expect(await decodeSave(legacy)).toEqual(legacy);
  });
  it('round trips large saves without changing data', async () => {
    const save = { version: 2, citizens: Array.from({ length: 2000 }, (_, id) => ({ id, name: 'Buerger', region: 'preussen', gold: id % 7 })) };
    const packed = await encodeSave(save);
    expect(await decodeSave(packed)).toEqual(save);
    if (typeof CompressionStream !== 'undefined') {
      expect((packed as { encoding?: string }).encoding).toBe('gzip-base64-v2');
      expect(await decodeSave(JSON.parse(JSON.stringify(packed)))).toEqual(save);
      const bytes=Array.from(atob((packed as {payload:string}).payload),char=>char.charCodeAt(0));
      expect(await decodeSave({encoding:'gzip-json-v1',payload:bytes})).toEqual(save);
      expect(JSON.stringify(packed).length).toBeLessThan(JSON.stringify({encoding:'gzip-json-v1',payload:bytes}).length);
    }
  });
  it('rejects damaged envelopes safely', async () => {
    await expect(decodeSave({ encoding: 'gzip-json-v1', payload: [1, 2, 3] })).rejects.toThrow('beschädigt');
    await expect(decodeSave({ encoding: 'gzip-json-v1', payload: [256] })).rejects.toThrow();
    await expect(decodeSave({ encoding: 'gzip-base64-v2', payload: '!invalid!' })).rejects.toThrow('beschädigt');
  });
});
