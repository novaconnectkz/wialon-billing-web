<template>
  <div class="smtp-settings">
    <!-- SMTP Настройки -->
    <Card class="settings-card">
      <template #title>
        <div class="card-header">
          <span>SMTP Сервер</span>
          <div class="header-actions">
            <Button 
              label="Тест" 
              severity="secondary" 
              @click="testConnection"
              :loading="testing"
              :disabled="!smtpForm.host"
            />
            <Button 
              label="Сохранить" 
              @click="saveSettings"
              :loading="saving"
            />
          </div>
        </div>
      </template>
      <template #content>
        <form @submit.prevent="saveSettings" class="smtp-form">
          <div class="form-row">
            <div class="field flex-2">
              <label>Хост SMTP</label>
              <InputText v-model="smtpForm.host" placeholder="smtp.gmail.com" class="w-full" />
            </div>
            <div class="field flex-1">
              <label>Порт</label>
              <InputNumber v-model="smtpForm.port" :min="1" :max="65535" class="w-full" />
            </div>
          </div>

          <div class="form-row">
            <div class="field flex-1">
              <label>Логин</label>
              <InputText v-model="smtpForm.username" placeholder="user@gmail.com" class="w-full" />
            </div>
            <div class="field flex-1">
              <label>Пароль {{ hasPassword ? '(введите для замены)' : '' }}</label>
              <Password v-model="smtpForm.password" :feedback="false" toggleMask class="w-full" :placeholder="hasPassword ? '••••••••' : 'Пароль'" />
            </div>
          </div>

          <div class="form-row">
            <div class="field flex-1">
              <label>Email отправителя</label>
              <InputText v-model="smtpForm.from_email" placeholder="noreply@example.com" class="w-full" />
            </div>
            <div class="field flex-1">
              <label>Имя отправителя</label>
              <InputText v-model="smtpForm.from_name" placeholder="Wialon Billing" class="w-full" />
            </div>
          </div>

          <div class="form-row">
            <div class="field flex-1">
              <label>Email для копии счетов</label>
              <InputText v-model="smtpForm.copy_email" placeholder="copy@example.com" class="w-full" />
            </div>
          </div>

          <div class="form-row switches">
            <div class="switch-item">
              <label>TLS/STARTTLS</label>
              <InputSwitch v-model="smtpForm.use_tls" />
            </div>
            <div class="switch-item">
              <label>Включить SMTP</label>
              <InputSwitch v-model="smtpForm.enabled" />
            </div>
            <div class="switch-item">
              <label>Отправлять копию</label>
              <InputSwitch v-model="smtpForm.copy_enabled" />
            </div>
          </div>
        </form>
      </template>
    </Card>

    <!-- Шаблоны писем -->
    <Card class="settings-card mt-4">
      <template #title>
        <div class="card-header">
          <span>Шаблоны писем</span>
          <div class="header-actions">
            <Button 
              label="Превью" 
              severity="secondary" 
              @click="previewTemplate"
              :disabled="!selectedType"
            />
            <Button 
              label="Сохранить шаблон" 
              @click="saveTemplate"
              :loading="savingTemplate"
              :disabled="!selectedType"
            />
          </div>
        </div>
      </template>
      <template #content>
        <!-- Выбор типа шаблона -->
        <div class="template-selector">
          <div class="field">
            <label>Тип шаблона</label>
            <Dropdown 
              v-model="selectedType" 
              :options="templateTypes" 
              optionLabel="label" 
              optionValue="value"
              placeholder="Выберите тип"
              class="w-full"
              @change="loadTemplate"
            />
          </div>
        </div>

        <div v-if="selectedType" class="template-editor">
          <!-- Тема письма -->
          <div class="field">
            <label>Тема письма</label>
            <InputText v-model="templateForm.subject" class="w-full" placeholder="Тема {{переменная}}" />
          </div>

          <!-- Доступные переменные -->
          <div class="variables-panel">
            <span class="variables-label">Переменные:</span>
            <Button 
              v-for="v in availableVariables" 
              :key="v"
              :label="`{{${v}}}`"
              severity="secondary"
              size="small"
              class="var-btn"
              @click="insertVariable(v)"
            />
          </div>

          <!-- TipTap Editor -->
          <div class="editor-wrapper">
            <div class="editor-toolbar" v-if="editor">
              <button 
                type="button"
                :class="{ active: editor.isActive('bold') }" 
                @click="editor.chain().focus().toggleBold().run()"
                title="Жирный"
              >
                <strong>B</strong>
              </button>
              <button
                type="button" 
                :class="{ active: editor.isActive('italic') }" 
                @click="editor.chain().focus().toggleItalic().run()"
                title="Курсив"
              >
                <em>I</em>
              </button>
              <button 
                type="button"
                :class="{ active: editor.isActive('underline') }" 
                @click="editor.chain().focus().toggleUnderline().run()"
                title="Подчёркивание"
              >
                <u>U</u>
              </button>
              <span class="toolbar-divider" />
              <button 
                type="button"
                :class="{ active: editor.isActive('heading', { level: 1 }) }" 
                @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
                title="Заголовок 1"
              >
                H1
              </button>
              <button 
                type="button"
                :class="{ active: editor.isActive('heading', { level: 2 }) }" 
                @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
                title="Заголовок 2"
              >
                H2
              </button>
              <button 
                type="button"
                :class="{ active: editor.isActive('heading', { level: 3 }) }" 
                @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
                title="Заголовок 3"
              >
                H3
              </button>
              <span class="toolbar-divider" />
              <button 
                type="button"
                :class="{ active: editor.isActive('bulletList') }" 
                @click="editor.chain().focus().toggleBulletList().run()"
                title="Маркированный список"
              >
                •&nbsp;Список
              </button>
              <button 
                type="button"
                :class="{ active: editor.isActive('orderedList') }" 
                @click="editor.chain().focus().toggleOrderedList().run()"
                title="Нумерованный список"
              >
                1.&nbsp;Список
              </button>
              <span class="toolbar-divider" />
              <button 
                type="button"
                :class="{ active: editor.isActive({ textAlign: 'left' }) }" 
                @click="editor.chain().focus().setTextAlign('left').run()"
                title="По левому краю"
              >
                ⬛
              </button>
              <button 
                type="button"
                :class="{ active: editor.isActive({ textAlign: 'center' }) }" 
                @click="editor.chain().focus().setTextAlign('center').run()"
                title="По центру"
              >
                ⬜
              </button>
              <button 
                type="button"
                @click="setLink"
                :class="{ active: editor.isActive('link') }"
                title="Ссылка"
              >
                🔗
              </button>
              <button
                type="button" 
                @click="editor.chain().focus().setHorizontalRule().run()"
                title="Горизонтальная линия"
              >
                ―
              </button>
            </div>
            <editor-content :editor="editor" class="editor-content" />
          </div>
        </div>
      </template>
    </Card>

    <!-- Диалог превью -->
    <Dialog 
      v-model:visible="showPreview" 
      header="Превью письма"
      :modal="true"
      :style="{ width: '700px' }"
    >
      <div v-if="previewData" class="preview-content">
        <div class="preview-subject">
          <strong>Тема:</strong> {{ previewData.subject }}
        </div>
        <div class="preview-body" v-html="previewData.body" />
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Password from 'primevue/password'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import InputSwitch from 'primevue/inputswitch'

// TipTap
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'

import {
  getSMTPSettings, updateSMTPSettings, testSMTPConnection,
  getEmailTemplates, getEmailTemplate, updateEmailTemplate, previewEmailTemplate
} from '@/services/api'

const toast = useToast()

// === SMTP ===
const saving = ref(false)
const testing = ref(false)
const hasPassword = ref(false)
const smtpForm = ref({
  enabled: false,
  host: '',
  port: 587,
  username: '',
  password: '',
  from_email: '',
  from_name: '',
  use_tls: true,
  copy_email: '',
  copy_enabled: false
})

// === Шаблоны ===
const savingTemplate = ref(false)
const selectedType = ref(null)
const showPreview = ref(false)
const previewData = ref(null)
const templateForm = ref({
  name: '',
  subject: '',
  html_body: '',
  is_active: true
})

const templateTypes = [
  { label: '📧 OTP — Код авторизации', value: 'otp' },
  { label: '📄 Счёт на оплату', value: 'invoice' },
  { label: '🔔 Уведомление', value: 'notification' }
]

const templateVariables = {
  otp: ['code', 'email', 'expires_minutes'],
  invoice: ['company_name', 'sender_company_name', 'sender_phone', 'period', 'amount', 'currency', 'invoice_number'],
  notification: ['title', 'message', 'date']
}

const testVariables = {
  otp: { code: '123456', email: 'test@example.com', expires_minutes: '5' },
  invoice: { company_name: 'ТОО "Тест"', period: '01.2026', amount: '15000.00', currency: 'KZT', invoice_number: '42' },
  notification: { title: 'Тестовое уведомление', message: 'Это тестовое сообщение.', date: new Date().toLocaleDateString('ru-RU') }
}

const availableVariables = computed(() => {
  return templateVariables[selectedType.value] || []
})

// TipTap Editor
const editor = useEditor({
  content: '',
  extensions: [
    StarterKit,
    Underline,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Link.configure({ openOnClick: false })
  ],
  onUpdate: ({ editor: e }) => {
    templateForm.value.html_body = e.getHTML()
  }
})

// === Методы ===

async function loadSettings() {
  try {
    const { data } = await getSMTPSettings()
    smtpForm.value = {
      enabled: data.enabled || false,
      host: data.host || '',
      port: data.port || 587,
      username: data.username || '',
      password: '',
      from_email: data.from_email || '',
      from_name: data.from_name || '',
      use_tls: data.use_tls !== false,
      copy_email: data.copy_email || '',
      copy_enabled: data.copy_enabled || false
    }
    hasPassword.value = data.has_password || false
  } catch (err) {
    console.error('Ошибка загрузки SMTP настроек:', err)
  }
}

async function saveSettings() {
  saving.value = true
  try {
    await updateSMTPSettings(smtpForm.value)
    toast.add({ severity: 'success', summary: 'Сохранено', detail: 'Настройки SMTP обновлены', life: 3000 })
    if (smtpForm.value.password) {
      hasPassword.value = true
      smtpForm.value.password = ''
    }
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: err.response?.data?.error || 'Не удалось сохранить', life: 5000 })
  } finally {
    saving.value = false
  }
}

async function testConnection() {
  testing.value = true
  try {
    await testSMTPConnection()
    toast.add({ severity: 'success', summary: 'Успех', detail: 'Тестовое письмо отправлено!', life: 3000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Ошибка SMTP', detail: err.response?.data?.error || 'Не удалось подключиться', life: 5000 })
  } finally {
    testing.value = false
  }
}

async function loadTemplate() {
  if (!selectedType.value) return
  try {
    const { data } = await getEmailTemplate(selectedType.value)
    templateForm.value = {
      name: data.name,
      subject: data.subject,
      html_body: data.html_body,
      is_active: data.is_active
    }
    if (editor.value) {
      editor.value.commands.setContent(data.html_body || '')
    }
  } catch (err) {
    console.error('Ошибка загрузки шаблона:', err)
  }
}

async function saveTemplate() {
  if (!selectedType.value) return
  savingTemplate.value = true
  try {
    await updateEmailTemplate(selectedType.value, templateForm.value)
    toast.add({ severity: 'success', summary: 'Сохранено', detail: 'Шаблон обновлён', life: 3000 })
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: err.response?.data?.error || 'Не удалось сохранить шаблон', life: 5000 })
  } finally {
    savingTemplate.value = false
  }
}

async function previewTemplate() {
  if (!selectedType.value) return
  try {
    const vars = testVariables[selectedType.value] || {}
    const { data } = await previewEmailTemplate(selectedType.value, vars)
    previewData.value = data
    showPreview.value = true
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Ошибка', detail: err.response?.data?.error || 'Не удалось получить превью', life: 5000 })
  }
}

function insertVariable(varName) {
  if (editor.value) {
    editor.value.chain().focus().insertContent(`{{${varName}}}`).run()
  }
}

function setLink() {
  if (!editor.value) return
  const previousUrl = editor.value.getAttributes('link').href
  const url = window.prompt('URL ссылки:', previousUrl)
  if (url === null) return
  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.smtp-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.smtp-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.flex-1 { flex: 1; }
.flex-2 { flex: 2; }

.form-row.switches {
  display: flex;
  gap: 2rem;
}

.switch-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.switch-item label {
  margin: 0;
  font-weight: 500;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field label {
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.mt-4 { margin-top: 1rem; }

/* Шаблоны */
.template-selector {
  margin-bottom: 1rem;
  max-width: 400px;
}

.variables-panel {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  background: var(--surface-50);
  border-radius: 8px;
}

.variables-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-color-secondary);
  margin-right: 0.25rem;
}

.var-btn {
  font-family: monospace !important;
  font-size: 0.75rem !important;
}

/* TipTap Editor */
.editor-wrapper {
  border: 1px solid var(--surface-200);
  border-radius: 8px;
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 8px;
  background: var(--surface-50);
  border-bottom: 1px solid var(--surface-200);
  flex-wrap: wrap;
}

.editor-toolbar button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-color);
  transition: all 0.15s;
}

.editor-toolbar button:hover {
  background: var(--surface-200);
}

.editor-toolbar button.active {
  background: var(--primary-color);
  color: white;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: var(--surface-200);
  margin: 0 4px;
}

.editor-content {
  min-height: 250px;
  padding: 1rem;
}

.editor-content :deep(.tiptap) {
  min-height: 230px;
  outline: none;
}

.editor-content :deep(.tiptap p) {
  margin: 0.5em 0;
}

.editor-content :deep(.tiptap h1) {
  font-size: 1.5em;
  margin: 0.67em 0;
}

.editor-content :deep(.tiptap h2) {
  font-size: 1.25em;
  margin: 0.75em 0;
}

.editor-content :deep(.tiptap h3) {
  font-size: 1.1em;
  margin: 0.83em 0;
}

.editor-content :deep(.tiptap ul),
.editor-content :deep(.tiptap ol) {
  padding-left: 1.5em;
}

.editor-content :deep(.tiptap a) {
  color: var(--primary-color);
  cursor: pointer;
}

.editor-content :deep(.tiptap hr) {
  border: none;
  border-top: 1px solid var(--surface-200);
  margin: 1em 0;
}

/* Превью */
.preview-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.preview-subject {
  padding: 0.75rem;
  background: var(--surface-50);
  border-radius: 6px;
  font-size: 0.95rem;
}

.preview-body {
  padding: 1rem;
  border: 1px solid var(--surface-200);
  border-radius: 8px;
  min-height: 200px;
}

/* Адаптация для dark mode */
:deep(.p-password-input) {
  width: 100%;
}
</style>
