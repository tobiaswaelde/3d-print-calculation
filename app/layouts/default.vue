<template>
  <UDashboardGroup unit="rem" storage="local" storage-key="print-cost-dashboard">
    <LayoutAppSidebar />
    <slot />
    <LayoutChangelogDialog v-model:open="changelogOpen" />
    <CommonDialogsShortcuts />
  </UDashboardGroup>
</template>

<script setup lang="ts">
const changelogOpen = useState('changelog-open', () => false);
const { load: loadFeatures } = useFeatures();

onMounted(loadFeatures);
</script>
