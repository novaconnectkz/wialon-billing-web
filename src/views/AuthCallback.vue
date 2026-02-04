<template>
  <div class="auth-callback">
    <div class="loading-container">
      <i class="pi pi-spin pi-spinner"></i>
      <p>{{ status }}</p>
      
      <!-- Debug info -->
      <div v-if="debugInfo" class="debug-info">
        <pre>{{ debugInfo }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const status = ref('Авторизация...')
const debugInfo = ref('')

onMounted(() => {
  // Wialon возвращает токен в разных форматах:
  // 1. В URL hash: #access_token=TOKEN&user_name=...
  // 2. Просто токен в hash: #TOKEN
  // 3. В query string: ?access_token=TOKEN
  
  const hash = window.location.hash.substring(1)
  const query = window.location.search.substring(1)
  
  console.log('AuthCallback - hash:', hash)
  console.log('AuthCallback - query:', query)
  console.log('AuthCallback - full URL:', window.location.href)
  
  let accessToken = null
  let userName = null
  
  // Попробуем разные форматы
  
  // 1. Hash как URL params: #access_token=TOKEN&...
  if (hash) {
    const hashParams = new URLSearchParams(hash)
    accessToken = hashParams.get('access_token')
    userName = hashParams.get('user_name')
    
    // 2. Hash просто токен (64 символа hex)
    if (!accessToken && hash.match(/^[a-f0-9]{64}$/i)) {
      accessToken = hash
    }
    
    // 3. Hash — это JSON с токеном
    if (!accessToken) {
      try {
        const decoded = decodeURIComponent(hash)
        const json = JSON.parse(decoded)
        accessToken = json.access_token || json.token
      } catch (e) {
        // Не JSON
      }
    }
  }
  
  // 4. Query string: ?access_token=TOKEN
  if (!accessToken && query) {
    const queryParams = new URLSearchParams(query)
    accessToken = queryParams.get('access_token')
    userName = queryParams.get('user_name')
  }
  
  debugInfo.value = JSON.stringify({
    hash,
    query,
    accessToken: accessToken ? accessToken.substring(0, 20) + '...' : null,
    userName
  }, null, 2)
  
  if (accessToken) {
    status.value = 'Токен получен, переход...'
    
    // Сохраняем токен
    authStore.setToken(accessToken, userName)
    
    // Небольшая задержка для отображения статуса
    setTimeout(() => {
      router.replace('/dashboard')
    }, 500)
  } else {
    status.value = 'Ошибка получения токена'
    
    // Показываем debug на 3 секунды, потом редирект
    setTimeout(() => {
      router.replace('/login?error=' + encodeURIComponent('Не удалось получить токен от Wialon'))
    }, 3000)
  }
})
</script>

<style scoped>
.auth-callback {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--surface-ground);
}

.loading-container {
  text-align: center;
  padding: 2rem;
}

.loading-container i {
  font-size: 3rem;
  color: var(--primary-color);
}

.loading-container p {
  margin-top: 1rem;
  color: var(--text-color-secondary);
}

.debug-info {
  margin-top: 2rem;
  background: var(--surface-card);
  padding: 1rem;
  border-radius: 0.5rem;
  text-align: left;
  max-width: 600px;
  overflow-x: auto;
}

.debug-info pre {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-color);
}
</style>
