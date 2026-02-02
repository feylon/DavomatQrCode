<script setup>
import { reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/api'
import { errorMessage } from '@/api/http'
import { useToast } from '@/composables/useToast'
import { formatDateTime, fullName, initials, ROLE_LABELS } from '@/utils/format'

const auth = useAuthStore()
const toast = useToast()

const form = reactive({ oldPassword: '', newPassword: '', confirm: '' })
const saving = ref(false)
const error = ref('')

async function changePassword() {
  error.value = ''
  if (form.newPassword !== form.confirm) {
    error.value = 'Yangi parollar mos kelmadi'
    return
  }
  saving.value = true
  try {
    await authApi.changePassword({ oldPassword: form.oldPassword, newPassword: form.newPassword })
    toast.success('Parol muvaffaqiyatli o‘zgartirildi')
    Object.assign(form, { oldPassword: '', newPassword: '', confirm: '' })
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Profil</h1>
        <p>Shaxsiy ma’lumotlar va xavfsizlik</p>
      </div>
    </div>

    <div class="grid grid-2">
      <div class="card card-body">
        <div class="person" style="margin-bottom: 20px">
          <span class="avatar" style="width: 56px; height: 56px; font-size: 18px">{{ initials(auth.user) }}</span>
          <div>
            <div style="font-size: 18px; font-weight: 600">{{ fullName(auth.user) }}</div>
            <span class="badge badge-primary">{{ ROLE_LABELS[auth.role] }}</span>
          </div>
        </div>
        <dl class="info">
          <dt>Login</dt>
          <dd>{{ auth.user?.login }}</dd>
          <dt>Email</dt>
          <dd>{{ auth.user?.email }}</dd>
          <dt>Otasining ismi</dt>
          <dd>{{ auth.user?.middlname || '—' }}</dd>
          <dt>Tashkilot</dt>
          <dd>{{ auth.user?.company || '—' }}</dd>
          <dt>Ro‘yxatdan o‘tgan</dt>
          <dd>{{ formatDateTime(auth.user?.created_At) }}</dd>
        </dl>
      </div>

      <form class="card card-body stack" @submit.prevent="changePassword">
        <h2 style="font-size: 16px">Parolni o‘zgartirish</h2>
        <div v-if="error" class="alert alert-danger">{{ error }}</div>
        <div class="field">
          <label>Joriy parol</label>
          <input v-model="form.oldPassword" type="password" class="input" autocomplete="current-password" required />
        </div>
        <div class="field">
          <label>Yangi parol</label>
          <input v-model="form.newPassword" type="password" class="input" autocomplete="new-password" minlength="6" required />
          <span class="hint">Kamida 6 ta belgi</span>
        </div>
        <div class="field">
          <label>Yangi parolni takrorlang</label>
          <input v-model="form.confirm" type="password" class="input" autocomplete="new-password" minlength="6" required />
        </div>
        <div>
          <button class="btn btn-primary" :disabled="saving">
            <span v-if="saving" class="spinner" /> Saqlash
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.info {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 10px 16px;
  margin: 0;
}
.info dt {
  color: var(--text-muted);
}
.info dd {
  margin: 0;
  font-weight: 500;
  word-break: break-word;
}
</style>
