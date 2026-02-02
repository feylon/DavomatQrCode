<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  label: { type: String, required: true },
  value: { type: [Number, String], default: 0 },
  icon: { type: String, default: 'dashboard' },
  tone: { type: String, default: 'primary' },
  hint: { type: String, default: '' },
})
</script>

<template>
  <div class="card stat">
    <div class="stat-icon" :class="`tone-${tone}`">
      <AppIcon :name="icon" :size="20" />
    </div>
    <div>
      <div class="stat-label">{{ label }}</div>
      <div class="stat-value mono">{{ value }}</div>
      <div v-if="hint" class="stat-hint">{{ hint }}</div>
    </div>
  </div>
</template>

<style scoped>
.stat {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 16px 18px;
}
.stat-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.tone-primary { background: var(--primary-soft); color: var(--primary); }
.tone-success { background: var(--success-soft); color: var(--success); }
.tone-warning { background: var(--warning-soft); color: var(--warning); }
.tone-danger { background: var(--danger-soft); color: var(--danger); }
.tone-info { background: var(--info-soft); color: var(--info); }
.tone-neutral { background: var(--neutral-soft); color: var(--text-muted); }
.stat-label {
  font-size: 13px;
  color: var(--text-muted);
}
.stat-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}
.stat-hint {
  font-size: 12px;
  color: var(--text-muted);
}
</style>
