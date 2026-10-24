const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const { VitePWA } = require('vite-plugin-pwa');
const path = require('path');
module.exports = defineConfig(async () => {
  const { nodePolyfills } = await import('vite-plugin-node-polyfills');

  return {
    base: './',
    plugins: [
      react(),
      nodePolyfills(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Áquila School OS',
        short_name: 'Áquila OS',
        description: 'Ecossistema Educacional Áquila',
        theme_color: '#0f172a',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
      }
    })
  ],
  root: __dirname,
  publicDir: 'public',
  optimizeDeps: {
    entries: ['index.html'],
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: false,
    rollupOptions: {
      output: {
        // Deixar o Vite gerenciar chunks com ordem topológica segura para evitar ReferenceError em Electron
      }
    }
  },
  server: {
    port: 3000,
    strictPort: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      './main/logger': path.resolve(__dirname, 'src/ui/utils/RendererLogger'),
      '../main/logger': path.resolve(__dirname, 'src/ui/utils/RendererLogger'),
    },
  },
};
});
