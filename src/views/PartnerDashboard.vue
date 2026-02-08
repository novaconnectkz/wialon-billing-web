<template>
  <div class="partner-dashboard">
    <!-- Заголовок -->
    <div class="dashboard-header">
      <div>
        <div class="title-row" v-if="balance">
          <h1 class="page-title">{{ balance.account_name }}</h1>
          <div class="account-status" v-if="account">
            <div 
              v-if="(account.IsActive || account.is_active) && !(account.IsBlocked || account.is_blocked)" 
              class="status-icon-header status-icon-header--active" 
              v-tooltip.bottom="'Активно в Wialon'"
            >
              <Activity :size="32" />
            </div>
            <div 
              v-if="account.IsBlocked || account.is_blocked" 
              class="status-icon-header status-icon-header--blocked" 
              v-tooltip.bottom="'Заблокировано в Wialon'"
            >
              <Lock :size="32" />
            </div>
          </div>
        </div>
        <h1 class="page-title" v-else>Личный кабинет</h1>
        <p class="page-subtitle">Ваш личный кабинет партнёра</p>
      </div>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="loading-state">
      <ProgressSpinner />
      <p>Загрузка данных...</p>
    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="error-state">
      <AlertCircle :size="48" />
      <p>{{ error }}</p>
      <Button label="Повторить" @click="loadData" outlined />
    </div>

    <!-- Контент -->
    <template v-else>
      <!-- Карточки статистики по объектам -->
      <div class="stats-grid">
        <div class="stat-card stat-card--balance">
          <div class="stat-icon">
            <Box :size="24" />
          </div>
          <div class="stat-content">
            <span class="stat-label">Всего объектов</span>
            <div class="stat-row">
              <span class="stat-value">{{ latestSnapshot?.total_units || 0 }}</span>
              <span v-if="prevLatestSnapshot" class="stat-delta" :class="deltaClass(latestSnapshot?.total_units, prevLatestSnapshot?.total_units)">
                <component :is="deltaIcon(latestSnapshot?.total_units, prevLatestSnapshot?.total_units)" :size="14" />
                {{ deltaPercent(latestSnapshot?.total_units, prevLatestSnapshot?.total_units) }}%
              </span>
            </div>
          </div>
        </div>

        <div class="stat-card stat-card--created">
          <div class="stat-icon">
            <PlusCircle :size="24" />
          </div>
          <div class="stat-content">
            <span class="stat-label">Добавлено за {{ monthNames[snapMonth - 1] }}</span>
            <div class="stat-row">
              <span class="stat-value stat-value--success">{{ totalCreated }}</span>
              <span v-if="prevTotalCreated != null" class="stat-delta" :class="deltaClass(totalCreated, prevTotalCreated)">
                <component :is="deltaIcon(totalCreated, prevTotalCreated)" :size="14" />
                {{ deltaPercent(totalCreated, prevTotalCreated) }}%
              </span>
            </div>
          </div>
        </div>

        <div class="stat-card stat-card--deleted">
          <div class="stat-icon">
            <MinusCircle :size="24" />
          </div>
          <div class="stat-content">
            <span class="stat-label">Удалено за {{ monthNames[snapMonth - 1] }}</span>
            <div class="stat-row">
              <span class="stat-value stat-value--danger">{{ totalDeleted }}</span>
              <span v-if="prevTotalDeleted != null" class="stat-delta" :class="deltaClass(totalDeleted, prevTotalDeleted)">
                <component :is="deltaIcon(totalDeleted, prevTotalDeleted)" :size="14" />
                {{ deltaPercent(totalDeleted, prevTotalDeleted) }}%
              </span>
            </div>
          </div>
        </div>

        <div class="stat-card stat-card--deactivated">
          <div class="stat-icon">
            <PauseCircle :size="24" />
          </div>
          <div class="stat-content">
            <span class="stat-label">Деактивировано</span>
            <span class="stat-value stat-value--warning">{{ latestSnapshot?.units_deactivated || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- Два блока: Счета и Начисления -->
      <div class="content-grid">
        <!-- Блок снимков (Данные по дням) -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="card-title">
              <CalendarDays :size="20" />
              Данные по дням
            </h2>
            <div class="month-selector">
              <button class="month-btn" @click="changeSnapshotMonth(-1)">
                <ChevronLeft :size="16" />
              </button>
              <span class="month-label">{{ monthNames[snapMonth - 1] }} {{ snapYear }}</span>
              <button class="month-btn" @click="changeSnapshotMonth(1)" :disabled="isSnapCurrentMonth">
                <ChevronRight :size="16" />
              </button>
            </div>
          </div>

          <div v-if="snapshotsLoading" class="loading-mini">
            <ProgressSpinner style="width: 24px; height: 24px" />
          </div>
          <div v-else-if="snapshots.length === 0" class="empty-state">
            <CalendarDays :size="32" />
            <p>Нет данных за этот период</p>
          </div>

          <div v-else class="snapshot-table-wrap">
            <table class="snapshot-table">
              <thead>
                <tr>
                  <th class="col-date">Дата</th>
                  <th class="col-total text-center">Объекты</th>
                  <th class="col-stat text-center" title="Добавлено"><span class="stat-icon stat-green">＋</span></th>
                  <th class="col-stat text-center" title="Удалено"><span class="stat-icon stat-red">−</span></th>
                  <th class="col-stat text-center" title="Деактивировано"><span class="stat-icon stat-amber">⏸</span></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(s, i) in snapshots" :key="i">
                  <td class="col-date">{{ formatChargeDate(s.date) }}</td>
                  <td class="col-total text-center"><span class="total-badge">{{ s.total_units }}</span></td>
                  <td class="col-stat text-center">
                    <span v-if="s.units_created" class="stat-badge stat-green">+{{ s.units_created }}</span>
                    <span v-else class="stat-empty">—</span>
                  </td>
                  <td class="col-stat text-center">
                    <span v-if="s.units_deleted" class="stat-badge stat-red">−{{ s.units_deleted }}</span>
                    <span v-else class="stat-empty">—</span>
                  </td>
                  <td class="col-stat text-center">
                    <span v-if="s.units_deactivated" class="stat-badge stat-amber">{{ s.units_deactivated }}</span>
                    <span v-else class="stat-empty">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Блок начислений -->
        <div class="content-card">
          <div class="card-header">
            <h2 class="card-title">
              <BarChart3 :size="20" />
              Начисления за месяц
            </h2>
            <div class="month-selector">
              <button class="month-btn" @click="changeMonth(-1)">
                <ChevronLeft :size="16" />
              </button>
              <span class="month-label">{{ monthNames[selectedMonth - 1] }} {{ selectedYear }}</span>
              <button class="month-btn" @click="changeMonth(1)" :disabled="isCurrentMonth">
                <ChevronRight :size="16" />
              </button>
            </div>
          </div>

          <div v-if="chargesLoading" class="loading-mini">
            <ProgressSpinner style="width: 24px; height: 24px" />
          </div>
          <div v-else-if="charges.length === 0" class="empty-state">
            <BarChart3 :size="32" />
            <p>Нет начислений за этот период</p>
          </div>

          <div v-else class="charges-table-wrap">
            <table class="charges-table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Модуль</th>
                  <th>Объекты</th>
                  <th class="text-right">Сумма</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(ch, i) in charges" :key="i">
                  <td class="td-date">{{ formatChargeDate(ch.ChargeDate || ch.charge_date) }}</td>
                  <td>{{ ch.ModuleName || ch.module_name }}</td>
                  <td class="td-units">{{ ch.UnitsCount || ch.units_count }}</td>
                  <td class="td-cost text-right">{{ formatMoney(ch.DailyCost || ch.daily_cost) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3"><strong>Итого</strong></td>
                  <td class="text-right"><strong>{{ formatMoney(chargesTotalSum) }}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- Информация об аккаунте -->
      <div class="content-card account-card" v-if="account">
        <div class="card-header">
          <h2 class="card-title">
            <Building :size="20" />
            Информация об аккаунте
          </h2>
        </div>
        <div class="account-grid">
          <div class="account-field">
            <span class="field-label">Название</span>
            <span class="field-value">{{ account.Name || account.name }}</span>
          </div>
          <div class="account-field">
            <span class="field-label">Wialon ID</span>
            <span class="field-value">{{ account.WialonID || account.wialon_id }}</span>
          </div>
          <div class="account-field" v-if="account.BuyerName || account.buyer_name">
            <span class="field-label">Покупатель</span>
            <span class="field-value">{{ account.BuyerName || account.buyer_name }}</span>
          </div>
          <div class="account-field" v-if="account.BuyerBIN || account.buyer_bin">
            <span class="field-label">БИН/ИИН</span>
            <span class="field-value">{{ account.BuyerBIN || account.buyer_bin }}</span>
          </div>
          <div class="account-field" v-if="account.BuyerEmail || account.buyer_email">
            <span class="field-label">Email</span>
            <span class="field-value">{{ account.BuyerEmail || account.buyer_email }}</span>
          </div>
          <div class="account-field" v-if="account.BuyerPhone || account.buyer_phone">
            <span class="field-label">Телефон</span>
            <span class="field-value">{{ account.BuyerPhone || account.buyer_phone }}</span>
          </div>
          <div class="account-field" v-if="account.ContractNumber || account.contract_number">
            <span class="field-label">Контракт</span>
            <span class="field-value">{{ account.ContractNumber || account.contract_number }}</span>
          </div>
          <div class="account-field" v-if="account.BillingCurrency || account.billing_currency">
            <span class="field-label">Валюта</span>
            <span class="field-value">{{ account.BillingCurrency || account.billing_currency }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  getPartnerAccount, 
  getPartnerCharges, 
  getPartnerBalance,
  getPartnerSnapshots 
} from '@/services/api'
import { 
  Wallet, FileText, CheckCircle, Clock, BarChart3, CalendarDays,
  ChevronLeft, ChevronRight, Building, AlertCircle,
  Box, PlusCircle, MinusCircle, PauseCircle,
  TrendingUp, TrendingDown, Minus, Activity, Lock
} from 'lucide-vue-next'

const loading = ref(true)
const chargesLoading = ref(false)
const snapshotsLoading = ref(false)
const error = ref(null)

const balance = ref(null)
const account = ref(null)
const charges = ref([])
const snapshots = ref([])
const prevSnapshots = ref([])

const now = new Date()

// Переключатель месяца для начислений
const selectedYear = ref(now.getFullYear())
const selectedMonth = ref(now.getMonth() + 1)

// Переключатель месяца для снимков
const snapYear = ref(now.getFullYear())
const snapMonth = ref(now.getMonth() + 1)

const monthNames = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
]

const isCurrentMonth = computed(() => {
  return selectedYear.value === now.getFullYear() && selectedMonth.value === now.getMonth() + 1
})

const isSnapCurrentMonth = computed(() => {
  return snapYear.value === now.getFullYear() && snapMonth.value === now.getMonth() + 1
})

const chargesTotalSum = computed(() => {
  return charges.value.reduce((sum, ch) => sum + (ch.DailyCost || ch.daily_cost || 0), 0)
})

// Последний снимок (для карточки «Всего объектов» и «Деактивировано»)
const latestSnapshot = computed(() => {
  if (!snapshots.value.length) return null
  return snapshots.value[snapshots.value.length - 1]
})

// Сумма добавленных за месяц
const totalCreated = computed(() => {
  return snapshots.value.reduce((sum, s) => sum + (s.units_created || 0), 0)
})

// Сумма удалённых за месяц
const totalDeleted = computed(() => {
  return snapshots.value.reduce((sum, s) => sum + (s.units_deleted || 0), 0)
})

// Данные прошлого месяца для сравнения
const prevLatestSnapshot = computed(() => {
  if (!prevSnapshots.value.length) return null
  return prevSnapshots.value[prevSnapshots.value.length - 1]
})

const prevTotalCreated = computed(() => {
  if (!prevSnapshots.value.length) return null
  return prevSnapshots.value.reduce((sum, s) => sum + (s.units_created || 0), 0)
})

const prevTotalDeleted = computed(() => {
  if (!prevSnapshots.value.length) return null
  return prevSnapshots.value.reduce((sum, s) => sum + (s.units_deleted || 0), 0)
})

// Спарклайны — массивы ежедневных значений
const sparklineUnits = computed(() => snapshots.value.map(s => s.total_units || 0))
const sparklineCreated = computed(() => snapshots.value.map(s => s.units_created || 0))
const sparklineDeleted = computed(() => snapshots.value.map(s => s.units_deleted || 0))
const sparklineDeactivated = computed(() => snapshots.value.map(s => s.units_deactivated || 0))

// Построение SVG polyline points
function buildSparkline(data) {
  if (!data.length) return ''
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const w = 120
  const h = 28
  const pad = 2
  return data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = pad + ((max - v) / range) * (h - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

// Вычисление % изменения
function deltaPercent(curr, prev) {
  const c = curr || 0
  const p = prev || 0
  if (p === 0 && c === 0) return 0
  if (p === 0) return 100
  return Math.abs(Math.round(((c - p) / p) * 100))
}

function deltaClass(curr, prev) {
  const c = curr || 0
  const p = prev || 0
  if (c > p) return 'delta-up'
  if (c < p) return 'delta-down'
  return 'delta-neutral'
}

function deltaIcon(curr, prev) {
  const c = curr || 0
  const p = prev || 0
  if (c > p) return TrendingUp
  if (c < p) return TrendingDown
  return Minus
}

function formatMoney(val) {
  if (val == null) return '0.00'
  return Number(val).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatChargeDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}

async function changeMonth(delta) {
  let m = selectedMonth.value + delta
  let y = selectedYear.value
  if (m > 12) { m = 1; y++ }
  if (m < 1) { m = 12; y-- }
  
  selectedMonth.value = m
  selectedYear.value = y
  await loadCharges()
}

async function changeSnapshotMonth(delta) {
  let m = snapMonth.value + delta
  let y = snapYear.value
  if (m > 12) { m = 1; y++ }
  if (m < 1) { m = 12; y-- }
  
  snapMonth.value = m
  snapYear.value = y
  await loadSnapshots()
}

async function loadCharges() {
  chargesLoading.value = true
  try {
    const res = await getPartnerCharges(selectedYear.value, selectedMonth.value)
    charges.value = res.data?.charges || res.data || []
  } catch (e) {
    charges.value = []
  } finally {
    chargesLoading.value = false
  }
}

async function loadSnapshots() {
  snapshotsLoading.value = true
  try {
    const res = await getPartnerSnapshots(snapYear.value, snapMonth.value)
    snapshots.value = res.data?.snapshots || []
  } catch (e) {
    snapshots.value = []
  } finally {
    snapshotsLoading.value = false
  }
}

// Загрузка снимков прошлого месяца для сравнения
async function loadPrevSnapshots() {
  let pm = snapMonth.value - 1
  let py = snapYear.value
  if (pm < 1) { pm = 12; py-- }
  try {
    const res = await getPartnerSnapshots(py, pm)
    prevSnapshots.value = res.data?.snapshots || []
  } catch (e) {
    prevSnapshots.value = []
  }
}

async function loadData() {
  loading.value = true
  error.value = null
  
  try {
    const [balRes, accRes] = await Promise.all([
      getPartnerBalance(),
      getPartnerAccount()
    ])
    
    balance.value = balRes.data
    account.value = accRes.data
    
    // Загружаем начисления и снимки параллельно
    await Promise.all([loadCharges(), loadSnapshots(), loadPrevSnapshots()])
  } catch (e) {
    error.value = e.response?.data?.error || 'Ошибка загрузки данных'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.partner-dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

/* Заголовок */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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

.title-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.25rem;
}

.title-row .page-title {
  margin: 0;
}

.account-status {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.status-icon-header {
  padding: 6px;
  border-radius: 8px;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
}

.status-icon-header--active {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.2);
}

.status-icon-header--blocked {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
}

.currency-badge {
  display: inline-block;
  padding: 0.375rem 0.875rem;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.875rem;
}

/* Загрузка / Ошибка */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  color: var(--text-color-secondary);
}

.error-state {
  color: var(--red-400);
}

/* Карточки статистики */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
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

.stat-card--balance .stat-icon { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.stat-card--invoiced .stat-icon { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
.stat-card--paid .stat-icon { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
.stat-card--outstanding .stat-icon { background: rgba(251, 191, 36, 0.1); color: #f59e0b; }
.stat-card--created .stat-icon { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
.stat-card--deleted .stat-icon { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
.stat-card--deactivated .stat-icon { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.stat-value {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-color);
}

.stat-value--success { color: #22c55e; }
.stat-value--warning { color: #f59e0b; }
.stat-value--danger { color: #ef4444; }

.stat-row {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.stat-delta {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.12rem 0.4rem;
  border-radius: 8px;
}

.delta-up { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
.delta-down { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
.delta-neutral { background: rgba(107, 114, 128, 0.12); color: #6b7280; }

.sparkline {
  width: 100%;
  height: 28px;
  margin-top: 0.35rem;
  opacity: 0.7;
}

/* Контент */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.content-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--surface-border);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.card-count {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  padding: 0.25rem 0.625rem;
  background: var(--surface-hover);
  border-radius: 20px;
}

/* Пустое состояние */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2.5rem;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

/* Таблица снимков */
.snapshot-table-wrap {
  max-height: 400px;
  overflow-y: auto;
}

.snapshot-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  table-layout: fixed;
}

.snapshot-table th,
.snapshot-table td {
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid var(--surface-border);
}

.snapshot-table th {
  font-weight: 600;
  color: var(--text-color-secondary);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: var(--surface-hover);
  position: sticky;
  top: 0;
  z-index: 1;
}

.snapshot-table tbody tr:hover { background: var(--surface-hover); }
.snapshot-table tbody tr:last-child td { border-bottom: none; }

.col-date { width: 60px; font-size: 0.8rem; color: var(--text-color-secondary); text-align: center; }
.col-total { width: 70px; }
.col-stat { width: 55px; cursor: help; }

.total-badge {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--text-color);
}

.stat-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
}

.stat-icon.stat-green { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
.stat-icon.stat-red { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
.stat-icon.stat-amber { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }

.stat-badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.75rem;
}

.stat-badge.stat-green { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
.stat-badge.stat-red { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
.stat-badge.stat-amber { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }

.stat-empty { color: var(--surface-border); font-size: 0.8rem; }

.loading-mini {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
}

/* Переключатель месяца */
.month-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.month-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--surface-border);
  background: var(--surface-card);
  color: var(--text-color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.month-btn:hover:not(:disabled) { background: var(--surface-hover); color: var(--text-color); }
.month-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.month-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-color);
  min-width: 110px;
  text-align: center;
}

/* Мини-загрузка */
.loading-mini {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

/* Таблица начислений */
.charges-table-wrap {
  max-height: 400px;
  overflow-y: auto;
}

.charges-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.charges-table th {
  text-align: left;
  padding: 0.625rem 1rem;
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

.charges-table td {
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--surface-border);
  color: var(--text-color);
}

.charges-table tbody tr:hover { background: var(--surface-hover); }

.td-date { color: var(--text-color-secondary); font-size: 0.825rem; }
.td-units { font-weight: 500; }
.td-cost { font-weight: 600; }
.text-right { text-align: right; }

.charges-table tfoot td {
  padding: 0.75rem 1rem;
  border-top: 2px solid var(--surface-border);
  border-bottom: none;
  background: var(--surface-hover);
}

/* Аккаунт */
.account-card {
  margin-bottom: 2rem;
}

.account-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
}

.account-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--surface-border);
  border-right: 1px solid var(--surface-border);
}

.account-field:nth-child(4n) { border-right: none; }
.account-field:nth-last-child(-n+4) { border-bottom: none; }

.field-label {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.field-value {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-color);
}

/* Адаптивность */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .content-grid {
    grid-template-columns: 1fr;
  }
  .account-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .account-field:nth-child(2n) { border-right: none; }
  .account-field:nth-child(4n) { border-right: 1px solid var(--surface-border); }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .account-grid {
    grid-template-columns: 1fr;
  }
  .account-field { border-right: none !important; }
}
</style>
