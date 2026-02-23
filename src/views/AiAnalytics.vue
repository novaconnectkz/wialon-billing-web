<template>
  <div class="ai-analytics">
    <h1 class="page-title">AI Аналитика</h1>
    
    <!-- Статистика -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon-wrapper purple">
          <Sparkles :size="24" />
        </div>
        <div class="stat-content">
          <div class="stat-label">Тренд</div>
          <div class="stat-value">
            <Tag :value="trendLabel" :severity="trendSeverity" />
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon-wrapper blue">
          <Truck :size="24" />
        </div>
        <div class="stat-content">
          <div class="stat-label">Текущий флот</div>
          <div class="stat-value">{{ trends?.current_fleet || 0 }}</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon-wrapper" :class="trends?.net_change >= 0 ? 'green' : 'red'">
          <TrendingUp v-if="trends?.net_change >= 0" :size="24" />
          <TrendingDown v-else :size="24" />
        </div>
        <div class="stat-content">
          <div class="stat-label">Изменение</div>
          <div class="stat-value">
            <span :class="trends?.net_change >= 0 ? 'positive' : 'negative'">
              {{ trends?.net_change >= 0 ? '+' : '' }}{{ trends?.net_change || 0 }}
            </span>
            <small>({{ (trends?.change_percent || 0).toFixed(1) }}%)</small>
          </div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon-wrapper orange">
          <AlertTriangle :size="24" />
        </div>
        <div class="stat-content">
          <div class="stat-label">Аномалии</div>
          <div class="stat-value">{{ trends?.anomalies?.length || 0 }}</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon-wrapper yellow">
          <UserMinus :size="24" />
        </div>
        <div class="stat-content">
          <div class="stat-label">Churn-риски</div>
          <div class="stat-value">{{ trends?.churn_risk_count || 0 }}</div>
        </div>
      </div>
    </div>
    
    <!-- Управление -->
    <div class="controls-bar">
      <div class="controls-left">
        <SelectButton v-model="selectedPeriod" :options="periodOptions" optionLabel="label" optionValue="value" :allowEmpty="true" />
        <div class="date-range-picker">
          <Calendar 
            v-model="dateRange" 
            selectionMode="range" 
            :manualInput="false"
            :maxDate="maxDate"
            :minDate="minDate"
            dateFormat="dd.mm.yy"
            placeholder="Выберите период"
            :showIcon="true"
            :showButtonBar="true"
            :numberOfMonths="2"
            class="custom-date-range"
          />
        </div>
      </div>
      <div class="controls-right">
        <Button 
          label="Обновить данные" 
          icon="pi pi-refresh" 
          :loading="loading"
          @click="loadTrends"
          outlined
        />
        <Button 
          label="AI Анализ" 
          icon="pi pi-sparkles" 
          :loading="analyzing"
          :disabled="!aiEnabled"
          @click="runAnalysis"
        />
      </div>
    </div>
    
    <!-- AI Инсайт -->
    <Card v-if="trends?.ai_insight" class="ai-insight-card">
      <template #title>
        <div class="insight-header">
          <Sparkles :size="20" />
          <span>AI Анализ</span>
        </div>
      </template>
      <template #content>
        <div class="ai-insight-content" v-html="formatInsight(trends.ai_insight)"></div>
      </template>
    </Card>
    
    <!-- График трендов (placeholder) -->
    <Card class="trends-card">
      <template #title>
        <div class="card-header">
          <span>Динамика флота</span>
          <span class="period-label">{{ periodDisplayLabel }}</span>
        </div>
      </template>
      <template #content>
        <div v-if="loading" class="loading-state">
          <ProgressSpinner style="width: 48px; height: 48px" />
        </div>
        <div v-else-if="trends?.trends_data?.length" class="trends-table-wrapper">
          <DataTable 
            :value="trends.trends_data" 
            responsiveLayout="scroll"
            scrollable
            scrollHeight="400px"
            size="small"
          >
            <Column field="date" header="Дата" :sortable="true">
              <template #body="{ data }">
                {{ formatDate(data.date) }}
              </template>
            </Column>
            <Column field="total_units" header="Объектов" :sortable="true" />
            <Column header="Добавлено">
              <template #body="{ data }">
                <span v-if="data.created" class="badge-success">+{{ data.created }}</span>
                <span v-else>—</span>
              </template>
            </Column>
            <Column header="Удалено">
              <template #body="{ data }">
                <span v-if="data.deleted" class="badge-danger">-{{ data.deleted }}</span>
                <span v-else>—</span>
              </template>
            </Column>
            <Column header="Деактивировано">
              <template #body="{ data }">
                <span v-if="data.deactivated" class="badge-warning">{{ data.deactivated }}</span>
                <span v-else>—</span>
              </template>
            </Column>
          </DataTable>
        </div>
        <div v-else class="empty-state">
          <p>Нет данных за выбранный период</p>
        </div>
      </template>
    </Card>
    
    <!-- Аномалии -->
    <Card v-if="trends?.anomalies?.length" class="anomalies-card">
      <template #title>
        <div class="card-header">
          <AlertTriangle :size="20" class="warning-icon" />
          <span>Обнаруженные аномалии</span>
          <Badge :value="trends.anomalies.length" severity="warning" />
        </div>
      </template>
      <template #content>
        <div class="anomalies-list">
          <div 
            v-for="(anomaly, index) in trends.anomalies" 
            :key="index"
            class="anomaly-item"
            :class="anomaly.severity"
          >
            <div class="anomaly-header">
              <Tag :value="anomalyTypeLabel(anomaly.type)" :severity="anomaly.severity === 'critical' ? 'danger' : 'warning'" />
              <span class="anomaly-date">{{ formatDate(anomaly.date) }}</span>
            </div>
            <div class="anomaly-account">{{ anomaly.account_name }}</div>
            <div class="anomaly-description">{{ anomaly.description }}</div>
          </div>
        </div>
      </template>
    </Card>
    
    <!-- Инсайты по аккаунтам -->
    <Card class="insights-card">
      <template #title>
        <div class="card-header">
          <span>AI-инсайты по аккаунтам</span>
          <Badge v-if="insights.length" :value="insights.length" severity="info" />
        </div>
      </template>
      <template #content>
        <!-- Фильтры по статусам -->
        <div v-if="insights.length" class="insight-filters">
          <button 
            class="filter-btn" 
            :class="{ active: severityFilter === 'all' }" 
            @click="severityFilter = 'all'"
          >
            Все <span class="filter-count">{{ insights.length }}</span>
          </button>
          <button 
            class="filter-btn filter-critical" 
            :class="{ active: severityFilter === 'critical' }" 
            @click="severityFilter = 'critical'"
            v-if="countBySeverity('critical')"
          >
            🔴 Критично <span class="filter-count">{{ countBySeverity('critical') }}</span>
          </button>
          <button 
            class="filter-btn filter-warning" 
            :class="{ active: severityFilter === 'warning' }" 
            @click="severityFilter = 'warning'"
            v-if="countBySeverity('warning')"
          >
            🟡 Внимание <span class="filter-count">{{ countBySeverity('warning') }}</span>
          </button>
          <button 
            class="filter-btn filter-info" 
            :class="{ active: severityFilter === 'info' }" 
            @click="severityFilter = 'info'"
            v-if="countBySeverity('info')"
          >
            🔵 Информация <span class="filter-count">{{ countBySeverity('info') }}</span>
          </button>
        </div>

        <div v-if="insightsLoading" class="loading-state">
          <ProgressSpinner style="width: 32px; height: 32px" />
        </div>
        <div v-else-if="filteredInsights.length" class="insights-grid">
          <div 
            v-for="insight in filteredInsights" 
            :key="insight.id"
            class="insight-card"
            :class="'insight-' + insight.severity"
            @click="openInsightDetail(insight)"
          >
            <!-- Верхняя строка: бейдж + аккаунт + дата -->
            <div class="insight-top">
              <Tag :value="severityLabel(insight.severity)" :severity="severityToColor(insight.severity)" rounded />
              <span class="insight-account">{{ insight.account?.name || '—' }}</span>
              <span class="insight-date">{{ formatDateTime(insight.created_at) }}</span>
            </div>
            
            <!-- Заголовок -->
            <div class="insight-title">{{ insight.title }}</div>
            
            <!-- Метрики -->
            <div class="insight-metrics">
              <div v-if="getInsightMeta(insight).delta" class="metric">
                <span class="metric-icon">
                  {{ getInsightMeta(insight).delta > 0 ? '📈' : '📉' }}
                </span>
                <span class="metric-value" :class="getInsightMeta(insight).delta > 0 ? 'positive' : 'negative'">
                  {{ getInsightMeta(insight).delta > 0 ? '+' : '' }}{{ getInsightMeta(insight).delta }} объектов
                </span>
                <span v-if="getInsightMeta(insight).delta_percent" class="metric-percent">
                  ({{ getInsightMeta(insight).delta_percent > 0 ? '+' : '' }}{{ getInsightMeta(insight).delta_percent.toFixed(1) }}%)
                </span>
              </div>
              <div v-if="insight.financial_impact" class="metric">
                <span class="metric-icon">💰</span>
                <span class="metric-value">
                  {{ insight.financial_impact > 0 ? '+' : '' }}{{ formatCurrency(insight.financial_impact, insight.currency) }}
                </span>
              </div>
            </div>
            
            <!-- Описание (компактное, 2 строки) -->
            <div class="insight-description-short">{{ insight.description }}</div>
          </div>
        </div>
        <div v-else-if="insights.length && !filteredInsights.length" class="empty-state">
          <p>Нет инсайтов с выбранным статусом</p>
          <small>Выберите другой фильтр</small>
        </div>
        <div v-else class="empty-state">
          <CheckCircle :size="48" class="success-icon" />
          <p>Нет активных инсайтов</p>
          <small>Всё в порядке!</small>
        </div>
      </template>
    </Card>

    <!-- Модальное окно расширенного инсайта -->
    <Dialog 
      v-model:visible="insightDialogVisible" 
      :header="selectedInsight?.title || 'Детали инсайта'" 
      modal 
      :style="{ width: '600px' }"
      :breakpoints="{ '768px': '95vw' }"
    >
      <div v-if="selectedInsight" class="insight-detail">
        <!-- Статус и тип -->
        <div class="detail-row detail-status">
          <Tag :value="severityLabel(selectedInsight.severity)" :severity="severityToColor(selectedInsight.severity)" rounded />
          <Tag :value="insightTypeLabel(selectedInsight.insight_type)" severity="secondary" rounded />
          <span class="detail-date">{{ formatDateTime(selectedInsight.created_at) }}</span>
        </div>

        <!-- Аккаунт -->
        <div class="detail-section">
          <div class="detail-label">Аккаунт</div>
          <div class="detail-value detail-account-name">{{ selectedInsight.account?.name || '—' }}</div>
        </div>

        <!-- Ключевые метрики -->
        <div class="detail-section detail-metrics-grid">
          <div v-if="selectedMeta.delta" class="detail-metric-card">
            <div class="detail-metric-label">Изменение объектов</div>
            <div class="detail-metric-value" :class="selectedMeta.delta > 0 ? 'positive' : 'negative'">
              {{ selectedMeta.delta > 0 ? '+' : '' }}{{ selectedMeta.delta }}
            </div>
            <div v-if="selectedMeta.delta_percent" class="detail-metric-sub">
              {{ selectedMeta.delta_percent > 0 ? '+' : '' }}{{ selectedMeta.delta_percent.toFixed(1) }}% за период
            </div>
          </div>
          <div v-if="selectedInsight.financial_impact" class="detail-metric-card">
            <div class="detail-metric-label">Финансовое влияние</div>
            <div class="detail-metric-value">
              {{ selectedInsight.financial_impact > 0 ? '+' : '' }}{{ formatCurrency(selectedInsight.financial_impact, selectedInsight.currency) }}
            </div>
            <div class="detail-metric-sub">в месяц</div>
          </div>
        </div>

        <!-- Описание -->
        <div class="detail-section">
          <div class="detail-label">Анализ</div>
          <div class="detail-text">{{ selectedInsight.description }}</div>
        </div>

        <!-- Рекомендация -->
        <div v-if="selectedMeta.recommendation" class="detail-section">
          <div class="detail-label">💡 Рекомендация</div>
          <div class="detail-recommendation">{{ selectedMeta.recommendation }}</div>
        </div>

        <!-- Мета-информация -->
        <div class="detail-footer">
          <span>ID: #{{ selectedInsight.id }}</span>
          <span>Истекает: {{ formatDateTime(selectedInsight.expires_at) }}</span>
        </div>
      </div>
    </Dialog>
    
    <!-- AI Настройки -->
    <Card class="settings-card">
      <template #title>
        <div class="card-header">
          <Settings :size="20" />
          <span>Настройки AI</span>
        </div>
      </template>
      <template #content>
        <div class="settings-form">
          <div class="setting-row">
            <label>AI включён</label>
            <InputSwitch v-model="aiSettings.enabled" @change="saveSettings" />
          </div>
          <div class="setting-row" v-if="aiSettings.enabled">
            <label>Модель анализа</label>
            <Dropdown 
              v-model="aiSettings.analysis_model" 
              :options="modelOptions" 
              optionLabel="label" 
              optionValue="value"
              @change="saveSettings"
            />
          </div>
          <div class="setting-row">
            <label>API ключ</label>
            <div class="api-key-status">
              <i :class="aiSettings.has_api_key ? 'pi pi-check-circle' : 'pi pi-times-circle'" 
                 :style="{ color: aiSettings.has_api_key ? '#22c55e' : '#ef4444' }"></i>
              {{ aiSettings.has_api_key ? 'Настроен' : 'Не настроен' }}
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import Tag from 'primevue/tag'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import SelectButton from 'primevue/selectbutton'
import InputSwitch from 'primevue/inputswitch'
import Dropdown from 'primevue/dropdown'
import ProgressSpinner from 'primevue/progressspinner'
import Calendar from 'primevue/calendar'
import Dialog from 'primevue/dialog'
import { 
  Sparkles, 
  Truck, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  UserMinus,
  CheckCircle,
  Settings
} from 'lucide-vue-next'
import { 
  getFleetTrends, 
  analyzeFleetTrends, 
  getAIInsights, 
  getAISettings,
  updateAISettings
} from '@/services/api'

const toast = useToast()

// State
const loading = ref(false)
const analyzing = ref(false)
const insightsLoading = ref(false)
const trends = ref(null)
const insights = ref([])
const aiSettings = ref({ enabled: false, has_api_key: false, analysis_model: 'deepseek-reasoner' })
const selectedPeriod = ref(7)
const dateRange = ref(null)
const severityFilter = ref('all')
const insightDialogVisible = ref(false)
const selectedInsight = ref(null)

// Ограничения для произвольного диапазона: сегодня и 90 дней назад
const maxDate = ref(new Date())
const minDate = ref((() => {
  const d = new Date()
  d.setDate(d.getDate() - 90)
  return d
})())

// Options
const periodOptions = [
  { label: '7 дней', value: 7 },
  { label: '30 дней', value: 30 },
  { label: '90 дней', value: 90 }
]

const modelOptions = [
  { label: 'DeepSeek R1 (Reasoning)', value: 'deepseek-reasoner' },
  { label: 'DeepSeek V3 (Chat)', value: 'deepseek-chat' }
]

// Computed
const aiEnabled = computed(() => aiSettings.value.enabled && aiSettings.value.has_api_key)

// Сортировка: critical → warning → info, затем по дате
const severityOrder = { critical: 0, warning: 1, info: 2 }

const sortedInsights = computed(() => {
  return [...insights.value].sort((a, b) => {
    const sa = severityOrder[a.severity] ?? 3
    const sb = severityOrder[b.severity] ?? 3
    if (sa !== sb) return sa - sb
    return new Date(b.created_at) - new Date(a.created_at)
  })
})

const filteredInsights = computed(() => {
  if (severityFilter.value === 'all') return sortedInsights.value
  return sortedInsights.value.filter(i => i.severity === severityFilter.value)
})

const countBySeverity = (severity) => {
  return insights.value.filter(i => i.severity === severity).length
}

const selectedMeta = computed(() => {
  if (!selectedInsight.value) return {}
  return getInsightMeta(selectedInsight.value)
})

const trendLabel = computed(() => {
  const trend = trends.value?.trend
  if (trend === 'growth') return 'Рост'
  if (trend === 'decline') return 'Падение'
  return 'Стабильно'
})

const trendSeverity = computed(() => {
  const trend = trends.value?.trend
  if (trend === 'growth') return 'success'
  if (trend === 'decline') return 'danger'
  return 'secondary'
})

// Computed: эффективное количество дней для запроса к API
const effectiveDays = computed(() => {
  // Если выбран произвольный диапазон с двумя датами
  if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
    const diffMs = dateRange.value[1].getTime() - dateRange.value[0].getTime()
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1
    return Math.min(Math.max(days, 1), 90)
  }
  // Иначе — пресет
  return selectedPeriod.value || 7
})

// Computed: лейбл для отображения в заголовке карточки
const periodDisplayLabel = computed(() => {
  if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
    const fmt = (d) => d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
    return `${fmt(dateRange.value[0])} – ${fmt(dateRange.value[1])}`
  }
  return `${effectiveDays.value} дней`
})

// Methods
const loadTrends = async () => {
  loading.value = true
  try {
    const { data } = await getFleetTrends(effectiveDays.value)
    trends.value = data
  } catch (error) {
    console.error('Ошибка загрузки трендов:', error)
    toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Не удалось загрузить данные', life: 3000 })
  } finally {
    loading.value = false
  }
}

const runAnalysis = async () => {
  analyzing.value = true
  try {
    const { data } = await analyzeFleetTrends(effectiveDays.value)
    trends.value = data
    toast.add({ severity: 'success', summary: 'Готово', detail: 'AI анализ завершён', life: 3000 })
  } catch (error) {
    console.error('Ошибка анализа:', error)
    toast.add({ severity: 'error', summary: 'Ошибка', detail: error.response?.data?.error || 'Ошибка AI анализа', life: 3000 })
  } finally {
    analyzing.value = false
  }
}

const loadInsights = async () => {
  insightsLoading.value = true
  try {
    const { data } = await getAIInsights()
    insights.value = data || []
  } catch (error) {
    console.error('Ошибка загрузки инсайтов:', error)
  } finally {
    insightsLoading.value = false
  }
}

const loadSettings = async () => {
  try {
    const { data } = await getAISettings()
    aiSettings.value = data
  } catch (error) {
    console.error('Ошибка загрузки настроек:', error)
  }
}

const saveSettings = async () => {
  try {
    await updateAISettings(aiSettings.value)
    toast.add({ severity: 'success', summary: 'Сохранено', detail: 'Настройки обновлены', life: 2000 })
  } catch (error) {
    console.error('Ошибка сохранения:', error)
    toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Не удалось сохранить настройки', life: 3000 })
  }
}

const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('ru-RU')
}

const formatDateTime = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleString('ru-RU')
}

const formatCurrency = (value, currency) => {
  if (!value) return '—'
  const symbols = { EUR: '€', RUB: '₽', KZT: '₸' }
  const symbol = symbols[currency] || currency
  return `${value.toLocaleString('ru-RU')} ${symbol}`
}

const formatInsight = (text) => {
  if (!text) return ''
  // Пробуем парсить JSON
  try {
    const parsed = JSON.parse(text)
    return parsed.summary || parsed.description || text
  } catch {
    return text.replace(/\n/g, '<br>')
  }
}

const anomalyTypeLabel = (type) => {
  const labels = {
    mass_deletion: 'Массовое удаление',
    rapid_growth: 'Быстрый рост',
    churn_risk: 'Churn-риск'
  }
  return labels[type] || type
}

const insightTypeLabel = (type) => {
  const labels = {
    churn_risk: '⚠️ Риск оттока',
    growth: '📈 Рост',
    financial_impact: '💰 Финансы'
  }
  return labels[type] || type
}

const openInsightDetail = (insight) => {
  selectedInsight.value = insight
  insightDialogVisible.value = true
}

const severityToColor = (severity) => {
  const colors = {
    critical: 'danger',
    warning: 'warning',
    info: 'info'
  }
  return colors[severity] || 'secondary'
}

const severityLabel = (severity) => {
  const labels = {
    critical: 'Критично',
    warning: 'Внимание',
    info: 'Информация'
  }
  return labels[severity] || severity
}

// Безопасный парсинг metadata JSON из инсайта
const getInsightMeta = (insight) => {
  if (!insight.metadata) return {}
  try {
    if (typeof insight.metadata === 'string') {
      return JSON.parse(insight.metadata)
    }
    return insight.metadata
  } catch {
    return {}
  }
}

// Watchers
// При выборе пресета — сбрасываем произвольный диапазон
watch(selectedPeriod, (newVal) => {
  if (newVal) {
    dateRange.value = null
    loadTrends()
  }
})

// При выборе произвольного диапазона — сбрасываем пресет
watch(dateRange, (newVal) => {
  if (newVal && newVal[0] && newVal[1]) {
    selectedPeriod.value = null
    loadTrends()
  }
})

// Lifecycle
onMounted(() => {
  loadSettings()
  loadTrends()
  loadInsights()
})
</script>

<style scoped>
.ai-analytics {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-title {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
}

/* Статистика */
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
}

.stat-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon-wrapper.purple { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
.stat-icon-wrapper.blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.stat-icon-wrapper.green { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
.stat-icon-wrapper.red { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
.stat-icon-wrapper.orange { background: rgba(249, 115, 22, 0.1); color: #f97316; }
.stat-icon-wrapper.yellow { background: rgba(234, 179, 8, 0.1); color: #eab308; }

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-value small {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--text-color-secondary);
}

.positive { color: #22c55e; }
.negative { color: #ef4444; }

/* Управление */
.controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.controls-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.controls-right {
  display: flex;
  gap: 0.5rem;
}

/* Произвольный диапазон дат */
.date-range-picker {
  display: flex;
  align-items: center;
}

.custom-date-range {
  max-width: 260px;
}

:deep(.custom-date-range .p-inputtext) {
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
  background: var(--surface-card);
  border-color: var(--surface-border);
  color: var(--text-color);
}

:deep(.custom-date-range .p-inputtext::placeholder) {
  color: var(--text-color-secondary);
}

:deep(.custom-date-range .p-datepicker-trigger) {
  background: var(--surface-card);
  border-color: var(--surface-border);
  color: var(--text-color-secondary);
}

/* AI Insight */
.ai-insight-card {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.05), rgba(59, 130, 246, 0.05));
  border-color: var(--primary-color);
}

.insight-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--primary-color);
}

.ai-insight-content {
  line-height: 1.6;
}

/* Cards */
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.period-label {
  margin-left: auto;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  font-weight: 400;
}

.warning-icon {
  color: #f97316;
}

/* Anomalies */
.anomalies-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.anomaly-item {
  padding: 1rem;
  border-radius: 8px;
  background: var(--surface-ground);
  border-left: 4px solid var(--surface-border);
}

.anomaly-item.critical {
  border-left-color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
}

.anomaly-item.warning {
  border-left-color: #f97316;
  background: rgba(249, 115, 22, 0.05);
}

.anomaly-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.anomaly-date {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.anomaly-account {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.anomaly-description {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

/* Insights — карточки */
.insights-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.insight-card {
  padding: 1rem 1.25rem;
  border-radius: 10px;
  background: var(--surface-ground);
  border-left: 4px solid var(--text-color-secondary);
  transition: transform 0.15s, box-shadow 0.15s;
}

.insight-card:hover {
  transform: translateX(2px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.insight-info { border-left-color: #3b82f6; }
.insight-warning { border-left-color: #f59e0b; }
.insight-critical { border-left-color: #ef4444; }

.insight-top {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.insight-account {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  font-weight: 500;
}

.insight-date {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  margin-left: auto;
  white-space: nowrap;
}

.insight-title {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.insight-metrics {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.metric {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
  font-weight: 500;
}

.metric-icon {
  font-size: 1.1rem;
}

.metric-value.positive { color: #22c55e; }
.metric-value.negative { color: #ef4444; }

.metric-percent {
  color: var(--text-color-secondary);
  font-size: 0.8rem;
  font-weight: 400;
}

.insight-description {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  line-height: 1.4;
  margin-bottom: 0.5rem;
}

/* Фильтры по статусам */
.insight-filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  border-radius: 20px;
  border: 1px solid var(--surface-border);
  background: transparent;
  color: var(--text-color-secondary);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: var(--surface-hover);
}

.filter-btn.active {
  background: rgba(59, 130, 246, 0.15);
  border-color: #3b82f6;
  color: #93c5fd;
}

.filter-btn.active.filter-critical {
  background: rgba(239, 68, 68, 0.15);
  border-color: #ef4444;
  color: #fca5a5;
}

.filter-btn.active.filter-warning {
  background: rgba(245, 158, 11, 0.15);
  border-color: #f59e0b;
  color: #fcd34d;
}

.filter-btn.active.filter-info {
  background: rgba(59, 130, 246, 0.15);
  border-color: #3b82f6;
  color: #93c5fd;
}

.filter-count {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 0.1rem 0.4rem;
  font-size: 0.7rem;
  font-weight: 600;
}

/* Карточка — клик */
.insight-card {
  cursor: pointer;
}

/* Описание обрезается до 2 строк в списке */
.insight-description-short {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Модальное окно — расширенный инсайт */
.insight-detail {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.detail-status {
  flex-wrap: wrap;
}

.detail-date {
  margin-left: auto;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.detail-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-color-secondary);
  font-weight: 600;
}

.detail-value {
  font-size: 1rem;
}

.detail-account-name {
  font-weight: 600;
  font-size: 1.1rem;
}

.detail-metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.detail-metric-card {
  background: var(--surface-ground);
  border-radius: 10px;
  padding: 1rem;
  text-align: center;
}

.detail-metric-label {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.25rem;
}

.detail-metric-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.detail-metric-value.positive { color: #22c55e; }
.detail-metric-value.negative { color: #ef4444; }

.detail-metric-sub {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  margin-top: 0.15rem;
}

.detail-text {
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--text-color);
}

.detail-recommendation {
  padding: 0.75rem 1rem;
  background: rgba(59, 130, 246, 0.08);
  border-radius: 8px;
  font-size: 0.9rem;
  color: #93c5fd;
  line-height: 1.5;
}

.detail-footer {
  display: flex;
  justify-content: space-between;
  padding-top: 0.75rem;
  border-top: 1px solid var(--surface-border);
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

/* Settings */
.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.setting-row label {
  font-weight: 500;
}

.api-key-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Empty & Loading */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--text-color-secondary);
}

.success-icon {
  color: #22c55e;
  margin-bottom: 0.5rem;
}

/* Badges */
.badge-success {
  color: #22c55e;
  font-weight: 600;
}

.badge-danger {
  color: #ef4444;
  font-weight: 600;
}

.badge-warning {
  color: #eab308;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .controls-bar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
