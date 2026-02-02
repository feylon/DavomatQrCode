import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/AppLayout.vue'

const routes = [
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { guest: true } },
  {
    path: '/',
    component: AppLayout,
    meta: { auth: true },
    children: [
      { path: '', name: 'home', redirect: () => useAuthStore().homePath },
      { path: 'profile', name: 'profile', component: () => import('@/views/ProfileView.vue') },
      { path: 'admin', component: () => import('@/views/admin/AdminDashboard.vue'), meta: { roles: ['ADMIN'] } },
      { path: 'admin/owners', component: () => import('@/views/admin/AdminOwners.vue'), meta: { roles: ['ADMIN'] } },
      { path: 'admin/users', component: () => import('@/views/admin/AdminUsers.vue'), meta: { roles: ['ADMIN'] } },

      { path: 'owner', component: () => import('@/views/owner/OwnerToday.vue'), meta: { roles: ['OWNER'] } },
      { path: 'owner/scan', component: () => import('@/views/owner/OwnerScanner.vue'), meta: { roles: ['OWNER'] } },
      { path: 'owner/employees', component: () => import('@/views/owner/OwnerEmployees.vue'), meta: { roles: ['OWNER'] } },
      { path: 'owner/history', component: () => import('@/views/owner/OwnerHistory.vue'), meta: { roles: ['OWNER'] } },

      { path: 'me', component: () => import('@/views/user/UserHome.vue'), meta: { roles: ['USER'] } },
      { path: 'me/history', component: () => import('@/views/user/UserHistory.vue'), meta: { roles: ['USER'] } },
    ],
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFound.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.restore()

  if (to.meta.guest && auth.isAuthenticated) return auth.homePath
  if (to.matched.some((r) => r.meta.auth) && !auth.isAuthenticated) {
    return { path: '/login', query: to.fullPath !== '/' ? { redirect: to.fullPath } : {} }
  }
  const roles = to.meta.roles
  if (roles && !roles.includes(auth.role)) return auth.homePath
  return true
})

export default router
