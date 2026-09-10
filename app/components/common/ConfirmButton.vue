<template>
  <UPopover>
    <UButton v-bind="$attrs" :label="label" />
    <template #content>
      <div class="max-w-72 space-y-3 p-4">
        <p class="text-sm">{{ confirmation }}</p>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" :label="t('common.cancel')" />
          <UButton color="error" :label="t('common.confirm')" @click="$emit('confirm')" />
        </div>
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
defineProps<{ label: string; confirmation: string }>();
defineEmits<{ confirm: [] }>();
const { t } = useI18n();
</script>
