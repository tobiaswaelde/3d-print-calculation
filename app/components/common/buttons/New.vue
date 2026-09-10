<template>
  <UTooltip>
    <UButton icon="i-tabler-plus" label="New" @click="emit('click', $event)" />

    <template #content> <UKbd value="shift" /> + <UKbd value="N" /> </template>
  </UTooltip>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  click: [event?: MouseEvent];
}>();

defineShortcuts({
  shift_n: () => emit('click'),
});
</script>
