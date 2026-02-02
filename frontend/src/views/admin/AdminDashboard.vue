<script setup>
import { onMounted, ref } from 'vue'
import { adminApi } from '@/api'
import { errorMessage } from '@/api/http'
import { useToast } from '@/composables/useToast'
import StatCard from '@/components/StatCard.vue'
import PersonCell from '@/components/PersonCell.vue'
import { formatDate } from '@/utils/format'

const toast = useToast()
const stats = ref(null)
const owners = ref([])

onMounted(async () => {
  try {
    const [s, o] = await Promise.all([adminApi.stats(), adminApi.owners({ page: 1, limit: 5 })])
    stats.value = s
    owners.value = o.data
  } catch (e) {
    toast.error(errorMessage(e))
  }
})
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>Bosh sahifa</h1>
        <p>Tizim bo‘yicha umumiy ko‘rsatkichlar</p>
      </div>
      <div class="row">
        <RouterLink to="/admin/owners" class="btn btn-primary">Tashkilot qo‘shish</RouterLink>
      </div>
    </div>

    <div class="grid grid-stats" style="margin-bottom: 20px">
      <StatCard label="Tashkilotlar" :value="stats?.owners.total ?? '—'" icon="building" :hint="stats ? `${stats.owners.blocked} ta bloklangan` : ''" />
      <StatCard label="Xodimlar" :value="stats?.users.total ?? '—'" icon="users" tone="info" :hint="stats ? `${stats.users.blocked} ta bloklangan` : ''" />
      <StatCard label="Bugun ishga kelgan" :value="stats?.today.present ?? '—'" icon="check" tone="success" />
      <StatCard label="Bugun kelmagan (belgilangan)" :value="stats?.today.other ?? '—'" icon="calendar" tone="warning" />
    </div>

    <div class="card">
      <div class="card-header">
        <h2>So‘nggi qo‘shilgan tashkilotlar</h2>
        <RouterLink to="/admin/owners" class="small">Barchasi →</RouterLink>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Rahbar</th>
              <th>Tashkilot</th>
              <th>Xodimlar</th>
              <th>Holat</th>
              <th>Qo‘shilgan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in owners" :key="o.id">
              <td><PersonCell :user="o" /></td>
              <td>{{ o.company }}</td>
              <td class="mono">{{ o.employeesCount ?? 0 }}</td>
              <td>
                <span class="badge" :class="o.isBlock ? 'badge-danger' : 'badge-success'">{{ o.isBlock ? 'Bloklangan' : 'Faol' }}</span>
              </td>
              <td>{{ formatDate(o.created_At) }}</td>
            </tr>
            <tr v-if="!owners.length">
              <td colspan="5" class="empty">Hozircha tashkilotlar yo‘q</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
