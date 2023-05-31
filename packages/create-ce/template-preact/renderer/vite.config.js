import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

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
  plugins: [preact()],
})
