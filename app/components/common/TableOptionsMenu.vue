<template>
  <UDropdownMenu :items="items" :content="{ align: 'end', sideOffset: 8 }">
    <UButton
      color="neutral"
      variant="outline"
      icon="i-tabler-adjustments"
      :aria-label="t('common.tableOptions')"
    />
  </UDropdownMenu>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';

const includeArchived = defineModel<boolean>('includeArchived', { required: true });
const { t } = useI18n();

const items = computed<DropdownMenuItem[]>(() => [
  {
    label: t('master.includeArchived'),
    type: 'checkbox',
    checked: includeArchived.value,
    onUpdateChecked: (checked) => {
      includeArchived.value = checked;
    },
  },
]);
</script>
