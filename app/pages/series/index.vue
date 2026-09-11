<template>
  <LayoutPagePanel panel-id="series" :title="t('nav.series')" table>
    <template #toolbar>
      <CommonTableToolbar v-model:search="search" :title="t('nav.series')">
        <template #filters>
          <USelect
            v-model="status"
            class="w-44"
            value-key="value"
            :items="statusOptions"
            :aria-label="t('series.state')"
          />
        </template>
        <template #options>
          <CommonTableOptionsMenu v-model:include-archived="includeArchived" />
        </template>
        <template #create><CommonButtonsNew @click="creating = true" /></template>
      </CommonTableToolbar>
    </template>

    <UAlert v-if="error" class="m-4 shrink-0 sm:m-6" color="error" :description="error" />

    <UModal v-model:open="creating" :title="t('series.create')" scrollable :ui="{ content: 'sm:max-w-3xl' }">
      <template #body><ModulesSeriesForm @saved="open" /></template>
    </UModal>

    <ModulesPrintsCreateDialog
      v-model:open="creatingPrint"
      :initial-series-id="selectedSeries?.id"
      :initial-customer-id="selectedSeries?.customerId"
    />

    <div data-table-region class="min-h-0 flex-1 overflow-auto">
      <div v-if="loading" class="flex min-h-full items-center justify-center">
        <UIcon name="i-tabler-loader-2" class="size-8 animate-spin" />
      </div>
      <CommonEmptyState
        v-else-if="!items.length"
        class="min-h-full rounded-none border-0"
        :title="t('series.emptyTitle')"
        :description="t('series.emptyDescription')"
        icon="i-tabler-stack-2"
      >
        <UButton icon="i-tabler-plus" :label="t('common.new')" @click="creating = true" />
      </CommonEmptyState>
      <table v-else class="w-full min-w-260 text-sm">
        <thead class="sticky top-0 z-10 bg-elevated text-left text-xs text-muted uppercase">
          <tr>
            <th class="px-4 py-3 font-medium sm:first:pl-6">{{ t('master.name') }}</th>
            <th class="px-4 py-3 font-medium">{{ t('nav.customers') }}</th>
            <th class="px-4 py-3 font-medium">{{ t('series.progress') }}</th>
            <th class="px-4 py-3 font-medium">{{ t('series.runs') }}</th>
            <th class="px-4 py-3 font-medium">{{ t('series.costs') }}</th>
            <th class="px-4 py-3 font-medium">{{ t('history.lastActivity') }}</th>
            <th class="w-1 px-4 py-3 text-right font-medium sm:pr-6">{{ t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="series in items"
            :key="series.id"
            class="border-t border-default transition-colors hover:bg-elevated/50"
            :class="series.archivedAt && 'opacity-60'"
          >
            <td class="px-4 py-2.5 sm:first:pl-6">
              <NuxtLink :to="`/series/${series.id}`" class="font-medium text-primary hover:underline">
                {{ series.name }}
              </NuxtLink>
              <div class="mt-1 flex flex-wrap gap-1">
                <UBadge :color="series.status === 'OPEN' ? 'primary' : 'success'" variant="subtle">
                  {{ t(`series.${series.status}`) }}
                </UBadge>
                <UBadge v-if="series.archivedAt" color="neutral" variant="subtle">
                  {{ t('series.archived') }}
                </UBadge>
              </div>
            </td>
            <td class="px-4 py-2.5">
              <NuxtLink
                v-if="series.customer"
                :to="`/customers/${series.customer.id}`"
                class="text-primary hover:underline"
              >
                {{ series.customer.name }}
              </NuxtLink>
              <span v-else>—</span>
            </td>
            <td class="px-4 py-2.5">
              <div class="mb-1 flex items-center justify-between gap-3">
                <span>{{ series.summary.producedQuantity }} / {{ series.targetQuantity ?? '—' }}</span>
                <span v-if="series.targetQuantity" class="text-xs text-muted">{{ progress(series) }}%</span>
              </div>
              <UProgress
                v-if="series.targetQuantity"
                :model-value="Math.min(series.summary.producedQuantity, series.targetQuantity)"
                :max="series.targetQuantity"
                size="xs"
                :aria-label="t('series.produced')"
              />
            </td>
            <td class="px-4 py-2.5">
              {{ series.summary.totalRuns }}
              <div class="text-xs text-muted">
                {{ t('dashboard.completedPrints') }}: {{ series.summary.completedPrints }}
              </div>
            </td>
            <td class="px-4 py-2.5">
              {{ money(series.summary.actualCost, series.currency) }}
              <div class="text-xs text-muted">
                {{ t('outcome.failedCost') }}: {{ money(series.summary.failedCost, series.currency) }}
              </div>
            </td>
            <td class="px-4 py-2.5">
              {{ series.summary.lastActivity ? dateTime(series.summary.lastActivity) : '—' }}
            </td>
            <td class="px-4 py-2.5 sm:pr-6">
              <div class="flex justify-end gap-1">
                <UButton
                  :to="`/series/${series.id}`"
                  color="neutral"
                  variant="ghost"
                  icon="i-tabler-eye"
                  :aria-label="t('common.open')"
                />
                <UButton
                  v-if="!series.archivedAt"
                  color="neutral"
                  variant="ghost"
                  icon="i-tabler-file-plus"
                  :aria-label="t('prints.new')"
                  @click="startPrint(series)"
                />
                <UButton
                  color="neutral"
                  variant="ghost"
                  :icon="series.archivedAt ? 'i-tabler-archive-off' : 'i-tabler-archive'"
                  :aria-label="t(series.archivedAt ? 'common.restore' : 'common.archive')"
                  :loading="pendingId === series.id"
                  @click="toggleArchive(series)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UPagination v-model:page="page" :total="total" :items-per-page="25" class="shrink-0 p-4" />
  </LayoutPagePanel>
</template>

<script setup lang="ts">
import type { PrintSeriesDto } from '#shared/types/series';
import type { PaginatedResponse } from '#shared/types/master-data';

definePageMeta({ middleware: 'print-series' });
const { t } = useI18n();
const { money, dateTime } = useFormatting();
const search = ref('');
const status = ref<'ALL' | PrintSeriesDto['status']>('ALL');
const page = ref(1);
const total = ref(0);
const includeArchived = ref(false);
const creating = ref(false);
const creatingPrint = ref(false);
const selectedSeries = ref<PrintSeriesDto | null>(null);
const loading = ref(true);
const pendingId = ref<string | null>(null);
const error = ref('');
const items = ref<PrintSeriesDto[]>([]);
let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let request = 0;

const statusOptions = computed(() =>
  (['ALL', 'OPEN', 'COMPLETED'] as const).map((value) => ({ value, label: t(`series.${value}`) })),
);

function progress(series: PrintSeriesDto) {
  if (!series.targetQuantity) return 0;
  return Math.min(100, Math.round((series.summary.producedQuantity / series.targetQuantity) * 100));
}

async function refresh() {
  const current = ++request;
  loading.value = true;
  try {
    const response = await $fetch<PaginatedResponse<PrintSeriesDto>>('/api/series', {
      query: {
        search: search.value,
        page: page.value,
        includeArchived: includeArchived.value,
        status: status.value === 'ALL' ? undefined : status.value,
      },
    });
    if (current !== request) return;
    items.value = response.items;
    total.value = response.total;
    error.value = '';
  } catch (reason) {
    if (current === request) error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    if (current === request) loading.value = false;
  }
}

async function open(series: PrintSeriesDto) {
  creating.value = false;
  await navigateTo(`/series/${series.id}`);
}

function startPrint(series: PrintSeriesDto) {
  selectedSeries.value = series;
  creatingPrint.value = true;
}

async function toggleArchive(series: PrintSeriesDto) {
  pendingId.value = series.id;
  try {
    await $fetch(`/api/series/${series.id}/archive`, {
      method: 'POST',
      body: { archived: !series.archivedAt },
    });
    await refresh();
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    pendingId.value = null;
  }
}

watch([search, status, includeArchived], () => {
  page.value = 1;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(refresh, 250);
});
watch(page, refresh);
onMounted(refresh);
</script>
