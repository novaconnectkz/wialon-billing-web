import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem('token') || null)
    const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

    const isAuthenticated = computed(() => !!token.value)
    const isAdmin = computed(() => user.value?.is_admin || user.value?.role === 'admin' || (!user.value?.role && user.value?.is_admin !== false))
    const isDealer = computed(() => user.value?.role === 'dealer')
    const isPartner = computed(() => user.value?.role === 'partner')
    const role = computed(() => user.value?.role || 'admin')
    const dealerAccountId = computed(() => user.value?.dealer_account_id)
    const partnerAccountId = computed(() => user.value?.partner_account_id)
    const userEmail = computed(() => user.value?.email || null)

    // Шаг 1: Запрос OTP кода
    async function requestCode(email) {
        const response = await api.post('/auth/request-code', { email })
        return response.data
    }

    // Шаг 2: Проверка кода и получение JWT
    async function verifyCode(email, code) {
        const response = await api.post('/auth/verify-code', { email, code })

        // Сохраняем токен и данные пользователя
        token.value = response.data.token
        user.value = response.data.user

        localStorage.setItem('token', token.value)
        localStorage.setItem('user', JSON.stringify(user.value))

        return response.data
    }

    // Получить текущего пользователя
    async function fetchCurrentUser() {
        try {
            const response = await api.get('/auth/me')
            user.value = response.data
            localStorage.setItem('user', JSON.stringify(user.value))
            return response.data
        } catch (error) {
            // Если ошибка — сбросить авторизацию
            logout()
            throw error
        }
    }

    // Выход
    function logout() {
        token.value = null
        user.value = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')
    }

    // Вход через Wialon OAuth токен
    async function wialonLogin(accessToken) {
        const response = await api.post('/auth/wialon-login', { access_token: accessToken })

        token.value = response.data.token
        user.value = response.data.user

        localStorage.setItem('token', token.value)
        localStorage.setItem('user', JSON.stringify(user.value))

        return response.data
    }

    return {
        token,
        user,
        isAuthenticated,
        isAdmin,
        isDealer,
        isPartner,
        role,
        dealerAccountId,
        partnerAccountId,
        userEmail,
        requestCode,
        verifyCode,
        fetchCurrentUser,
        wialonLogin,
        logout
    }
})

