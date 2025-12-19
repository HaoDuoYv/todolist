import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
app.mount('#app')

// 注册 PWA Service Worker（vite-plugin-pwa 提供）
import { registerSW } from 'virtual:pwa-register'

registerSW({
    onNeedRefresh() {
        // 可在此触发应用内提示用户刷新（示例：控制台）
        console.log('New content available, please refresh.')
    },
    onOfflineReady() {
        console.log('App is ready to work offline.')
    }
})
