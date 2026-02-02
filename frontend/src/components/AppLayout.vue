<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { fullName, initials, ROLE_LABELS } from '@/utils/format'
import AppIcon from './AppIcon.vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const open = ref(false)

const MENUS = {
  ADMIN: [
    { to: '/admin', label: 'Bosh sahifa', icon: 'dashboard', exact: true },
    { to: '/admin/owners', label: 'Tashkilotlar', icon: 'building' },
    { to: '/admin/users', label: 'Xodimlar', icon: 'users' },
  ],
  OWNER: [
    { to: '/owner', label: 'Bugun', icon: 'dashboard', exact: true },
    { to: '/owner/scan', label: 'QR skaner', icon: 'scan' },
    { to: '/owner/employees', label: 'Xodimlar', icon: 'users' },
    { to: '/owner/history', label: 'Davomat tarixi', icon: 'history' },
  ],
  USER: [
    { to: '/me', label: 'Mening QR kodim', icon: 'qr', exact: true },
    { to: '/me/history', label: 'Mening davomatim', icon: 'history' },
  ],
}

const menu = computed(() => MENUS[auth.role] ?? [])
const company = computed(() => auth.user?.company)

function isActive(item) {
  return item.exact ? route.path === item.to : route.path.startsWith(item.to)
}

function logout() {
  auth.logout()
  router.replace('/login')
}

watch(() => route.fullPath, () => (open.value = false))
</script>

<template>
  <div class="shell" :class="{ open }">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-logo"><AppIcon name="qr" :size="20" /></div>
        <div>
          <div class="brand-name">Davomat</div>
          <div class="brand-sub">{{ company || 'QR orqali hisob' }}</div>
        </div>
      </div>

      <nav class="nav">
        <RouterLink v-for="item in menu" :key="item.to" :to="item.to" class="nav-item" :class="{ active: isActive(item) }">
          <AppIcon :name="item.icon" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-foot">
        <RouterLink to="/profile" class="nav-item" :class="{ active: route.path === '/profile' }">
          <AppIcon name="user" />
          <span>Profil</span>
        </RouterLink>
        <button class="nav-item" @click="logout">
          <AppIcon name="logout" />
          <span>Chiqish</span>
        </button>
      </div>
    </aside>

    <div class="backdrop" @click="open = false" />

    <div class="main">
      <header class="topbar">
        <button class="btn btn-ghost btn-icon menu-btn" aria-label="Menyu" @click="open = !open">
          <AppIcon name="menu" />
        </button>
        <div class="spacer" />
        <div v-if="auth.user" class="person">
          <div class="who">
            <div class="name">{{ fullName(auth.user) }}</div>
            <div class="sub">{{ ROLE_LABELS[auth.role] }}</div>
          </div>
          <span class="avatar">{{ initials(auth.user) }}</span>
        </div>
      </header>

      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
}
.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: var(--sidebar-w);
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 16px 12px;
  z-index: 50;
  transition: transform 0.2s ease;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px 20px;
}
.brand-logo {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.brand-name {
  font-weight: 700;
  font-size: 16px;
}
.brand-sub {
  font-size: 12px;
  color: var(--text-muted);
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-weight: 500;
  border: none;
  background: none;
  font: inherit;
  cursor: pointer;
  width: 100%;
  text-align: left;
}
.nav-item:hover {
  background: var(--surface-2);
  color: var(--text);
}
.nav-item.active {
  background: var(--primary-soft);
  color: var(--primary);
}
.sidebar-foot {
  border-top: 1px solid var(--border);
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.main {
  margin-left: var(--sidebar-w);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.topbar {
  height: 60px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 24px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 40;
}
.who {
  text-align: right;
}
.who .name {
  font-weight: 600;
  font-size: 13px;
}
.who .sub {
  font-size: 12px;
  color: var(--text-muted);
}
.content {
  padding: 24px;
  width: 100%;
  max-width: 1280px;
}
.menu-btn,
.backdrop {
  display: none;
}

@media (max-width: 900px) {
  .sidebar {
    transform: translateX(-100%);
  }
  .shell.open .sidebar {
    transform: none;
    box-shadow: var(--shadow-lg);
  }
  .shell.open .backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    z-index: 45;
  }
  .main {
    margin-left: 0;
  }
  .menu-btn {
    display: inline-flex;
  }
  .topbar {
    padding: 0 16px;
  }
  .content {
    padding: 16px;
  }
}
@media (max-width: 480px) {
  .who {
    display: none;
  }
}
</style>
