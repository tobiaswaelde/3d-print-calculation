<template>
  <LayoutPagePanel panel-id="prints" :title="t('nav.prints')"
    ><CommonEmptyState :title="t('common.empty')" :description="t('pages.placeholder')"
  /></LayoutPagePanel>
</template>
<script setup lang="ts">
const { t } = useI18n();
</script>
