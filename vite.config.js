import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  // GitLab Pages loyihani kichik yo'lda ochadi (/<guruh>/<loyiha>/),
  // shuning uchun CI da VITE_BASE=./ qilinadi. Lokalda esa oddiy '/'.
  base: process.env.VITE_BASE ?? '/',

  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    // 0.0.0.0 — dev-server tarmoqdagi boshqa qurilmalarga ham ochiq bo'ladi
    host: true,
    port: 555,
    strictPort: true,
    proxy: {
      // CORS muammosini hal qiladi: /api -> backend
      '/api': {
        target: 'http://192.168.1.10:8000',
        changeOrigin: true
      }
    }
  }
})
