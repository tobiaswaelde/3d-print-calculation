<template>
  <LayoutPagePanel panel-id="series" :title="t('nav.series')">
    <div class="space-y-5">
      <div class="flex flex-wrap gap-3">
        <UInput v-model="search" :aria-label="t('common.search')" :placeholder="t('common.search')" /><USelect
          v-model="status"
          :items="statusOptions"
          :aria-label="t('series.state')"
        /><UCheckbox v-model="includeArchived" :label="t('spool.includeArchived')" /><UButton
          :label="t('series.create')"
          @click="creating = !creating"
        />
      </div>
      <UAlert v-if="error" color="error" :description="error" />
      <ModulesSeriesForm v-if="creating" @saved="open" />
      <div class="grid gap-4 lg:grid-cols-2">
        <UCard v-for="series in items" :key="series.id" :class="series.archivedAt && 'opacity-60'">
          <NuxtLink :to="`/series/${series.id}`" class="text-lg font-semibold text-primary underline">{{
            series.name
          }}</NuxtLink>
          <p>{{ t(`series.${series.status}`) }} · {{ series.customer?.name ?? '—' }}</p>
          <p>
            {{ t('series.produced') }}: {{ series.summary.producedQuantity }} /
            {{ series.targetQuantity ?? '—' }}
          </p>
          <UProgress
            v-if="series.targetQuantity"
            :model-value="Math.min(series.summary.producedQuantity, series.targetQuantity)"
            :max="series.targetQuantity"
            :aria-label="t('series.produced')"
          />
          <p class="mt-3 text-sm">
            {{ t('outcome.actualCost') }}: {{ money(series.summary.actualCost, series.currency) }} ·
            {{ t('outcome.failedCost') }}: {{ money(series.summary.failedCost, series.currency) }}
          </p>
        </UCard>
      </div>
      <p v-if="!items.length">{{ t('common.empty') }}</p>
      <UPagination v-model:page="page" :total="total" :items-per-page="25" />
    </div>
  </LayoutPagePanel>
</template>
<script setup lang="ts">
import type { PrintSeriesDto } from '#shared/types/series';
import type { PaginatedResponse } from '#shared/types/master-data';

definePageMeta({ middleware: 'print-series' });
const { t } = useI18n();
const { money } = useFormatting();
const search = ref('');
const status = ref('ALL');
const page = ref(1);
const total = ref(0);
const includeArchived = ref(false);
const creating = ref(false);
const error = ref('');
const items = ref<PrintSeriesDto[]>([]);
const statusOptions = computed(() =>
  ['ALL', 'OPEN', 'COMPLETED'].map((value) => ({ value, label: t(`series.${value}`) })),
);
async function refresh() {
  try {
    const response = await $fetch<PaginatedResponse<PrintSeriesDto>>('/api/series', {
      query: {
        search: search.value,
        page: page.value,
        includeArchived: includeArchived.value,
        status: status.value === 'ALL' ? undefined : status.value,
      },
    });
    items.value = response.items;
    total.value = response.total;
    error.value = '';
  } catch (reason) {
    error.value = String(reason);
  }
}
async function open(series: PrintSeriesDto) {
  await navigateTo(`/series/${series.id}`);
}
watch([search, status, includeArchived], () => {
  page.value = 1;
  void refresh();
});
watch(page, refresh);
onMounted(refresh);
</script>
