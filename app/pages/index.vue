<template>
  <LayoutPagePanel panel-id="dashboard" :title="t('pages.dashboard')">
    <CommonEmptyState
      :title="t('pages.dashboard')"
      :description="t('pages.placeholder')"
      icon="i-lucide-chart-no-axes-combined"
    />
  </LayoutPagePanel>
</template>

<script setup lang="ts">
const { t } = useI18n();
</script>
