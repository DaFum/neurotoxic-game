import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: 'Neurotoxic Game',
        short_name: 'Neurotoxic',
        description: 'A narrative adventure game',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'fullscreen',
        orientation: 'landscape',
        start_url: './',
        scope: './',
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
          },
          {
            src: 'pwa-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: false,
        skipWaiting: false,
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,json,mp3,ogg,wav,mid,midi}'
        ],
        globIgnores: ['**/*.{woff,woff2,ttf,otf,eot}'],
        maximumFileSizeToCacheInBytes: 25 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/gen\.pollinations\.ai\/.*$/i,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'online-only-image-generator'
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*$/i,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'online-only-font-css'
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*$/i,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'online-only-font-files'
            }
          }
        ],
        navigateFallback: 'index.html'
      }
    }),
    viteCompression({ algorithm: 'brotliCompress', ext: '.br' })
  ],
  base: './',
  build: {
    // Keep temporarily for deployment, PixiJS imports have been refactored
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor-react',
              test: /node_modules[\\/](react|react-dom)[\\/]/,
              priority: 20
            },
            {
              name: 'vendor-pixi',
              test: /node_modules[\\/](pixi\.js|@pixi)[\\/]/,
              priority: 20
            },
            {
              name: 'vendor-motion',
              test: /node_modules[\\/]framer-motion[\\/]/,
              priority: 20
            },
            {
              name: 'vendor-tone',
              test: /node_modules[\\/]tone[\\/]/,
              priority: 20
            },
            {
              name: 'scene-gig',
              test: /src[\\/](scenes[\\/]Gig\.jsx|components[\\/]stage[\\/])/,
              priority: 15
            },
            {
              name: 'scene-overworld',
              test: /src[\\/]scenes[\\/]Overworld\.jsx/,
              priority: 15
            }
          ]
        }
      }
    }
  }
})
