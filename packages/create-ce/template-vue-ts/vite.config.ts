import { defineConfig, searchForWorkspaceRoot } from 'vite'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'


// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': resolve('./renderer')
    }
  },
  build: {
    emptyOutDir: true,
    outDir: './out/renderer',
  },
  plugins: [
    vue(),
  ],
  assetsInclude: ['**/*.ico']
})
