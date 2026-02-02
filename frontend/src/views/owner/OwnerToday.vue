<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ownerApi } from '@/api'
import { errorMessage } from '@/api/http'
import { useToast } from '@/composables/useToast'
import StatCard from '@/components/StatCard.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import PersonCell from '@/components/PersonCell.vue'
import AppModal from '@/components/AppModal.vue'
import AppIcon from '@/components/AppIcon.vue'
import { durationSince, formatDate, formatHours, formatTime, fullName } from '@/utils/format'

const toast = useToast()
const data = ref(null)
const loading = ref(false)
const filter = ref('ALL')
const search = ref('')
const now = ref(Date.now())

async function load(silent = false) {
  if (!silent) loading.value = true
  try {
    data.value = await ownerApi.today()
  } catch (e) {
    if (!silent) toast.error(errorMessage(e))
  } finally {
    loading.value = false
  }
}

// Har 30 soniyada yangilab turish
let timer
onMounted(() => {
  load()
  timer = setInterval(() => {
    now.value = Date.now()
    load(true)
  }, 30000)
})
onBeforeUnmount(() => clearInterval(timer))

const FILTERS = [
  { key: 'ALL', label: 'Barchasi' },
  { key: 'AT_WORK', label: 'Ishda' },
  { key: 'LEFT', label: 'Ketgan' },
  { key: 'NOT_MARKED', label: 'Belgilanmagan' },
  { key: 'ABSENT_ANY', label: 'Kelmagan' },
]

const rows = computed(() => {
  const list = data.value?.employees ?? []
  const q = search.value.trim().toLowerCase()
  return list.filter((r) => {
    if (filter.value === 'ABSENT_ANY' && !['ABSENT', 'EXCUSED', 'ON_LEAVE'].includes(r.state)) return false
    if (!['ALL', 'ABSENT_ANY'].includes(filter.value) && r.state !== filter.value) return false
    if (q && !`${fullName(r.user)} ${r.user.login}`.toLowerCase().includes(q)) return false
    return true
  })
})

const s = computed(() => data.value?.summary)
const attendanceRate = computed(() => {
  if (!s.value?.total_employees) return 0
  return Math.round(((s.value.at_work + s.value.left) / s.value.total_employees) * 100)
})

// Kelmaganlikni belgilash
const absenceFor = ref(null)
const absence = reactive({ status: 'EXCUSED', reason: '' })
const saving = ref(false)

function openAbsence(row) {
  absenceFor.value = row
  Object.assign(absence, { status: 'EXCUSED', reason: '' })
}

async function saveAbsence() {
  saving.value = true
  try {
    await ownerApi.markAbsence({ user_id: absenceFor.value.user.id, status: absence.status, reason: absence.reason || undefined })
    toast.success('Holat belgilandi')
    absenceFor.value = null
    load(true)
  } catch (e) {
    toast.error(errorMessage(e))
  } finally {
    saving.value = false
  }
}

async function cancelAbsence(row) {
  if (!confirm(`${fullName(row.user)} uchun belgilangan holatni bekor qilasizmi?`)) return
  try {
    await ownerApi.cancelAbsence(row.attendance.id)
    toast.success('Bekor qilindi')
    load(true)
  } catch (e) {
    toast.error(errorMessage(e))
  }
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Bugungi davomat</h1>
        <p>{{ formatDate(new Date()) }} — har 30 soniyada avtomatik yangilanadi</p>
      </div>
      <div class="row">
        <button class="btn" :disabled="loading" @click="load()"><AppIcon name="refresh" /> Yangilash</button>
        <RouterLink to="/owner/scan" class="btn btn-primary"><AppIcon name="scan" /> QR skanerlash</RouterLink>
      </div>
    </div>

    <div class="grid grid-stats" style="margin-bottom: 20px">
      <StatCard label="Jami xodimlar" :value="s?.total_employees ?? '—'" icon="users" tone="neutral" />
      <StatCard label="Hozir ishda" :value="s?.at_work ?? '—'" icon="check" tone="success" />
      <StatCard label="Ishdan ketgan" :value="s?.left ?? '—'" icon="logout" tone="primary" />
      <StatCard label="Kelmagan" :value="s ? s.absent + s.excused + s.on_leave : '—'" icon="calendar" tone="warning" :hint="s ? `${s.excused} sababli · ${s.on_leave} ta’tilda` : ''" />
      <StatCard label="Belgilanmagan" :value="s?.not_marked ?? '—'" icon="clock" tone="danger" :hint="s ? `Davomat: ${attendanceRate}%` : ''" />
    </div>

    <div class="card">
      <div class="card-header">
        <div class="tabs">
          <button v-for="f in FILTERS" :key="f.key" class="tab" :class="{ active: filter === f.key }" @click="filter = f.key">
            {{ f.label }}
          </button>
        </div>
        <input v-model="search" class="input" style="max-width: 260px" placeholder="Xodimni qidirish…" />
      </div>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Xodim</th>
              <th>Holat</th>
              <th>Kelgan</th>
              <th>Ketgan</th>
              <th>Ishlagan</th>
              <th class="actions">Amallar</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.user.id">
              <td><PersonCell :user="r.user" /></td>
              <td>
                <StatusBadge :status="r.state" />
                <div v-if="r.attendance?.reason" class="small muted" style="margin-top: 2px">{{ r.attendance.reason }}</div>
              </td>
              <td class="mono">{{ r.state === 'AT_WORK' || r.state === 'LEFT' ? formatTime(r.attendance.start_time) : '—' }}</td>
              <td class="mono">{{ r.state === 'LEFT' ? formatTime(r.attendance.end_time) : '—' }}</td>
              <td class="mono">
                <template v-if="r.state === 'AT_WORK'">{{ durationSince(r.attendance.start_time, now) }}</template>
                <template v-else-if="r.state === 'LEFT'">{{ formatHours(r.attendance.worked_hours) }}</template>
                <template v-else>—</template>
              </td>
              <td class="actions">
                <button v-if="r.state === 'NOT_MARKED'" class="btn btn-sm" @click="openAbsence(r)">Kelmadi deb belgilash</button>
                <button v-else-if="['ABSENT', 'EXCUSED', 'ON_LEAVE'].includes(r.state)" class="btn btn-sm btn-ghost btn-danger" @click="cancelAbsence(r)">
                  Bekor qilish
                </button>
              </td>
            </tr>
            <tr v-if="!rows.length">
              <td colspan="6" class="empty">
                <template v-if="loading">Yuklanmoqda…</template>
                <template v-else-if="!data?.employees?.length">
                  Hali xodimlar yo‘q. <RouterLink to="/owner/employees">Xodim qo‘shish</RouterLink>
                </template>
                <template v-else>Bu filtrda xodim yo‘q</template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <AppModal v-if="absenceFor" title="Kelmaganlikni belgilash" width="440px" @close="absenceFor = null">
      <form id="absence-form" class="stack" @submit.prevent="saveAbsence">
        <p style="margin: 0"><b>{{ fullName(absenceFor.user) }}</b> — bugun uchun</p>
        <div class="field">
          <label>Holat</label>
          <div class="choice">
            <label v-for="o in [
              { v: 'EXCUSED', l: 'Sababli', d: 'Kasal, ruxsat so‘ragan' },
              { v: 'ABSENT', l: 'Sababsiz', d: 'Ogohlantirmasdan kelmagan' },
              { v: 'ON_LEAVE', l: 'Ta’tilda', d: 'Mehnat ta’tili' },
            ]" :key="o.v" class="choice-item" :class="{ active: absence.status === o.v }">
              <input v-model="absence.status" type="radio" :value="o.v" />
              <div>
                <div style="font-weight: 600">{{ o.l }}</div>
                <div class="small muted">{{ o.d }}</div>
              </div>
            </label>
          </div>
        </div>
        <div class="field">
          <label>Sabab (ixtiyoriy)</label>
          <textarea v-model="absence.reason" class="textarea" placeholder="Masalan: shifokor ma’lumotnomasi bor" />
        </div>
      </form>
      <template #footer>
        <button class="btn" @click="absenceFor = null">Bekor qilish</button>
        <button class="btn btn-primary" form="absence-form" :disabled="saving">
          <span v-if="saving" class="spinner" /> Belgilash
        </button>
      </template>
    </AppModal>
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 4px;
  background: var(--surface-2);
  padding: 4px;
  border-radius: 10px;
  flex-wrap: wrap;
}
.tab {
  border: none;
  background: none;
  font: inherit;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 7px;
  color: var(--text-muted);
  cursor: pointer;
}
.tab.active {
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow);
}
.choice {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.choice-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 400 !important;
}
.choice-item.active {
  border-color: var(--primary);
  background: var(--primary-soft);
}
.choice-item input {
  margin-top: 3px;
}
</style>
