import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteCompression({ algorithm: 'brotliCompress', ext: '.br' })
  ],
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react/')
          ) {
            return 'vendor-react'
          }
          if (
            id.includes('node_modules/pixi.js') ||
            id.includes('node_modules/@pixi/')
          ) {
            return 'vendor-pixi'
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion'
          }
          if (id.includes('node_modules/tone')) {
            return 'vendor-tone'
          }
          if (
            id.includes('src/scenes/Gig.jsx') ||
            id.includes('src/components/stage/')
          ) {
            return 'scene-gig'
          }
          if (id.includes('src/scenes/Overworld.jsx')) {
            return 'scene-overworld'
          }
        }
      }
    }
  }
})
