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
        manualChunks: {
          'vendor': ['localforage', 'uuid'],
          'core': [
            './src/core/GameEngine.ts',
            './src/core/Player.ts',
            './src/core/Kingdom.ts'
          ],
          'ui': [
            './src/ui/GameUI.ts',
            './src/ui/Graphics.ts'
          ]
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
