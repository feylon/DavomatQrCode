import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { setAuthFailureHandler } from './api/http'
import { useAuthStore } from './stores/auth'
import './assets/main.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// Token yangilab bo'lmasa — login sahifasiga qaytarish
setAuthFailureHandler(() => {
  const auth = useAuthStore()
  auth.logout()
  if (router.currentRoute.value.name !== 'login') {
    router.replace({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
  }
})

app.mount('#app')
