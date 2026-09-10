<template>
  <UModal
    v-model:open="open"
    scrollable
    :title="t('prints.new')"
    :description="t('prints.createDescription')"
    :ui="{
      content: 'sm:max-w-4xl',
      body: 'max-h-[calc(100dvh-10rem)] overflow-y-auto',
    }"
  >
    <template v-if="$slots.trigger" #default>
      <slot name="trigger" />
    </template>

    <template #body>
      <ModulesPrintsCreateForm v-if="open" @cancel="open = false" @created="handleCreated" />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { PrintJobDto } from '#shared/types/prints';

const emit = defineEmits<{
  created: [print: PrintJobDto];
}>();

const open = defineModel<boolean>('open', { default: false });
const { t } = useI18n();

async function handleCreated(print: PrintJobDto) {
  open.value = false;
  emit('created', print);
  await navigateTo(`/prints/${print.id}`);
}
</script>
