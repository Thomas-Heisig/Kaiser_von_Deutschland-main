import { defineConfig } from 'vite';
import path from 'path';
import { readdirSync } from 'node:fs';
import type { Plugin } from 'vite';

function cinemaCatalog(): { videos: Array<{ id: string; title: string; url: string }> } {
  const directory = path.resolve(__dirname, 'public/video');
  const videos = readdirSync(directory).filter(name => /\.(mp4|webm|m4v)$/i.test(name))
    .sort((a,b) => a.localeCompare(b,'de')).map(name => {
      const title = name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
      return { id: name, title, url: '/video/' + encodeURIComponent(name) };
    });
  return { videos };
}

function offlineBuildAssets(): Plugin {
  return {
    name: 'offline-build-assets',
    configureServer(server) {
      server.middlewares.use('/video-catalog.json', (_request, response) => {
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.end(JSON.stringify(cinemaCatalog()));
      });
    },
    generateBundle(_options, bundle) {
      const assets = Object.keys(bundle).filter(name => !name.endsWith('.map'));
      this.emitFile({ type: 'asset', fileName: 'video-catalog.json', source: JSON.stringify({ videos: cinemaCatalog().videos.map(video => ({ ...video, url: (process.env.GITHUB_PAGES === 'true' ? '/Kaiser_von_Deutschland-main' : '') + video.url })) }) });
      this.emitFile({ type: 'asset', fileName: 'offline-shell.json',
        source: JSON.stringify({ files: ['index.html', ...assets] }) });
    }
  };
}

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/Kaiser_von_Deutschland-main/' : '/',
  plugins: [offlineBuildAssets()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@data': path.resolve(__dirname, './src/data'),
      '@utils': path.resolve(__dirname, './src/utils')
    }
  },
  server: {
    port: (() => {
      const port = parseInt(process.env.PORT || '4100', 10);
      return isNaN(port) ? 4100 : port;
    })(),
    host: true,
    open: false
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id: string): string | undefined {
          if (id.includes('node_modules') && (id.includes('pixi.js') || id.includes('@pixi'))) {
            return 'graphics';
          }
          if (id.includes('node_modules') && (id.includes('localforage') || id.includes('uuid'))) {
            return 'vendor';
          }
          return undefined;
        }
      }
    }
  },
  optimizeDeps: {
    include: ['localforage', 'uuid']
  },
  test: {
    environment: 'node',
    globals: true
  }
});
