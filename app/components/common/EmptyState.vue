<template>
  <div
    class="flex min-h-52 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center"
  >
    <UIcon :name="icon" class="size-10 text-muted" />
    <h2 class="font-medium">{{ title }}</h2>
    <p v-if="description" class="max-w-lg text-sm text-muted">{{ description }}</p>
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ title: string; description?: string; icon?: string }>(), {
  description: undefined,
  icon: 'i-tabler-inbox',
});
</script>
