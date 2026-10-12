import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'
import { palette } from './src/brand/palette'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registered from src/main.tsx, so no inline script is needed (CSP in public/_headers).
      injectRegister: false,
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'logo.svg'],
      manifest: {
        id: '/',
        name: 'De Sociale Vlinder',
        short_name: 'SB',
        lang: 'nl',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        theme_color: palette.blue,
        background_color: palette.bg,
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell only. Personal data lives in IndexedDB and is never cached here.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        // iOS reads launch images at install; the service worker never needs them (F11, research R5).
        globIgnores: ['**/apple-splash-*'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    // tests/brand.test.ts reads styles.css as text; Vitest empties CSS unless it is included (F11).
    css: { include: [/styles\.css/] },
  },
})
