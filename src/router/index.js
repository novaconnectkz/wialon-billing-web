import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/Login.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/auth/callback',
        name: 'AuthCallback',
        component: () => import('@/views/AuthCallback.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/',
        redirect: '/dashboard'
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/changes',
        name: 'Changes',
        component: () => import('@/views/Changes.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/history',
        name: 'History',
        component: () => import('@/views/History.vue'),
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/invoices',
        name: 'Invoices',
        component: () => import('@/views/Invoices.vue'),
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/ai-analytics',
        name: 'AiAnalytics',
        component: () => import('@/views/AiAnalytics.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/partner',
        name: 'PartnerDashboard',
        component: () => import('@/views/PartnerDashboard.vue'),
        meta: { requiresAuth: true, requiresPartner: true }
    },
    {
        path: '/partner/invoices',
        name: 'PartnerInvoices',
        component: () => import('@/views/PartnerInvoices.vue'),
        meta: { requiresAuth: true, requiresPartner: true }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// Навигационный guard
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        // Не авторизован — на логин
        next('/login')
    } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
        // Не-админ пытается зайти на admin-страницу
        if (authStore.isPartner) {
            next('/partner')
        } else {
            next('/dashboard')
        }
    } else if (to.meta.requiresPartner && !authStore.isPartner) {
        // Не-партнёр пытается зайти на partner-страницу
        next('/dashboard')
    } else if (to.path === '/login' && authStore.isAuthenticated) {
        // Уже авторизован — на соответствующую страницу
        if (authStore.isPartner) {
            next('/partner')
        } else {
            next('/dashboard')
        }
    } else {
        next()
    }
})

export default router

