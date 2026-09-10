<template>
  <LayoutPagePanel panel-id="prints" :title="t('nav.prints')">
    <template #actions><UButton to="/prints/new" icon="i-lucide-plus" :label="t('prints.new')" /></template>
    <div class="space-y-4">
      <div class="flex flex-wrap gap-2">
        <UInput
          v-model="search"
          class="min-w-56 flex-1"
          icon="i-lucide-search"
          :placeholder="t('common.search')"
        />
        <USelect v-model="status" class="w-44" value-key="value" :items="statusOptions" />
        <UCheckbox v-model="includeArchived" :label="t('master.includeArchived')" />
      </div>
      <UAlert v-if="error" color="error" :description="error" />
      <CommonEmptyState v-if="!loading && !items.length" :title="t('common.empty')"
        ><UButton to="/prints/new" :label="t('prints.new')"
      /></CommonEmptyState>
      <div v-else class="overflow-x-auto rounded-lg border border-default">
        <table class="w-full min-w-180 text-sm">
          <thead class="bg-elevated text-left">
            <tr>
              <th class="p-3">{{ t('master.name') }}</th>
              <th class="p-3">{{ t('nav.customers') }}</th>
              <th class="p-3">{{ t('nav.printers') }}</th>
              <th class="p-3">{{ t('prints.duration') }}</th>
              <th class="p-3">{{ t('prints.totalCost') }}</th>
              <th class="p-3">{{ t('prints.status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in items"
              :key="item.id"
              class="border-t border-default hover:bg-elevated/50"
              :class="item.archivedAt && 'opacity-60'"
            >
              <td class="p-3">
                <NuxtLink :to="`/prints/${item.id}`" class="font-medium text-primary hover:underline">{{
                  item.name
                }}</NuxtLink>
              </td>
              <td class="p-3">{{ item.customer?.name ?? '—' }}</td>
              <td class="p-3">{{ item.printer.name }}</td>
              <td class="p-3">{{ duration(item.totalDurationSeconds) }}</td>
              <td class="p-3">{{ money(item.totalCost, item.currency) }}</td>
              <td class="p-3">
                <UBadge :color="item.status === 'COMPLETED' ? 'success' : 'warning'" variant="subtle">{{
                  t(`prints.${item.status.toLowerCase()}`)
                }}</UBadge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
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
