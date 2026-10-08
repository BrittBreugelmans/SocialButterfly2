import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Generates favicon.ico, pwa-*.png, maskable-icon-512x512.png and apple-touch-icon-180x180.png
// next to public/icon.svg. Run with `npm run generate-pwa-assets` after changing the icon.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: minimal2023Preset,
  images: ['public/icon.svg'],
})
