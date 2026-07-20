import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './index.css'

// 注册 PWA Service Worker（vite-plugin-pwa 注入的虚拟模块）
if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      // 简单控制台提示；可后续替换为 UI 提示
      console.info('[PWA] 新版本可用，请刷新页面以更新。')
    },
    onOfflineReady() {
      console.info('[PWA] 应用已就绪，可离线使用。')
    },
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
