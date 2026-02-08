<template>
  <div class="partner-contracts">
    <!-- Заголовок -->
    <div class="contracts-header">
      <div>
        <h1 class="page-title">Мои договоры</h1>
        <p class="page-subtitle">Подписанные договоры и приложения</p>
      </div>
    </div>

    <!-- Пустое состояние -->
    <div class="empty-state">
      <div class="empty-icon">
        <FileCheck :size="64" />
      </div>
      <h2 class="empty-title">Договоры пока не добавлены</h2>
      <p class="empty-description">
        Здесь будут отображаться ваши подписанные договоры<br>
        и приложения к ним
      </p>
    </div>
  </div>
</template>

<script setup>
import { FileCheck } from 'lucide-vue-next'
</script>

<style scoped>
.partner-contracts {
  max-width: 1200px;
  margin: 0 auto;
}

/* Заголовок */
.contracts-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 0.25rem;
}

.page-subtitle {
  font-size: 0.95rem;
  color: var(--text-color-secondary);
  margin: 0;
}

/* Пустое состояние */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem 2rem;
  text-align: center;
}

.empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  border-radius: 24px;
  background: rgba(59, 130, 246, 0.08);
  color: #3b82f6;
  margin-bottom: 1.5rem;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 0.5rem;
}

.empty-description {
  font-size: 0.95rem;
  color: var(--text-color-secondary);
  line-height: 1.6;
  margin: 0;
}
</style>
