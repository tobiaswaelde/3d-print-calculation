<template>
  <div class="mx-auto w-full max-w-3xl space-y-5">
    <ModulesSettingsBambuBuddyConfiguration @saved="revision += 1" />
    <ModulesSettingsBambuBuddy :key="revision" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'bambubuddy' });
const revision = ref(0);
</script>
