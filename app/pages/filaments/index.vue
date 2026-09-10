<template>
  <LayoutPagePanel panel-id="filaments" :title="t('nav.filaments')">
    <ModulesMasterDataResourceManager resource="filaments" :title="t('nav.filaments')" />
  </LayoutPagePanel>
</template>
<script setup lang="ts">
const { t } = useI18n();
</script>
