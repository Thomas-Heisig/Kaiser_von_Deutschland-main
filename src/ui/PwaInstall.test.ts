import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
describe('PWA installation is opt-in',()=>{
 it('offers a real browser install prompt with secure-context and iOS guidance',()=>{
  const code=readFileSync(new URL('./PwaInstall.ts',import.meta.url),'utf8');
  expect(code).toContain('beforeinstallprompt');
  expect(code).toContain('appinstalled');
  expect(code).toContain('Zum Home-Bildschirm');
  expect(code).toContain('isSecureContext');
 });
});
