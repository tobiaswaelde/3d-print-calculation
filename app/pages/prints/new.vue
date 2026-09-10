<template>
  <LayoutPagePanel panel-id="new-print" :title="t('prints.new')">
    <ModulesPrintsPrintEditor />
  </LayoutPagePanel>
</template>

<script setup lang="ts">
const { t } = useI18n();
</script>
