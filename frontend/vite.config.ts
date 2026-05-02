import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Modern root-relative alias (safest for Vercel/ESM)
      '@': '/src',
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
