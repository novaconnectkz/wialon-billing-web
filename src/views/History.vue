<template>
  <div class="history-page">
    <div class="page-header">
      <h1 class="page-title">История снимков</h1>
    </div>
    
    <Card>
      <template #content>
        <DataTable 
          :value="snapshots" 
          :loading="loading"
          :paginator="true"
          :rows="20"
          responsiveLayout="scroll"
          emptyMessage="Нет снимков"
        >
          <Column field="id" header="ID" />
          <Column field="account.name" header="Аккаунт" />
          <Column field="total_units" header="Объектов">
            <template #body="{ data }">
              <span class="units-count">{{ data.total_units }}</span>
            </template>
          </Column>
          <Column header="Изменения">
            <template #body="{ data }">
              <span v-if="data.units_created > 0" class="change-created">+{{ data.units_created }}</span>
              <span v-if="data.units_deleted > 0" class="change-deleted">-{{ data.units_deleted }}</span>
              <span v-if="!data.units_created && !data.units_deleted">—</span>
            </template>
          </Column>
          <Column header="Дата снимка">
            <template #body="{ data }">
              {{ formatDate(data.snapshot_date) }}
            </template>
          </Column>
          <Column header="Действия">
            <template #body="{ data }">
              <Button 
                text 
                v-tooltip="'Просмотр'"
                @click="viewSnapshot(data)"
              >
                <template #icon>
                  <Eye :size="20" />
                </template>
              </Button>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
    
    <!-- Диалог просмотра снимка -->
    <Dialog 
      v-model:visible="showDialog" 
      header="Детали снимка"
      :modal="true"
      :style="{ width: '600px' }"
    >
      <div v-if="selectedSnapshot" class="snapshot-details">
        <div class="detail-row">
          <span class="label">ID:</span>
          <span class="value">{{ selectedSnapshot.id }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Аккаунт:</span>
          <span class="value">{{ selectedSnapshot.account?.name || '—' }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Объектов:</span>
          <span class="value">{{ selectedSnapshot.total_units }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Дата снимка:</span>
          <span class="value">{{ formatDate(selectedSnapshot.snapshot_date) }}</span>
        </div>
      </div>
    </Dialog>
    
    <!-- Диалог создания снимков за диапазон дат -->
    <Dialog 
      v-model:visible="showCreateDialog" 
      header="Создать снимки"
      :modal="true"
      :style="{ width: '420px' }"
    >
      <div class="create-form">
        <div class="date-range-info">
          <div class="range-label">Период создания снимков:</div>
          <div class="range-value">
            <CalendarIcon :size="16" class="range-icon" />
            <span>{{ formatDate(createDateTo) }} → {{ formatDate(yesterday) }}</span>
          </div>
        </div>
        <div class="form-field">
          <label>Рассчитать начиная с:</label>
          <Calendar 
            v-model="createDateTo" 
            dateFormat="dd.mm.yy"
            :maxDate="yesterday"
            showIcon
            placeholder="Выберите дату"
          />
          <small class="hint">Снимки будут созданы с этой даты до вчера ({{ formatDate(yesterday) }})</small>
        </div>
        
        <!-- Индикатор загрузки -->
        <div v-if="creating" class="loading-section">
          <ProgressBar mode="indeterminate" style="height: 6px" />
          <small class="progress-text">Создание снимков с обратным расчётом...</small>
        </div>
        
        <Message v-if="createError" severity="error" :closable="false">{{ createError }}</Message>
        <Message v-if="createSuccess" severity="success" :closable="false">{{ createSuccess }}</Message>
      </div>
      <template #footer>
        <Button label="Отмена" text @click="showCreateDialog = false" :disabled="creating" />
        <Button 
          label="Создать снимки" 
          severity="success" 
          :loading="creating"
          @click="createSnapshotsRange"
        >
          <template #icon>
            <Plus :size="18" />
          </template>
        </Button>
      </template>
    </Dialog>
    
    <!-- Диалог очистки всех снимков -->
    <Dialog 
      v-model:visible="showClearDialog" 
      header="Очистить все снимки"
      :modal="true"
      :style="{ width: '400px' }"
    >
      <div class="clear-form">
        <Message severity="warn" :closable="false">
          Это действие удалит ВСЕ снимки и изменения. Это необратимо!
        </Message>
        <div class="form-field">
          <label>Введите код подтверждения:</label>
          <InputText v-model="clearCode" placeholder="Код подтверждения" />
        </div>
        <Message v-if="clearError" severity="error" :closable="false">{{ clearError }}</Message>
      </div>
      <template #footer>
        <Button label="Отмена" text @click="showClearDialog = false" />
        <Button 
          label="Удалить всё" 
          severity="danger" 
          :loading="clearing"
          @click="clearAllSnapshots"
        />
      </template>
    </Dialog>
    
    <!-- FAB (Floating Action Button) -->
    <div class="fab-container">
      <transition name="fab-actions">
        <div v-if="fabOpen" class="fab-actions">
          <div class="fab-action" @click="fabOpen = false; showClearDialog = true">
            <span class="fab-action-label">Очистить всё</span>
            <button class="fab-action-btn fab-danger">
              <Trash2 :size="20" />
            </button>
          </div>
          <div class="fab-action" @click="fabOpen = false; showCreateDialog = true">
            <span class="fab-action-label">Создать снимки</span>
            <button class="fab-action-btn fab-success">
              <Camera :size="20" />
            </button>
          </div>
        </div>
      </transition>
      <button 
        class="fab-main" 
        :class="{ 'fab-active': fabOpen }"
        @click="fabOpen = !fabOpen"
      >
        <Plus :size="24" class="fab-icon" />
      </button>
      <transition name="fab-overlay">
        <div v-if="fabOpen" class="fab-overlay" @click="fabOpen = false" />
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { getSnapshots, createSnapshotsForRange as apiCreateRange, clearAllSnapshots as apiClearSnapshots } from '@/services/api'
import { Eye, Plus, Trash2, Calendar as CalendarIcon, Camera } from 'lucide-vue-next'

const toast = useToast()
const snapshots = ref([])
const loading = ref(false)
const showDialog = ref(false)
const selectedSnapshot = ref(null)

// FAB
const fabOpen = ref(false)

// Создание снимков
const showCreateDialog = ref(false)
const createDateTo = ref((() => {
  const d = new Date()
  d.setDate(d.getDate() - 7) // По умолчанию = неделю назад
  return d
})())
const creating = ref(false)
const createError = ref('')
const createSuccess = ref('')

// Вчерашняя дата (максимум для выбора)
const yesterday = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d
})

// Очистка снимков
const showClearDialog = ref(false)
const clearCode = ref('')
const clearing = ref(false)
const clearError = ref('')

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

const viewSnapshot = (snapshot) => {
  selectedSnapshot.value = snapshot
  showDialog.value = true
}

// Форматирование даты в YYYY-MM-DD
const toDateStr = (d) => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Создание снимков за диапазон дат (от выбранной даты до сегодня)
const createSnapshotsRange = async () => {
  createError.value = ''
  createSuccess.value = ''
  creating.value = true
  
  try {
    const startDate = new Date(createDateTo.value)
    startDate.setHours(0, 0, 0, 0)
    
    // Конец диапазона — вчера (снимки всегда за предыдущий день)
    const endDate = new Date()
    endDate.setDate(endDate.getDate() - 1)
    endDate.setHours(0, 0, 0, 0)
    
    const fromStr = toDateStr(startDate)
    const toStr = toDateStr(endDate)
    
    const { data } = await apiCreateRange(fromStr, toStr)
    
    createSuccess.value = `Создано ${data.count} снимков за ${formatDate(startDate)} — ${formatDate(endDate)}`
    
    toast.add({ 
      severity: 'success', 
      summary: 'Успех', 
      detail: createSuccess.value,
      life: 5000
    })
    
    await loadSnapshots()
    
    setTimeout(() => {
      showCreateDialog.value = false
      createSuccess.value = ''
    }, 2000)
  } catch (error) {
    createError.value = error.response?.data?.error || error.message
    toast.add({ severity: 'error', summary: 'Ошибка', detail: createError.value })
  } finally {
    creating.value = false
  }
}

const clearAllSnapshots = async () => {
  clearError.value = ''
  clearing.value = true
  
  try {
    const { data } = await apiClearSnapshots(clearCode.value)
    
    toast.add({ 
      severity: 'success', 
      summary: 'Успех', 
      detail: `Удалено ${data.count} снимков`,
      life: 5000
    })
    
    await loadSnapshots()
    showClearDialog.value = false
    clearCode.value = ''
  } catch (error) {
    clearError.value = error.response?.data?.error || error.message
    toast.add({ severity: 'error', summary: 'Ошибка', detail: clearError.value })
  } finally {
    clearing.value = false
  }
}

onMounted(() => {
  loadSnapshots()
})
</script>

<style scoped>
.history-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
}

.units-count {
  font-weight: 600;
  color: var(--primary-color);
}

.change-created {
  color: var(--green-500);
  font-weight: 600;
  margin-right: 0.5rem;
}

.change-deleted {
  color: var(--red-500);
  font-weight: 600;
}

.snapshot-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-row {
  display: flex;
  gap: 1rem;
}

.detail-row .label {
  font-weight: 500;
  color: var(--text-color-secondary);
  min-width: 100px;
}

.detail-row .value {
  color: var(--text-color);
}

/* === Форма создания снимков === */
.create-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.date-range-info {
  background: var(--surface-100, rgba(255,255,255,0.05));
  border-radius: 10px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.range-label {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.range-value {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1.05rem;
  color: var(--primary-color);
}

.range-icon {
  opacity: 0.7;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-weight: 500;
}

.hint {
  color: var(--text-color-secondary);
  font-size: 0.8rem;
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-text {
  color: var(--text-color-secondary);
  text-align: center;
}

.clear-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* === FAB === */
.fab-container {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.fab-main {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  border: none;
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1002;
}

.fab-main:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 28px rgba(16, 185, 129, 0.5);
}

.fab-main.fab-active {
  background: linear-gradient(135deg, #64748b, #475569);
  box-shadow: 0 4px 20px rgba(100, 116, 139, 0.4);
}

.fab-icon {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fab-active .fab-icon {
  transform: rotate(45deg);
}

.fab-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
  z-index: 1002;
}

.fab-action {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  animation: fabSlideUp 0.2s ease-out both;
}

.fab-action:nth-child(1) { animation-delay: 0.05s; }
.fab-action:nth-child(2) { animation-delay: 0.1s; }

@keyframes fabSlideUp {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.fab-action-label {
  background: var(--surface-card, #1e293b);
  color: var(--text-color, #e2e8f0);
  padding: 0.5rem 0.85rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 2px 12px rgba(0,0,0,0.2);
  pointer-events: none;
}

.fab-action-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 12px rgba(0,0,0,0.15);
}

.fab-action-btn:hover {
  transform: scale(1.1);
}

.fab-success {
  background: linear-gradient(135deg, #10b981, #059669);
}

.fab-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.fab-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.3);
  z-index: 1001;
  backdrop-filter: blur(2px);
}

/* Анимации FAB */
.fab-actions-enter-active {
  transition: all 0.2s ease-out;
}
.fab-actions-leave-active {
  transition: all 0.15s ease-in;
}
.fab-actions-enter-from,
.fab-actions-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.fab-overlay-enter-active {
  transition: opacity 0.2s ease;
}
.fab-overlay-leave-active {
  transition: opacity 0.15s ease;
}
.fab-overlay-enter-from,
.fab-overlay-leave-to {
  opacity: 0;
}
</style>
