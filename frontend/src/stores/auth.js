import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi } from '@/api'
import { tokenStorage } from '@/utils/tokenStorage'

export const HOME_BY_ROLE = {
  ADMIN: '/admin',
  OWNER: '/owner',
  USER: '/me',
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loaded = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  const role = computed(() => user.value?.role ?? null)
  const homePath = computed(() => HOME_BY_ROLE[role.value] ?? '/login')

  async function login(username, password) {
    const tokens = await authApi.login({ username, password })
    tokenStorage.set(tokens.accessToken, tokens.refreshToken)
    await fetchProfile()
  }

  async function fetchProfile() {
    user.value = await authApi.profile()
    loaded.value = true
    return user.value
  }

  // Sahifa yangilanganda saqlangan token bo'yicha profilni tiklash
  async function restore() {
    if (loaded.value) return user.value
    if (!tokenStorage.access && !tokenStorage.refresh) {
      loaded.value = true
      return null
    }
    try {
      return await fetchProfile()
    } catch {
      tokenStorage.clear()
      user.value = null
      loaded.value = true
      return null
    }
  }

  function logout() {
    tokenStorage.clear()
    user.value = null
  }

  return { user, loaded, isAuthenticated, role, homePath, login, fetchProfile, restore, logout }
})
