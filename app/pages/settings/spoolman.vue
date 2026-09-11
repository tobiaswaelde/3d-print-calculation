<template>
  <div class="mx-auto w-full max-w-3xl space-y-5">
    <ModulesSettingsSpoolmanConfiguration @saved="revision += 1" />
    <ModulesSettingsSpoolman :key="revision" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'spoolman' });
const revision = ref(0);
</script>
