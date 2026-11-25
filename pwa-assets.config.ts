import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Genera los iconos PNG de la PWA a partir de public/icono.svg:
//   npm run iconos
// (favicon.ico, pwa-64/192/512, maskable-icon-512 y apple-touch-icon-180)
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    // Android recorta los iconos "maskable" en circulo: se deja margen con el mismo fondo.
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#1C1917' } },
    // iPhone no admite transparencia: fondo casi negro.
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#1C1917' } },
  },
  images: ['public/icono.svg'],
})
