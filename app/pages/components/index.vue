<template>
  <LayoutPagePanel panel-id="components" :title="t('nav.components')">
    <ModulesMasterDataResourceManager resource="components" :title="t('nav.components')" />
  </LayoutPagePanel>
</template>
<script setup lang="ts">
const { t } = useI18n();
</script>
