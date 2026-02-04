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
      <div class="action-right">
        <Button 
          label="Удалить все" 
          icon="pi pi-trash" 
          severity="danger"
          outlined
          @click="openClearDialog"
          :disabled="invoices.length === 0"
        />
        <Button 
          label="Сгенерировать счета" 
          icon="pi pi-plus" 
          :loading="generating"
          @click="generateInvoicesClick"
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
          <Column field="status" header="Статус" style="width: 130px">
            <template #body="{ data }">
              <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" />
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
              <span>{{ data.unit_price }} {{ data.currency }}</span>
            </template>
          </Column>
          <Column field="total_price" header="Итого" style="width: 100px">
            <template #body="{ data }">
              <span class="total-price">{{ data.total_price.toFixed(2) }} {{ data.currency }}</span>
            </template>
          </Column>
        </DataTable>

        <div class="invoice-total">
          <span>Итого:</span>
          <strong>{{ selectedInvoice.total_amount.toFixed(2) }} {{ selectedInvoice.currency }}</strong>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getInvoices, generateInvoices, updateInvoiceStatus, clearAllInvoices } from '@/services/api'
import { FileText, Clock, CheckCircle, DollarSign } from 'lucide-vue-next'
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
  return d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
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
</style>
