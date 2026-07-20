import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: 'hidden',
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    tsconfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'icon.svg', 'maskable.svg'],
      manifest: {
        name: 'Marginalia · AI 工作笔记',
        short_name: 'Marginalia',
        description: '把每一则工作笔记沉淀为可问询的项目知识资产。AI 自动归类、相似检测、引用式问答与项目说明文档自动生成。',
        lang: 'zh-CN',
        dir: 'ltr',
        categories: ['productivity', 'business', 'utilities'],
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'any',
        background_color: '#FAF6EC',
        theme_color: '#FAF6EC',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/maskable.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: '新建笔记',
            short_name: '新建',
            description: '快速创建一条新的工作笔记',
            url: '/notes',
            icons: [
              { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            ],
          },
          {
            name: '向 AI 提问',
            short_name: 'AI',
            description: '基于笔记内容进行 AI 问答',
            url: '/ask',
            icons: [
              { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            ],
          },
          {
            name: '工作台',
            short_name: '首页',
            description: '查看今日概览与 AI 智能建议',
            url: '/',
            icons: [
              { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            ],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'autoUpdate',
      },
    }),
  ],
})
