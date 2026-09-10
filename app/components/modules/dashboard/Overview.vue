<template>
  <div class="space-y-5">
    <div class="flex justify-end">
      <USelect
        v-model="period"
        class="w-44"
        value-key="value"
        :items="periodOptions"
        :aria-label="t('dashboard.period')"
      />
    </div>
    <UAlert v-if="error" color="error" :description="error" />
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <NuxtLink
        v-for="kpi in kpis"
        :key="kpi.label"
        :to="kpi.to"
        class="rounded-lg border border-default p-4 transition hover:bg-elevated"
      >
        <div class="text-sm text-muted">{{ kpi.label }}</div>
        <div class="mt-2 text-3xl font-semibold">{{ kpi.value }}</div>
      </NuxtLink>
    </div>

    <div class="grid gap-5 xl:grid-cols-2">
      <UCard>
        <template #header
          ><h2 class="font-semibold">{{ t('dashboard.costOverTime') }}</h2></template
        >
        <ClientOnly><VChart v-if="data" class="h-80" autoresize :option="lineOption" /></ClientOnly>
        <ul class="sr-only">
          <li v-for="point in data?.completedCostSeries" :key="point.date">
            {{ point.date }}: {{ money(point.value, data!.currency) }}
          </li>
        </ul>
      </UCard>
      <UCard>
        <template #header
          ><h2 class="font-semibold">{{ t('dashboard.costCategories') }}</h2></template
        >
        <ClientOnly><VChart v-if="data" class="h-80" autoresize :option="pieOption" /></ClientOnly>
        <ul class="sr-only">
          <li v-for="item in data?.categoryTotals" :key="item.category">
            {{ categoryLabel(item.category) }}: {{ money(item.value, data!.currency) }}
          </li>
        </ul>
      </UCard>
    </div>

    <UCard>
      <template #header
        ><div class="flex items-center justify-between">
          <h2 class="font-semibold">{{ t('dashboard.unfinished') }}</h2>
          <UButton to="/prints/new" icon="i-lucide-plus" :label="t('prints.new')" /></div
      ></template>
      <CommonEmptyState
        v-if="data && !data.unfinishedPrints.length"
        :title="t('dashboard.noDrafts')"
        :description="t('dashboard.noDraftsDescription')"
        ><UButton to="/prints/new" :label="t('prints.new')"
      /></CommonEmptyState>
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-180 text-sm">
          <thead class="text-left text-muted">
            <tr>
              <th class="p-3">{{ t('master.name') }}</th>
              <th class="p-3">{{ t('nav.customers') }}</th>
              <th class="p-3">{{ t('nav.printers') }}</th>
              <th class="p-3">{{ t('dashboard.updated') }}</th>
              <th class="p-3">{{ t('prints.duration') }}</th>
              <th class="p-3">{{ t('prints.totalCost') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in data?.unfinishedPrints"
              :key="item.id"
              class="border-t border-default hover:bg-elevated/50"
            >
              <td class="p-3">
                <NuxtLink :to="`/prints/${item.id}`" class="font-medium text-primary hover:underline">{{
                  item.name
                }}</NuxtLink>
              </td>
              <td class="p-3">{{ item.customer?.name ?? '—' }}</td>
              <td class="p-3">{{ item.printer.name }}</td>
              <td class="p-3">{{ date(item.updatedAt) }}</td>
              <td class="p-3">{{ duration(item.totalDurationSeconds) }}</td>
              <td class="p-3">{{ money(item.totalCost, item.currency) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { DashboardDto } from '#shared/types/prints';

const { t, locale } = useI18n();
const { money } = useFormatting();
const period = ref<DashboardDto['period']>('30d');
const colorMode = useColorMode();
const data = ref<DashboardDto | null>(null);
const error = ref('');
const periodOptions = computed(() => [
  { label: t('dashboard.last30Days'), value: '30d' },
  { label: t('dashboard.last90Days'), value: '90d' },
  { label: t('dashboard.allTime'), value: 'all' },
]);
const duration = (seconds: number) =>
  `${Math.floor(seconds / 3600)} h ${Math.floor((seconds % 3600) / 60)} min`;
const date = (value: string) =>
  new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
const categoryLabel = (category: string) => t(`dashboard.category.${category}`);
const kpis = computed(() => [
  {
    label: t('dashboard.activeDrafts'),
    value: data.value?.kpis.activeDrafts ?? 0,
    to: '/prints?status=DRAFT',
  },
  {
    label: t('dashboard.completedPrints'),
    value: data.value?.kpis.completedPrints ?? 0,
    to: '/prints?status=COMPLETED',
  },
  {
    label: t('dashboard.totalDuration'),
    value: duration(data.value?.kpis.totalDurationSeconds ?? 0),
    to: '/prints?status=COMPLETED',
  },
  {
    label: t('dashboard.totalCost'),
    value: money(data.value?.kpis.totalCost ?? '0', data.value?.currency ?? 'EUR'),
    to: '/prints?status=COMPLETED',
  },
]);
const chartTextColor = computed(() => (colorMode.value === 'dark' ? '#cbd5e1' : '#334155'));
const lineOption = computed(() => ({
  textStyle: { color: chartTextColor.value },
  tooltip: { trigger: 'axis', valueFormatter: (value: number) => money(value, data.value?.currency) },
  grid: { left: 16, right: 16, top: 16, bottom: 16, containLabel: true },
  xAxis: { type: 'category', data: data.value?.completedCostSeries.map((item) => item.date) ?? [] },
  yAxis: { type: 'value' },
  series: [
    {
      type: 'line',
      smooth: true,
      data: data.value?.completedCostSeries.map((item) => Number(item.value)) ?? [],
      areaStyle: {},
    },
  ],
}));
const pieOption = computed(() => ({
  textStyle: { color: chartTextColor.value },
  tooltip: { trigger: 'item', valueFormatter: (value: number) => money(value, data.value?.currency) },
  legend: { bottom: 0, textStyle: { color: chartTextColor.value } },
  series: [
    {
      type: 'pie',
      radius: ['38%', '68%'],
      data:
        data.value?.categoryTotals.map((item) => ({
          name: categoryLabel(item.category),
          value: Number(item.value),
        })) ?? [],
    },
  ],
}));

async function refresh() {
  try {
    data.value = await $fetch<DashboardDto>('/api/dashboard', { query: { period: period.value } });
    error.value = '';
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  }
}

watch(period, refresh);
onMounted(refresh);
</script>
