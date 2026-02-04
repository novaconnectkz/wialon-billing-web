<template>
  <div class="login-container">
    <Card class="login-card">
      <template #header>
        <div class="login-header">
          <Car :size="48" style="color: var(--primary-color);" />
          <h1>Wialon Billing</h1>
          <p>Система учёта объектов</p>
        </div>
      </template>
      
      <template #content>
        <div class="login-content">
          <!-- Ошибка авторизации -->
          <Message v-if="error" severity="error" :closable="false" class="error-message">
            {{ error }}
          </Message>
          
          <!-- Шаг 1: Ввод Email -->
          <div v-if="step === 'email'" class="step-email">
            <label class="input-label">Email</label>
            <InputText 
              v-model="email"
              type="email"
              placeholder="Введите ваш email..."
              class="email-input"
              @keyup.enter="requestCode"
            />
            <Button 
              label="Получить код"
              class="submit-button"
              :loading="loading"
              :disabled="!isValidEmail"
              @click="requestCode"
            >
              <template #icon>
                <Mail :size="20" class="mr-2" />
              </template>
            </Button>
          </div>
          
          <!-- Шаг 2: Ввод OTP кода -->
          <div v-if="step === 'code'" class="step-code">
            <p class="code-hint">
              Код отправлен на <strong>{{ email }}</strong>
            </p>
            
            <label class="input-label">6-значный код</label>
            <InputText 
              v-model="code"
              placeholder="000000"
              class="code-input"
              maxlength="6"
              @keyup.enter="verifyCode"
            />
            
            <Button 
              label="Войти"
              class="submit-button"
              :loading="loading"
              :disabled="code.length !== 6"
              @click="verifyCode"
            >
              <template #icon>
                <LogIn :size="20" class="mr-2" />
              </template>
            </Button>
            
            <Button 
              label="Изменить email"
              text
              size="small"
              @click="resetToEmail"
            />
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Car, Mail, LogIn } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

// Состояние
const step = ref('email') // 'email' или 'code'
const email = ref('')
const code = ref('')
const loading = ref(false)
const error = ref('')

// Валидация email
const isValidEmail = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.value)
})

// Шаг 1: Запрос кода
const requestCode = async () => {
  if (!isValidEmail.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    await authStore.requestCode(email.value)
    step.value = 'code'
  } catch (err) {
    error.value = err.message || 'Ошибка отправки кода'
  } finally {
    loading.value = false
  }
}

// Шаг 2: Проверка кода
const verifyCode = async () => {
  if (code.value.length !== 6) return
  
  loading.value = true
  error.value = ''
  
  try {
    await authStore.verifyCode(email.value, code.value)
    router.push('/dashboard')
  } catch (err) {
    error.value = err.message || 'Неверный код'
  } finally {
    loading.value = false
  }
}

// Сброс на шаг email
const resetToEmail = () => {
  step.value = 'email'
  code.value = ''
  error.value = ''
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--surface-ground) 0%, var(--surface-section) 100%);
  padding: 1rem;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: var(--surface-card);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  padding: 2rem 2rem 1rem;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-600) 100%);
}

.login-header h1 {
  margin: 1rem 0 0.5rem;
  color: white;
  font-size: 1.5rem;
}

.login-header p {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

.login-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.error-message {
  margin-bottom: 0.5rem;
}

.input-label {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.25rem;
}

.email-input,
.code-input {
  width: 100%;
  font-size: 1rem;
}

.code-input {
  font-size: 1.5rem;
  text-align: center;
  letter-spacing: 0.5rem;
  font-family: monospace;
}

.submit-button {
  width: 100%;
  justify-content: center;
  padding: 1rem;
  font-size: 1.1rem;
  margin-top: 0.5rem;
}

.code-hint {
  text-align: center;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  margin: 0 0 1rem 0;
}

.step-email,
.step-code {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
</style>
