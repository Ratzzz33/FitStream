import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react()
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': __dirname,
        }
      },
      optimizeDeps: {
        exclude: [
          '@nicklassvensson/capacitor-health-connect',
          'capacitor-plugin-healthkit',
          'capacitor-native-settings'
        ]
      },
      build: {
        outDir: 'dist',
        sourcemap: false,
        rollupOptions: {
          external: [
            '@nicklassvensson/capacitor-health-connect',
            'capacitor-plugin-healthkit',
            'capacitor-native-settings'
          ],
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              charts: ['recharts']
            }
          }
        }
      }
    };
});
