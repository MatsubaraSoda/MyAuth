import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { applyI18nLocale, i18n } from './locales'
import router from './router'
import { useAppStore } from './stores/app'
import './style.css'
import 'vue-sonner/style.css'

if (__BUNDLE_LOCAL_FONTS__) {
  await import('./styles/inter-fonts.css')
}

const app = createApp(App)

app.use(createPinia())
applyI18nLocale(useAppStore().language)
app.use(i18n)
app.use(router)

app.mount('#app')
