import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react(),
      viteCompression({ algorithm: 'brotliCompress', ext: '.br' })
    ],
    define: {
      'process.env.VITE_POLLINATIONS_API_KEY': JSON.stringify(
        process.env.VITE_POLLINATIONS_API_KEY
      )
    },
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
  }
})
