<template>
  <LayoutPagePanel panel-id="print-detail" :title="t('prints.detail')">
    <ModulesPrintsPrintEditor :print-id="String(route.params.id)" />
  </LayoutPagePanel>
</template>

<script setup lang="ts">
const { t } = useI18n();
const route = useRoute();
</script>
