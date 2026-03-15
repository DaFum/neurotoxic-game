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
    rolldownOptions: {
      output: {
        // TODO: Reintroduce code-splitting optimization using Rolldown's codeSplitting API
        // Previous manualChunks logic for vendor/scene chunks was removed due to Rolldown API changes
      }
    }
  }
})
