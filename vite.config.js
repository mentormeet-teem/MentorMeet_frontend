import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://10.84.123.90:5010',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})