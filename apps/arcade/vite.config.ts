import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// SUPUESTO: registerType 'prompt' (no 'autoUpdate'), porque product-spec.md
// §11.3 exige que "la actualización de la app no puede interrumpir una
// partida en curso". Con 'prompt' y el registro por defecto (sin callback
// propio) el nuevo service worker se instala en segundo plano y solo toma
// control en la siguiente carga completa; con 'autoUpdate' recargaría de
// inmediato. La UI de aviso de actualización queda pendiente para el shell.
export default defineConfig({
  build: {
    target: 'es2022',
  },
  plugins: [
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'ARCADE',
        short_name: 'ARCADE',
        description: 'Maquinita arcade que reproduce juegos de los 80 con fidelidad al original.',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'fullscreen',
        orientation: 'portrait-primary',
        background_color: '#0b0b10',
        theme_color: '#0b0b10',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,webmanifest}'],
      },
    }),
  ],
});
