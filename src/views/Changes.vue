<template>
  <div class="changes-page">
    <h1 class="page-title">Изменения объектов</h1>
    
    <!-- Статистика -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon-wrapper green">
          <Plus :size="24" />
        </div>
        <div class="stat-content">
          <div class="stat-label">Добавлено</div>
          <div class="stat-value">{{ totalCreated }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrapper red">
          <Minus :size="24" />
        </div>
        <div class="stat-content">
          <div class="stat-label">Удалено</div>
          <div class="stat-value">{{ totalDeleted }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon-wrapper blue">
          <Activity :size="24" />
        </div>
        <div class="stat-content">
          <div class="stat-label">Снимков</div>
          <div class="stat-value">{{ filteredSnapshots.length }}</div>
        </div>
      </div>
    </div>

    <!-- Фильтры -->
    <div class="filters-panel">
      <div class="filter-item date-filter">
        <span class="filter-label">Период</span>
        <Calendar 
          v-model="dateRange" 
          selectionMode="range"
          :manualInput="false"
          dateFormat="dd.mm.yy"
          placeholder="Начало - Конец"
          class="date-picker-custom"
          showIcon
          iconDisplay="input"
          :showButtonBar="true"
        >
            <template #footer>
                <div class="p-2 text-center text-sm text-color-secondary">
                    Выберите вторую дату для завершения периода
                </div>
            </template>
        </Calendar>
      </div>

      <div class="filter-divider"></div>

      <div class="filter-item switch-filter">
        <InputSwitch v-model="onlyWithChanges" inputId="changes-switch" />
        <label for="changes-switch" class="switch-label">Только с изменениями</label>
      </div>

      <div class="filter-actions">
        <Button 
          type="button" 
          label="Сбросить" 
          icon="pi pi-times" 
          severity="secondary" 
          text 
          size="small"
          @click="resetFilters"
        />
      </div>
    </div>
    
    <!-- Таблица -->
    <Card class="table-card">
      <template #content>
        <DataTable 
          :value="filteredSnapshots" 
          :loading="loading"
          :paginator="true"
          :rows="20"
          responsiveLayout="scroll"
          emptyMessage="Нет данных об изменениях"
          size="small"
          class="changes-table"
        >
          <Column header="№" style="width: 50px">
            <template #body="{ index }">
              <span class="row-number">{{ index + 1 }}</span>
            </template>
          </Column>
          <Column field="account.name" header="Аккаунт" />
          <Column field="total_units" header="Объектов" style="width: 100px">
             <template #body="{ data }">
              <span class="units-count">{{ data.total_units }}</span>
            </template>
          </Column>
          <Column header="Добавлено" style="width: 120px; text-align: center">
            <template #body="{ data }">
              <div v-if="data.units_created" class="diff-badge created">
                 <Plus :size="14" strokeWidth="3" />
                 <span>{{ data.units_created }}</span>
              </div>
              <span v-else class="empty-dash">—</span>
            </template>
          </Column>
          <Column header="Удалено" style="width: 120px; text-align: center">
            <template #body="{ data }">
               <div v-if="data.units_deleted" class="diff-badge deleted">
                 <Minus :size="14" strokeWidth="3" />
                 <span>{{ data.units_deleted }}</span>
              </div>
              <span v-else class="empty-dash">—</span>
            </template>
          </Column>
          <Column field="created_at" header="Дата" style="width: 120px; text-align: right">
            <template #body="{ data }">
              <span class="date-cell">{{ formatDate(data.created_at) }}</span>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getSnapshots } from '@/services/api'
import { Plus, Minus, Activity, Calendar as CalendarIcon, FilterX } from 'lucide-vue-next'
import InputSwitch from 'primevue/inputswitch'

const snapshots = ref([])
const loading = ref(false)
const onlyWithChanges = ref(true)

// Инициализация периода текущим месяцем
const now = new Date()
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
const dateRange = ref([startOfMonth, endOfMonth])

// Подсчёт статистики
const totalCreated = computed(() => 
  filteredSnapshots.value.reduce((sum, s) => sum + (s.units_created || 0), 0)
)

const totalDeleted = computed(() => 
  filteredSnapshots.value.reduce((sum, s) => sum + (s.units_deleted || 0), 0)
)

// Фильтрация
const filteredSnapshots = computed(() => {
  let result = snapshots.value

  // Только с изменениями
  if (onlyWithChanges.value) {
    result = result.filter(s => s.units_created > 0 || s.units_deleted > 0)
  }

  // Фильтр по дате
  if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
    const startDate = new Date(dateRange.value[0])
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(dateRange.value[1])
    endDate.setHours(23, 59, 59, 999)

    result = result.filter(s => {
      const date = new Date(s.created_at)
      return date >= startDate && date <= endDate
    })
  }

  return result
})

const resetFilters = () => {
  dateRange.value = null
  onlyWithChanges.value = true
}

const loadSnapshots = async () => {
  loading.value = true
  try {
    const { data } = await getSnapshots()
    snapshots.value = data || []
  } catch (error) {
    console.error('Ошибка загрузки снимков:', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('ru-RU')
}

onMounted(() => {
  loadSnapshots()
})
</script>

<style scoped>
.changes-page {
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
  grid-template-columns: repeat(3, 1fr);
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

.stat-icon-wrapper.green {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.2));
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.stat-icon-wrapper.red {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.2));
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.stat-icon-wrapper.blue {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.2));
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.2);
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
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
}

/* Фильтры */
.filters-panel {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.filter-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  font-weight: 500;
}

.date-picker-custom {
  width: 240px;
}

.filter-divider {
  width: 1px;
  height: 24px;
  background-color: var(--surface-border);
}

.switch-filter {
  cursor: pointer;
}

.switch-label {
  font-size: 0.95rem;
  cursor: pointer;
  user-select: none;
}

.filter-actions {
  margin-left: auto;
}

/* Таблица */
.table-card {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--surface-border);
}

.changes-table {
  font-size: 0.95rem;
}

.row-number {
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

.units-count {
  font-weight: 600;
}

.diff-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  min-width: 70px;
  justify-content: center;
}

.diff-badge.created {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.diff-badge.deleted {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.empty-dash {
  color: var(--text-color-secondary);
  opacity: 0.5;
}

.date-cell {
  color: var(--text-color-secondary);
  font-variant-numeric: tabular-nums;
}

/* Адаптивность */
@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .filters-panel {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .filter-divider {
    display: none;
  }
  
  .date-picker-custom {
    width: 100%;
  }
  
  .filter-actions {
    margin-left: 0;
  }
}
</style>
