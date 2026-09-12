import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
await build({
  entryPoints: [path.join(root, 'src-electron/main.ts')],
  outfile: path.join(root, 'dist-electron/main.js'),
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'esm',
  packages: 'external',
  external: ['electron'],
  logLevel: 'info',
});
await import('./bundle-electron-preload.mjs');
