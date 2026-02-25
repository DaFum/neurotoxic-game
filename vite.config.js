import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
        }
      }
    }
  }
})
