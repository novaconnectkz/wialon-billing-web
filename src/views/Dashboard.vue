<template>
  <div class="dashboard">
    <h1 class="page-title">Данные</h1>
    
    <!-- Статистика -->
    <!-- Статистика -->
    <!-- Статистика -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon-wrapper blue">
          <Truck :size="24" />
        </div>
        <div class="stat-content">
          <div class="stat-label">Объектов</div>
          <div class="stat-value">{{ dashboard.total_units || 0 }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrapper green">
          <Euro :size="24" />
        </div>
        <div class="stat-content">
          <div class="stat-label">Стоимость</div>
          <div class="stat-value" v-if="hasCosts">
            <span v-for="(amount, currency) in dashboard.cost_by_currency" :key="currency" class="cost-item">
              {{ formatCurrency(amount, currency) }}
            </span>
          </div>
          <div class="stat-value" v-else>0</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon-wrapper purple">
          <Building2 :size="24" />
        </div>
        <div class="stat-content">
          <div class="stat-label">Аккаунтов</div>
          <div class="stat-value">{{ dashboard.accounts?.length || 0 }}</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon-wrapper orange">
          <Database :size="24" />
        </div>
        <div class="stat-content">
          <div class="stat-label">Снимков</div>
          <div class="stat-value">{{ dashboard.snapshots?.length || 0 }}</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon-wrapper yellow">
          <PauseCircle :size="24" />
        </div>
        <div class="stat-content">
          <div class="stat-label">Деактивировано</div>
          <div class="stat-value">{{ totalDeactivated }}</div>
        </div>
      </div>
    </div>
    
    <!-- Снимки -->
    <Card class="data-card">
      <template #title>
        <div class="card-header">
          <div class="card-header-left">
            <span>Данные за выбранный период</span>
            <Dropdown 
              v-model="filterAccountId" 
              :options="accountOptions" 
              optionLabel="name" 
              optionValue="id"
              placeholder="Все аккаунты"
              showClear
              :filter="true"
              filterPlaceholder="Поиск..."
              class="account-filter-dropdown"
            />
          </div>
          <div class="period-selectors">
            <Button 
              text 
              rounded
              @click="prevMonth"
              title="Предыдущий месяц"
            >
              <template #icon>
                <ChevronLeft :size="20" />
              </template>
            </Button>
            <Calendar 
              v-model="dateRange" 
              selectionMode="range"
              :manualInput="false"
              dateFormat="dd.mm.yy"
              placeholder="Выберите период"
              class="date-range-picker"
              showIcon
              iconDisplay="input"
              @update:modelValue="onDateRangeChange"
            />
            <Button 
              text 
              rounded
              @click="nextMonth"
              title="Следующий месяц"
            >
              <template #icon>
                <ChevronRight :size="20" />
              </template>
            </Button>
            <Button 
              text 
              @click="loadDashboard"
              :loading="loading"
            >
              <template #icon>
                <RefreshCw :size="20" :class="{'spin-anim': loading}" />
              </template>
            </Button>
          </div>
        </div>
      </template>
      <template #content>
        <DataTable 
          :value="filteredSnapshots" 
          :loading="loading"
          responsiveLayout="scroll"
          class="responsive-table"
          scrollable
          scrollHeight="500px"
          size="small"
        >
          <Column header="№" style="width: 60px">
            <template #body="{ index }">
              {{ index + 1 }}
            </template>
          </Column>
          <Column field="account.name" header="Аккаунт" :sortable="true" />
          <Column field="total_units" header="Объектов" :sortable="true">
            <template #body="{ data }">
              <span class="units-display">
                <span class="units-total">{{ data.total_units }}</span>
                <span v-if="data.units_created" class="units-created">+{{ data.units_created }}</span>
                <span v-if="data.units_deleted" class="units-deleted">-{{ data.units_deleted }}</span>
                <span v-if="data.units_deactivated" class="units-deactivated">{{ data.units_deactivated }}</span>
              </span>
            </template>
          </Column>
          <Column field="snapshot_date" header="Дата" :sortable="true">
            <template #body="{ data }">
              {{ formatDate(data.snapshot_date) }}
            </template>
          </Column>
          <Column header="" style="width: 120px">
            <template #body="{ data }">
              <Button 
                icon="pi pi-chart-bar" 
                text 
                rounded
                severity="info"
                title="Статистика"
                @click="showStats(data.account)"
              />
              <Button 
                icon="pi pi-money-bill" 
                text 
                rounded
                severity="success"
                title="Детализация начислений"
                @click="showCharges(data.account)"
              />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
    
    <!-- Модальное окно статистики -->
    <Dialog 
      v-model:visible="statsDialog" 
      :header="'Статистика: ' + (selectedAccount?.name || '') + ' (' + monthNames[selectedMonth - 1] + ' ' + selectedYear + ')'"
      :modal="true"
      :style="{ width: '90vw', maxWidth: '1000px' }"
    >
      <div v-if="statsLoading" class="stats-loading">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: var(--primary-color);"></i>
        <p>Загрузка статистики из Wialon...</p>
      </div>
      <div v-else-if="accountStats?.length">
        <DataTable :value="accountStats" responsiveLayout="scroll" class="stats-table">
          <Column field="date" header="Дата" :sortable="true" />
          <Column field="unit_total" header="Всего" :sortable="true" />
          <Column header="Добавлено" :sortable="true">
            <template #body="{ data }">
              <span v-if="data.unit_created" class="badge badge-success">+{{ data.unit_created }}</span>
              <span v-else>—</span>
            </template>
          </Column>
          <Column header="Удалено" :sortable="true">
            <template #body="{ data }">
              <span v-if="data.unit_deleted" class="badge badge-danger">-{{ data.unit_deleted }}</span>
              <span v-else>—</span>
            </template>
          </Column>
          <Column header="Пользов." style="width: 100px">
            <template #body="{ data }">
              <span v-if="data.user_created" class="badge badge-info">+{{ data.user_created }}</span>
              <span v-if="data.user_deleted" class="badge badge-warning">-{{ data.user_deleted }}</span>
              <span v-if="!data.user_created && !data.user_deleted">—</span>
            </template>
          </Column>
        </DataTable>
      </div>
      <div v-else class="stats-empty">
        <p>Нет данных за выбранный период</p>
      </div>
    </Dialog>

    <!-- Детализация начислений — Antigravity Design -->
    <Dialog 
      v-model:visible="chargesDialog" 
      :modal="true"
      :style="{ width: '90vw', maxWidth: '960px' }"
      :showHeader="false"
      :pt="{ content: { style: 'padding: 0' } }"
    >
      <!-- Кастомный Header -->
      <div class="ag-header">
        <div class="ag-header-left">
          <div class="ag-title">{{ chargesAccount?.name || '' }}</div>
          <div class="ag-period">{{ monthNames[selectedMonth - 1] }} {{ selectedYear }}</div>
        </div>
        <div class="ag-header-right">
          <div class="ag-grand-total" v-if="chargesData?.monthly_totals?.cost_by_currency">
            <span 
              v-for="(amount, currency) in chargesData.monthly_totals.cost_by_currency" 
              :key="currency"
              class="ag-total-amount"
            >{{ formatCurrency(amount, currency) }}</span>
            <!-- Конвертированная сумма для завершённых месяцев -->
            <template v-if="chargesData.conversion">
              <span 
                v-for="(amount, currency) in chargesData.conversion.converted_totals" 
                :key="'conv-' + currency"
                class="ag-total-converted"
              >≈ {{ formatCurrency(amount, currency) }}</span>
            </template>
          </div>
          <Button 
            icon="pi pi-file-excel" 
            label="Excel"
            size="small"
            outlined
            severity="success" 
            @click="downloadChargesExcel" 
            :loading="excelLoading"
            style="white-space: nowrap"
          />
          <Button 
            icon="pi pi-times" 
            text 
            rounded 
            severity="secondary"
            @click="chargesDialog = false" 
          />
        </div>
      </div>

      <div v-if="chargesLoading" class="ag-loader">
        <i class="pi pi-spin pi-spinner" style="font-size: 1.5rem; color: var(--primary-color);"></i>
      </div>
      <div v-else-if="chargesData" class="ag-body">

        <!-- Модули: компактные карточки -->
        <div class="ag-module-cards" v-if="chargesData.monthly_totals?.cost_details?.length">
          <div 
            v-for="detail in chargesData.monthly_totals.cost_details" 
            :key="detail.module_id" 
            class="ag-module-card"
          >
            <div class="ag-mc-top">
              <span class="ag-mc-name">{{ shortenModuleName(detail.module_name) }}</span>
              <span class="ag-mc-total">{{ formatCurrency(detail.total_cost, detail.currency) }}</span>
            </div>
            <div class="ag-mc-formula">
              <template v-if="detail.pricing_type !== 'fixed'">
                {{ detail.unit_price }} × {{ detail.avg_units }} ÷ {{ detail.days_in_month }}д = {{ detail.avg_daily_cost }}/день × {{ detail.days_count }}д
              </template>
              <template v-else>
                Фиксированная — начислено 1-го числа
              </template>
            </div>
          </div>
        </div>

        <!-- Прогресс-бар периода -->
        <div class="ag-progress" v-if="chargesData.period">
          <span class="ag-progress-label">{{ chargesData.daily_breakdown?.length || 0 }} из {{ chargesData.period.days_in_month }} дней</span>
          <div class="ag-progress-bar">
            <div 
              class="ag-progress-fill" 
              :style="{ width: ((chargesData.daily_breakdown?.length || 0) / chargesData.period.days_in_month * 100) + '%' }"
            ></div>
          </div>
        </div>

        <!-- Таблица: чистая, без шума -->
        <div class="ag-table-wrap">
          <table class="ag-table">
            <thead>
              <tr>
                <th class="ag-th-date">Дата</th>
                <th class="ag-th-units">Объектов</th>
                <th class="ag-th-module">Модуль</th>
                <th class="ag-th-rate">Тариф</th>
                <th class="ag-th-cost">Стоимость</th>
                <th v-if="chargesData.conversion" class="ag-th-cost">{{ chargesData.conversion.billing_currency }}</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(day, dayIdx) in chargesData.daily_breakdown" :key="day.date">
                <tr 
                  v-for="(charge, chargeIdx) in day.charges" 
                  :key="charge.module_id"
                  :class="{ 'ag-date-first': chargeIdx === 0 && dayIdx > 0 }"
                >
                  <td class="ag-td-date">
                    <span v-if="chargeIdx === 0" class="ag-date-label">{{ formatDateShort(day.date) }}</span>
                  </td>
                  <td class="ag-td-units">
                    <span v-if="chargeIdx === 0">{{ charge.total_units }}</span>
                  </td>
                  <td class="ag-td-module">
                    <span class="ag-module-label">{{ shortenModuleName(charge.module_name) }}</span>
                    <span v-if="charge.pricing_type === 'fixed'" class="ag-badge-fix">фикс</span>
                  </td>
                  <td class="ag-td-rate">{{ charge.unit_price }}</td>
                  <td class="ag-td-cost">{{ formatCurrency(charge.daily_cost, charge.currency) }}</td>
                  <td v-if="chargesData.conversion" class="ag-td-cost">
                    <span v-if="chargeIdx === 0 && day.day_cost_local">{{ formatCurrency(day.day_cost_local, day.local_currency) }}</span>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- Курс и конвертация для завершённых месяцев -->
        <div class="ag-conversion" v-if="chargesData.conversion">
          <div class="ag-conversion-rate">
            Курс EUR/{{ chargesData.conversion.billing_currency }} на {{ formatDate(chargesData.conversion.rate_date) }}: 
            <strong>{{ chargesData.conversion.rate }}</strong>
          </div>
          <div class="ag-conversion-total">
            <span 
              v-for="(amount, currency) in chargesData.conversion.converted_totals" 
              :key="currency"
            >
              Итого: <strong>{{ formatCurrency(amount, currency) }}</strong>
            </span>
          </div>
        </div>

      </div>
      <div v-else class="ag-empty">
        Нет данных за выбранный период
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getDashboard, getAccountStats, getAccountCharges, exportAccountChargesExcel } from '@/services/api'
import { 
  Truck, 
  Euro, 
  Building2, 
  Database, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw,
  PauseCircle
} from 'lucide-vue-next'

const dashboard = ref({})
const loading = ref(false)

// Диапазон дат (по умолчанию текущий месяц)
const now = new Date()
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
const dateRange = ref([startOfMonth, endOfMonth])

// Для API и статистики — сохраняем год и месяц
const selectedYear = ref(now.getFullYear())
const selectedMonth = ref(now.getMonth() + 1)

const monthNames = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
]

// Фильтр по аккаунту
const filterAccountId = ref(null)

// Список аккаунтов из загруженных данных
const accountOptions = computed(() => {
  if (!dashboard.value.accounts) return []
  return dashboard.value.accounts.map(a => ({ id: a.id, name: a.name })).sort((a, b) => a.name.localeCompare(b.name))
})

// Фильтруем снимки по выбранному диапазону дат и аккаунту
const filteredSnapshots = computed(() => {
  if (!dashboard.value.snapshots) return []
  
  let result = dashboard.value.snapshots
  
  // Фильтр по диапазону дат
  if (dateRange.value && dateRange.value.length === 2 && dateRange.value[0] && dateRange.value[1]) {
    const startDate = new Date(dateRange.value[0])
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(dateRange.value[1])
    endDate.setHours(23, 59, 59, 999)
    
    result = result.filter(s => {
      const snapshotDate = new Date(s.snapshot_date)
      return snapshotDate >= startDate && snapshotDate <= endDate
    })
  }
  
  // Фильтр по аккаунту
  if (filterAccountId.value) {
    result = result.filter(s => s.account_id === filterAccountId.value)
  }
  
  return result
})

// Подсчёт деактивированных объектов за период (последний снимок каждого аккаунта)
const totalDeactivated = computed(() => {
  if (!filteredSnapshots.value || filteredSnapshots.value.length === 0) return 0
  // Группируем по аккаунтам и берём последний снимок каждого
  const latestByAccount = new Map()
  for (const s of filteredSnapshots.value) {
    const existing = latestByAccount.get(s.account_id)
    if (!existing || new Date(s.snapshot_date) > new Date(existing.snapshot_date)) {
      latestByAccount.set(s.account_id, s)
    }
  }
  // Суммируем деактивированные из последних снимков
  let total = 0
  for (const s of latestByAccount.values()) {
    total += s.units_deactivated || 0
  }
  return total
})

// Статистика аккаунта
const statsDialog = ref(false)
const statsLoading = ref(false)
const selectedAccount = ref(null)
const accountStats = ref([])

// Обработка изменения диапазона дат
const onDateRangeChange = (range) => {
  if (range && range.length === 2 && range[0] && range[1]) {
    // Обновляем месяц/год по началу диапазона для API
    selectedYear.value = range[0].getFullYear()
    selectedMonth.value = range[0].getMonth() + 1
    loadDashboard()
  }
}

// Переход на предыдущий месяц
const prevMonth = () => {
  const currentStart = dateRange.value?.[0] || new Date()
  const newStart = new Date(currentStart.getFullYear(), currentStart.getMonth() - 1, 1)
  const newEnd = new Date(newStart.getFullYear(), newStart.getMonth() + 1, 0)
  dateRange.value = [newStart, newEnd]
  onDateRangeChange(dateRange.value)
}

// Переход на следующий месяц
const nextMonth = () => {
  const currentStart = dateRange.value?.[0] || new Date()
  const newStart = new Date(currentStart.getFullYear(), currentStart.getMonth() + 1, 1)
  const newEnd = new Date(newStart.getFullYear(), newStart.getMonth() + 1, 0)
  dateRange.value = [newStart, newEnd]
  onDateRangeChange(dateRange.value)
}

const loadDashboard = async () => {
  loading.value = true
  try {
    const { data } = await getDashboard(selectedYear.value, selectedMonth.value)
    dashboard.value = data
  } catch (error) {
    console.error('Ошибка загрузки dashboard:', error)
  } finally {
    loading.value = false
  }
}

// Показать статистику аккаунта
const showStats = async (account) => {
  selectedAccount.value = account
  statsDialog.value = true
  statsLoading.value = true
  accountStats.value = []
  
  try {
    const { data } = await getAccountStats(account.id, selectedYear.value, selectedMonth.value)
    accountStats.value = data.stats || []
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error)
  } finally {
    statsLoading.value = false
  }
}

// Детализация начислений
const chargesDialog = ref(false)
const chargesLoading = ref(false)
const chargesAccount = ref(null)
const chargesData = ref(null)
const excelLoading = ref(false)




const showCharges = async (account) => {
  chargesAccount.value = account
  chargesDialog.value = true
  chargesLoading.value = true
  chargesData.value = null
  
  try {
    const { data } = await getAccountCharges(account.id, selectedYear.value, selectedMonth.value)
    chargesData.value = data
  } catch (error) {
    console.error('Ошибка загрузки детализации:', error)
  } finally {
    chargesLoading.value = false
  }
}

const downloadChargesExcel = async () => {
  if (!chargesAccount.value) return
  excelLoading.value = true
  try {
    const { data } = await exportAccountChargesExcel(
      chargesAccount.value.id, 
      selectedYear.value, 
      selectedMonth.value
    )
    // Скачиваем blob как файл
    const url = window.URL.createObjectURL(new Blob([data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `charges_${chargesAccount.value.name}_${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Ошибка экспорта:', error)
  } finally {
    excelLoading.value = false
  }
}

const formatCurrency = (value, currency) => {
  if (value === null || value === undefined) return '—'
  const symbols = { EUR: '€', RUB: '₽', KZT: '₸' }
  const symbol = symbols[currency] || currency
  const num = typeof value === 'number' ? value : parseFloat(value)
  return `${num.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`
}

const hasCosts = computed(() => {
  const costs = dashboard.value?.cost_by_currency
  return costs && Object.keys(costs).length > 0
})

const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('ru-RU')
}

// Antigravity: короткий формат даты «01 фев»
const shortMonths = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
const formatDateShort = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')} ${shortMonths[d.getMonth()]}`
}

// Antigravity: убирает длинные префиксы из названий модулей
const shortenModuleName = (name) => {
  if (!name) return ''
  return name
    .replace(/^Пакет\s+"/i, '"')
    .replace(/\s+\/месяц$/i, '')
    .replace(/\s+\/мес$/i, '')
}


onMounted(() => {
  loadDashboard()
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-title {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
}

/* Статистика - Компактный дизайн */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
}

.stat-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.stat-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.stat-icon-wrapper.blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.stat-icon-wrapper.green { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
.stat-icon-wrapper.purple { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
.stat-icon-wrapper.orange { background: rgba(249, 115, 22, 0.1); color: #f97316; }
.stat-icon-wrapper.yellow { background: rgba(234, 179, 8, 0.1); color: #eab308; }

.stat-content {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  font-weight: 500;
  white-space: nowrap;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cost-item {
  display: block;
  font-size: 1rem;
}

.cost-item:first-child {
  font-size: 1.25rem;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 576px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.card-header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.account-filter-dropdown {
  min-width: 200px;
  font-size: 0.9rem;
}

.period-selectors {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-range-picker {
  min-width: 250px;
}


.data-card {
  overflow: hidden;
}

/* Адаптивность */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stat-value {
    font-size: 1.25rem;
  }
}

/* Статистика */
.stats-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  gap: 1rem;
}

.stats-empty {
  text-align: center;
  padding: 2rem;
  color: var(--text-color-secondary);
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 600;
}

.badge-success {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.badge-danger {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.badge-info {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.badge-warning {
  background: rgba(234, 179, 8, 0.15);
  color: #eab308;
}

/* Отображение объектов в снимках */
.units-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.units-total {
  font-weight: 600;
}

.units-created {
  color: #22c55e;
  font-size: 0.875rem;
}

.units-deleted {
  color: #ef4444;
  font-size: 0.875rem;
}

.units-deactivated {
  color: #eab308;
  font-size: 0.875rem;
}

/* ═══════════════════════════════════════════════════
   Antigravity Design System — Детализация начислений
   ═══════════════════════════════════════════════════ */

/* Header */
.ag-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--surface-border);
  gap: 1rem;
}

.ag-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  line-height: 1.3;
}

.ag-period {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  margin-top: 2px;
}

.ag-header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.ag-grand-total {
  display: flex;
  gap: 0.75rem;
}

.ag-total-amount {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.ag-total-converted {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color-secondary);
  align-self: flex-end;
  padding-bottom: 0.1rem;
}

/* Блок конвертации под таблицей */
.ag-conversion {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background: rgba(0, 150, 200, 0.06);
  border-top: 1px solid var(--surface-border);
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.ag-conversion-rate {
  font-size: 0.85rem;
}

.ag-conversion-total {
  font-size: 1.1rem;
  color: var(--text-color);
}

/* Loader */
.ag-loader {
  display: flex;
  justify-content: center;
  padding: 3rem 0;
}

/* Body */
.ag-body {
  padding: 1rem 1.5rem 1.5rem;
}

/* Module cards */
.ag-module-cards {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.ag-module-card {
  flex: 1;
  min-width: 220px;
  background: var(--surface-ground);
  border: 1px solid var(--surface-border);
  border-radius: 10px;
  padding: 0.875rem 1rem;
}

.ag-mc-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.75rem;
}

.ag-mc-name {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-color);
  line-height: 1.3;
}

.ag-mc-total {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-color);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.ag-mc-formula {
  font-size: 0.72rem;
  color: var(--text-color-secondary);
  margin-top: 0.35rem;
  line-height: 1.4;
  opacity: 0.7;
}

/* Progress */
.ag-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.ag-progress-label {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  white-space: nowrap;
}

.ag-progress-bar {
  flex: 1;
  height: 4px;
  background: var(--surface-border);
  border-radius: 2px;
  overflow: hidden;
}

.ag-progress-fill {
  height: 100%;
  background: var(--primary-color);
  border-radius: 2px;
  transition: width 0.4s ease;
}

/* Table */
.ag-table-wrap {
  max-height: 420px;
  overflow-y: auto;
  border: 1px solid var(--surface-border);
  border-radius: 10px;
}

.ag-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
  font-variant-numeric: tabular-nums;
}

.ag-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

.ag-table th {
  background: var(--surface-ground);
  color: var(--text-color-secondary);
  font-weight: 500;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid var(--surface-border);
  text-align: left;
}

.ag-th-units,
.ag-th-rate,
.ag-th-cost {
  text-align: right;
}

.ag-table td {
  padding: 0.5rem 0.75rem;
  color: var(--text-color);
  vertical-align: top;
  border-bottom: none;
}

.ag-td-units,
.ag-td-rate,
.ag-td-cost {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.ag-td-cost {
  font-weight: 600;
}

.ag-td-rate {
  color: var(--text-color-secondary);
}

/* Date grouping */
.ag-date-first td {
  border-top: 1px solid var(--surface-border);
  padding-top: 0.65rem;
}

.ag-date-label {
  font-weight: 500;
  color: var(--text-color);
}

/* Module label & badge */
.ag-module-label {
  color: var(--text-color-secondary);
}

.ag-badge-fix {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 500;
  background: rgba(96, 165, 250, 0.15);
  color: #60a5fa;
  padding: 1px 6px;
  border-radius: 4px;
  margin-left: 6px;
  vertical-align: middle;
}

/* Empty */
.ag-empty {
  text-align: center;
  padding: 3rem;
  color: var(--text-color-secondary);
}
</style>
