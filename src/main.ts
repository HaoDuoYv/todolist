import { createApp } from 'vue'
import App from './App.vue'

// 提前监听 beforeinstallprompt / appinstalled，防止在 App 组件挂载前错过事件
window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault()
        ; (window as any).__deferredPrompt = e
    // 派发自定义事件通知应用已可安装
    window.dispatchEvent(new CustomEvent('pwa-beforeinstallprompt', { detail: e }))
    console.log('[PWA] beforeinstallprompt captured in main.ts')
})

window.addEventListener('appinstalled', () => {
    // 派发自定义事件通知应用已安装
    window.dispatchEvent(new CustomEvent('pwa-appinstalled'))
    console.log('[PWA] appinstalled fired')
})

// 注册 PWA Service Worker（vite-plugin-pwa 提供），尽早注册
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
    onNeedRefresh() {
        console.log('New content available, please refresh.')
    },
    onOfflineReady() {
        console.log('App is ready to work offline.')
    }
})

const app = createApp(App)
app.mount('#app')
