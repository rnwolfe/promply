import preact from '@preact/preset-vite';
import { copyFileSync } from 'fs';
import { resolve } from 'path';
import { defineConfig } from 'vite';

// Plugin to move HTML files to dist root
const moveHtmlPlugin = () => ({
  name: 'move-html',
  writeBundle() {
    // Copy HTML files from nested structure to dist root
    try {
      copyFileSync('dist/src/ui/popup/index.html', 'dist/popup.html');
      copyFileSync('dist/src/ui/options/index.html', 'dist/options.html');
      console.log('Moved HTML files to dist root');
    } catch (err) {
      console.warn('Could not move HTML files:', err.message);
    }
  }
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development';

  return {
    plugins: [preact(), moveHtmlPlugin()],
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      // Disable minification in development for better debugging
      minify: isDevelopment ? false : 'esbuild',
      // Sourcemaps for debugging
      sourcemap: isDevelopment ? 'inline' : false,
      rollupOptions: {
        input: {
          popup: resolve(process.cwd(), 'src/ui/popup/index.html'),
          options: resolve(process.cwd(), 'src/ui/options/index.html'),
          background: resolve(process.cwd(), 'src/background/index.ts'),
        },
        output: {
          entryFileNames: 'js/[name].js',
          chunkFileNames: 'js/chunks/[name].js',
          // Put HTML files at the root of dist, other assets in assets/
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.html')) {
              return '[name].[ext]';
            }
            return 'assets/[name].[ext]';
          },
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
