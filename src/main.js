import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import Vant from 'vant'
import 'vant/lib/index.css'
import '@vant/touch-emulator'

// 初始化实时数据同步
import { storage } from './utils/storage'
// 初始化默认账号（确保从Firebase读取）
import './api/auth-local'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(Vant)

// 设置实时数据监听（如果使用Firebase）
// 始终启用Firebase监听，确保多用户数据同步
if (storage.useFirebase) {
  let updateTimer = null
  const unsubscribe = storage.onDataChange((data) => {
    // 防抖处理，避免频繁触发
    if (updateTimer) {
      clearTimeout(updateTimer)
    }
    
    updateTimer = setTimeout(() => {
      console.log('📥 收到Firebase数据更新，刷新页面数据')
      // 触发全局事件，通知组件刷新
      window.dispatchEvent(new CustomEvent('data-updated', { detail: data }))
    }, 1000) // 1秒防抖，避免频繁刷新
  })
  
  if (unsubscribe) {
    console.log('✅ Firebase实时监听已启用')
  } else {
    console.log('⚠️ Firebase实时监听未启用')
  }
} else {
  console.log('📡 Firebase未配置，使用localStorage模式')
}

app.mount('#app')
