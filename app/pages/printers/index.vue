<template>
  <LayoutPagePanel panel-id="printers" :title="t('nav.printers')"
    ><CommonEmptyState :title="t('common.empty')" :description="t('pages.placeholder')"
  /></LayoutPagePanel>
</template>
<script setup lang="ts">
const { t } = useI18n();
</script>
