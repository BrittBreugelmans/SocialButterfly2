import {
  type AppleDeviceName,
  createAppleSplashScreens,
  defineConfig,
  minimal2023Preset,
} from '@vite-pwa/assets-generator/config'
import { palette } from './src/brand/palette'

// Generates favicon.ico, pwa-*.png, maskable-icon-512x512.png and apple-touch-icon-180x180.png
// next to public/logo.svg, the single logo source (F11). Run `npm run generate-pwa-assets` after
// changing the logo, and commit the results.
// The apple and maskable icons get the white background (wiki M10); iOS would fill transparency black.
// Also the iOS launch images (research R5): copy the printed apple-touch-startup-image links into
// index.html. Light only (M6), so no dark launch images.

/** iPhones that run iOS 17 or later; iOS shows a launch image only for an exact size match. */
const IPHONES: AppleDeviceName[] = [
  'iPhone XS',
  'iPhone XS Max',
  'iPhone XR',
  'iPhone 11',
  'iPhone 11 Pro',
  'iPhone 11 Pro Max',
  'iPhone 12 mini',
  'iPhone 12',
  'iPhone 12 Pro',
  'iPhone 12 Pro Max',
  'iPhone 13 mini',
  'iPhone 13',
  'iPhone 13 Pro',
  'iPhone 13 Pro Max',
  'iPhone 14',
  'iPhone 14 Plus',
  'iPhone 14 Pro',
  'iPhone 14 Pro Max',
  'iPhone 15',
  'iPhone 15 Plus',
  'iPhone 15 Pro',
  'iPhone 15 Pro Max',
  'iPhone 16e',
  'iPhone 16',
  'iPhone 16 Plus',
  'iPhone 16 Pro',
  'iPhone 16 Pro Max',
  'iPhone 17',
  'iPhone Air',
  'iPhone 17 Pro',
  'iPhone 17 Pro Max',
  'iPhone SE 4.7"',
]

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: {
      sizes: [512],
      padding: 0.3,
      resizeOptions: { background: palette.bg, fit: 'contain' },
    },
    apple: {
      sizes: [180],
      padding: 0.15,
      resizeOptions: { background: palette.bg, fit: 'contain' },
    },
    appleSplashScreens: createAppleSplashScreens(
      {
        padding: 0.35,
        resizeOptions: { background: palette.bg, fit: 'contain' },
        linkMediaOptions: { log: true, addMediaScreen: true, basePath: '/', xhtml: false },
      },
      IPHONES,
    ),
  },
  images: ['public/logo.svg'],
})
