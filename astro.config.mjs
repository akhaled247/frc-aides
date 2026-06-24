import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { fileURLToPath } from 'url';
import { normalizeWindowsDevPathsPlugin } from './scripts/normalize-windows-dev-paths.mjs';

const SITE = 'https://akhaled247.github.io';
const BASE = '/frc-aides/';

export default defineConfig({
  devToolbar: { enabled: false },
  site: SITE,
  base: BASE,
  output: 'static',
  trailingSlash: 'never',
  integrations: [react()],
  vite: {
    plugins: [normalizeWindowsDevPathsPlugin()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    optimizeDeps: {
      include: ['@monaco-editor/react', 'monaco-editor', 'uplot'],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
              return 'react-vendor';
            }
            if (id.includes('node_modules/uplot')) {
              return 'pid-uplot';
            }
            if (id.includes('node_modules/monaco-editor') || id.includes('node_modules/@monaco-editor')) {
              return 'pid-monaco';
            }
            if (
              id.includes('/lib/pid-sim/physics/elevatorSim') ||
              id.includes('/lib/pid-sim/physics/flywheelSim') ||
              id.includes('/lib/pid-sim/physics/armSim') ||
              id.includes('/lib/pid-sim/physics/plant/') ||
              id.includes('/lib/pid-sim/physics/sim/')
            ) {
              return 'pid-physics';
            }
          },
        },
      },
    },
  },
});
