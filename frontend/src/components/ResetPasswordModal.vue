<script setup>
import { ref } from 'vue'
import AppModal from './AppModal.vue'
import { errorMessage } from '@/api/http'
import { useToast } from '@/composables/useToast'
import { fullName } from '@/utils/format'

const props = defineProps({
  user: { type: Object, required: true },
  // (id, newPassword) => Promise
  action: { type: Function, required: true },
})
const emit = defineEmits(['close'])
const toast = useToast()

const password = ref('')
const saving = ref(false)
const error = ref('')

function generate() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  password.value = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

async function submit() {
  saving.value = true
  error.value = ''
  try {
    await props.action(props.user.id, password.value)
    toast.success(`${fullName(props.user)} uchun yangi parol o‘rnatildi`)
    emit('close')
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <AppModal title="Parolni tiklash" width="420px" @close="emit('close')">
    <form id="reset-form" class="stack" @submit.prevent="submit">
      <p class="muted" style="margin: 0">
        <b>{{ fullName(user) }}</b> (@{{ user.login }}) uchun yangi parol o‘rnating.
      </p>
      <div v-if="error" class="alert alert-danger">{{ error }}</div>
      <div class="field">
        <label>Yangi parol</label>
        <div class="row">
          <input v-model="password" class="input" style="flex: 1" minlength="6" required />
          <button type="button" class="btn" @click="generate">Yaratish</button>
        </div>
        <span class="hint">Parolni xodimga xavfsiz yo‘l bilan yetkazing</span>
      </div>
    </form>
    <template #footer>
      <button class="btn" @click="emit('close')">Bekor qilish</button>
      <button class="btn btn-primary" form="reset-form" :disabled="saving">
        <span v-if="saving" class="spinner" /> Saqlash
      </button>
    </template>
  </AppModal>
</template>
