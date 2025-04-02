import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.js', 'src/cli/index.js'],
  format: ['esm'],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: false,
});
