import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'

import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    plugins: [
      vue(),
      VueI18nPlugin({
        /**
         * 只匹配真正的语言资源文件；不要用 `src/locales/**`，否则会命中 `index.ts`
         * 并被当成 locale 模块解析（报 export default 对象错误）。
         */
        include: [
          path.resolve(projectRoot, 'src/locales/**/*.json'),
          path.resolve(projectRoot, 'src/locales/**/*.yaml'),
          path.resolve(projectRoot, 'src/locales/**/*.yml'),
        ],
      }),
      vueDevTools(),
      tailwindcss(),
    ],
    define: {
      __BUNDLE_LOCAL_FONTS__: JSON.stringify(isProduction),
    },
    server: {
      proxy: {
        // 本地开发：5173 -> 8787（wrangler dev）
        '/api': {
          target: 'http://127.0.0.1:8787',
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
  }
})
