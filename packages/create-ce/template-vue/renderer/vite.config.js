import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

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
  plugins: [vue()],
})
