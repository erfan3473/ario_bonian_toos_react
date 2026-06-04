import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.riv'], 
  server: {
    port: 5173,
    historyApiFallback: true, 
    proxy: {
      '/api': {
        target: 'https://www.ariobonyantoos.com', // 👈 حتماً https:// داشته باشد
        changeOrigin: true,
        secure: false,
      },
      '/media': {
        target: 'https://www.ariobonyantoos.com', // 👈 حتماً https:// داشته باشد
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'wss://www.ariobonyantoos.com', // 👈 این درست است
        ws: true,
        changeOrigin: true,
        secure: false,
      },
      '/static': {
        target: 'https://www.ariobonyantoos.com', // 👈 به https:// تغییر کرد
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
