import { defineConfig } from 'vite'

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
  }
})
