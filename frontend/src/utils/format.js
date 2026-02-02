const pad = (n) => String(n).padStart(2, '0')

export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

export function formatTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatDateTime(value) {
  if (!value) return '—'
  return `${formatDate(value)} ${formatTime(value)}`
}

// 7.5 -> "7 soat 30 daq"
export function formatHours(hours) {
  const total = Math.round(Number(hours || 0) * 60)
  const h = Math.floor(total / 60)
  const m = total % 60
  if (!h && !m) return '0 daq'
  return [h ? `${h} soat` : '', m ? `${m} daq` : ''].filter(Boolean).join(' ')
}

// Ish boshlangandan beri o'tgan vaqt
export function durationSince(value, now = Date.now()) {
  if (!value) return ''
  const mins = Math.max(0, Math.floor((now - new Date(value).getTime()) / 60000))
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h ? `${h} soat ${m} daq` : `${m} daq`
}

export function fullName(u) {
  if (!u) return ''
  return [u.lastname, u.firstname].filter(Boolean).join(' ')
}

export function initials(u) {
  if (!u) return '?'
  return ((u.firstname?.[0] || '') + (u.lastname?.[0] || '')).toUpperCase() || '?'
}

export function toInputDate(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const ROLE_LABELS = {
  ADMIN: 'Administrator',
  OWNER: 'Tashkilot rahbari',
  USER: 'Xodim',
}

export const STATUS_META = {
  PRESENT: { label: 'Ishda bo‘lgan', cls: 'badge-success' },
  ABSENT: { label: 'Sababsiz', cls: 'badge-danger' },
  EXCUSED: { label: 'Sababli', cls: 'badge-warning' },
  ON_LEAVE: { label: 'Ta’tilda', cls: 'badge-info' },
  AT_WORK: { label: 'Ishda', cls: 'badge-success' },
  LEFT: { label: 'Ketgan', cls: 'badge-primary' },
  NOT_MARKED: { label: 'Belgilanmagan', cls: '' },
}
