<template>
  <LayoutPagePanel panel-id="prints" :title="t('nav.prints')" table>
    <template #toolbar>
      <CommonTableToolbar v-model:search="search" :title="t('nav.prints')">
        <template #filters>
          <USelect
            v-model="status"
            class="w-44"
            value-key="value"
            :items="statusOptions"
            :aria-label="t('prints.status')"
          />
          <USelect v-model="outcome" class="w-44" :items="outcomeOptions" :aria-label="t('outcome.title')" />
          <UPopover
            ><UButton
              color="neutral"
              variant="outline"
              icon="i-tabler-filter"
              :aria-label="t('history.filters')" /><template #content
              ><div class="grid w-80 max-w-[calc(100vw-2rem)] gap-3 p-4">
                <UFormField :label="t('history.from')"
                  ><UInput v-model="dateFrom" type="date" class="w-full"
                /></UFormField>
                <UFormField :label="t('history.to')"
                  ><UInput v-model="dateTo" type="date" class="w-full"
                /></UFormField>
                <UFormField :label="t('nav.printers')"
                  ><USelect v-model="printerId" :items="printerOptions" class="w-full"
                /></UFormField>
                <UFormField :label="t('nav.customers')"
                  ><USelect v-model="customerId" :items="customerOptions" class="w-full"
                /></UFormField>
                <UFormField :label="t('nav.series')"
                  ><CommonSeriesSelect v-model="seriesId"
                /></UFormField></div></template
          ></UPopover>
        </template>
        <template #options>
          <CommonTableOptionsMenu v-model:include-archived="includeArchived" />
        </template>
        <template #create>
          <UButton
            :to="exportUrl"
            external
            color="neutral"
            variant="outline"
            :label="t('report.csv')"
          /><CommonButtonsNew @click="createOpen = true" />
        </template>
      </CommonTableToolbar>
    </template>

    <UAlert v-if="error" class="m-4 shrink-0 sm:m-6" color="error" :description="error" />
    <div data-table-region class="min-h-0 flex-1 overflow-auto">
      <div v-if="loading" class="flex min-h-full items-center justify-center">
        <UIcon name="i-tabler-loader-2" class="size-8 animate-spin" />
      </div>
      <CommonEmptyState
        v-else-if="!items.length"
        class="min-h-full rounded-none border-0"
        :title="t('common.empty')"
      >
        <UButton icon="i-tabler-plus" :label="t('common.new')" @click="createOpen = true" />
      </CommonEmptyState>
      <template v-else>
        <table class="w-full min-w-200 text-sm">
          <thead class="sticky top-0 z-10 bg-elevated text-left text-xs text-muted uppercase">
            <tr>
              <th class="px-4 py-3 font-medium sm:first:pl-6">{{ t('master.name') }}</th>
              <th class="px-4 py-3 font-medium">{{ t('nav.customers') }}</th>
              <th class="px-4 py-3 font-medium">{{ t('nav.printers') }}</th>
              <th class="px-4 py-3 font-medium">{{ t('prints.duration') }}</th>
              <th class="px-4 py-3 font-medium">{{ t('prints.totalCost') }}</th>
              <th class="px-4 py-3 font-medium sm:pr-6">{{ t('prints.status') }}</th>
              <th class="px-4 py-3 font-medium">{{ t('outcome.title') }}</th>
              <th class="px-4 py-3 font-medium sm:pr-6">{{ t('prints.payment') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in items"
              :key="item.id"
              class="border-t border-default transition-colors hover:bg-elevated/50"
              :class="item.archivedAt && 'opacity-60'"
            >
              <td class="px-4 py-2.5 sm:first:pl-6">
                <NuxtLink :to="`/prints/${item.id}`" class="font-medium text-primary hover:underline">{{
                  item.name
                }}</NuxtLink
                ><NuxtLink
                  v-if="item.series"
                  :to="`/series/${item.series.id}`"
                  class="block text-xs text-primary"
                  >{{ item.series.name }}</NuxtLink
                >
              </td>
              <td class="px-4 py-2.5">
                <NuxtLink
                  v-if="item.customer"
                  :to="`/customers/${item.customer.id}`"
                  class="text-primary underline"
                  >{{ item.customer.name }}</NuxtLink
                ><span v-else>—</span>
              </td>
              <td class="px-4 py-2.5">{{ item.printer.name }}</td>
              <td class="px-4 py-2.5">{{ duration(item.totalDurationSeconds) }}</td>
              <td class="px-4 py-2.5">
                {{ money(item.totalCost, item.currency) }}
                <div class="text-xs text-muted">
                  {{ t('prints.quantity') }}: {{ item.quantity }} · {{ t('prints.costPerUnit') }}:
                  {{ money(item.costPerUnit, item.currency) }}
                </div>
              </td>
              <td class="px-4 py-2.5 sm:pr-6">
                <UBadge :color="statusColors[item.status]" variant="subtle">
                  {{ t(`prints.${item.status.toLowerCase()}`) }}
                </UBadge>
              </td>
              <td class="px-4 py-2.5 sm:pr-6">
                <UBadge
                  v-if="item.status === 'DONE'"
                  :color="item.outcome?.status === 'FAILED' ? 'error' : item.outcome ? 'success' : 'neutral'"
                  >{{ t(`outcome.${item.outcome?.status ?? 'PENDING'}`) }}</UBadge
                >
              </td>
              <td class="px-4 py-2.5 sm:pr-6">
                <UBadge :color="item.paidAt ? 'success' : 'neutral'" variant="subtle">
                  {{ t(item.paidAt ? 'prints.paid' : 'prints.unpaid') }}
                </UBadge>
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </div>

    <UPagination v-model:page="page" :total="total" :items-per-page="25" class="p-4" />
    <ModulesPrintsCreateDialog
      v-model:open="createOpen"
      :initial-series-id="seriesId"
      :initial-customer-id="customerId === 'ALL' ? null : customerId"
      @created="refresh"
    />
  </LayoutPagePanel>
</template>

<script setup lang="ts">
import type { PaginatedResponse, MasterDataListItem } from '#shared/types/master-data';
import { printStatuses } from '#shared/schemas/prints';
import type { PrintJobDto } from '#shared/types/prints';

const { t } = useI18n();
const route = useRoute();
const { money, duration } = useFormatting();
const items = ref<PrintJobDto[]>([]);
const search = ref('');
type StatusFilter = 'ALL' | PrintJobDto['status'];
const status = ref<StatusFilter>(
  printStatuses.includes(route.query.status as PrintJobDto['status'])
    ? (route.query.status as PrintJobDto['status'])
    : 'ALL',
);
const outcome = ref('ALL');
const outcomeOptions = computed(() =>
  ['ALL', 'PENDING', 'SUCCESS', 'FAILED'].map((value) => ({ value, label: t(`outcome.${value}`) })),
);
const page = ref(1);
const total = ref(0);
const dateFrom = ref('');
const dateTo = ref('');
const printerId = ref('ALL');
const customerId = ref('ALL');
const seriesId = ref<string | null>(String(route.query.seriesId ?? '') || null);
const printers = ref<MasterDataListItem[]>([]);
const customers = ref<MasterDataListItem[]>([]);
const printerOptions = computed(() => [
  { label: t('history.allPrinters'), value: 'ALL' },
  ...printers.value.map((item) => ({ label: item.name, value: item.id })),
]);
const customerOptions = computed(() => [
  { label: t('history.allCustomers'), value: 'ALL' },
  ...customers.value.map((item) => ({ label: item.name, value: item.id })),
]);
const includeArchived = ref(false);
const createOpen = ref(route.query.create === 'true');
const loading = ref(true);
const error = ref('');
let timer: ReturnType<typeof setTimeout> | undefined;
const statusOptions = computed<Array<{ label: string; value: StatusFilter }>>(() => [
  { label: t('prints.allStatuses'), value: 'ALL' },
  ...printStatuses.map((value) => ({ label: t(`prints.${value.toLowerCase()}`), value })),
]);
const statusColors = {
  DRAFT: 'neutral',
  PRINTING: 'info',
  PRINTED: 'primary',
  SHIPPED: 'warning',
  DONE: 'success',
} as const;
const filters = computed(() => ({
  page: page.value,
  dateFrom: dateFrom.value || undefined,
  dateTo: dateTo.value || undefined,
  printerId: printerId.value === 'ALL' ? undefined : printerId.value,
  customerId: customerId.value === 'ALL' ? undefined : customerId.value,
  seriesId: seriesId.value ?? undefined,
  search: search.value,
  outcome: outcome.value === 'ALL' ? undefined : outcome.value,
  status: status.value === 'ALL' ? undefined : status.value,
  includeArchived: includeArchived.value,
}));
const exportUrl = computed(() => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters.value))
    if (value !== undefined) params.set(key, String(value));
  return `/api/prints/export?${params}`;
});
async function refresh() {
  loading.value = true;
  try {
    const response = await $fetch<PaginatedResponse<PrintJobDto>>('/api/prints', {
      query: filters.value,
    });
    items.value = response.items;
    total.value = response.total;
    error.value = '';
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    loading.value = false;
  }
}

watch([search, status, outcome, includeArchived, dateFrom, dateTo, printerId, customerId, seriesId], () => {
  page.value = 1;
  clearTimeout(timer);
  timer = setTimeout(refresh, 250);
});
watch(createOpen, (open) => {
  if (open || route.query.create === undefined) return;
  const query = { ...route.query };
  delete query.create;
  void navigateTo({ path: '/prints', query }, { replace: true });
});
watch(page, refresh);
onMounted(async () => {
  await refresh();
  try {
    const [p, c] = await Promise.all([
      $fetch<PaginatedResponse<MasterDataListItem>>('/api/printers', { query: { pageSize: 100 } }),
      $fetch<PaginatedResponse<MasterDataListItem>>('/api/customers', { query: { pageSize: 100 } }),
    ]);
    printers.value = p.items;
    customers.value = c.items;
  } catch (reason) {
    error.value = String(reason);
  }
});
</script>
