<template>
  <Card class="ai-dashboard-widget">
    <template #title>
      <div class="widget-header">
        <i class="pi pi-sparkles"></i>
        <span>AI Аналитика</span>
        <Badge v-if="insights.length" :value="insights.length" severity="info" />
      </div>
    </template>
    <template #content>
      <div v-if="loading" class="loading-state">
        <ProgressSpinner style="width: 32px; height: 32px" />
        <span>Загрузка инсайтов...</span>
      </div>
      
      <div v-else-if="!enabled" class="disabled-state">
        <i class="pi pi-cog"></i>
        <p>AI аналитика не настроена</p>
        <small>Настройте API ключ в разделе Настройки → AI</small>
      </div>
      
      <div v-else-if="insights.length === 0" class="empty-state">
        <i class="pi pi-check-circle"></i>
        <p>Нет активных инсайтов</p>
        <small>Всё в порядке!</small>
      </div>
      
      <div v-else class="insights-list">
        <AiInsightBadge
          v-for="insight in visibleInsights"
          :key="insight.id"
          :insight="insight"
        />
        
        <Button
          v-if="insights.length > 3 && !showAll"
          label="Показать все"
          class="p-button-text p-button-sm"
          icon="pi pi-angle-down"
          @click="showAll = true"
        />
      </div>
    </template>
  </Card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Card from 'primevue/card'
import Badge from 'primevue/badge'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import AiInsightBadge from './AiInsightBadge.vue'
import { getAIInsights, getAISettings } from '@/services/api'

const loading = ref(true)
const enabled = ref(false)
const insights = ref([])
const showAll = ref(false)

const visibleInsights = computed(() => {
  return showAll.value ? insights.value : insights.value.slice(0, 3)
})

const loadData = async () => {
  try {
    // Проверяем настройки
    const settingsRes = await getAISettings()
    enabled.value = settingsRes.data.enabled && settingsRes.data.has_api_key
    
    if (enabled.value) {
      const insightsRes = await getAIInsights()
      insights.value = insightsRes.data || []
    }
  } catch (error) {
    console.error('Ошибка загрузки AI данных:', error)
    enabled.value = false
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.ai-dashboard-widget {
  height: 100%;
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.widget-header i {
  color: #8b5cf6;
}

.loading-state,
.disabled-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
  color: var(--text-color-secondary);
}

.loading-state span,
.disabled-state p,
.empty-state p {
  margin-top: 12px;
  font-weight: 500;
}

.disabled-state small,
.empty-state small {
  margin-top: 4px;
  font-size: 0.75rem;
  opacity: 0.7;
}

.disabled-state i,
.empty-state i {
  font-size: 2rem;
}

.empty-state i {
  color: #22c55e;
}

.disabled-state i {
  color: var(--text-color-secondary);
}

.insights-list {
  display: flex;
  flex-direction: column;
}
</style>
