import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // PWA: "Agregar a pantalla principal" y abrir a pantalla completa, con todo guardado
    // en el telefono para que abra sin senal. Iconos: npm run iconos (pwa-assets.config.ts).
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        id: '/',
        name: 'Mi Banca',
        short_name: 'Mi Banca',
        description: 'Control diario de ventas de lotería, premios, ganancia y banca',
        lang: 'es',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FAFAF9',
        theme_color: '#FAFAF9',
        categories: ['finance', 'business', 'productivity'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          { name: 'Hoy', url: '/', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Resumen', url: '/resumen', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Solo la letra latina de Inter; las otras escrituras no se usan.
        globIgnores: ['**/inter-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: {
    // Firebase pesa casi todo el paquete: va en un archivo aparte para que se guarde en cache.
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: (id) =>
          id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')
            ? 'firebase'
            : undefined,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
