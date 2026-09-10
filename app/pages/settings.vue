<template>
  <LayoutPagePanel panel-id="settings" :title="t('nav.settings')"
    ><CommonEmptyState :title="t('common.empty')" :description="t('pages.placeholder')"
  /></LayoutPagePanel>
</template>
<script setup lang="ts">
const { t } = useI18n();
</script>
