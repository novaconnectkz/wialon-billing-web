<template>
  <div class="app-layout">
    <!-- Боковое меню -->
    <aside v-if="isAuthenticated" class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo" v-if="!sidebarCollapsed">
          <Activity :size="28" />
          <span>Wialon Billing</span>
        </div>
        <Button 
          text 
          rounded
          class="collapse-btn"
          @click="sidebarCollapsed = !sidebarCollapsed"
        >
          <template #icon>
            <ChevronRight v-if="sidebarCollapsed" :size="20" />
            <ChevronLeft v-else :size="20" />
          </template>
        </Button>
      </div>
      
      <nav class="sidebar-nav">
        <router-link 
          v-for="item in menuItems" 
          :key="item.to" 
          :to="item.to"
          class="nav-item"
          :title="sidebarCollapsed ? item.label : ''"
        >
          <component :is="item.icon" :size="20" />
          <span v-if="!sidebarCollapsed">{{ item.label }}</span>
        </router-link>
      </nav>
      
      <div class="sidebar-footer">
        <button class="nav-item logout-btn" @click="logout" :title="sidebarCollapsed ? 'Выход' : ''">
          <LogOut :size="20" />
          <span v-if="!sidebarCollapsed">Выход</span>
        </button>
      </div>
    </aside>

    <!-- Основной контент -->
    <main class="main-content" :class="{ 'full-width': !isAuthenticated, 'collapsed': sidebarCollapsed && isAuthenticated }">
      <router-view />
    </main>

    <!-- Toast notifications -->
    <Toast position="top-right" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { 
  LayoutDashboard, 
  Settings, 
  History, 
  CalendarClock,
  Activity,
  ChevronLeft,
  ChevronRight,
  LogOut,
  BarChart3,
  FileText,
  Sparkles
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const sidebarCollapsed = ref(false)
const isAuthenticated = computed(() => authStore.isAuthenticated)
const isAdmin = computed(() => authStore.isAdmin)
const isPartner = computed(() => authStore.isPartner)

// Все пункты меню с флагами ролей
const allMenuItems = [
  { to: '/dashboard', label: 'Данные', icon: BarChart3 },
  { to: '/invoices', label: 'Счета', icon: FileText, requiresAdmin: true },
  { to: '/settings', label: 'Настройки', icon: Settings, requiresAdmin: true },
  { to: '/changes', label: 'Изменения', icon: History },
  { to: '/history', label: 'История', icon: CalendarClock, requiresAdmin: true },
  { to: '/ai-analytics', label: 'AI Аналитика', icon: Sparkles },
  { to: '/partner', label: 'Мой аккаунт', icon: LayoutDashboard, requiresPartner: true },
  { to: '/partner/invoices', label: 'Финансы', icon: FileText, requiresPartner: true },
]

// Фильтруем меню по роли
const menuItems = computed(() => {
  if (isPartner.value) {
    // Партнёр видит только партнёрские пункты
    return allMenuItems.filter(item => item.requiresPartner)
  }
  // Остальные — по flags requiresAdmin
  return allMenuItems.filter(item => !item.requiresAdmin || isAdmin.value)
    .filter(item => !item.requiresPartner)
})

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: var(--surface-ground);
}

/* Боковое меню */
.sidebar {
  width: 260px;
  background: var(--surface-card);
  border-right: 1px solid var(--surface-border);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 100;
}

.sidebar.collapsed {
  width: 70px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--surface-border);
  min-height: 64px;
}

.sidebar.collapsed .sidebar-header {
  justify-content: center;
  padding: 1rem 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--primary-color);
}

.logo i {
  font-size: 1.5rem;
}

.collapse-btn {
  color: var(--text-color-secondary);
  width: 32px;
  height: 32px;
  display: flex !important;
  align-items: center;
  justify-content: center;
}

.collapse-btn:hover {
  background: var(--surface-hover);
  color: var(--text-color);
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: 8px;
  color: var(--text-color-secondary);
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  font-size: 0.95rem;
}

.nav-item i {
  font-size: 1.25rem;
  min-width: 24px;
  text-align: center;
}

.nav-item:hover {
  background: var(--surface-hover);
  color: var(--text-color);
}

.nav-item.router-link-active {
  background: rgba(59, 130, 246, 0.15);
  color: var(--primary-color);
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 0.875rem;
}

.sidebar-footer {
  padding: 1rem 0.75rem;
  border-top: 1px solid var(--surface-border);
}

.logout-btn {
  color: var(--red-400);
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--red-400);
}

/* Основной контент */
.main-content {
  flex: 1;
  margin-left: 260px;
  padding: 1.5rem 2rem;
  transition: margin-left 0.3s ease;
  min-height: 100vh;
}

.sidebar.collapsed ~ .main-content,
.main-content.collapsed {
  margin-left: 70px;
}

.main-content.full-width {
  margin-left: 0;
}

/* Адаптивность */
@media (max-width: 768px) {
  .sidebar {
    width: 70px;
  }
  
  .sidebar .logo span,
  .sidebar .nav-item span,
  .sidebar .logout-btn span {
    display: none;
  }
  
  .sidebar .nav-item {
    justify-content: center;
    padding: 0.875rem;
  }
  
  .main-content {
    margin-left: 70px;
    padding: 1rem;
  }
}
</style>
