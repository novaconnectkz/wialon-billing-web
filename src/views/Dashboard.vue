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
          <span>Данные за выбранный период</span>
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
          <Column header="" style="width: 80px">
            <template #body="{ data }">
              <Button 
                icon="pi pi-chart-bar" 
                text 
                rounded
                severity="info"
                title="Статистика"
                @click="showStats(data.account)"
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getDashboard, getAccountStats } from '@/services/api'
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

// Фильтруем снимки по выбранному диапазону дат
const filteredSnapshots = computed(() => {
  if (!dashboard.value.snapshots) return []
  if (!dateRange.value || dateRange.value.length < 2) return dashboard.value.snapshots
  
  const [start, end] = dateRange.value
  if (!start || !end) return dashboard.value.snapshots
  
  // Устанавливаем время для корректного сравнения
  const startDate = new Date(start)
  startDate.setHours(0, 0, 0, 0)
  const endDate = new Date(end)
  endDate.setHours(23, 59, 59, 999)
  
  return dashboard.value.snapshots.filter(s => {
    const snapshotDate = new Date(s.snapshot_date)
    return snapshotDate >= startDate && snapshotDate <= endDate
  })
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

const formatCurrency = (value, currency) => {
  if (!value) return '—'
  const symbols = { EUR: '€', RUB: '₽', KZT: '₸' }
  const symbol = symbols[currency] || currency
  return `${value.toLocaleString('ru-RU')} ${symbol}`
}

const hasCosts = computed(() => {
  const costs = dashboard.value?.cost_by_currency
  return costs && Object.keys(costs).length > 0
})

const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('ru-RU')
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
</style>
