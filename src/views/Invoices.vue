<template>
  <div class="invoices-page">
    <h1 class="page-title">Счета</h1>
    
    <!-- Статистика -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon-wrapper blue">
          <FileText :size="24" />
        </div>
        <div class="stat-content">
          <div class="stat-label">Всего счетов</div>
          <div class="stat-value">{{ invoices.length }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrapper yellow">
          <Clock :size="24" />
        </div>
        <div class="stat-content">
          <div class="stat-label">Черновики</div>
          <div class="stat-value">{{ draftCount }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrapper green">
          <CheckCircle :size="24" />
        </div>
        <div class="stat-content">
          <div class="stat-label">Оплачено</div>
          <div class="stat-value">{{ paidCount }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrapper purple">
          <DollarSign :size="24" />
        </div>
        <div class="stat-content">
          <div class="stat-label">Сумма</div>
          <div class="stat-value">{{ formatCurrency(totalAmount) }}</div>
        </div>
      </div>
    </div>

    <!-- Панель действий -->
    <div class="actions-panel">
      <div class="action-left">
        <Dropdown
          v-model="selectedYear"
          :options="years"
          placeholder="Год"
          class="year-select"
        />
        <Dropdown
          v-model="selectedMonth"
          :options="months"
          optionLabel="name"
          optionValue="value"
          placeholder="Месяц"
          class="month-select"
        />
      </div>
    </div>
    
    <!-- Таблица -->
    <Card class="table-card">
      <template #content>
        <DataTable 
          :value="filteredInvoices" 
          :loading="loading"
          :paginator="true"
          :rows="20"
          responsiveLayout="scroll"
          emptyMessage="Нет счетов"
          size="small"
          class="invoices-table"
        >
          <Column header="№" style="width: 60px">
            <template #body="{ data }">
              <span class="invoice-number">#{{ data.id }}</span>
            </template>
          </Column>
          <Column field="account.name" header="Аккаунт" />
          <Column field="period" header="Период" style="width: 120px">
            <template #body="{ data }">
              <span class="period-cell">{{ formatPeriod(data.period) }}</span>
            </template>
          </Column>
          <Column field="total_amount" header="Сумма" style="width: 150px">
            <template #body="{ data }">
              <span class="amount-cell">{{ formatCurrency(data.total_amount) }} {{ data.currency }}</span>
            </template>
          </Column>
          <Column field="status" header="Статус" style="width: 80px; text-align: center">
            <template #body="{ data }">
              <div 
                v-tooltip.top="getStatusLabel(data.status)"
                class="status-icon-wrapper"
                :class="getStatusClass(data.status)"
              >
                <component :is="getStatusIcon(data.status)" :size="20" />
              </div>
            </template>
          </Column>
          <Column field="created_at" header="Создан" style="width: 100px">
            <template #body="{ data }">
              <span class="date-cell">{{ formatDate(data.created_at) }}</span>
            </template>
          </Column>
          <Column header="Действия" style="width: 150px">
            <template #body="{ data }">
              <div class="action-buttons">
                <Button 
                  icon="pi pi-eye" 
                  text 
                  rounded 
                  severity="info"
                  size="small"
                  @click="viewInvoice(data)"
                  v-tooltip="'Просмотр'"
                />
                <Button 
                  icon="pi pi-file-pdf" 
                  text 
                  rounded 
                  severity="secondary"
                  size="small"
                  @click="downloadPdf(data)"
                  v-tooltip="'Скачать PDF'"
                />
                <Button 
                  v-if="data.status === 'draft'"
                  icon="pi pi-send"
                  text 
                  rounded 
                  severity="warning"
                  size="small"
                  @click="sendInvoice(data)"
                  v-tooltip="'Отправить'"
                />
                <Button 
                  v-if="data.status !== 'paid'"
                  icon="pi pi-check"
                  text 
                  rounded 
                  severity="success"
                  size="small"
                  @click="markAsPaid(data)"
                  v-tooltip="'Отметить оплаченным'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Диалог просмотра счёта -->
    <Dialog v-model:visible="viewDialog" header="Детали счёта" :style="{ width: '600px' }" modal>
      <div v-if="selectedInvoice" class="invoice-details">
        <div class="detail-header">
          <h3>Счёт #{{ selectedInvoice.id }}</h3>
          <Tag :value="getStatusLabel(selectedInvoice.status)" :severity="getStatusSeverity(selectedInvoice.status)" />
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Аккаунт:</span>
          <span class="detail-value">{{ selectedInvoice.account?.name }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Период:</span>
          <span class="detail-value">{{ formatPeriod(selectedInvoice.period) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Создан:</span>
          <span class="detail-value">{{ formatDate(selectedInvoice.created_at) }}</span>
        </div>

        <h4>Детализация</h4>
        <DataTable :value="selectedInvoice.lines || []" size="small" class="lines-table">
          <Column field="module_name" header="Услуга" />
          <Column field="quantity" header="Кол-во" style="width: 80px">
            <template #body="{ data }">
              <span>{{ data.pricing_type === 'fixed' ? '—' : data.quantity.toFixed(1) }}</span>
            </template>
          </Column>
          <Column field="unit_price" header="Цена" style="width: 100px">
            <template #body="{ data }">
              <span>{{ formatCurrency(data.unit_price) }} {{ data.currency }}</span>
            </template>
          </Column>
          <Column field="total_price" header="Итого" style="width: 100px">
            <template #body="{ data }">
              <span class="total-price">{{ formatCurrency(data.total_price) }} {{ data.currency }}</span>
            </template>
          </Column>
        </DataTable>

        <div class="invoice-total">
          <span>Итого:</span>
          <strong>{{ formatCurrency(selectedInvoice.total_amount) }} {{ selectedInvoice.currency }}</strong>
        </div>
      </div>
    </Dialog>

    <!-- Диалог удаления всех счетов -->
    <Dialog v-model:visible="clearDialog" header="Удаление всех счетов" :style="{ width: '480px' }" modal>
      <div class="clear-dialog-content">
        <div class="warning-alert">
          <i class="pi pi-exclamation-triangle warning-icon"></i>
          <span>Это действие удалит <strong>ВСЕ</strong> счета ({{ invoices.length }} шт.). Это необратимо!</span>
        </div>
        <div class="confirm-code-section">
          <label for="confirmCode">Введите код подтверждения:</label>
          <InputText 
            id="confirmCode"
            v-model="confirmCode" 
            placeholder="Код подтверждения"
            class="confirm-input"
          />
        </div>
      </div>
      <template #footer>
        <Button label="Отмена" severity="secondary" text @click="clearDialog = false" />
        <Button 
          label="Удалить всё" 
          severity="danger" 
          icon="pi pi-trash"
          :loading="clearing"
          @click="clearAllInvoicesClick"
        />
      </template>
    </Dialog>

    <!-- Диалог генерации счетов за выбранный месяц -->
    <Dialog 
      v-model:visible="generateDialog" 
      header="Генерация счетов" 
      :style="{ width: '440px' }" 
      modal
    >
      <div class="generate-form">
        <div class="generate-info">
          <i class="pi pi-info-circle info-icon"></i>
          <span>Выберите период для генерации счетов. Доступны только <strong>завершённые</strong> месяцы.</span>
        </div>
        <div class="generate-selectors">
          <div class="form-field">
            <label>Год</label>
            <Dropdown
              v-model="genYear"
              :options="years"
              placeholder="Год"
              class="gen-select"
              @change="onGenYearChange"
            />
          </div>
          <div class="form-field">
            <label>Месяц</label>
            <Dropdown
              v-model="genMonth"
              :options="availableMonths"
              optionLabel="name"
              optionValue="value"
              placeholder="Месяц"
              class="gen-select"
              :disabled="availableMonths.length === 0"
            />
          </div>
        </div>
        <div class="form-field" style="margin-top: 0.75rem">
          <label>Аккаунт <span style="color: var(--text-color-secondary); font-weight: 400">(необязательно)</span></label>
          <Dropdown
            v-model="genAccountId"
            :options="billingAccounts"
            optionLabel="name"
            optionValue="id"
            placeholder="Все аккаунты"
            class="gen-select"
            showClear
            filter
            filterPlaceholder="Поиск..."
          />
        </div>
        <div v-if="genYear && genMonth" class="selected-period">
          <CalendarDays :size="18" class="period-icon" />
          <span>Период: <strong>{{ getMonthName(genMonth) }} {{ genYear }}</strong></span>
          <span v-if="genAccountId" style="margin-left: 0.5rem; color: var(--text-color-secondary)"> · {{ billingAccounts.find(a => a.id === genAccountId)?.name }}</span>
        </div>
      </div>
      <template #footer>
        <Button label="Отмена" severity="secondary" text @click="generateDialog = false" />
        <Button 
          label="Сгенерировать" 
          icon="pi pi-file-export" 
          :loading="generating"
          :disabled="!genYear || !genMonth"
          @click="generateFromDialog"
        />
      </template>
    </Dialog>

    <!-- FAB (Floating Action Button) -->
    <div class="fab-container">
      <transition name="fab-actions">
        <div v-if="fabOpen" class="fab-actions">
          <div class="fab-action" @click="fabOpen = false; openClearDialog()">
            <span class="fab-action-label">Удалить все</span>
            <button class="fab-action-btn fab-danger">
              <Trash2 :size="20" />
            </button>
          </div>
          <div class="fab-action" @click="fabOpen = false; openGenerateDialog()">
            <span class="fab-action-label">Сгенерировать счета</span>
            <button class="fab-action-btn fab-success">
              <FileText :size="20" />
            </button>
          </div>
        </div>
      </transition>
      <button 
        class="fab-main" 
        :class="{ 'fab-active': fabOpen }"
        @click="fabOpen = !fabOpen"
      >
        <Plus :size="24" class="fab-icon" />
      </button>
      <transition name="fab-overlay">
        <div v-if="fabOpen" class="fab-overlay" @click="fabOpen = false" />
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getInvoices, generateInvoices, updateInvoiceStatus, clearAllInvoices, getSelectedAccounts } from '@/services/api'
import { FileText, Clock, CheckCircle, DollarSign, Plus, Trash2, CalendarDays, Send, AlertCircle } from 'lucide-vue-next'
import { useToast } from 'primevue/usetoast'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'

const toast = useToast()
const invoices = ref([])
const loading = ref(false)
const generating = ref(false)
const clearing = ref(false)
const viewDialog = ref(false)
const clearDialog = ref(false)
const selectedInvoice = ref(null)
const confirmCode = ref('')

// FAB
const fabOpen = ref(false)

// Диалог генерации
const generateDialog = ref(false)
const genYear = ref(null)
const genMonth = ref(null)
const genAccountId = ref(null)
const billingAccounts = ref([])

// Фильтры
const now = new Date()
const selectedYear = ref(now.getFullYear())
const selectedMonth = ref(now.getMonth() + 1)

const years = computed(() => {
  const result = []
  for (let y = now.getFullYear(); y >= 2024; y--) {
    result.push(y)
  }
  return result
})

const monthNames = [
  { name: 'Январь', value: 1 },
  { name: 'Февраль', value: 2 },
  { name: 'Март', value: 3 },
  { name: 'Апрель', value: 4 },
  { name: 'Май', value: 5 },
  { name: 'Июнь', value: 6 },
  { name: 'Июль', value: 7 },
  { name: 'Август', value: 8 },
  { name: 'Сентябрь', value: 9 },
  { name: 'Октябрь', value: 10 },
  { name: 'Ноябрь', value: 11 },
  { name: 'Декабрь', value: 12 },
]

const months = [
  { name: 'Январь', value: 1 },
  { name: 'Февраль', value: 2 },
  { name: 'Март', value: 3 },
  { name: 'Апрель', value: 4 },
  { name: 'Май', value: 5 },
  { name: 'Июнь', value: 6 },
  { name: 'Июль', value: 7 },
  { name: 'Август', value: 8 },
  { name: 'Сентябрь', value: 9 },
  { name: 'Октябрь', value: 10 },
  { name: 'Ноябрь', value: 11 },
  { name: 'Декабрь', value: 12 },
]

// Доступные месяцы для генерации (только завершённые)
const availableMonths = computed(() => {
  if (!genYear.value) return []
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  
  return monthNames.filter(m => {
    // Если выбранный год < текущего — все месяцы доступны
    if (genYear.value < currentYear) return true
    // Если выбранный год = текущему — только прошедшие месяцы
    if (genYear.value === currentYear) return m.value < currentMonth
    // Если будущий год — ничего не доступно
    return false
  })
})

const getMonthName = (value) => {
  const m = monthNames.find(m => m.value === value)
  return m ? m.name : ''
}

const onGenYearChange = () => {
  // Сбрасываем месяц если он стал недоступен
  if (genMonth.value && !availableMonths.value.find(m => m.value === genMonth.value)) {
    genMonth.value = null
  }
}

const openGenerateDialog = async () => {
  // По умолчанию выбираем предыдущий месяц
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  genYear.value = prev.getFullYear()
  genMonth.value = prev.getMonth() + 1
  genAccountId.value = null
  generateDialog.value = true

  // Загружаем список аккаунтов
  try {
    const { data } = await getSelectedAccounts()
    billingAccounts.value = data || []
  } catch (e) {
    billingAccounts.value = []
  }
}

const generateFromDialog = async () => {
  if (!genYear.value || !genMonth.value) return
  
  generating.value = true
  try {
    const { data } = await generateInvoices(genYear.value, genMonth.value, genAccountId.value)
    toast.add({ 
      severity: 'success', 
      summary: 'Готово', 
      detail: `Создано ${data.count} счетов за ${getMonthName(genMonth.value)} ${genYear.value}`, 
      life: 3000 
    })
    // Переключаем фильтры на сгенерированный период
    selectedYear.value = genYear.value
    selectedMonth.value = genMonth.value
    generateDialog.value = false
    await loadInvoices()
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Ошибка', 
      detail: error.response?.data?.error || 'Ошибка генерации', 
      life: 3000 
    })
  } finally {
    generating.value = false
  }
}

// Статистика
const draftCount = computed(() => invoices.value.filter(i => i.status === 'draft').length)
const paidCount = computed(() => invoices.value.filter(i => i.status === 'paid').length)
const totalAmount = computed(() => invoices.value.reduce((sum, i) => sum + (i.total_amount || 0), 0))

const filteredInvoices = computed(() => {
  return invoices.value.filter(i => {
    const period = new Date(i.period)
    return period.getFullYear() === selectedYear.value && (period.getMonth() + 1) === selectedMonth.value
  })
})

const loadInvoices = async () => {
  loading.value = true
  try {
    const { data } = await getInvoices()
    invoices.value = data || []
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Не удалось загрузить счета', life: 3000 })
  } finally {
    loading.value = false
  }
}

const generateInvoicesClick = async () => {
  generating.value = true
  try {
    const { data } = await generateInvoices(selectedYear.value, selectedMonth.value)
    toast.add({ severity: 'success', summary: 'Готово', detail: `Создано ${data.count} счетов`, life: 3000 })
    await loadInvoices()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: error.response?.data?.error || 'Ошибка генерации', life: 3000 })
  } finally {
    generating.value = false
  }
}

const viewInvoice = (invoice) => {
  selectedInvoice.value = invoice
  viewDialog.value = true
}

const downloadPdf = async (invoice) => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/invoices/${invoice.id}/pdf`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (!response.ok) throw new Error('Ошибка загрузки PDF')
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice_${invoice.id}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Не удалось скачать PDF', life: 3000 })
  }
}

const sendInvoice = async (invoice) => {
  try {
    await updateInvoiceStatus(invoice.id, 'sent')
    toast.add({ severity: 'success', summary: 'Отправлено', detail: 'Статус изменён на "Отправлен"', life: 3000 })
    await loadInvoices()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Не удалось обновить статус', life: 3000 })
  }
}

const markAsPaid = async (invoice) => {
  try {
    await updateInvoiceStatus(invoice.id, 'paid')
    toast.add({ severity: 'success', summary: 'Оплачено', detail: 'Счёт отмечен как оплаченный', life: 3000 })
    await loadInvoices()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Не удалось обновить статус', life: 3000 })
  }
}

const getStatusLabel = (status) => {
  const labels = { draft: 'Черновик', sent: 'Отправлен', paid: 'Оплачен', overdue: 'Просрочен' }
  return labels[status] || status
}

const getStatusIcon = (status) => {
  const icons = {
    draft: FileText,
    sent: Send,
    paid: CheckCircle,
    overdue: AlertCircle
  }
  return icons[status] || FileText
}

const getStatusClass = (status) => {
  const classes = {
    draft: 'status-icon-draft',
    sent: 'status-icon-sent',
    paid: 'status-icon-paid',
    overdue: 'status-icon-overdue'
  }
  return classes[status] || ''
}

const getStatusSeverity = (status) => {
  const severities = { draft: 'secondary', sent: 'warning', paid: 'success', overdue: 'danger' }
  return severities[status] || 'info'
}

const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('ru-RU')
}

const formatPeriod = (date) => {
  if (!date) return '—'
  const d = new Date(date)
  return d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }).replace(' г.', '')
}

const formatCurrency = (value) => {
  if (value == null) return '0'
  return value.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const openClearDialog = () => {
  confirmCode.value = ''
  clearDialog.value = true
}

const clearAllInvoicesClick = async () => {
  if (!confirmCode.value) {
    toast.add({ severity: 'warn', summary: 'Внимание', detail: 'Введите код подтверждения', life: 3000 })
    return
  }

  clearing.value = true
  try {
    const { data } = await clearAllInvoices(confirmCode.value)
    toast.add({ severity: 'success', summary: 'Готово', detail: `Удалено ${data.count} счетов`, life: 3000 })
    clearDialog.value = false
    confirmCode.value = ''
    await loadInvoices()
  } catch (error) {
    const message = error.response?.data?.error || 'Ошибка удаления'
    toast.add({ severity: 'error', summary: 'Ошибка', detail: message, life: 3000 })
  } finally {
    clearing.value = false
  }
}

onMounted(() => {
  loadInvoices()
})
</script>

<style scoped>
.invoices-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.025em;
}

/* Статистика */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.stat-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.stat-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon-wrapper.blue {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.2));
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.stat-icon-wrapper.yellow {
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.1), rgba(234, 179, 8, 0.2));
  color: #eab308;
  border: 1px solid rgba(234, 179, 8, 0.2);
}

.stat-icon-wrapper.green {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.2));
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.stat-icon-wrapper.purple {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(168, 85, 247, 0.2));
  color: #a855f7;
  border: 1px solid rgba(168, 85, 247, 0.2);
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
}

/* Панель действий */
.actions-panel {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.action-left {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.year-select {
  width: 130px;
}

.month-select {
  width: 150px;
}

/* Таблица */
.table-card {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--surface-border);
}

.invoices-table {
  font-size: 0.95rem;
}

.invoice-number {
  font-weight: 600;
  color: var(--primary-color);
}

.period-cell {
  text-transform: capitalize;
  white-space: nowrap;
}

.amount-cell {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.date-cell {
  color: var(--text-color-secondary);
  font-variant-numeric: tabular-nums;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

/* Диалог просмотра */
.invoice-details h3 {
  margin: 0;
}

.invoice-details h4 {
  margin: 1.5rem 0 1rem;
  font-size: 1rem;
  color: var(--text-color-secondary);
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--surface-border);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.detail-label {
  color: var(--text-color-secondary);
}

.detail-value {
  font-weight: 500;
}

.lines-table {
  margin-top: 0.5rem;
}

.total-price {
  font-weight: 600;
}

.invoice-total {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);
  font-size: 1.25rem;
}

/* Иконки статусов */
.status-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  transition: all 0.2s;
}

.status-icon-wrapper:hover {
  transform: scale(1.1);
}

.status-icon-draft {
  color: var(--text-color-secondary);
  background: var(--surface-ground);
}

.status-icon-sent {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.status-icon-paid {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

.status-icon-overdue {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Адаптивность */
@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  .actions-panel {
    flex-direction: column;
    align-items: stretch;
  }
  
  .action-left {
    flex-direction: column;
  }
  
  .year-select, .month-select {
    width: 100%;
  }
}

/* Диалог удаления */
.clear-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.warning-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(234, 179, 8, 0.15);
  border: 1px solid rgba(234, 179, 8, 0.4);
  border-left: 4px solid #eab308;
  border-radius: 8px;
  color: #eab308;
}

.warning-alert .warning-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.warning-alert span {
  font-size: 0.95rem;
  line-height: 1.5;
}

.warning-alert strong {
  color: inherit;
}

.confirm-code-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.confirm-code-section label {
  font-size: 0.95rem;
  color: var(--text-color);
}

.confirm-input {
  width: 100%;
}

.action-right {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

/* === FAB === */
.fab-container {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.fab-main {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  border: none;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1002;
}

.fab-main:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 28px rgba(59, 130, 246, 0.5);
}

.fab-main.fab-active {
  background: linear-gradient(135deg, #64748b, #475569);
  box-shadow: 0 4px 20px rgba(100, 116, 139, 0.4);
}

.fab-icon {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fab-active .fab-icon {
  transform: rotate(45deg);
}

.fab-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
  z-index: 1002;
}

.fab-action {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  animation: fabSlideUp 0.2s ease-out both;
}

.fab-action:nth-child(1) { animation-delay: 0.05s; }
.fab-action:nth-child(2) { animation-delay: 0.1s; }

@keyframes fabSlideUp {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.fab-action-label {
  background: var(--surface-card, #1e293b);
  color: var(--text-color, #e2e8f0);
  padding: 0.5rem 0.85rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 2px 12px rgba(0,0,0,0.2);
  pointer-events: none;
}

.fab-action-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 12px rgba(0,0,0,0.15);
}

.fab-action-btn:hover {
  transform: scale(1.1);
}

.fab-success {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.fab-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.fab-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.3);
  z-index: 1001;
  backdrop-filter: blur(2px);
}

/* Анимации FAB */
.fab-actions-enter-active {
  transition: all 0.2s ease-out;
}
.fab-actions-leave-active {
  transition: all 0.15s ease-in;
}
.fab-actions-enter-from,
.fab-actions-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.fab-overlay-enter-active {
  transition: opacity 0.2s ease;
}
.fab-overlay-leave-active {
  transition: opacity 0.15s ease;
}
.fab-overlay-enter-from,
.fab-overlay-leave-to {
  opacity: 0;
}

/* === Диалог генерации === */
.generate-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.generate-info {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-left: 4px solid #3b82f6;
  border-radius: 8px;
  color: #93c5fd;
  font-size: 0.9rem;
  line-height: 1.5;
}

.generate-info .info-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
  margin-top: 2px;
  color: #3b82f6;
}

.generate-selectors {
  display: flex;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.form-field label {
  font-weight: 500;
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.gen-select {
  width: 100%;
}

.selected-period {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1rem;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.25);
  border-radius: 10px;
  color: #86efac;
  font-size: 0.95rem;
}

.selected-period .period-icon {
  color: #22c55e;
  flex-shrink: 0;
}
</style>
