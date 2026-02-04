<template>
  <div class="settings-page">
    <h1 class="page-title">Настройки</h1>
    
    <!-- Tabs для разделов -->
    <div class="settings-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        <component :is="tab.icon" :size="20" />
        <span>{{ tab.label }}</span>
      </button>
    </div>
    
    <!-- Учётные записи -->
    <Card v-if="activeTab === 'accounts'" class="settings-card">
      <template #title>
        <div class="card-header">
          <span>Аккаунты</span>
          <span v-if="selectedAccounts.length > 0" class="selected-count">
            Выбрано: {{ selectedAccounts.length }}
          </span>
        </div>
      </template>
      <template #content>
        <DataTable 
          v-model:selection="selectedAccounts"
          :value="accounts" 
          :loading="loading"
          responsiveLayout="scroll"
          dataKey="id"
        >
          <Column selectionMode="multiple" headerStyle="width: 3rem" />
          <Column header="№" style="width: 60px">
            <template #body="{ index }">
              {{ index + 1 }}
            </template>
          </Column>
          <Column field="name" header="Название" />
          <Column field="wialon_id" header="Wialon ID" />
          <Column header="Статус" style="width: 80px; text-align: center">
            <template #body="{ data }">
              <div style="display: flex; justify-content: center; align-items: center;">
                <CheckCircle2 v-if="data.is_active && !data.is_blocked" :size="20" style="color: var(--green-500)" v-tooltip="'Активен'" />
                <Ban v-else-if="data.is_blocked" :size="20" style="color: var(--orange-500)" v-tooltip="'Заблокирован'" />
                <XCircle v-else :size="20" style="color: var(--red-500)" v-tooltip="'Удалён из Wialon'" />
              </div>
            </template>
          </Column>
          <Column header="Дилер" style="width: 80px; text-align: center">
            <template #body="{ data }">
              <div style="display: flex; justify-content: center; align-items: center;">
                <CheckCircle2 v-if="data.is_dealer" :size="20" style="color: var(--green-500)" v-tooltip="'Дилер'" />
                <X v-else :size="20" style="color: var(--surface-400)" v-tooltip="'Не дилер'" />
              </div>
            </template>
          </Column>
          <Column header="Биллинг" style="width: 100px; text-align: center">
            <template #body="{ data }">
              <div style="display: flex; justify-content: center; align-items: center; cursor: pointer;" @click="toggleAccount(data.id)">
                <CheckCircle2 v-if="data.is_billing_enabled" :size="20" style="color: var(--green-500)" v-tooltip="'Включено'" />
                <Circle v-else :size="20" style="color: var(--surface-400)" v-tooltip="'Выключено'" />
              </div>
            </template>
          </Column>
          <Column header="Валюта" style="width: 80px; text-align: center">
            <template #body="{ data }">
              <Tag :value="data.billing_currency || 'KZT'" :severity="getCurrencySeverity(data.billing_currency)" />
            </template>
          </Column>
          <Column header="Модули" style="width: 120px">
            <template #body="{ data }">
              <div class="module-icons" v-if="data.modules && data.modules.length">
                <span 
                  v-for="am in data.modules" 
                  :key="am.id" 
                  class="module-icon"
                  v-tooltip.top="am.module?.name || 'Модуль'"
                >
                  <Package :size="18" />
                </span>
              </div>
              <span v-else class="no-modules">—</span>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
    
    <!-- FAB группа для аккаунтов -->
    <div v-if="activeTab === 'accounts'" class="fab-group">
      <!-- Кнопки массовых операций (при выборе) -->
      <template v-if="selectedAccounts.length > 0">
        <!-- Реквизиты (только при выборе одного аккаунта) -->
        <Button 
          v-if="selectedAccounts.length === 1"
          @click="openAccountDetails(selectedAccounts[0])"
          rounded
          severity="secondary"
          class="fab-button"
          v-tooltip.left="'Реквизиты покупателя'"
        >
          <template #icon>
            <FileText :size="24" />
          </template>
        </Button>
        <Button 
          @click="openCurrencyDialog"
          rounded
          severity="info"
          class="fab-button"
          v-tooltip.left="'Установить валюту'"
        >
          <template #icon>
            <DollarSign :size="24" />
          </template>
        </Button>
        <Button 
          @click="openBulkUnassignDialog"
          rounded
          severity="danger"
          class="fab-button"
          v-tooltip.left="'Отвязать модуль'"
        >
          <template #icon>
            <Minus :size="24" />
          </template>
        </Button>
        <Button 
          @click="openBulkAssignDialog"
          rounded
          severity="success"
          class="fab-button"
          v-tooltip.left="'Привязать модуль'"
        >
          <template #icon>
            <Plus :size="24" />
          </template>
        </Button>
      </template>
      <!-- FAB синхронизации -->
      <Button 
        @click="handleSync"
        :loading="syncing"
        rounded
        severity="primary"
        class="fab-button fab-main"
        v-tooltip.left="'Синхронизировать'"
      >
        <template #icon>
          <RefreshCw :size="28" :class="{'spin-anim': syncing}" />
        </template>
      </Button>
    </div>

    <!-- Модули -->
    <Card v-if="activeTab === 'modules'" class="settings-card">
      <template #title>
        <div class="card-header">
          <span>Модули</span>
          <Button 
            label="Добавить"
            @click="showModuleDialog = true"
          >
            <template #icon>
              <Plus :size="18" class="mr-2" />
            </template>
          </Button>
        </div>
      </template>
      <template #content>
        <DataTable 
          :value="modules" 
          :loading="loading"
          responsiveLayout="scroll"
        >
          <Column field="name" header="Название" />
          <Column field="price" header="Цена">
            <template #body="{ data }">
              {{ data.price }} {{ data.currency === 'EUR' ? '€' : '₽' }}
            </template>
          </Column>
          <Column field="activation_price" header="Подключение">
            <template #body="{ data }">
              {{ data.activation_price ? `${data.activation_price} ${data.currency === 'EUR' ? '€' : '₽'}` : '—' }}
            </template>
          </Column>
          <Column field="billing_type" header="Тип платы">
            <template #body="{ data }">
              <Tag :severity="data.billing_type === 'monthly' ? 'info' : 'warning'">
                {{ data.billing_type === 'monthly' ? 'Месячный' : 'Единовременный' }}
              </Tag>
            </template>
          </Column>
          <Column field="pricing_type" header="Расчёт">
            <template #body="{ data }">
              <Tag :severity="data.pricing_type === 'per_unit' ? 'success' : 'secondary'">
                {{ data.pricing_type === 'per_unit' ? 'За объект' : 'Фикса' }}
              </Tag>
            </template>
          </Column>
          <Column header="Действия">
            <template #body="{ data }">
              <div class="action-btns">
                <Button text @click="editModule(data)" v-tooltip="'Редактировать'">
                  <template #icon>
                    <Pen :size="18" />
                  </template>
                </Button>
                <Button text severity="danger" @click="deleteModuleHandler(data.id)" v-tooltip="'Удалить'">
                  <template #icon>
                    <Trash2 :size="18" />
                  </template>
                </Button>
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
    
    <!-- Курсы валют -->
    <Card v-if="activeTab === 'rates'" class="settings-card">
      <template #title>Курсы валют (НБК)</template>
      <template #content>
        <p class="info-text">
          Курсы загружаются автоматически ежедневно в 04:00 UTC из Национального банка Казахстана.
        </p>
        <DataTable 
          :value="groupedRates" 
          :loading="loading"
          responsiveLayout="scroll"
          :paginator="true"
          :rows="30"
        >
          <Column field="date" header="Дата" :sortable="true">
            <template #body="{ data }">
              {{ data.date }}
            </template>
          </Column>
          <Column header="EUR → KZT" :sortable="true">
            <template #body="{ data }">
              <span v-if="data.eur" class="rate-value">{{ data.eur.toFixed(2) }} ₸</span>
              <span v-else>—</span>
            </template>
          </Column>
          <Column header="RUB → KZT" :sortable="true">
            <template #body="{ data }">
              <span v-if="data.rub" class="rate-value">{{ data.rub.toFixed(4) }} ₸</span>
              <span v-else>—</span>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
    
    <!-- Подключения Wialon -->
    <Card v-if="activeTab === 'connections'" class="settings-card">
      <template #title>
        <div class="card-header">
          <span>Wialon подключения</span>
          <Button 
            label="Добавить"
            @click="openConnectionDialog()"
          >
            <template #icon>
              <Plus :size="18" class="mr-2" />
            </template>
          </Button>
        </div>
      </template>
      <template #content>
        <Message v-if="connections.length === 0 && !loading" severity="info" :closable="false">
          Нет подключений. Добавьте первое подключение к Wialon.
        </Message>
        
        <DataTable 
          v-if="connections.length > 0"
          :value="connections" 
          :loading="loading"
          responsiveLayout="scroll"
        >
          <Column header="№" style="width: 60px">
            <template #body="{ index }">
              {{ index + 1 }}
            </template>
          </Column>
          <Column field="name" header="Название" />
          <Column field="host" header="Хост Wialon" />
          <Column field="account_name" header="Аккаунт Wialon">
            <template #body="{ data }">
              {{ data.account_name || '—' }}
            </template>
          </Column>
          <Column field="created_at" header="Добавлен">
            <template #body="{ data }">
              {{ new Date(data.created_at).toLocaleDateString('ru-RU') }}
            </template>
          </Column>
          <Column header="Действия" style="width: 120px">
            <template #body="{ data }">
              <div class="action-btns">
                <Button 
                  text 
                  rounded
                  severity="secondary"
                  v-tooltip="'Редактировать'"
                  @click="openConnectionDialog(data)"
                >
                  <template #icon>
                    <Pen :size="16" />
                  </template>
                </Button>
                <Button 
                  text 
                  rounded
                  severity="success"
                  v-tooltip="'Проверить подключение'"
                  @click="testConnectionHandler(data)"
                  :loading="data.testing"
                >
                  <template #icon>
                    <Zap :size="16" />
                  </template>
                </Button>
                <Button 
                  text 
                  rounded
                  severity="danger"
                  v-tooltip="'Удалить'"
                  @click="deleteConnection(data)"
                >
                  <template #icon>
                    <Trash2 :size="16" />
                  </template>
                </Button>
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
    
    <!-- Реквизиты поставщика -->
    <Card v-if="activeTab === 'requisites'" class="settings-card">
      <template #title>
        <div class="card-header">
          <span>Реквизиты компании</span>
          <Button 
            label="Сохранить"
            @click="saveRequisites"
            :loading="savingRequisites"
          />
        </div>
      </template>
      <template #content>
        <form @submit.prevent="saveRequisites" class="requisites-form">
          <h4>Данные компании</h4>
          <div class="field-grid">
            <div class="field">
              <label>Название компании</label>
              <InputText v-model="settings.company_name" class="w-full" placeholder="ТОО АЛАТАУ ТРЭК" />
            </div>
            <div class="field">
              <label>БИН/ИИН</label>
              <InputText v-model="settings.company_bin" class="w-full" placeholder="251140003447" />
            </div>
            <div class="field full-width">
              <label>Адрес</label>
              <InputText v-model="settings.company_address" class="w-full" placeholder="03000, Казахстан, г. Актобе..." />
            </div>
            <div class="field">
              <label>Телефон</label>
              <InputText v-model="settings.company_phone" class="w-full" placeholder="+7 (771) 752-99-09" />
            </div>
          </div>
          
          <h4>Банковские реквизиты</h4>
          <div class="field-grid">
            <div class="field full-width">
              <label>Название банка</label>
              <InputText v-model="settings.bank_name" class="w-full" placeholder="АО «ForteBank», филиал в г. Актобе" />
            </div>
            <div class="field">
              <label>ИИК (расчётный счёт)</label>
              <InputText v-model="settings.bank_iik" class="w-full" placeholder="KZ8996515F0008967670" />
            </div>
            <div class="field">
              <label>БИК</label>
              <InputText v-model="settings.bank_bik" class="w-full" placeholder="IRTYKZKA" />
            </div>
            <div class="field">
              <label>Кбе</label>
              <InputText v-model="settings.bank_kbe" class="w-full" placeholder="17" />
            </div>
            <div class="field">
              <label>Код назначения платежа</label>
              <InputText v-model="settings.payment_code" class="w-full" placeholder="859" />
            </div>
          </div>
          
          <h4>Дополнительно</h4>
          <div class="field-grid">
            <div class="field">
              <label>ФИО исполнителя</label>
              <InputText v-model="settings.executor_name" class="w-full" placeholder="Шешина Алина Игоревна" />
            </div>
            <div class="field">
              <label>Ставка НДС (%)</label>
              <InputNumber v-model="settings.vat_rate" :min="0" :max="100" suffix="%" />
            </div>
          </div>
        </form>
      </template>
    </Card>
    
    <!-- Диалог подключения -->
    <Dialog 
      v-model:visible="showConnectionDialog" 
      :header="editingConnection ? 'Редактировать подключение' : 'Новое подключение'"
      :modal="true"
      :style="{ width: '500px' }"
    >
      <form @submit.prevent="saveConnection" class="module-form">
        <div class="field">
          <label>Название подключения</label>
          <InputText v-model="connectionForm.name" class="w-full" placeholder="Например: Мой Hosting" required />
        </div>
        
        <div class="field">
          <label>Хост Wialon</label>
          <Dropdown 
            v-model="connectionForm.host"
            :options="wialonHosts"
            optionLabel="label"
            optionValue="value"
            placeholder="Выберите хост"
            class="w-full"
          />
        </div>
        
        <div class="field">
          <label>API Токен</label>
          <div class="token-field-group">
            <InputText v-model="connectionForm.token" class="w-full" placeholder="Введите токен Wialon" :required="!editingConnection" />
            <Button 
              type="button"
              label="Получить"
              severity="secondary"
              @click="getWialonToken"
              v-tooltip="'Получить токен через OAuth'"
            >
              <template #icon>
                <Key :size="16" class="mr-1" />
              </template>
            </Button>
          </div>
          <small class="text-muted">Нажмите "Получить" для авторизации через Wialon</small>
        </div>
        
        <div class="dialog-footer">
          <Button type="button" label="Отмена" text @click="showConnectionDialog = false" />
          <Button type="submit" label="Сохранить" />
        </div>
      </form>
    </Dialog>
    
    <!-- Диалог модуля -->
    <Dialog 
      v-model:visible="showModuleDialog" 
      :header="editingModule ? 'Редактировать модуль' : 'Новый модуль'"
      :modal="true"
      :style="{ width: '500px' }"
    >
      <form @submit.prevent="saveModule" class="module-form">
        <div class="field">
          <label>Название</label>
          <InputText v-model="moduleForm.name" class="w-full" required />
        </div>
        
        <div class="field">
          <label>Описание</label>
          <InputText v-model="moduleForm.description" class="w-full" />
        </div>
        
        <div class="field-group">
          <div class="field">
            <label>Цена</label>
            <InputNumber v-model="moduleForm.price" :min="0" :maxFractionDigits="2" />
          </div>
          
          <div class="field">
            <label>Цена подключения</label>
            <InputNumber v-model="moduleForm.activation_price" :min="0" :maxFractionDigits="2" />
          </div>
        </div>
        
        <div class="field-group">
          <div class="field">
            <label>Валюта</label>
            <Dropdown 
              v-model="moduleForm.currency"
              :options="currencies"
              optionLabel="label"
              optionValue="value"
            />
          </div>
          
          <div class="field">
            <label>Тип платы</label>
            <Dropdown 
              v-model="moduleForm.billing_type"
              :options="billingTypes"
              optionLabel="label"
              optionValue="value"
            />
          </div>
          
          <div class="field">
            <label>Тип расчёта</label>
            <Dropdown 
              v-model="moduleForm.pricing_type"
              :options="pricingTypes"
              optionLabel="label"
              optionValue="value"
            />
          </div>
        </div>
        
        <div class="dialog-footer">
          <Button type="button" label="Отмена" text @click="showModuleDialog = false" />
          <Button type="submit" label="Сохранить" />
        </div>
      </form>
    </Dialog>
    
    <!-- Диалог редактирования реквизитов аккаунта -->
    <Dialog 
      v-model:visible="showAccountDetailsDialog" 
      header="Реквизиты покупателя"
      :modal="true"
      :style="{ width: '550px' }"
    >
      <form @submit.prevent="saveAccountDetails" class="requisites-form">
        <div class="field-grid">
          <div class="field full-width">
            <label>Название компании</label>
            <InputText v-model="accountDetailsForm.buyer_name" class="w-full" placeholder="ТОО Profi service plus" />
          </div>
          <div class="field">
            <label>БИН/ИИН</label>
            <InputText v-model="accountDetailsForm.buyer_bin" class="w-full" placeholder="180740034242" />
          </div>
          <div class="field">
            <label>Email (для входа и рассылки)</label>
            <InputText v-model="accountDetailsForm.buyer_email" class="w-full" type="email" placeholder="client@example.com" />
          </div>
          <div class="field">
            <label>Телефон</label>
            <InputText v-model="accountDetailsForm.buyer_phone" class="w-full" placeholder="+7 (771) 752-99-09" />
          </div>
          <div class="field full-width">
            <label>Адрес</label>
            <InputText v-model="accountDetailsForm.buyer_address" class="w-full" placeholder="г. Алматы, Гете, дом 17/43" />
          </div>
          <div class="field">
            <label>Номер договора</label>
            <InputText v-model="accountDetailsForm.contract_number" class="w-full" placeholder="WH/05112025-11" />
          </div>
          <div class="field">
            <label>Дата договора</label>
            <Calendar v-model="accountDetailsForm.contract_date" dateFormat="dd.mm.yy" showIcon class="w-full" />
          </div>
        </div>
        
        <div class="dialog-footer">
          <Button type="button" label="Отмена" text @click="showAccountDetailsDialog = false" />
          <Button type="submit" label="Сохранить" :loading="savingAccountDetails" />
        </div>
      </form>
    </Dialog>
    
    <!-- Диалог массовой привязки модулей -->
    <Dialog 
      v-model:visible="showBulkModuleDialog" 
      :header="bulkAction === 'assign' ? 'Привязать модуль' : 'Отвязать модуль'"
      :modal="true"
      :style="{ width: '400px' }"
    >
      <div class="field">
        <label>Выберите модуль</label>
        <Dropdown 
          v-model="selectedBulkModule"
          :options="modules"
          optionLabel="name"
          optionValue="id"
          placeholder="Модуль"
          class="w-full"
        />
      </div>
      <p class="bulk-info">
        {{ bulkAction === 'assign' ? 'Привязать' : 'Отвязать' }} модуль к {{ selectedAccounts.length }} аккаунтам
      </p>
      <div class="dialog-footer">
        <Button type="button" label="Отмена" text @click="showBulkModuleDialog = false" />
        <Button 
          :label="bulkAction === 'assign' ? 'Привязать' : 'Отвязать'" 
          :severity="bulkAction === 'assign' ? 'success' : 'danger'"
          :loading="bulkLoading"
          @click="executeBulkAction"
        />
      </div>
    </Dialog>
    
    <!-- Диалог выбора валюты -->
    <Dialog 
      v-model:visible="showCurrencyDialog" 
      header="Установить валюту"
      :modal="true"
      :style="{ width: '400px' }"
    >
      <div class="field">
        <label>Выберите валюту</label>
        <Dropdown 
          v-model="selectedCurrency"
          :options="billingCurrencies"
          optionLabel="label"
          optionValue="value"
          placeholder="Валюта"
          class="w-full"
        />
      </div>
      <p class="bulk-info">
        Установить валюту для {{ selectedAccounts.length }} аккаунтов
      </p>
      <div class="dialog-footer">
        <Button type="button" label="Отмена" text @click="showCurrencyDialog = false" />
        <Button 
          label="Установить"
          severity="info"
          :loading="currencyLoading"
          @click="executeCurrencyChange"
        />
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'




import { useToast } from 'primevue/usetoast'
import Tag from 'primevue/tag'
import Calendar from 'primevue/calendar'
import { 
  getAccounts, toggleAccount as apiToggleAccount, syncAccounts,
  getModules, createModule, updateModule, deleteModule,
  getSettings, updateSettings,
  getExchangeRates,
  getConnections, createConnection as apiCreateConnection, 
  updateConnection as apiUpdateConnection, deleteConnection as apiDeleteConnection,
  testConnection as apiTestConnection,
  assignModuleBulk, unassignModuleBulk, setCurrencyBulk,
  updateAccountDetails as apiUpdateAccountDetails
} from '@/services/api'
import { 
  RefreshCw, 
  Plus, 
  Minus,
  DollarSign,
  Pen, 
  Trash2,
  Users,
  Package,
  Wallet,
  LineChart,
  Link2,
  Key,
  Zap,
  CheckCircle2,
  Ban,
  XCircle,
  X,
  Circle,
  FileText
} from 'lucide-vue-next'

const toast = useToast()

const tabs = [
  { id: 'accounts', label: 'Аккаунты', icon: Users },
  { id: 'modules', label: 'Модули', icon: Package },
  { id: 'rates', label: 'Курсы', icon: LineChart },
  { id: 'connections', label: 'Подключения', icon: Link2 },
  { id: 'requisites', label: 'Реквизиты', icon: FileText }
]

const activeTab = ref('accounts')
const loading = ref(false)
const syncing = ref(false)
const savingRequisites = ref(false)

// Данные
const accounts = ref([])
const modules = ref([])
const settings = ref({ wialon_type: 'hosting', unit_price: 2, currency: 'EUR' })
const exchangeRates = ref([])
const connections = ref([])

// Массовая привязка модулей
const selectedAccounts = ref([])
const showBulkModuleDialog = ref(false)
const selectedBulkModule = ref(null)
const bulkAction = ref('assign') // 'assign' или 'unassign'
const bulkLoading = ref(false)

// Массовая установка валюты
const showCurrencyDialog = ref(false)
const selectedCurrency = ref('KZT')
const currencyLoading = ref(false)
const billingCurrencies = [
  { label: 'EUR (Евро)', value: 'EUR' },
  { label: 'RUB (Рубли)', value: 'RUB' },
  { label: 'KZT (Тенге)', value: 'KZT' }
]

// Wialon хосты
const wialonHosts = [
  { label: 'Wialon Hosting (hst-api.wialon.com)', value: 'hst-api.wialon.com' },
  { label: 'Wialon Hosting EU (hst-api.wialon.eu)', value: 'hst-api.wialon.eu' },
  { label: 'Wialon Local (local)', value: 'local' },
  { label: 'RegWialon (hosting.regwialon.com)', value: 'hosting.regwialon.com' }
]

// Состояние диалога подключений
const showConnectionDialog = ref(false)
const editingConnection = ref(null)
const connectionForm = ref({
  name: '',
  host: 'hst-api.wialon.com',
  token: ''
})

// Редактирование реквизитов аккаунта
const showAccountDetailsDialog = ref(false)
const savingAccountDetails = ref(false)
const editingAccountId = ref(null)
const accountDetailsForm = ref({
  buyer_name: '',
  buyer_bin: '',
  buyer_address: '',
  buyer_email: '',
  buyer_phone: '',
  contract_number: '',
  contract_date: null
})

// Группировка курсов по дате
const groupedRates = computed(() => {
  const grouped = {}
  for (const rate of exchangeRates.value) {
    const date = new Date(rate.rate_date).toLocaleDateString('ru-RU')
    if (!grouped[date]) {
      grouped[date] = { date }
    }
    if (rate.currency_from === 'EUR') {
      grouped[date].eur = rate.rate
    } else if (rate.currency_from === 'RUB') {
      grouped[date].rub = rate.rate
    }
  }
  // Сортировка по дате (новые сверху)
  return Object.values(grouped).sort((a, b) => {
    const [d1, m1, y1] = a.date.split('.').map(Number)
    const [d2, m2, y2] = b.date.split('.').map(Number)
    return new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1)
  })
})

// Модуль форма
const showModuleDialog = ref(false)
const editingModule = ref(null)
const moduleForm = ref({
  name: '',
  description: '',
  price: 0,
  activation_price: null,
  currency: 'EUR',
  billing_type: 'monthly',
  pricing_type: 'per_unit'
})

const wialonTypes = [
  { label: 'Wialon Hosting (EUR)', value: 'hosting' },
  { label: 'Wialon Local (RUB)', value: 'local' }
]

const currencies = [
  { label: 'EUR (€)', value: 'EUR' },
  { label: 'RUB (₽)', value: 'RUB' }
]

const billingTypes = [
  { label: 'Месячный', value: 'monthly' },
  { label: 'Единовременный', value: 'one_time' }
]

const pricingTypes = [
  { label: 'За объект (среднее × цена)', value: 'per_unit' },
  { label: 'Фикса (ежемесячно)', value: 'fixed' }
]

// Загрузка данных
const loadData = async () => {
  loading.value = true
  try {
    const [accountsRes, modulesRes, settingsRes, ratesRes] = await Promise.all([
      getAccounts(),
      getModules(),
      getSettings(),
      getExchangeRates()
    ])
    
    accounts.value = accountsRes.data || []
    modules.value = modulesRes.data || []
    settings.value = settingsRes.data || settings.value
    exchangeRates.value = ratesRes.data || []
  } catch (error) {
    console.error('Ошибка загрузки данных:', error)
  } finally {
    loading.value = false
  }
}

// Переключение аккаунта
const toggleAccount = async (id) => {
  try {
    await apiToggleAccount(id)
    await loadData()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: error.message })
  }
}

// Синхронизация с Wialon
const handleSync = async () => {
  syncing.value = true
  try {
    const { data } = await syncAccounts()
    toast.add({ 
      severity: 'success', 
      summary: 'Синхронизация завершена', 
      detail: `Всего: ${data.total}, Новых: ${data.synced}, Дилеров: ${data.dealers_found}` 
    })
    await loadData()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: error.response?.data?.error || error.message })
  } finally {
    syncing.value = false
  }
}

// Сохранение реквизитов
const saveRequisites = async () => {
  savingRequisites.value = true
  try {
    await updateSettings(settings.value)
    toast.add({ severity: 'success', summary: 'Сохранено', detail: 'Реквизиты успешно сохранены' })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: error.response?.data?.error || error.message })
  } finally {
    savingRequisites.value = false
  }
}

// Редактирование реквизитов аккаунта
const openAccountDetails = (account) => {
  editingAccountId.value = account.id
  accountDetailsForm.value = {
    buyer_name: account.buyer_name || '',
    buyer_bin: account.buyer_bin || '',
    buyer_address: account.buyer_address || '',
    buyer_email: account.buyer_email || '',
    buyer_phone: account.buyer_phone || '',
    contract_number: account.contract_number || '',
    contract_date: account.contract_date ? new Date(account.contract_date) : null
  }
  showAccountDetailsDialog.value = true
}

const saveAccountDetails = async () => {
  savingAccountDetails.value = true
  try {
    const payload = {
      ...accountDetailsForm.value,
      contract_date: accountDetailsForm.value.contract_date 
        ? accountDetailsForm.value.contract_date.toISOString().split('T')[0] 
        : null
    }
    await apiUpdateAccountDetails(editingAccountId.value, payload)
    toast.add({ severity: 'success', summary: 'Сохранено', detail: 'Реквизиты покупателя обновлены' })
    showAccountDetailsDialog.value = false
    await loadData()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: error.response?.data?.error || error.message })
  } finally {
    savingAccountDetails.value = false
  }
}

// Массовая привязка модулей
const openBulkAssignDialog = () => {
  bulkAction.value = 'assign'
  selectedBulkModule.value = null
  showBulkModuleDialog.value = true
}

const openBulkUnassignDialog = () => {
  bulkAction.value = 'unassign'
  selectedBulkModule.value = null
  showBulkModuleDialog.value = true
}

const executeBulkAction = async () => {
  if (!selectedBulkModule.value) {
    toast.add({ severity: 'warn', summary: 'Внимание', detail: 'Выберите модуль' })
    return
  }
  
  bulkLoading.value = true
  try {
    const accountIds = selectedAccounts.value.map(a => a.id)
    
    if (bulkAction.value === 'assign') {
      await assignModuleBulk(selectedBulkModule.value, accountIds)
      toast.add({ severity: 'success', summary: 'Готово', detail: `Модуль привязан к ${accountIds.length} аккаунтам` })
    } else {
      await unassignModuleBulk(selectedBulkModule.value, accountIds)
      toast.add({ severity: 'success', summary: 'Готово', detail: `Модуль отвязан от ${accountIds.length} аккаунтов` })
    }
    
    showBulkModuleDialog.value = false
    selectedAccounts.value = []
    await loadData()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: error.response?.data?.error || error.message })
  } finally {
    bulkLoading.value = false
  }
}

// Массовая установка валюты
const openCurrencyDialog = () => {
  selectedCurrency.value = 'KZT'
  showCurrencyDialog.value = true
}

const executeCurrencyChange = async () => {
  if (!selectedCurrency.value) {
    toast.add({ severity: 'warn', summary: 'Внимание', detail: 'Выберите валюту' })
    return
  }
  
  currencyLoading.value = true
  try {
    const accountIds = selectedAccounts.value.map(a => a.id)
    await setCurrencyBulk(accountIds, selectedCurrency.value)
    toast.add({ severity: 'success', summary: 'Готово', detail: `Валюта ${selectedCurrency.value} установлена для ${accountIds.length} аккаунтов` })
    
    showCurrencyDialog.value = false
    selectedAccounts.value = []
    await loadData()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: error.response?.data?.error || error.message })
  } finally {
    currencyLoading.value = false
  }
}

const getCurrencySeverity = (currency) => {
  const severities = { EUR: 'success', RUB: 'warning', KZT: 'info' }
  return severities[currency] || 'secondary'
}

// Модули CRUD
const editModule = (module) => {
  editingModule.value = module
  moduleForm.value = { ...module }
  showModuleDialog.value = true
}

const saveModule = async () => {
  try {
    if (editingModule.value) {
      await updateModule(editingModule.value.id, moduleForm.value)
    } else {
      await createModule(moduleForm.value)
    }
    
    showModuleDialog.value = false
    editingModule.value = null
    moduleForm.value = { name: '', description: '', price: 0, activation_price: null, currency: 'EUR', billing_type: 'monthly', pricing_type: 'per_unit' }
    await loadData()
    
    toast.add({ severity: 'success', summary: 'Успех', detail: 'Модуль сохранён' })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: error.message })
  }
}

const deleteModuleHandler = async (id) => {
  try {
    await deleteModule(id)
    await loadData()
    toast.add({ severity: 'success', summary: 'Успех', detail: 'Модуль удалён' })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: error.message })
  }
}

// Сохранение настроек
const saveSettings = async () => {
  try {
    settings.value.currency = settings.value.wialon_type === 'hosting' ? 'EUR' : 'RUB'
    await updateSettings(settings.value)
    toast.add({ severity: 'success', summary: 'Успех', detail: 'Настройки сохранены' })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: error.message })
  }
}

// === Connections CRUD ===

const loadConnections = async () => {
  try {
    const { data } = await getConnections()
    connections.value = data
  } catch (error) {
    console.error('Ошибка загрузки подключений:', error)
  }
}

const openConnectionDialog = (connection = null) => {
  if (connection) {
    editingConnection.value = connection
    connectionForm.value = {
      name: connection.name,
      host: connection.host,
      token: '' // Не показываем старый токен
    }
  } else {
    editingConnection.value = null
    connectionForm.value = {
      name: '',
      host: 'hst-api.wialon.com',
      token: ''
    }
  }
  showConnectionDialog.value = true
}

const saveConnection = async () => {
  try {
    if (editingConnection.value) {
      // Обновление — отправляем только если есть новый токен
      const updateData = { name: connectionForm.value.name }
      if (connectionForm.value.token) {
        updateData.token = connectionForm.value.token
      }
      await apiUpdateConnection(editingConnection.value.id, updateData)
    } else {
      // Создание нового
      await apiCreateConnection(connectionForm.value)
    }
    
    showConnectionDialog.value = false
    editingConnection.value = null
    connectionForm.value = { name: '', host: 'hst-api.wialon.com', token: '' }
    await loadConnections()
    
    toast.add({ severity: 'success', summary: 'Успех', detail: 'Подключение сохранено' })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: error.response?.data?.error || error.message })
  }
}

const deleteConnection = async (connection) => {
  if (!confirm(`Удалить подключение "${connection.name}"?`)) return
  
  try {
    await apiDeleteConnection(connection.id)
    await loadConnections()
    toast.add({ severity: 'success', summary: 'Успех', detail: 'Подключение удалено' })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: error.message })
  }
}

// Тестирование подключения к Wialon
const testConnectionHandler = async (connection) => {
  connection.testing = true
  try {
    const { data } = await apiTestConnection(connection.id)
    if (data.success) {
      toast.add({ 
        severity: 'success', 
        summary: 'Подключение успешно', 
        detail: `Аккаунт: ${data.wialon_user} (ID: ${data.wialon_id})`,
        life: 5000
      })
      // Обновляем данные подключения в таблице
      connection.account_name = data.wialon_user
      await loadConnections()
    } else {
      toast.add({ severity: 'error', summary: 'Ошибка', detail: data.error })
    }
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Ошибка подключения', 
      detail: error.response?.data?.error || error.message 
    })
  } finally {
    connection.testing = false
  }
}

// OAuth получение токена Wialon
const getWialonToken = () => {
  const host = connectionForm.value.host
  if (!host || host === 'local') {
    toast.add({ severity: 'warn', summary: 'Внимание', detail: 'Выберите хост Wialon (кроме Local)' })
    return
  }
  
  // Маппинг API хостов на login-хосты
  const hostMapping = {
    'hst-api.wialon.com': 'hosting.wialon.com',
    'hst-api.wialon.eu': 'hosting.wialon.eu',
    'hosting.regwialon.com': 'hosting.regwialon.com'
  }
  
  const loginHost = hostMapping[host] || host
  const hostUrl = `https://${loginHost}`
  
  const redirectUri = window.location.origin + '/settings?tab=connections'
  const params = new URLSearchParams({
    client_id: 'WialonBilling',
    access_type: '-1',
    activation_time: '0',
    duration: '0',
    flags: '0x1',
    redirect_uri: redirectUri
  })
  
  // Сохраняем форму в localStorage для восстановления после callback
  localStorage.setItem('pendingConnection', JSON.stringify({
    name: connectionForm.value.name,
    host: connectionForm.value.host
  }))
  
  const loginUrl = `${hostUrl}/login.html?${params.toString()}`
  window.location.href = loginUrl
}

onMounted(() => {
  loadData()
  loadConnections()
  
  // Проверка callback от OAuth
  const pendingConnectionStr = localStorage.getItem('pendingConnection')
  const urlParams = new URLSearchParams(window.location.search)
  const accessToken = urlParams.get('access_token') || urlParams.get('token')
  
  if (pendingConnectionStr && accessToken) {
    const pendingConnection = JSON.parse(pendingConnectionStr)
    localStorage.removeItem('pendingConnection')
    
    // Открываем диалог с полученным токеном
    connectionForm.value = {
      name: pendingConnection.name,
      host: pendingConnection.host,
      token: accessToken
    }
    showConnectionDialog.value = true
    activeTab.value = 'connections'
    
    // Очищаем URL
    window.history.replaceState({}, document.title, window.location.pathname)
    
    toast.add({ severity: 'success', summary: 'Успех', detail: 'Токен получен! Сохраните подключение.' })
  }
})
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
}

.settings-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
  color: var(--text-color-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: var(--surface-hover);
}

.tab-btn.active {
  background: var(--primary-color);
  color: var(--primary-color-text);
  border-color: var(--primary-color);
}

.settings-card {
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 400px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field label {
  font-weight: 500;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.flex-1 {
  flex: 1;
}

.currency {
  font-weight: 600;
  color: var(--primary-color);
}

.action-btns {
  display: flex;
  gap: 0.25rem;
}

.module-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

.w-full {
  width: 100%;
}

.info-text {
  color: var(--text-color-secondary);
  margin-bottom: 1rem;
}

/* Адаптивность */
@media (max-width: 768px) {
  .field-group {
    grid-template-columns: 1fr;
  }
  
  .tab-btn span {
    display: none;
  }
}

.token-field-group {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}

.token-field-group .p-inputtext {
  flex: 1;
}

.text-muted {
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

/* Массовая привязка */
.bulk-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.selected-count {
  font-size: 0.9rem;
  color: var(--primary-color);
  font-weight: 500;
}

.module-icons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.module-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: rgba(100, 160, 180, 0.3);
  color: rgba(150, 200, 220, 0.8);
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

.module-icon:hover {
  transform: scale(1.1);
  background: rgba(100, 160, 180, 0.5);
  box-shadow: 0 2px 8px rgba(100, 160, 180, 0.2);
}

.no-modules {
  color: var(--text-color-secondary);
}

.bulk-info {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  margin: 1rem 0;
}

/* FAB группа */
.fab-group {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.fab-button {
  width: 48px;
  height: 48px;
  border-radius: 50% !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s, box-shadow 0.2s;
}

.fab-button:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
}

.fab-main {
  width: 56px;
  height: 56px;
}

.spin-anim {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Форма реквизитов */
.requisites-form h4 {
  margin: 1.5rem 0 1rem;
  color: var(--text-color);
  font-size: 1.1rem;
  border-bottom: 1px solid var(--surface-border);
  padding-bottom: 0.5rem;
}

.requisites-form h4:first-child {
  margin-top: 0;
}

.field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.field-grid .full-width {
  grid-column: 1 / -1;
}

/* Приглушённые теги валюты */
:deep(.p-tag) {
  opacity: 0.7;
  font-weight: 500;
}

:deep(.p-tag-info) {
  background: rgba(100, 160, 180, 0.25) !important;
  color: rgba(150, 200, 220, 0.9) !important;
}

:deep(.p-tag-success) {
  background: rgba(100, 180, 100, 0.25) !important;
  color: rgba(150, 220, 150, 0.9) !important;
}

:deep(.p-tag-warning) {
  background: rgba(180, 150, 80, 0.25) !important;
  color: rgba(220, 200, 120, 0.9) !important;
}
</style>
