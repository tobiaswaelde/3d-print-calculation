<template>
  <main class="grid min-h-full place-items-center overflow-y-auto bg-muted p-4">
    <UCard :class="['w-full', route.path === '/setup' ? 'max-w-3xl' : 'max-w-md']">
      <slot />
    </UCard>
  </main>
</template>

<script setup lang="ts">
const route = useRoute();
</script>
