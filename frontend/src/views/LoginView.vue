<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { errorMessage } from '@/api/http'
import AppIcon from '@/components/AppIcon.vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({ username: '', password: '' })
const loading = ref(false)
const error = ref('')
const showPass = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(form.username.trim(), form.password)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
    router.replace(redirect && redirect.startsWith('/') ? redirect : auth.homePath)
  } catch (e) {
    error.value = errorMessage(e, 'Kirishda xatolik')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <section class="hero">
      <div class="hero-inner">
        <div class="logo"><AppIcon name="qr" :size="28" /></div>
        <h1>Xodimlar davomatini QR kod orqali yuriting</h1>
        <p>Xodim telefonida QR kod hosil qiladi, rahbar uni skanerlaydi — kelish va ketish vaqti avtomatik qayd etiladi.</p>
        <ul>
          <li><AppIcon name="check" :size="16" /> Kamera yoki rasm orqali skanerlash</li>
          <li><AppIcon name="check" :size="16" /> Bugungi holat va real vaqt ro‘yxati</li>
          <li><AppIcon name="check" :size="16" /> Statistika va Excel (CSV) eksport</li>
        </ul>
      </div>
    </section>

    <section class="form-side">
      <form class="card login-card" @submit.prevent="submit">
        <h2>Tizimga kirish</h2>
        <p class="muted">Login va parolingizni kiriting</p>

        <div v-if="error" class="alert alert-danger">{{ error }}</div>

        <div class="field">
          <label for="username">Login</label>
          <input id="username" v-model="form.username" class="input" autocomplete="username" required autofocus />
        </div>

        <div class="field">
          <label for="password">Parol</label>
          <div class="pass">
            <input
              id="password"
              v-model="form.password"
              class="input"
              :type="showPass ? 'text' : 'password'"
              autocomplete="current-password"
              minlength="6"
              required
            />
            <button type="button" class="btn btn-ghost btn-sm" @click="showPass = !showPass">
              {{ showPass ? 'Yashirish' : 'Ko‘rsatish' }}
            </button>
          </div>
        </div>

        <button class="btn btn-primary btn-lg btn-block" :disabled="loading">
          <span v-if="loading" class="spinner" />
          <AppIcon v-else name="login" />
          Kirish
        </button>
      </form>
    </section>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.1fr 1fr;
}
.hero {
  background: linear-gradient(140deg, #4f46e5 0%, #6d28d9 100%);
  color: #fff;
  display: flex;
  align-items: center;
  padding: 48px;
}
.hero-inner {
  max-width: 460px;
  margin: 0 auto;
}
.logo {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28px;
}
.hero h1 {
  font-size: 30px;
  font-weight: 700;
  margin-bottom: 14px;
}
.hero p {
  opacity: 0.85;
  font-size: 15px;
}
.hero ul {
  list-style: none;
  padding: 0;
  margin: 24px 0 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.hero li {
  display: flex;
  align-items: center;
  gap: 10px;
}
.form-side {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
}
.login-card {
  width: 100%;
  max-width: 400px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.login-card h2 {
  font-size: 22px;
}
.login-card > p {
  margin: -10px 0 4px;
}
.pass {
  position: relative;
}
.pass .btn {
  position: absolute;
  right: 4px;
  top: 4px;
}
@media (max-width: 860px) {
  .login-page {
    grid-template-columns: 1fr;
  }
  .hero {
    padding: 32px 16px;
  }
  .hero h1 {
    font-size: 22px;
  }
  .hero ul {
    display: none;
  }
  .login-card {
    padding: 24px 20px;
  }
}
</style>
