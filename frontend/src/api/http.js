import axios from 'axios'
import { tokenStorage } from '@/utils/tokenStorage'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 20000,
})

http.interceptors.request.use((config) => {
  const token = tokenStorage.access
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Bir vaqtda kelgan 401 javoblar uchun bitta refresh so'rovi yuboriladi
let refreshPromise = null

async function refreshTokens() {
  const refreshToken = tokenStorage.refresh
  if (!refreshToken) throw new Error('Refresh token yo‘q')
  const { data } = await axios.post(`${http.defaults.baseURL}/auth/refresh`, { refreshToken })
  tokenStorage.set(data.accessToken, data.refreshToken)
  return data.accessToken
}

let onAuthFailure = () => {}
export function setAuthFailureHandler(fn) {
  onAuthFailure = fn
}

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    const isAuthCall = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh')

    if (status === 401 && !original._retry && !isAuthCall && tokenStorage.refresh) {
      original._retry = true
      try {
        refreshPromise ??= refreshTokens().finally(() => (refreshPromise = null))
        const token = await refreshPromise
        original.headers.Authorization = `Bearer ${token}`
        return http(original)
      } catch {
        tokenStorage.clear()
        onAuthFailure()
      }
    } else if (status === 401 && !isAuthCall) {
      tokenStorage.clear()
      onAuthFailure()
    }
    return Promise.reject(error)
  },
)

// Backend xato xabarini o'qiladigan matnga aylantirish
export function errorMessage(error, fallback = 'Xatolik yuz berdi') {
  const msg = error?.response?.data?.message
  if (Array.isArray(msg)) return msg.join(', ')
  if (typeof msg === 'string') return msg
  if (error?.code === 'ECONNABORTED') return 'Server javob bermadi (timeout)'
  if (error?.message === 'Network Error') return 'Server bilan aloqa yo‘q'
  return fallback
}
