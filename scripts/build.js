#!/usr/bin/env node

import * as esbuild from 'esbuild';
import { copyFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWatch = process.argv.includes('--watch');

async function copyAssets() {
  try {
    await mkdir('dist/assets', { recursive: true });
    await copyFile('src/assets/404.html', 'dist/assets/404.html');
    await copyFile('src/assets/listing.html', 'dist/assets/listing.html');
    await copyFile('src/assets/favicon.ico', 'dist/assets/favicon.ico');
  } catch (err) {
    console.error('Error copying assets:', err);
  }
}

const buildOptions = {
  entryPoints: ['src/index.js', 'src/cli/index.js'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outdir: 'dist',
  format: 'esm',
  sourcemap: true,
  minify: false,
  banner: {
    js: '#!/usr/bin/env node\n',
  },
};

if (isWatch) {
  // Watch mode
  const context = await esbuild.context(buildOptions);
  await copyAssets();
  await context.watch();
  console.log('Watching for changes...');
} else {
  // Build mode
  await esbuild.build(buildOptions);
  await copyAssets();
  console.log('Build completed');
}
