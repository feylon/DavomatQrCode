<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ownerApi } from '@/api'
import { errorMessage } from '@/api/http'
import { useToast } from '@/composables/useToast'
import { usePaged } from '@/composables/usePaged'
import AppIcon from '@/components/AppIcon.vue'
import AppPagination from '@/components/AppPagination.vue'
import PersonCell from '@/components/PersonCell.vue'
import StatCard from '@/components/StatCard.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { formatDate, formatHours, formatTime, fullName, toInputDate } from '@/utils/format'

const toast = useToast()
const route = useRoute()

const monthStart = new Date()
monthStart.setDate(1)

const { items, meta, loading, filters, page, load } = usePaged(
  ownerApi.stats,
  {
    startDate: toInputDate(monthStart),
    endDate: toInputDate(),
    status: '',
    userId: typeof route.query.userId === 'string' ? route.query.userId : '',
    search: '',
  },
  { limit: 15 },
)

const employees = ref([])
onMounted(async () => {
  load()
  try {
    const res = await ownerApi.employees({ page: 1, limit: 100 })
    employees.value = res.data
  } catch (e) {
    toast.error(errorMessage(e))
  }
})

function setPreset(p) {
  const now = new Date()
  const start = new Date()
  if (p === 'today') {
    /* bugun */
  } else if (p === 'week') {
    start.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  } else if (p === 'month') {
    start.setDate(1)
  } else if (p === 'prev') {
    start.setMonth(now.getMonth() - 1, 1)
    now.setDate(0)
  }
  filters.startDate = toInputDate(start)
  filters.endDate = toInputDate(now)
}

const exporting = ref(false)
async function exportCsv() {
  exporting.value = true
  try {
    const params = {}
    for (const [k, v] of Object.entries(filters)) if (v) params[k] = v
    const res = await ownerApi.exportCsv(params)
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `davomat_${filters.startDate || 'boshidan'}_${filters.endDate || 'bugun'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    toast.error(errorMessage(e, 'Eksport qilib bo‘lmadi'))
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Davomat tarixi</h1>
        <p>Davr, xodim va holat bo‘yicha filtrlash</p>
      </div>
      <button class="btn" :disabled="exporting" @click="exportCsv">
        <span v-if="exporting" class="spinner" /><AppIcon v-else name="download" /> Excel (CSV) yuklab olish
      </button>
    </div>

    <div class="grid grid-stats" style="margin-bottom: 20px">
      <StatCard label="Jami ishlangan vaqt" :value="formatHours(meta.total_worked_hours_in_period)" icon="clock" />
      <StatCard label="Ishga kelgan (kun)" :value="meta.by_status?.PRESENT ?? 0" icon="check" tone="success" />
      <StatCard label="Sababli" :value="meta.by_status?.EXCUSED ?? 0" icon="calendar" tone="warning" />
      <StatCard label="Sababsiz" :value="meta.by_status?.ABSENT ?? 0" icon="close" tone="danger" />
      <StatCard label="Ta’tilda" :value="meta.by_status?.ON_LEAVE ?? 0" icon="calendar" tone="info" />
    </div>

    <div class="card">
      <div class="card-header" style="flex-direction: column; align-items: stretch">
        <div class="row">
          <button class="btn btn-sm" @click="setPreset('today')">Bugun</button>
          <button class="btn btn-sm" @click="setPreset('week')">Shu hafta</button>
          <button class="btn btn-sm" @click="setPreset('month')">Shu oy</button>
          <button class="btn btn-sm" @click="setPreset('prev')">O‘tgan oy</button>
          <div class="spacer" />
          <span v-if="loading" class="spinner muted" />
        </div>
        <div class="filters">
          <div class="field">
            <label class="small muted">Dan</label>
            <input v-model="filters.startDate" type="date" class="input" />
          </div>
          <div class="field">
            <label class="small muted">Gacha</label>
            <input v-model="filters.endDate" type="date" class="input" />
          </div>
          <div class="field">
            <label class="small muted">Xodim</label>
            <select v-model="filters.userId" class="select">
              <option value="">Barcha xodimlar</option>
              <option v-for="e in employees" :key="e.id" :value="e.id">{{ fullName(e) }}</option>
            </select>
          </div>
          <div class="field">
            <label class="small muted">Holat</label>
            <select v-model="filters.status" class="select">
              <option value="">Barcha holatlar</option>
              <option value="PRESENT">Ishda bo‘lgan</option>
              <option value="EXCUSED">Sababli</option>
              <option value="ABSENT">Sababsiz</option>
              <option value="ON_LEAVE">Ta’tilda</option>
            </select>
          </div>
          <div class="field" style="flex: 1 1 200px">
            <label class="small muted">Qidiruv</label>
            <input v-model="filters.search" class="input" style="width: 100%" placeholder="Ism yoki login…" />
          </div>
        </div>
      </div>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Sana</th>
              <th>Xodim</th>
              <th>Holat</th>
              <th>Kelgan</th>
              <th>Ketgan</th>
              <th>Ishlagan</th>
              <th>Izoh</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in items" :key="r.id">
              <td class="mono">{{ formatDate(r.date) }}</td>
              <td><PersonCell :user="r.user" :sub="r.user.email" /></td>
              <td>
                <StatusBadge :status="r.status === 'PRESENT' && !r.end_time ? 'AT_WORK' : r.status" />
              </td>
              <td class="mono">{{ r.status === 'PRESENT' ? formatTime(r.start_time) : '—' }}</td>
              <td class="mono">{{ r.status === 'PRESENT' ? formatTime(r.end_time) : '—' }}</td>
              <td class="mono">{{ r.status === 'PRESENT' && r.end_time ? formatHours(r.worked_hours) : '—' }}</td>
              <td class="muted" style="white-space: normal; max-width: 260px">{{ r.reason || '' }}</td>
            </tr>
            <tr v-if="!items.length && !loading">
              <td colspan="7" class="empty">Tanlangan davrda yozuvlar yo‘q</td>
            </tr>
          </tbody>
        </table>
      </div>
      <AppPagination v-model:page="page" :total-pages="meta.totalPages" :total="meta.total" />
    </div>
  </div>
</template>
