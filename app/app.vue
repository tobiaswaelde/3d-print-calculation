<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
const { locale } = useI18n();

useHead({
  title: '3D Print Costing',
  htmlAttrs: { lang: locale },
});
</script>
