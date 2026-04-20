import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './style.css'

if (__BUNDLE_LOCAL_FONTS__) {
  await import('./styles/inter-fonts.css')
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
