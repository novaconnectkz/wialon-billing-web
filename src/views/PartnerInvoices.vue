<template>
  <div class="partner-invoices">
    <div class="page-header">
      <div>
        <h1 class="page-title">Финансы</h1>
        <p class="page-subtitle">Счета и финансовая сводка</p>
      </div>
    </div>

    <!-- Финансовые карточки -->
    <div v-if="balance" class="stats-grid">
      <div class="stat-card stat-card--balance">
        <div class="stat-icon"><Wallet :size="24" /></div>
        <div class="stat-content">
          <span class="stat-label">Текущий месяц</span>
          <span class="stat-value">{{ formatMoney(balance.current_month_total) }} <small class="currency-tag">EUR</small></span>
        </div>
      </div>
      <div class="stat-card stat-card--invoiced">
        <div class="stat-icon"><FileText :size="24" /></div>
        <div class="stat-content">
          <span class="stat-label">Всего выставлено</span>
          <span class="stat-value">{{ formatMoney(balance.total_invoiced) }} <small class="currency-tag">{{ accountCurrency }}</small></span>
        </div>
      </div>
      <div class="stat-card stat-card--paid">
        <div class="stat-icon"><CheckCircle :size="24" /></div>
        <div class="stat-content">
          <span class="stat-label">Оплачено</span>
          <span class="stat-value stat-value--success">{{ formatMoney(balance.total_paid) }} <small class="currency-tag">{{ accountCurrency }}</small></span>
        </div>
      </div>
      <div class="stat-card stat-card--outstanding">
        <div class="stat-icon"><Clock :size="24" /></div>
        <div class="stat-content">
          <span class="stat-label">К оплате</span>
          <span class="stat-value" :class="{ 'stat-value--warning': (balance.outstanding_balance || 0) > 0 }">
            {{ formatMoney(balance.outstanding_balance) }} <small class="currency-tag">{{ accountCurrency }}</small>
          </span>
        </div>
      </div>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="loading-state">
      <ProgressSpinner />
      <p>Загрузка счетов...</p>
    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="error-state">
      <AlertCircle :size="48" />
      <p>{{ error }}</p>
      <Button label="Повторить" @click="loadInvoices" outlined />
    </div>

    <!-- Пустой список -->
    <div v-else-if="invoices.length === 0" class="empty-state">
      <FileText :size="48" />
      <p>Счета ещё не выставлены</p>
    </div>

    <!-- Таблица счетов -->
    <div v-else class="invoices-card">
      <table class="invoices-table">
        <thead>
          <tr>
            <th>№ счёта</th>
            <th>Дата</th>
            <th>Период</th>
            <th>Сумма</th>
            <th class="text-center">Валюта</th>
            <th class="text-center">Статус</th>
            <th class="text-center">Скачать</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="inv in invoices" :key="inv.ID || inv.id">
            <td class="td-number">{{ inv.InvoiceNumber || inv.invoice_number || inv.ID || inv.id }}</td>
            <td class="td-date">{{ formatDate(inv.CreatedAt || inv.created_at) }}</td>
            <td>{{ formatPeriod(inv.Period || inv.period) }}</td>
            <td class="td-amount">{{ formatMoney(inv.TotalAmount || inv.total_amount) }}</td>
            <td class="text-center">{{ inv.Currency || inv.currency }}</td>
            <td class="text-center">
              <CheckCircle v-if="(inv.Status || inv.status) === 'paid'" :size="20" class="status-icon status-icon--paid" title="Оплачено" />
              <Clock v-else :size="20" class="status-icon status-icon--unpaid" title="Не оплачено" />
            </td>
            <td class="text-center">
              <button
                class="download-btn"
                @click="downloadPDF(inv.ID || inv.id)"
                :disabled="downloadingId === (inv.ID || inv.id)"
                title="Скачать PDF"
              >
                <Download v-if="downloadingId !== (inv.ID || inv.id)" :size="18" />
                <ProgressSpinner v-else style="width: 18px; height: 18px" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getPartnerInvoices, getPartnerInvoicePDF, getPartnerBalance, getPartnerAccount } from '@/services/api'
import { FileText, AlertCircle, Download, Wallet, CheckCircle, Clock } from 'lucide-vue-next'

const loading = ref(true)
const error = ref(null)
const invoices = ref([])
const balance = ref(null)
const account = ref(null)
const downloadingId = ref(null)

const accountCurrency = computed(() => {
  return account.value?.BillingCurrency || account.value?.billing_currency || 'KZT'
})

const monthNames = [
  '', 'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
]

function formatMoney(val) {
  if (val == null) return '0.00'
  return Number(val).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatPeriod(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${monthNames[d.getMonth() + 1]} ${d.getFullYear()}`
}

function statusLabel(status) {
  const labels = {
    paid: 'Оплачен',
    pending: 'Ожидание',
    sent: 'Отправлен',
    overdue: 'Просрочен',
    draft: 'Черновик'
  }
  return labels[status] || status || 'Ожидание'
}

async function downloadPDF(id) {
  downloadingId.value = id
  try {
    const res = await getPartnerInvoicePDF(id)
    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `invoice_${id}.pdf`
    link.click()
    window.URL.revokeObjectURL(url)
  } catch (e) {
    console.error('Ошибка скачивания PDF:', e)
  } finally {
    downloadingId.value = null
  }
}

async function loadInvoices() {
  loading.value = true
  error.value = null
  try {
    const [invRes, balRes, accRes] = await Promise.all([
      getPartnerInvoices(),
      getPartnerBalance(),
      getPartnerAccount()
    ])
    invoices.value = invRes.data || []
    balance.value = balRes.data
    account.value = accRes.data
  } catch (e) {
    error.value = e.response?.data?.error || 'Ошибка загрузки данных'
  } finally {
    loading.value = false
  }
}

onMounted(loadInvoices)
</script>

<style scoped>
.partner-invoices {
  max-width: 1200px;
  margin: 0 auto;
}

/* Финансовые карточки */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card--balance .stat-icon { background: rgba(59, 130, 246, 0.12); color: #3b82f6; }
.stat-card--invoiced .stat-icon { background: rgba(168, 85, 247, 0.12); color: #a855f7; }
.stat-card--paid .stat-icon { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
.stat-card--outstanding .stat-icon { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }

.stat-content { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
.stat-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-color-secondary); font-weight: 600; }
.stat-value { font-size: 1.35rem; font-weight: 700; color: var(--text-color); }
.stat-value--success { color: #22c55e; }
.stat-value--warning { color: #f59e0b; }

.currency-tag {
  font-size: 0.65rem;
  font-weight: 500;
  opacity: 0.6;
  letter-spacing: 0.03em;
}

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 0.25rem;
}

.page-subtitle {
  font-size: 0.95rem;
  color: var(--text-color-secondary);
  margin: 0;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem;
  color: var(--text-color-secondary);
}

.error-state {
  color: var(--red-400);
}

.invoices-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  overflow: hidden;
}

.invoices-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.invoices-table th {
  text-align: left;
  padding: 0.875rem 1.25rem;
  font-weight: 600;
  color: var(--text-color-secondary);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: var(--surface-hover);
  position: sticky;
  top: 0;
  z-index: 1;
}

.invoices-table td {
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid var(--surface-border);
  color: var(--text-color);
}

.invoices-table tbody tr:hover {
  background: var(--surface-hover);
}

.invoices-table tbody tr:last-child td {
  border-bottom: none;
}

.td-number {
  font-weight: 600;
}

.td-date {
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

.td-amount {
  font-weight: 700;
  font-size: 0.95rem;
}

.invoices-table .text-right,
.text-right {
  text-align: right !important;
}

.invoices-table .text-center,
.text-center {
  text-align: center !important;
}

.status-icon {
  vertical-align: middle;
}

.status-icon--paid {
  color: #22c55e;
}

.status-icon--unpaid {
  color: #f59e0b;
}

.download-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--surface-border);
  background: var(--surface-card);
  color: var(--primary-color);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.download-btn:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.1);
  border-color: var(--primary-color);
}

.download-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .invoices-table th,
  .invoices-table td {
    padding: 0.625rem 0.75rem;
    font-size: 0.8rem;
  }
}
</style>
