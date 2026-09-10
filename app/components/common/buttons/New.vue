<template>
  <UTooltip>
    <UButton icon="i-tabler-plus" label="New" @click="emit('click', $event)" />

    <template #content> <UKbd value="ctrl" /> + <UKbd value="N" /> </template>
  </UTooltip>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  click: [event?: MouseEvent];
}>();

defineShortcuts({
  ctrl_n: () => emit('click'),
});
</script>
