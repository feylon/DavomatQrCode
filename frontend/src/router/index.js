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
      // ROUTES
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
