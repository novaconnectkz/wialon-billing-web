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
        // Дилер пытается зайти на admin-страницу — на dashboard
        next('/dashboard')
    } else if (to.path === '/login' && authStore.isAuthenticated) {
        // Уже авторизован — на dashboard
        next('/dashboard')
    } else {
        next()
    }
})

export default router

