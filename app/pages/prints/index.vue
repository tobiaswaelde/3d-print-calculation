<template>
  <LayoutPagePanel panel-id="prints" :title="t('nav.prints')" table>
    <template #toolbar>
      <CommonTableToolbar v-model:search="search" :title="t('nav.prints')">
        <template #filters>
          <USelect v-model="status" class="w-44" value-key="value" :items="statusOptions" />
          <UCheckbox v-model="includeArchived" :label="t('master.includeArchived')" />
        </template>
        <template #create>
          <UButton to="/prints/new" icon="i-tabler-plus" :label="t('prints.new')" />
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
        <UButton to="/prints/new" icon="i-tabler-plus" :label="t('prints.new')" />
      </CommonEmptyState>
      <template v-else>
        <table class="w-full min-w-180 text-sm">
          <thead class="sticky top-0 z-10 bg-elevated text-left text-xs text-muted uppercase">
            <tr>
              <th class="px-4 py-3 font-medium sm:first:pl-6">{{ t('master.name') }}</th>
              <th class="px-4 py-3 font-medium">{{ t('nav.customers') }}</th>
              <th class="px-4 py-3 font-medium">{{ t('nav.printers') }}</th>
              <th class="px-4 py-3 font-medium">{{ t('prints.duration') }}</th>
              <th class="px-4 py-3 font-medium">{{ t('prints.totalCost') }}</th>
              <th class="px-4 py-3 font-medium sm:pr-6">{{ t('prints.status') }}</th>
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
                }}</NuxtLink>
              </td>
              <td class="px-4 py-2.5">{{ item.customer?.name ?? '—' }}</td>
              <td class="px-4 py-2.5">{{ item.printer.name }}</td>
              <td class="px-4 py-2.5">{{ duration(item.totalDurationSeconds) }}</td>
              <td class="px-4 py-2.5">{{ money(item.totalCost, item.currency) }}</td>
              <td class="px-4 py-2.5 sm:pr-6">
                <UBadge :color="item.status === 'COMPLETED' ? 'success' : 'warning'" variant="subtle">{{
                  t(`prints.${item.status.toLowerCase()}`)
                }}</UBadge>
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </div>
  </LayoutPagePanel>
</template>

<script setup lang="ts">
import type { PaginatedResponse } from '#shared/types/master-data';
import type { PrintJobDto } from '#shared/types/prints';

const { t } = useI18n();
const route = useRoute();
const { money } = useFormatting();
const items = ref<PrintJobDto[]>([]);
const search = ref('');
const status = ref(
  route.query.status === 'DRAFT' || route.query.status === 'COMPLETED' ? route.query.status : '',
);
const includeArchived = ref(false);
const loading = ref(true);
const error = ref('');
let timer: ReturnType<typeof setTimeout> | undefined;
const statusOptions = computed(() => [
  { label: t('prints.allStatuses'), value: '' },
  { label: t('prints.draft'), value: 'DRAFT' },
  { label: t('prints.completed'), value: 'COMPLETED' },
]);
const duration = (seconds: number) =>
  `${Math.floor(seconds / 3600)} h ${Math.floor((seconds % 3600) / 60)} min`;

async function refresh() {
  loading.value = true;
  try {
    const response = await $fetch<PaginatedResponse<PrintJobDto>>('/api/prints', {
      query: {
        search: search.value,
        status: status.value || undefined,
        includeArchived: includeArchived.value,
      },
    });
    items.value = response.items;
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    loading.value = false;
  }
}

watch([search, status, includeArchived], () => {
  clearTimeout(timer);
  timer = setTimeout(refresh, 250);
});
onMounted(refresh);
</script>
