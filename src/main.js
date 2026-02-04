import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import App from './App.vue'
import router from './router'

// PrimeVue стили
import 'primevue/resources/themes/lara-dark-blue/theme.css'
import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'

// Глобальные стили
import './assets/main.css'

// PrimeVue компоненты
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import Toast from 'primevue/toast'
import ToastService from 'primevue/toastservice'
import Menubar from 'primevue/menubar'
import Sidebar from 'primevue/sidebar'
import Tag from 'primevue/tag'
import Calendar from 'primevue/calendar'
import Tooltip from 'primevue/tooltip'
import Message from 'primevue/message'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
    locale: {
        firstDayOfWeek: 1,
        dayNames: ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"],
        dayNamesShort: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
        dayNamesMin: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
        monthNames: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
        monthNamesShort: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
        today: 'Сегодня',
        clear: 'Очистить',
        dateFormat: 'dd.mm.yy',
        weekHeader: 'Нед'
    }
})
app.use(ToastService)

// Регистрация директив
app.directive('tooltip', Tooltip)

// Регистрация компонентов
app.component('Button', Button)
app.component('InputText', InputText)
app.component('InputNumber', InputNumber)
app.component('DataTable', DataTable)
app.component('Column', Column)
app.component('Card', Card)
app.component('Checkbox', Checkbox)
app.component('Dropdown', Dropdown)
app.component('Dialog', Dialog)
app.component('Toast', Toast)
app.component('Menubar', Menubar)
app.component('Sidebar', Sidebar)
app.component('Tag', Tag)
app.component('Calendar', Calendar)
app.component('Message', Message)

app.mount('#app')
