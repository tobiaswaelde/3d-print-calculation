<template>
  <LayoutPagePanel panel-id="spools" :title="t('nav.spools')" table>
    <template #toolbar>
      <CommonTableToolbar v-model:search="search" :title="t('nav.spools')">
        <template #options>
          <CommonTableOptionsMenu v-model:include-archived="includeArchived" />
        </template>
        <template #create>
          <UButton
            :to="{ path: '/settings/integrations', hash: '#integration-spoolman' }"
            :label="t('integration.spoolman')"
            icon="i-tabler-plug-connected"
            color="neutral"
            variant="outline"
          />
          <CommonButtonsNew @click="creating = true" />
        </template>
      </CommonTableToolbar>
    </template>

    <UAlert v-if="error" class="m-4 shrink-0 sm:m-6" color="error" :description="error" />

    <UModal v-model:open="creating" :title="t('spool.create')" scrollable :ui="{ content: 'sm:max-w-3xl' }">
      <template #body><ModulesSpoolsForm @saved="open" /></template>
    </UModal>

    <div data-table-region class="min-h-0 flex-1 overflow-auto">
      <div v-if="loading" class="flex min-h-full items-center justify-center">
        <UIcon name="i-tabler-loader-2" class="size-8 animate-spin" />
      </div>
      <CommonEmptyState
        v-else-if="!items.length"
        class="min-h-full rounded-none border-0"
        :title="t('spool.emptyTitle')"
        :description="t('spool.emptyDescription')"
        icon="i-tabler-bobbin"
      >
        <UButton icon="i-tabler-plus" :label="t('common.new')" @click="creating = true" />
      </CommonEmptyState>
      <table v-else class="w-full min-w-240 text-sm">
        <thead class="sticky top-0 z-10 bg-elevated text-left text-xs text-muted uppercase">
          <tr>
            <th class="px-4 py-3 font-medium sm:first:pl-6">{{ t('spool.code') }}</th>
            <th class="px-4 py-3 font-medium">{{ t('nav.filaments') }}</th>
            <th class="px-4 py-3 font-medium">{{ t('spool.stock') }}</th>
            <th class="px-4 py-3 font-medium">{{ t('spool.storage') }}</th>
            <th class="px-4 py-3 font-medium">{{ t('master.rate') }}</th>
            <th class="px-4 py-3 font-medium">{{ t('spool.source') }}</th>
            <th class="w-1 px-4 py-3 text-right font-medium sm:pr-6">{{ t('common.actions') }}</th>
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
              <NuxtLink :to="`/spools/${item.id}`" class="font-medium text-primary hover:underline">
                {{ item.code }}
              </NuxtLink>
              <div v-if="item.legacy || item.archivedAt" class="mt-1 flex flex-wrap gap-1">
                <UBadge v-if="item.legacy" color="warning" variant="subtle">{{ t('spool.legacy') }}</UBadge>
                <UBadge v-if="item.archivedAt" color="neutral" variant="subtle">{{
                  t('spool.archived')
                }}</UBadge>
              </div>
            </td>
            <td class="px-4 py-2.5">{{ item.filamentName }}</td>
            <td class="px-4 py-2.5">
              <span :class="Number(item.remainingGrams) < 0 && 'text-error'">
                {{ item.remainingGrams === null ? '—' : `${decimal(item.remainingGrams)} g` }}
              </span>
              <div class="text-xs text-muted">
                {{ t('spool.initial') }}: {{ decimal(item.initialNetWeightGrams) }} g
              </div>
            </td>
            <td class="px-4 py-2.5">
              <div>{{ item.location ?? '—' }}</div>
              <div v-if="item.purchaseLot" class="text-xs text-muted">{{ item.purchaseLot }}</div>
            </td>
            <td class="px-4 py-2.5">
              {{ money(item.purchasePrice, currency) }}
              <div class="text-xs text-muted">{{ money(item.costPerGram, currency) }}/g</div>
            </td>
            <td class="px-4 py-2.5">
              <UBadge :color="item.stockAuthority === 'NATIVE' ? 'neutral' : 'info'" variant="subtle">
                {{ sourceLabel(item) }}
              </UBadge>
              <div v-if="item.stale" class="mt-1 text-xs text-warning">{{ t('integration.stale') }}</div>
            </td>
            <td class="px-4 py-2.5 sm:pr-6">
              <div class="flex justify-end gap-1">
                <UButton
                  :to="`/spools/${item.id}`"
                  color="neutral"
                  variant="ghost"
                  icon="i-tabler-eye"
                  :aria-label="t('common.open')"
                />
                <UButton
                  :to="`/spools/${item.id}/label`"
                  color="neutral"
                  variant="ghost"
                  icon="i-tabler-qrcode"
                  :aria-label="t('spool.label')"
                />
                <UButton
                  color="neutral"
                  variant="ghost"
                  :icon="item.archivedAt ? 'i-tabler-archive-off' : 'i-tabler-archive'"
                  :aria-label="t(item.archivedAt ? 'common.restore' : 'common.archive')"
                  :loading="pendingId === item.id"
                  @click="toggleArchive(item)"
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
import type { PaginatedResponse } from '#shared/types/master-data';
import type { SpoolDto } from '#shared/types/spools';

definePageMeta({ middleware: 'spool-management' });
const { t } = useI18n();
const { money, decimal } = useFormatting();
const route = useRoute();
const search = ref(typeof route.query.search === 'string' ? route.query.search : '');
const page = ref(1);
const total = ref(0);
const includeArchived = ref(false);
const items = ref<SpoolDto[]>([]);
const creating = ref(false);
const loading = ref(true);
const pendingId = ref<string | null>(null);
const error = ref('');
const currency = ref('EUR');
let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let request = 0;

function sourceLabel(item: SpoolDto) {
  return item.stockAuthority === 'NATIVE' ? t('spool.native') : t('integration.spoolman');
}

async function refresh() {
  const current = ++request;
  loading.value = true;
  try {
    const result = await $fetch<PaginatedResponse<SpoolDto>>('/api/spools', {
      query: { search: search.value, page: page.value, includeArchived: includeArchived.value },
    });
    if (current !== request) return;
    items.value = result.items;
    total.value = result.total;
    error.value = '';
  } catch (reason) {
    if (current === request) error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    if (current === request) loading.value = false;
  }
}

async function open(spool: SpoolDto) {
  creating.value = false;
  await navigateTo(`/spools/${spool.id}`);
}

async function toggleArchive(item: SpoolDto) {
  pendingId.value = item.id;
  try {
    await $fetch(`/api/spools/${item.id}/archive`, {
      method: 'POST',
      body: { archived: !item.archivedAt },
    });
    await refresh();
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    pendingId.value = null;
  }
}

watch([search, includeArchived], () => {
  page.value = 1;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(refresh, 250);
});
watch(page, refresh);
onMounted(async () => {
  await Promise.all([
    refresh(),
    $fetch<{ currency: string }>('/api/settings').then((settings) => {
      currency.value = settings.currency;
    }),
  ]);
});
</script>
