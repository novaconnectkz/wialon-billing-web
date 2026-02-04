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
      <SelectButton v-model="selectedPeriod" :options="periodOptions" optionLabel="label" optionValue="value" />
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
          <span class="period-label">{{ selectedPeriod }} дней</span>
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
          <span>История AI-инсайтов</span>
          <Badge v-if="insights.length" :value="insights.length" severity="info" />
        </div>
      </template>
      <template #content>
        <div v-if="insightsLoading" class="loading-state">
          <ProgressSpinner style="width: 32px; height: 32px" />
        </div>
        <div v-else-if="insights.length" class="insights-list">
          <div 
            v-for="insight in insights" 
            :key="insight.id"
            class="insight-item"
            :class="insight.severity"
          >
            <div class="insight-header-row">
              <Tag :value="insight.severity" :severity="severityToColor(insight.severity)" rounded />
              <span class="insight-date">{{ formatDateTime(insight.created_at) }}</span>
            </div>
            <div class="insight-title">{{ insight.title }}</div>
            <div class="insight-description">{{ insight.description }}</div>
            <div v-if="insight.financial_impact" class="insight-impact">
              Влияние: {{ formatCurrency(insight.financial_impact, insight.currency) }}
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <CheckCircle :size="48" class="success-icon" />
          <p>Нет активных инсайтов</p>
          <small>Всё в порядке!</small>
        </div>
      </template>
    </Card>
    
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
const selectedPeriod = ref(30)

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

// Methods
const loadTrends = async () => {
  loading.value = true
  try {
    const { data } = await getFleetTrends(selectedPeriod.value)
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
    const { data } = await analyzeFleetTrends(selectedPeriod.value)
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

const severityToColor = (severity) => {
  const colors = {
    critical: 'danger',
    warning: 'warning',
    info: 'info'
  }
  return colors[severity] || 'secondary'
}

// Watchers
watch(selectedPeriod, () => {
  loadTrends()
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

.controls-right {
  display: flex;
  gap: 0.5rem;
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

/* Insights */
.insights-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.insight-item {
  padding: 1rem;
  border-radius: 8px;
  background: var(--surface-ground);
}

.insight-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.insight-date {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.insight-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.insight-description {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.insight-impact {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
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
