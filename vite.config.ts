import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Configuracion base de la PWA. Los iconos PNG y el manifest completo llegan en la Fase 8.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Mi Banca',
        short_name: 'Mi Banca',
        description: 'Control de ventas de lotería y banca',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FAFAF9',
        theme_color: '#FAFAF9',
        icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
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
