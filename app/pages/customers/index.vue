<template>
  <LayoutPagePanel panel-id="customers" :title="t('nav.customers')"
    ><CommonEmptyState :title="t('common.empty')" :description="t('pages.placeholder')"
  /></LayoutPagePanel>
</template>
<script setup lang="ts">
const { t } = useI18n();
</script>
