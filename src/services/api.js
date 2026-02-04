import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
    timeout: 300000, // 5 минут для длительных операций (синхронизация)
    headers: {
        'Content-Type': 'application/json'
    }
})

// Request interceptor для добавления токена
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor для обработки ошибок
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default api

// === API методы ===

// Accounts
export const getAccounts = () => api.get('/accounts')
export const getSelectedAccounts = () => api.get('/accounts/selected')
export const toggleAccount = (id) => api.put(`/accounts/${id}/toggle`)
export const updateAccountDetails = (id, data) => api.put(`/accounts/${id}/details`, data)
export const assignModule = (accountId, moduleId) =>
    api.post(`/accounts/${accountId}/modules`, { module_id: moduleId })

// Modules
export const getModules = () => api.get('/modules')
export const createModule = (data) => api.post('/modules', data)
export const updateModule = (id, data) => api.put(`/modules/${id}`, data)
export const deleteModule = (id) => api.delete(`/modules/${id}`)

// Settings
export const getSettings = () => api.get('/settings')
export const updateSettings = (data) => api.put('/settings', data)

// Exchange Rates
export const getExchangeRates = () => api.get('/exchange-rates')

// Dashboard
export const getDashboard = (year, month) => api.get('/dashboard', { params: { year, month } })

// Snapshots
export const getSnapshots = () => api.get('/snapshots')
export const createSnapshotsForDate = (date) => api.post('/snapshots/date', { date })
export const createSnapshot = (accountId) => api.post('/snapshots', { account_id: accountId })
export const clearAllSnapshots = (confirmCode) => api.delete('/snapshots/clear', { data: { confirm_code: confirmCode } })

// Changes
export const getChanges = () => api.get('/changes')

// Sync
export const syncAccounts = () => api.post('/accounts/sync')

// Account Stats (Wialon Statistics API)
export const getAccountStats = (id, year, month) => api.get(`/accounts/${id}/stats`, { params: { year, month } })
export const getAccountHistory = (id, days = 30) => api.get(`/accounts/${id}/history`, { params: { days } })

// Wialon Connections
export const getConnections = () => api.get('/connections')
export const createConnection = (data) => api.post('/connections', data)
export const updateConnection = (id, data) => api.put(`/connections/${id}`, data)
export const deleteConnection = (id) => api.delete(`/connections/${id}`)
export const testConnection = (id) => api.post(`/connections/${id}/test`)

// Invoices (Счета)
export const getInvoices = () => api.get('/invoices')
export const getInvoice = (id) => api.get(`/invoices/${id}`)
export const generateInvoices = (year, month) => api.post('/invoices/generate', { year, month })
export const updateInvoiceStatus = (id, status) => api.put(`/invoices/${id}/status`, { status })

// Массовая привязка модулей
export const assignModuleBulk = (moduleId, accountIds) =>
    api.post(`/modules/${moduleId}/assign-bulk`, { account_ids: accountIds })
export const unassignModuleBulk = (moduleId, accountIds) =>
    api.post(`/modules/${moduleId}/unassign-bulk`, { account_ids: accountIds })

// Массовая установка валюты
export const setCurrencyBulk = (accountIds, currency) =>
    api.post('/accounts/set-currency-bulk', { account_ids: accountIds, currency })

// === AI Analytics ===

// Настройки AI
export const getAISettings = () => api.get('/ai/settings')
export const updateAISettings = (data) => api.put('/ai/settings', data)

// Инсайты
export const getAIInsights = () => api.get('/ai/insights')
export const getAccountAIInsights = (accountId) => api.get(`/ai/insights/account/${accountId}`)
export const sendInsightFeedback = (insightId, helpful, comment = '') =>
    api.post(`/ai/insights/${insightId}/feedback`, { helpful, comment })

// Статистика использования
export const getAIUsage = (days = 30) => api.get('/ai/usage', { params: { days } })

// Ручной запуск анализа
export const triggerAIAnalysis = () => api.post('/ai/analyze')

