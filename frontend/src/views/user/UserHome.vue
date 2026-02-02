<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { userApi } from '@/api'
import { errorMessage } from '@/api/http'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import AppIcon from '@/components/AppIcon.vue'
import StatCard from '@/components/StatCard.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { durationSince, formatDate, formatHours, formatTime } from '@/utils/format'

const toast = useToast()
const auth = useAuthStore()

const today = ref(null)
const qr = ref(null) // { qr_code, status, expires_at, company }
const generating = ref(false)
const now = ref(Date.now())

const state = computed(() => today.value?.state ?? 'NOT_MARKED')
const canEnter = computed(() => state.value === 'NOT_MARKED')
const canExit = computed(() => state.value === 'AT_WORK')
const secondsLeft = computed(() => (qr.value ? Math.max(0, Math.round((new Date(qr.value.expires_at) - now.value) / 1000)) : 0))
const expired = computed(() => qr.value && secondsLeft.value <= 0)
const countdown = computed(() => {
  const s = secondsLeft.value
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
})

async function loadToday(silent = false) {
  try {
    const prev = state.value
    today.value = await userApi.today()
    // QR skanerlangandan so'ng holat o'zgaradi — QR ni yashiramiz
    if (qr.value && prev !== state.value) {
      toast.success(state.value === 'AT_WORK' ? 'Ishga kelganingiz qayd etildi' : 'Ishdan ketganingiz qayd etildi')
      qr.value = null
    }
  } catch (e) {
    if (!silent) toast.error(errorMessage(e))
  }
}

async function generate(kind) {
  generating.value = true
  try {
    qr.value = kind === 'enter' ? await userApi.enterQr() : await userApi.exitQr()
  } catch (e) {
    toast.error(errorMessage(e))
  } finally {
    generating.value = false
  }
}

let tick, poll
onMounted(() => {
  loadToday()
  tick = setInterval(() => (now.value = Date.now()), 1000)
  // QR ko'rsatilayotganda holatni tez-tez tekshiramiz
  poll = setInterval(() => {
    if (qr.value && !expired.value) loadToday(true)
  }, 4000)
})
onBeforeUnmount(() => {
  clearInterval(tick)
  clearInterval(poll)
})

const STATE_TEXT = {
  NOT_MARKED: 'Bugun hali ishga kelganingiz qayd etilmagan',
  AT_WORK: 'Siz hozir ishdasiz',
  LEFT: 'Bugungi ish kuni yakunlangan',
  ABSENT: 'Bugun sababsiz kelmagan deb belgilangansiz',
  EXCUSED: 'Bugun sababli kelmagan deb belgilangansiz',
  ON_LEAVE: 'Siz bugun ta’tildasiz',
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Salom, {{ auth.user?.firstname }}!</h1>
        <p>{{ formatDate(new Date()) }} · {{ auth.user?.company }}</p>
      </div>
    </div>

    <div class="grid grid-2" style="margin-bottom: 20px">
      <div class="card card-body stack">
        <div class="row">
          <h2 style="font-size: 16px">Bugungi holat</h2>
          <div class="spacer" />
          <StatusBadge :status="state" />
        </div>
        <p class="muted" style="margin: 0">{{ STATE_TEXT[state] }}</p>

        <div v-if="today?.today && today.today.status === 'PRESENT'" class="times">
          <div>
            <span class="muted small">Kelgan</span>
            <b class="mono">{{ formatTime(today.today.start_time) }}</b>
          </div>
          <div>
            <span class="muted small">Ketgan</span>
            <b class="mono">{{ formatTime(today.today.end_time) }}</b>
          </div>
          <div>
            <span class="muted small">Ishlagan</span>
            <b class="mono">{{ state === 'AT_WORK' ? durationSince(today.today.start_time, now) : formatHours(today.today.worked_hours) }}</b>
          </div>
        </div>
        <p v-if="today?.today?.reason" class="small" style="margin: 0">Sabab: {{ today.today.reason }}</p>

        <div class="row" style="margin-top: auto">
          <button class="btn btn-primary btn-lg" :disabled="!canEnter || generating" @click="generate('enter')">
            <AppIcon name="login" /> Ishga keldim
          </button>
          <button class="btn btn-lg" :disabled="!canExit || generating" @click="generate('exit')">
            <AppIcon name="logout" /> Ishdan ketyapman
          </button>
        </div>
      </div>

      <div class="card card-body qr-card">
        <template v-if="qr">
          <div class="qr-label">
            <span class="badge" :class="qr.status === 'GOING_TO_WORK' ? 'badge-success' : 'badge-primary'">
              {{ qr.status === 'GOING_TO_WORK' ? 'Ishga kelish' : 'Ishdan ketish' }}
            </span>
          </div>
          <div class="qr-box" :class="{ expired }">
            <img :src="qr.qr_code" alt="QR kod" />
            <div v-if="expired" class="qr-expired">
              <p>QR kod muddati tugadi</p>
              <button class="btn btn-primary" @click="generate(qr.status === 'GOING_TO_WORK' ? 'enter' : 'exit')">
                <AppIcon name="refresh" /> Yangilash
              </button>
            </div>
          </div>
          <p v-if="!expired" class="muted small" style="margin: 0">
            Rahbarga ko‘rsating · amal qiladi: <b class="mono">{{ countdown }}</b>
          </p>
          <button class="btn btn-ghost btn-sm" @click="qr = null">Yopish</button>
        </template>
        <template v-else>
          <div class="qr-empty">
            <AppIcon name="qr" :size="56" />
            <p>QR kod hosil qilish uchun chapdagi tugmani bosing</p>
            <p class="small muted">QR kod xavfsizlik uchun bir necha daqiqa amal qiladi</p>
          </div>
        </template>
      </div>
    </div>

    <h2 style="font-size: 15px; margin-bottom: 12px">Shu oy</h2>
    <div class="grid grid-stats">
      <StatCard label="Ishlagan vaqt" :value="formatHours(today?.month.worked_hours)" icon="clock" />
      <StatCard label="Ishga kelgan kunlar" :value="today?.month.present_days ?? 0" icon="check" tone="success" />
      <StatCard label="Sababli" :value="today?.month.excused_days ?? 0" icon="calendar" tone="warning" />
      <StatCard label="Sababsiz" :value="today?.month.absent_days ?? 0" icon="close" tone="danger" />
      <StatCard label="Ta’til" :value="today?.month.leave_days ?? 0" icon="calendar" tone="info" />
    </div>
  </div>
</template>

<style scoped>
.times {
  display: flex;
  gap: 28px;
  flex-wrap: wrap;
}
.times div {
  display: flex;
  flex-direction: column;
}
.times b {
  font-size: 18px;
}
.qr-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
  min-height: 340px;
}
.qr-box {
  position: relative;
  background: #fff;
  padding: 10px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
}
.qr-box img {
  display: block;
  width: min(280px, 70vw);
  height: auto;
  image-rendering: pixelated;
}
.qr-box.expired img {
  filter: blur(4px);
  opacity: 0.4;
}
.qr-expired {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #171a23;
  font-weight: 600;
}
.qr-empty {
  color: var(--text-muted);
}
.qr-empty p {
  margin: 6px 0 0;
}
</style>
