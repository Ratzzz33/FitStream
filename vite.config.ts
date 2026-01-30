import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Plugin to serve static landing page at /land/
function serveStaticLanding() {
  return {
    name: 'serve-static-landing',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/land')) {
          const urlPath = req.url.replace(/\?.*$/, ''); // Remove query string
          let filePath = path.join(__dirname, 'public', urlPath);

          // If requesting directory, serve index.html
          if (urlPath === '/land' || urlPath === '/land/') {
            filePath = path.join(__dirname, 'public', 'land', 'index.html');
          }

          if (fs.existsSync(filePath)) {
            const ext = path.extname(filePath);
            const contentTypes = {
              '.html': 'text/html',
              '.css': 'text/css',
              '.js': 'application/javascript',
              '.png': 'image/png',
              '.jpg': 'image/jpeg',
              '.svg': 'image/svg+xml',
            };
            res.setHeader('Content-Type', contentTypes[ext] || 'text/plain');
            res.end(fs.readFileSync(filePath));
            return;
          }
        }
        next();
      });
    }
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        serveStaticLanding(),
        tailwindcss(),
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
