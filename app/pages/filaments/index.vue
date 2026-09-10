<template>
  <LayoutPagePanel panel-id="filaments" :title="t('nav.filaments')"
    ><CommonEmptyState :title="t('common.empty')" :description="t('pages.placeholder')"
  /></LayoutPagePanel>
</template>
<script setup lang="ts">
const { t } = useI18n();
</script>
