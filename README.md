# Wialon Billing Web

Веб-интерфейс системы биллинга Wialon.

## Технологии
- Vue 3
- PrimeVue (UI компоненты)
- Vite (сборка)

## Установка

```bash
npm install
npm run dev
```

## Сборка для production

```bash
npm run build
```

## Структура

```
├── src/
│   ├── components/    # Переиспользуемые компоненты
│   ├── views/         # Страницы
│   ├── services/      # API сервисы
│   ├── stores/        # Pinia stores
│   └── router/        # Маршрутизация
└── public/            # Статические файлы
```

## Страницы

- `/` - Dashboard
- `/accounts` - Аккаунты Wialon
- `/modules` - Модули биллинга
- `/invoices` - Счета
- `/snapshots` - Снимки состояния
- `/changes` - Изменения объектов
- `/settings` - Настройки
