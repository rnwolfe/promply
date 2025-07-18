import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development';

  return {
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      minify: isDevelopment ? false : 'esbuild',
      sourcemap: isDevelopment ? 'inline' : false,
      lib: {
        entry: resolve(process.cwd(), 'src/content/index.ts'),
        name: 'ContentScript',
        formats: ['iife'],
        fileName: () => 'js/content.js',
      },
      rollupOptions: {
        output: {
          extend: true,
        },
      },
    },
    resolve: {
      alias: {
        '~': resolve(process.cwd(), 'src'),
      },
    },
  };
}); 