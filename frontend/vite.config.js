import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: [
      'appealing-perfection-production.up.railway.app',
      'localhost',
      '127.0.0.1',
      'bookgym-front.onrender',
    ],
  },
})
