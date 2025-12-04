import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.riv'], 
  server: {
    proxy: {
      '/api': {
        // 🔴 تغییر مهم: آدرس سرور واقعی (با https)
        target: 'https://ariobonyantoos.com',
        
        // این یعنی هدر Host را به نام دامنه تغییر بده (برای Nginx حیاتی است)
        changeOrigin: true,
        
        // اگر SSL مشکلی داشت (که الان ندارد)، خطا ندهد. برای راحتی بگذار false بماند
        secure: false,
      }
    }
  }
})