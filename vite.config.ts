import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
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
    open: true
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
