<template>
  <div v-if="insight" :class="['ai-insight-badge', `severity-${insight.severity}`]">
    <div class="badge-header" @click="expanded = !expanded">
      <i :class="severityIcon"></i>
      <span class="badge-title">{{ insight.title }}</span>
      <i :class="['expand-icon pi', expanded ? 'pi-chevron-up' : 'pi-chevron-down']"></i>
    </div>
    
    <div v-if="expanded" class="badge-content">
      <p class="description">{{ insight.description }}</p>
      
      <div v-if="insight.financial_impact" class="financial-impact">
        <span class="impact-label">Финансовое влияние:</span>
        <span :class="['impact-value', insight.financial_impact > 0 ? 'positive' : 'negative']">
          {{ formatCurrency(insight.financial_impact, insight.currency) }}
        </span>
      </div>
      
      <div class="feedback-section" v-if="!feedbackSent">
        <span class="feedback-label">Полезно?</span>
        <Button icon="pi pi-thumbs-up" class="p-button-text p-button-sm" @click="sendFeedback(true)" />
        <Button icon="pi pi-thumbs-down" class="p-button-text p-button-sm" @click="sendFeedback(false)" />
      </div>
      <div v-else class="feedback-thanks">
        <i class="pi pi-check-circle"></i> Спасибо!
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Button from 'primevue/button'
import { sendInsightFeedback } from '@/services/api'

const props = defineProps({
  insight: {
    type: Object,
    required: true
  }
})

const expanded = ref(false)
const feedbackSent = ref(false)

const severityIcon = computed(() => {
  const icons = {
    'critical': 'pi pi-exclamation-triangle',
    'warning': 'pi pi-exclamation-circle',
    'info': 'pi pi-info-circle'
  }
  return icons[props.insight.severity] || icons.info
})

const formatCurrency = (value, currency) => {
  const sign = value > 0 ? '+' : ''
  return `${sign}${Math.abs(value).toLocaleString('ru-RU')} ${currency || 'KZT'}`
}

const sendFeedback = async (helpful) => {
  try {
    await sendInsightFeedback(props.insight.id, helpful)
    feedbackSent.value = true
  } catch (error) {
    console.error('Ошибка отправки обратной связи:', error)
  }
}
</script>

<style scoped>
.ai-insight-badge {
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
}

.severity-critical {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05));
  border-left: 3px solid #ef4444;
}

.severity-warning {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05));
  border-left: 3px solid #f59e0b;
}

.severity-info {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05));
  border-left: 3px solid #3b82f6;
}

.badge-header {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.badge-header i:first-child {
  font-size: 1rem;
}

.severity-critical .badge-header i:first-child { color: #ef4444; }
.severity-warning .badge-header i:first-child { color: #f59e0b; }
.severity-info .badge-header i:first-child { color: #3b82f6; }

.badge-title {
  flex: 1;
  font-weight: 500;
  font-size: 0.875rem;
}

.expand-icon {
  color: var(--text-color-secondary);
  font-size: 0.75rem;
}

.badge-content {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--surface-border);
}

.description {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin: 0 0 12px;
}

.financial-impact {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.impact-label {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.impact-value {
  font-weight: 600;
  font-size: 0.875rem;
}

.impact-value.positive { color: #22c55e; }
.impact-value.negative { color: #ef4444; }

.feedback-section {
  display: flex;
  align-items: center;
  gap: 4px;
}

.feedback-label {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.feedback-thanks {
  font-size: 0.75rem;
  color: #22c55e;
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
