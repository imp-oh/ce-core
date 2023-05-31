import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  build: {
    emptyOutDir: true,
    outDir: '../public/web',
    rollupOptions: {
      output: {
        manualChunks: {

        }
      }
    }
  },
  plugins: [react()],
})
