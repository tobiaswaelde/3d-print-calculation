<template>
  <LayoutPagePanel panel-id="printers" :title="t('nav.printers')">
    <ModulesMasterDataResourceManager resource="printers" :title="t('nav.printers')" />
  </LayoutPagePanel>
</template>
<script setup lang="ts">
const { t } = useI18n();
</script>
