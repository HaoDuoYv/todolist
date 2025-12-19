import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
app.mount('#app')

// register service worker provided by vite-plugin-pwa
// 如果项目已有更新提示/弹窗逻辑，可将 registerSW 的回调合并到已有逻辑中
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
    onNeedRefresh() {
        // 此处为示例：简单在控制台提示，生产可显示 UI 提示用户刷新
        console.log('New content available, please refresh.')
    },
    onOfflineReady() {
        console.log('App is ready to work offline.')
    }
})
