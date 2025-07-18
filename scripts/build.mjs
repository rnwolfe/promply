import { exec } from 'child_process';
import { rmSync } from 'fs';
import { copyFile, mkdir } from 'fs/promises';
import { resolve } from 'path';

const args = process.argv.slice(2);
const watch = args.includes('--watch');
const modeIndex = args.indexOf('--mode');
const mode = modeIndex !== -1 ? args[modeIndex + 1] : 'production';

const browser =
  args.filter((arg, i) => {
    if (arg.startsWith('--')) return false;
    if (modeIndex !== -1 && i === modeIndex + 1) return false;
    return true;
  })[0] || 'chrome';

const distDir = resolve(process.cwd(), 'dist');
const assetsDir = resolve(distDir, 'assets');

function runCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command}`);
    const childProcess = exec(command);
    childProcess.stdout?.pipe(process.stdout);
    childProcess.stderr?.pipe(process.stderr);
    childProcess.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

async function build() {
  try {
    console.log(`Building for ${browser} in ${mode} mode...`);

    // Clean dist folder for production builds
    if (!watch) {
      rmSync(distDir, { recursive: true, force: true });
    }
    await mkdir(distDir, { recursive: true });
    await mkdir(assetsDir, { recursive: true });

    // Copy manifest
    await copyFile(
      resolve(process.cwd(), `manifest.${browser}.json`),
      resolve(distDir, 'manifest.json')
    );
    console.log(`Copied manifest.${browser}.json to dist/manifest.json`);

    // Copy content script CSS
    await copyFile(
      resolve(process.cwd(), 'src/content/content.css'),
      resolve(assetsDir, 'content.css')
    );
    console.log('Copied content.css to dist/assets/content.css');

    // Copy icons if they exist
    const iconsDir = resolve(process.cwd(), 'icons');
    const distIconsDir = resolve(distDir, 'icons');
    try {
      await mkdir(distIconsDir, { recursive: true });
      const iconFiles = ['icon-16.png', 'icon-32.png', 'icon-48.png', 'icon-96.png', 'icon-128.png'];

      for (const iconFile of iconFiles) {
        const srcPath = resolve(iconsDir, iconFile);
        const destPath = resolve(distIconsDir, iconFile);
        try {
          await copyFile(srcPath, destPath);
          console.log(`Copied ${iconFile} to dist/icons/`);
        } catch (err) {
          // Icon file doesn't exist, skip silently
        }
      }
    } catch (err) {
      // Icons directory doesn't exist, skip
    }

    if (watch) {
      console.log('Starting builds in watch mode...');
      // Run both builds in parallel for watch mode
      const contentWatch = exec(`vite build --config vite.content.config.mjs --mode ${mode} --watch`);
      const mainWatch = exec(`vite build --mode ${mode} --watch`);

      // Pipe output to console
      contentWatch.stdout?.pipe(process.stdout);
      contentWatch.stderr?.pipe(process.stderr);
      mainWatch.stdout?.pipe(process.stdout);
      mainWatch.stderr?.pipe(process.stderr);

      // Handle process termination
      process.on('SIGINT', () => {
        console.log('\nShutting down watch processes...');
        contentWatch.kill();
        mainWatch.kill();
        process.exit(0);
      });

      console.log('Watch mode active. Press Ctrl+C to stop.');
    } else {
      // Run builds sequentially for production
      await runCommand(`vite build --config vite.content.config.mjs --mode ${mode}`);
      console.log('Content script built successfully.');
      await runCommand(`vite build --mode ${mode}`);
      console.log('Main build complete.');
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build(); 