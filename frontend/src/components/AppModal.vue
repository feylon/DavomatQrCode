<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  title: { type: String, default: '' },
  width: { type: String, default: '520px' },
})
const emit = defineEmits(['close'])

function onKey(e) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @mousedown.self="emit('close')">
      <div class="modal card" :style="{ maxWidth: props.width }" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h2>{{ title }}</h2>
          <button class="btn btn-ghost btn-icon" aria-label="Yopish" @click="emit('close')">
            <AppIcon name="close" />
          </button>
        </div>
        <div class="modal-body">
          <slot />
        </div>
        <div v-if="$slots.footer" class="modal-foot">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(10, 12, 20, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 100;
  animation: fade 0.15s ease;
}
.modal {
  width: 100%;
  max-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
  animation: pop 0.18s ease;
}
.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}
.modal-head h2 {
  font-size: 16px;
  font-weight: 600;
}
.modal-body {
  padding: 20px;
  overflow-y: auto;
}
.modal-foot {
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
@keyframes fade {
  from {
    opacity: 0;
  }
}
@keyframes pop {
  from {
    transform: translateY(8px) scale(0.98);
    opacity: 0;
  }
}
</style>
