<script setup>
import { useToast } from '@/composables/useToast'
import AppIcon from './AppIcon.vue'

const { state, dismiss } = useToast()
</script>

<template>
  <Teleport to="body">
    <div class="toasts" aria-live="polite">
      <TransitionGroup name="toast">
        <div v-for="t in state.items" :key="t.id" class="toast" :class="`toast-${t.type}`" @click="dismiss(t.id)">
          <AppIcon :name="t.type === 'error' ? 'close' : 'check'" :size="16" />
          <span>{{ t.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toasts {
  position: fixed;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 200;
  max-width: calc(100vw - 32px);
}
.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-lg);
  cursor: pointer;
  min-width: 260px;
  max-width: 420px;
}
.toast-success { border-left: 4px solid var(--success); }
.toast-success svg { color: var(--success); }
.toast-error { border-left: 4px solid var(--danger); }
.toast-error svg { color: var(--danger); }
.toast-info { border-left: 4px solid var(--info); }
.toast-info svg { color: var(--info); }
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}
</style>
