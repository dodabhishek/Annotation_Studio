import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    postcss: './postcss.config.mjs',
  },
  server: {
    proxy: {
      '/detect': 'http://127.0.0.1:5000',
      '/output': 'http://127.0.0.1:5000',
      '/api': 'http://127.0.0.1:5000',
      '/sam': 'http://127.0.0.1:5000',
    },
  },
})
