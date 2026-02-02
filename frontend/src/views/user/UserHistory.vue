<script setup>
import { onMounted } from 'vue'
import { userApi } from '@/api'
import { usePaged } from '@/composables/usePaged'
import AppPagination from '@/components/AppPagination.vue'
import StatCard from '@/components/StatCard.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { formatDate, formatHours, formatTime, toInputDate } from '@/utils/format'

const monthStart = new Date()
monthStart.setDate(1)

const { items, meta, loading, filters, page, load } = usePaged(
  userApi.stats,
  { startDate: toInputDate(monthStart), endDate: toInputDate(), status: '' },
  { limit: 15 },
)
onMounted(load)

const WEEKDAYS = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Mening davomatim</h1>
        <p>Ish kunlaringiz tarixi va ishlagan vaqtingiz</p>
      </div>
    </div>

    <div class="grid grid-stats" style="margin-bottom: 20px">
      <StatCard label="Tanlangan davrda ishlagan" :value="formatHours(meta.total_worked_hours)" icon="clock" />
      <StatCard label="Yozuvlar soni" :value="meta.total" icon="calendar" tone="neutral" />
    </div>

    <div class="card">
      <div class="card-header">
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
            <label class="small muted">Holat</label>
            <select v-model="filters.status" class="select">
              <option value="">Barchasi</option>
              <option value="PRESENT">Ishda bo‘lgan</option>
              <option value="EXCUSED">Sababli</option>
              <option value="ABSENT">Sababsiz</option>
              <option value="ON_LEAVE">Ta’tilda</option>
            </select>
          </div>
        </div>
        <span v-if="loading" class="spinner muted" />
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Sana</th>
              <th>Holat</th>
              <th>Kelgan</th>
              <th>Ketgan</th>
              <th>Ishlagan</th>
              <th>Izoh</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in items" :key="r.id">
              <td>
                <div class="mono">{{ formatDate(r.date) }}</div>
                <div class="small muted">{{ WEEKDAYS[new Date(r.date).getDay()] }}</div>
              </td>
              <td><StatusBadge :status="r.status === 'PRESENT' && !r.end_time ? 'AT_WORK' : r.status" /></td>
              <td class="mono">{{ r.status === 'PRESENT' ? formatTime(r.start_time) : '—' }}</td>
              <td class="mono">{{ r.status === 'PRESENT' ? formatTime(r.end_time) : '—' }}</td>
              <td class="mono">{{ r.status === 'PRESENT' && r.end_time ? formatHours(r.worked_hours) : '—' }}</td>
              <td class="muted" style="white-space: normal">{{ r.reason || '' }}</td>
            </tr>
            <tr v-if="!items.length && !loading">
              <td colspan="6" class="empty">Tanlangan davrda yozuvlar yo‘q</td>
            </tr>
          </tbody>
        </table>
      </div>
      <AppPagination v-model:page="page" :total-pages="meta.totalPages" :total="meta.total" />
    </div>
  </div>
</template>
