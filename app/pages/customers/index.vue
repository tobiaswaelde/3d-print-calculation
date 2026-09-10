<template>
  <LayoutPagePanel panel-id="customers" :title="t('nav.customers')">
    <ModulesMasterDataResourceManager resource="customers" :title="t('nav.customers')" />
  </LayoutPagePanel>
</template>
<script setup lang="ts">
const { t } = useI18n();
</script>
