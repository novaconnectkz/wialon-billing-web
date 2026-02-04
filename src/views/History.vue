<template>
  <div class="history-page">
    <div class="page-header">
      <h1 class="page-title">История снимков</h1>
      <div class="header-actions">
        <Button 
          label="Очистить всё" 
          severity="danger"
          outlined
          @click="showClearDialog = true"
        >
          <template #icon>
            <Trash2 :size="18" />
          </template>
        </Button>
        <Button 
          label="Создать снимки" 
          severity="success"
          @click="showCreateDialog = true"
        >
          <template #icon>
            <Plus :size="18" />
          </template>
        </Button>
      </div>
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
    
    <!-- Диалог создания снимков за дату -->
    <Dialog 
      v-model:visible="showCreateDialog" 
      header="Создать снимки за дату"
      :modal="true"
      :style="{ width: '400px' }"
    >
      <div class="create-form">
        <div class="form-field">
          <label>Выберите дату:</label>
          <Calendar 
            v-model="createDate" 
            dateFormat="dd.mm.yy"
            :maxDate="new Date()"
            showIcon
          />
        </div>
        <Message v-if="createError" severity="error" :closable="false">{{ createError }}</Message>
        <Message v-if="createSuccess" severity="success" :closable="false">{{ createSuccess }}</Message>
      </div>
      <template #footer>
        <Button label="Отмена" text @click="showCreateDialog = false" />
        <Button 
          label="Создать" 
          severity="success" 
          :loading="creating"
          @click="createSnapshotsForDate"
        />
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { getSnapshots, createSnapshotsForDate as apiCreateSnapshots, clearAllSnapshots as apiClearSnapshots } from '@/services/api'
import { Eye, Plus, Trash2 } from 'lucide-vue-next'

const toast = useToast()
const snapshots = ref([])
const loading = ref(false)
const showDialog = ref(false)
const selectedSnapshot = ref(null)

// Создание снимков
const showCreateDialog = ref(false)
const createDate = ref(new Date())
const creating = ref(false)
const createError = ref('')
const createSuccess = ref('')

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

const createSnapshotsForDate = async () => {
  createError.value = ''
  createSuccess.value = ''
  creating.value = true
  
  try {
    // Форматируем дату в YYYY-MM-DD
    const date = createDate.value
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    
    const { data } = await apiCreateSnapshots(dateStr)
    
    createSuccess.value = `Создано ${data.count} снимков за ${formatDate(date)}`
    toast.add({ 
      severity: 'success', 
      summary: 'Успех', 
      detail: createSuccess.value,
      life: 5000
    })
    
    // Перезагружаем список
    await loadSnapshots()
    
    // Закрываем диалог через 2 сек
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
    
    // Перезагружаем список
    await loadSnapshots()
    
    // Закрываем диалог
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

.create-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.clear-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
