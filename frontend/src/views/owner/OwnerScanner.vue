<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import QrScanner from 'qr-scanner'
import { ownerApi } from '@/api'
import { errorMessage } from '@/api/http'
import AppIcon from '@/components/AppIcon.vue'
import PersonCell from '@/components/PersonCell.vue'
import { formatHours, formatTime } from '@/utils/format'

const mode = ref('camera') // camera | image | manual
const video = ref(null)
const fileInput = ref(null)
const cameras = ref([])
const cameraId = ref('')
const running = ref(false)
const cameraError = ref('')
const busy = ref(false)
const result = ref(null) // { ok, data?, message? }
const history = ref([])
const manualToken = ref('')

let scanner = null
let lastToken = ''
let lastAt = 0

// Muvaffaqiyatli/xato skanerlashda qisqa ovozli signal
function beep(ok = true) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = ok ? 880 : 220
    gain.gain.value = 0.08
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + (ok ? 0.12 : 0.3))
  } catch {
    /* ovoz qo'llab-quvvatlanmasa e'tiborsiz */
  }
}

function pushResult(r) {
  result.value = r
  history.value.unshift({ ...r, at: new Date() })
  history.value = history.value.slice(0, 8)
  beep(r.ok)
  if (navigator.vibrate) navigator.vibrate(r.ok ? 80 : [60, 60, 60])
}

async function handle(promise) {
  busy.value = true
  try {
    const data = await promise
    pushResult({ ok: true, data })
  } catch (e) {
    pushResult({ ok: false, message: errorMessage(e, 'QR kodni qayta ishlab bo‘lmadi') })
  } finally {
    busy.value = false
  }
}

async function onDecode(res) {
  const token = (res?.data ?? '').trim()
  if (!token || busy.value) return
  // Bir xil kod 4 soniya ichida qayta yuborilmaydi
  if (token === lastToken && Date.now() - lastAt < 4000) return
  lastToken = token
  lastAt = Date.now()
  await handle(ownerApi.scanToken(token))
}

async function startCamera() {
  cameraError.value = ''
  if (!window.isSecureContext) {
    cameraError.value = 'Kamera faqat HTTPS yoki localhost orqali ishlaydi. Rasm yuklash usulidan foydalaning.'
    return
  }
  try {
    await nextTick()
    scanner ??= new QrScanner(video.value, onDecode, {
      returnDetailedScanResult: true,
      highlightScanRegion: true,
      highlightCodeOutline: true,
      preferredCamera: 'environment',
      maxScansPerSecond: 5,
    })
    await scanner.start()
    running.value = true
    cameras.value = await QrScanner.listCameras(true)
  } catch (e) {
    running.value = false
    cameraError.value =
      typeof e === 'string' && e.includes('Camera not found')
        ? 'Kamera topilmadi'
        : 'Kameraga ruxsat berilmadi yoki u band. Brauzer sozlamalarini tekshiring.'
  }
}

function stopCamera() {
  scanner?.stop()
  running.value = false
}

async function switchCamera() {
  if (scanner && cameraId.value) await scanner.setCamera(cameraId.value)
}

async function setMode(m) {
  mode.value = m
  if (m === 'camera') startCamera()
  else stopCamera()
}

async function onFile(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  await handle(ownerApi.scanImage(file))
}

async function submitManual() {
  const t = manualToken.value.trim()
  if (!t) return
  await handle(ownerApi.scanToken(t))
  if (result.value?.ok) manualToken.value = ''
}

onMounted(startCamera)
onBeforeUnmount(() => {
  scanner?.destroy()
  scanner = null
})
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>QR skaner</h1>
        <p>Xodim QR kodini skanerlang — kelish yoki ketish avtomatik aniqlanadi</p>
      </div>
      <div class="seg">
        <button :class="{ active: mode === 'camera' }" @click="setMode('camera')"><AppIcon name="camera" :size="16" /> Kamera</button>
        <button :class="{ active: mode === 'image' }" @click="setMode('image')"><AppIcon name="upload" :size="16" /> Rasm</button>
        <button :class="{ active: mode === 'manual' }" @click="setMode('manual')"><AppIcon name="edit" :size="16" /> Matn</button>
      </div>
    </div>

    <div class="scan-grid">
      <div class="card">
        <div v-show="mode === 'camera'" class="card-body stack">
          <div class="viewport">
            <video ref="video" muted playsinline />
            <div v-if="!running" class="viewport-overlay">
              <AppIcon name="camera" :size="40" />
              <p v-if="cameraError">{{ cameraError }}</p>
              <p v-else>Kamera ishga tushmoqda…</p>
              <button class="btn btn-primary" @click="startCamera">Kamerani yoqish</button>
            </div>
            <div v-if="busy" class="viewport-busy"><span class="spinner" /></div>
          </div>
          <div class="row">
            <select v-if="cameras.length > 1" v-model="cameraId" class="select" style="flex: 1" @change="switchCamera">
              <option value="">Kamerani tanlang</option>
              <option v-for="c in cameras" :key="c.id" :value="c.id">{{ c.label || c.id }}</option>
            </select>
            <div class="spacer" />
            <button v-if="running" class="btn" @click="stopCamera">To‘xtatish</button>
          </div>
        </div>

        <div v-show="mode === 'image'" class="card-body">
          <div class="drop" @click="fileInput?.click()" @dragover.prevent @drop.prevent="onFile({ target: { files: $event.dataTransfer.files, value: '' } })">
            <AppIcon name="upload" :size="40" />
            <p><b>QR kod rasmini tanlang</b> yoki shu yerga tashlang</p>
            <p class="small muted">PNG, JPG — 5MB gacha</p>
            <span v-if="busy" class="spinner" />
          </div>
          <input ref="fileInput" type="file" accept="image/*" hidden @change="onFile" />
        </div>

        <form v-show="mode === 'manual'" class="card-body stack" @submit.prevent="submitManual">
          <div class="field">
            <label>QR kod matni (token)</label>
            <textarea v-model="manualToken" class="textarea" rows="4" placeholder="eyJhbGciOi…" />
            <span class="hint">Tashqi skaner qurilmasi ishlatilsa, matn shu yerga tushadi</span>
          </div>
          <div>
            <button class="btn btn-primary" :disabled="busy || !manualToken.trim()">Yuborish</button>
          </div>
        </form>
      </div>

      <div class="stack">
        <div class="card result" :class="result ? (result.ok ? 'ok' : 'fail') : ''">
          <div class="card-body">
            <template v-if="!result">
              <div class="placeholder">
                <AppIcon name="scan" :size="36" />
                <p class="muted">Skanerlash natijasi shu yerda ko‘rinadi</p>
              </div>
            </template>
            <template v-else-if="result.ok">
              <div class="result-title">
                <AppIcon name="check" :size="22" />
                {{ result.data.action === 'LEFT_FROM_WORK' ? 'Ishdan ketish qayd etildi' : 'Ishga kelish qayd etildi' }}
              </div>
              <PersonCell :user="result.data.user" />
              <div class="result-meta">
                <div>
                  <span class="muted">Kelgan</span><b class="mono">{{ formatTime(result.data.start_time) }}</b>
                </div>
                <div v-if="result.data.end_time">
                  <span class="muted">Ketgan</span><b class="mono">{{ formatTime(result.data.end_time) }}</b>
                </div>
                <div v-if="result.data.end_time">
                  <span class="muted">Ishlagan</span><b>{{ formatHours(result.data.worked_hours) }}</b>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="result-title"><AppIcon name="close" :size="22" /> Qayd etilmadi</div>
              <p style="margin: 0">{{ result.message }}</p>
            </template>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h2>So‘nggi skanerlashlar</h2></div>
          <ul class="log">
            <li v-for="(h, i) in history" :key="i">
              <span class="dot" :class="h.ok ? 'ok' : 'fail'" />
              <div style="flex: 1; min-width: 0">
                <div class="ellipsis">
                  <template v-if="h.ok">{{ h.data.user.lastname }} {{ h.data.user.firstname }} — {{ h.data.action === 'LEFT_FROM_WORK' ? 'ketdi' : 'keldi' }}</template>
                  <template v-else>{{ h.message }}</template>
                </div>
              </div>
              <span class="small muted mono">{{ formatTime(h.at) }}</span>
            </li>
            <li v-if="!history.length" class="muted">Hali skanerlanmagan</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.seg {
  display: inline-flex;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
}
.seg button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: none;
  font: inherit;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 7px;
  color: var(--text-muted);
  cursor: pointer;
}
.seg button.active {
  background: var(--primary);
  color: #fff;
}
.scan-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
.viewport {
  position: relative;
  aspect-ratio: 4 / 3;
  background: #000;
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.viewport video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.viewport-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #cfd3dc;
  text-align: center;
  padding: 20px;
  background: #11131a;
}
.viewport-busy {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
}
.drop {
  border: 2px dashed var(--border);
  border-radius: var(--radius);
  padding: 48px 20px;
  text-align: center;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.drop:hover {
  border-color: var(--primary);
  color: var(--primary);
}
.drop p {
  margin: 0;
}
.result {
  border-width: 2px;
}
.result.ok {
  border-color: var(--success);
}
.result.fail {
  border-color: var(--danger);
}
.result .card-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.result-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
}
.result.ok .result-title {
  color: var(--success);
}
.result.fail .result-title {
  color: var(--danger);
}
.result-meta {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}
.result-meta div {
  display: flex;
  flex-direction: column;
}
.placeholder {
  text-align: center;
  color: var(--text-muted);
  padding: 20px 0;
}
.log {
  list-style: none;
  margin: 0;
  padding: 8px 0;
}
.log li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 20px;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot.ok {
  background: var(--success);
}
.dot.fail {
  background: var(--danger);
}
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (max-width: 900px) {
  .scan-grid {
    grid-template-columns: 1fr;
  }
}
</style>
