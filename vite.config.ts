import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      // 在开发环境也启用 PWA（方便本地调试）
      devOptions: {
        enabled: true
      },
      // 仅包含 pwa-192.png
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png', 'pwa-192.png'],
      manifest: {
        name: '待办事项管理',
        short_name: '待办',
        description: '记录你的任务，提升工作效率',
        theme_color: '#4776E6',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        // 所有 manifest 图标均使用 pwa-192.png
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' }
        ]
      }
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
