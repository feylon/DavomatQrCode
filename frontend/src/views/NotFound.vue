<script setup>
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
</script>

<template>
  <div class="nf">
    <div class="code">404</div>
    <h1>Sahifa topilmadi</h1>
    <p class="muted">Siz qidirayotgan sahifa mavjud emas yoki ko‘chirilgan.</p>
    <RouterLink :to="auth.isAuthenticated ? auth.homePath : '/login'" class="btn btn-primary">Bosh sahifaga qaytish</RouterLink>
  </div>
</template>

<style scoped>
.nf {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
  padding: 16px;
}
.code {
  font-size: 72px;
  font-weight: 700;
  color: var(--primary);
  line-height: 1;
}
</style>
