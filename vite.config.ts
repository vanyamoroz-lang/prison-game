import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://212.192.210.49:3000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://212.192.210.49:3000',
        changeOrigin: true,
      },
    },
  },
})