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
    if (typeof CompressionStream !== 'undefined') expect((packed as { encoding?: string }).encoding).toBe('gzip-json-v1');
  });
  it('rejects damaged envelopes safely', async () => {
    await expect(decodeSave({ encoding: 'gzip-json-v1', payload: [1, 2, 3] })).rejects.toThrow('beschädigt');
    await expect(decodeSave({ encoding: 'gzip-json-v1', payload: [256] })).rejects.toThrow();
  });
});
