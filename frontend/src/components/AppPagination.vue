<script setup>
import { computed } from 'vue'

const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, default: 1 },
  total: { type: Number, default: 0 },
})
const emit = defineEmits(['update:page'])

const pages = computed(() => {
  const n = Math.max(1, props.totalPages)
  const cur = props.page
  const set = new Set([1, n, cur - 1, cur, cur + 1].filter((p) => p >= 1 && p <= n))
  const sorted = [...set].sort((a, b) => a - b)
  const out = []
  sorted.forEach((p, i) => {
    if (i && p - sorted[i - 1] > 1) out.push('…')
    out.push(p)
  })
  return out
})
</script>

<template>
  <div class="pager">
    <span class="muted small">Jami: {{ total }}</span>
    <div class="row">
      <button class="btn btn-sm" :disabled="page <= 1" @click="emit('update:page', page - 1)">‹</button>
      <template v-for="(p, i) in pages" :key="i">
        <span v-if="p === '…'" class="muted">…</span>
        <button v-else class="btn btn-sm" :class="{ 'btn-primary': p === page }" @click="emit('update:page', p)">
          {{ p }}
        </button>
      </template>
      <button class="btn btn-sm" :disabled="page >= totalPages" @click="emit('update:page', page + 1)">›</button>
    </div>
  </div>
</template>

<style scoped>
.pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
}
</style>
