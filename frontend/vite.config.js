import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    minify: { mangle: false },
  },
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 4173,
    allowedHosts: [
      'appealing-perfection-production.up.railway.app',
      'localhost',
      '127.0.0.1',
    ],
  },
})
