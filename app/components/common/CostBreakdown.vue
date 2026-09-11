<template>
  <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
    <div v-for="item in items" :key="item.label" class="rounded-lg border border-default p-3">
      <div class="text-xs text-muted">{{ item.label }}</div>
      <div class="mt-1 text-lg font-semibold">{{ money(item.value, currency) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  currency: string;
  printerCost: string;
  componentCost: string;
  filamentCost: string;
  electricityCost: string;
  totalCost: string;
  costPerUnit?: string;
}>();
const { t } = useI18n();
const { money } = useFormatting();
const items = computed(() => [
  { label: t('prints.printerCost'), value: props.printerCost },
  { label: t('prints.componentCost'), value: props.componentCost },
  { label: t('prints.filamentCost'), value: props.filamentCost },
  { label: t('prints.electricityCost'), value: props.electricityCost },
  { label: t('prints.totalCost'), value: props.totalCost },
  ...(props.costPerUnit === undefined ? [] : [{ label: t('prints.costPerUnit'), value: props.costPerUnit }]),
]);
</script>
