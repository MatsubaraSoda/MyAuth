import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    plugins: [
      vue(),
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
