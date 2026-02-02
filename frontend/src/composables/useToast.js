import { reactive } from 'vue'

const state = reactive({ items: [] })
let seq = 0

function push(type, message, timeout = 3500) {
  const id = ++seq
  state.items.push({ id, type, message })
  setTimeout(() => dismiss(id), timeout)
}

function dismiss(id) {
  const i = state.items.findIndex((t) => t.id === id)
  if (i !== -1) state.items.splice(i, 1)
}

export function useToast() {
  return {
    state,
    dismiss,
    success: (m) => push('success', m),
    error: (m) => push('error', m, 5000),
    info: (m) => push('info', m),
  }
}
