<template>
  <LayoutPagePanel panel-id="spools" :title="t('nav.spools')">
    <div class="space-y-4">
      <div class="flex flex-wrap gap-3">
        <UInput v-model="search" :placeholder="t('common.search')" :aria-label="t('common.search')" />
        <UCheckbox v-model="includeArchived" :label="t('spool.includeArchived')" />
        <UButton
          :to="{ path: '/settings/integrations', hash: '#integration-spoolman' }"
          :label="t('integration.spoolman')"
          color="neutral"
        /><UButton :label="t('common.add')" @click="creating = !creating" />
      </div>
      <UAlert v-if="error" color="error" :description="error" />
      <UForm
        v-if="creating"
        :schema="spoolSchema"
        :state="form"
        class="grid gap-4 rounded-lg border border-default p-4 sm:grid-cols-2"
        @submit="create"
      >
        <UFormField name="code" :label="t('spool.code')" required
          ><UInput v-model="form.code" class="w-full"
        /></UFormField>
        <UFormField name="filamentId" :label="t('nav.filaments')" required
          ><USelectMenu
            v-model="form.filamentId"
            :items="filaments"
            value-key="id"
            label-key="name"
            class="w-full"
        /></UFormField>
        <UFormField name="purchasePrice" :label="t('master.purchasePrice')" required
          ><UInput v-model="form.purchasePrice" inputmode="decimal" class="w-full"
        /></UFormField>
        <UFormField name="initialNetWeightGrams" :label="t('spool.initialWeight')" required
          ><UInput v-model="form.initialNetWeightGrams" inputmode="decimal" class="w-full"
        /></UFormField>
        <UFormField name="location" :label="t('spool.location')"
          ><UInput v-model="form.location" class="w-full"
        /></UFormField>
        <UFormField name="purchaseLot" :label="t('spool.lot')"
          ><UInput v-model="form.purchaseLot" class="w-full"
        /></UFormField>
        <UFormField name="acquiredAt" :label="t('spool.acquired')"
          ><UInput v-model="form.acquiredAt" type="date" class="w-full"
        /></UFormField>
        <UButton type="submit" :label="t('common.save')" :loading="saving" class="self-end justify-center" />
      </UForm>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr>
              <th class="p-3">{{ t('spool.code') }}</th>
              <th class="p-3">{{ t('nav.filaments') }}</th>
              <th class="p-3">{{ t('spool.location') }}</th>
              <th class="p-3">{{ t('spool.remaining') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in items"
              :key="item.id"
              class="border-t border-default"
              :class="item.archivedAt && 'opacity-60'"
            >
              <td class="p-3">
                <NuxtLink :to="`/spools/${item.id}`" class="text-primary underline">{{ item.code }}</NuxtLink
                ><UBadge v-if="item.legacy" color="warning">{{ t('spool.legacy') }}</UBadge>
              </td>
              <td class="p-3">{{ item.filamentName }}</td>
              <td class="p-3">{{ item.location ?? '—' }}</td>
              <td class="p-3" :class="Number(item.remainingGrams) < 0 && 'text-error'">
                {{ item.remainingGrams ?? '—' }} g
                <span v-if="item.stale" class="block text-xs text-warning">{{ t('integration.stale') }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="!items.length">{{ t('common.empty') }}</p>
      <UPagination v-model:page="page" :total="total" :items-per-page="25" />
    </div>
  </LayoutPagePanel>
</template>
<script setup lang="ts">
import { spoolSchema } from '#shared/schemas/spools';
import type { SpoolDto } from '#shared/types/spools';
import type { MasterDataListItem, PaginatedResponse } from '#shared/types/master-data';
const { t } = useI18n();
const search = ref(String(useRoute().query.search ?? ''));
const page = ref(1);
const total = ref(0);
const includeArchived = ref(false);
const items = ref<SpoolDto[]>([]);
const filaments = ref<MasterDataListItem[]>([]);
const creating = ref(false);
const saving = ref(false);
const error = ref('');
const form = reactive({
  code: '',
  filamentId: '',
  purchasePrice: '0',
  initialNetWeightGrams: '1000',
  location: '',
  purchaseLot: '',
  acquiredAt: '',
});
async function refresh() {
  try {
    const result = await $fetch<PaginatedResponse<SpoolDto>>('/api/spools', {
      query: { search: search.value, page: page.value, includeArchived: includeArchived.value },
    });
    items.value = result.items;
    total.value = result.total;
    error.value = '';
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  }
}
async function create() {
  saving.value = true;
  try {
    const spool = await $fetch<SpoolDto>('/api/spools', { method: 'POST', body: form });
    await navigateTo(`/spools/${spool.id}`);
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    saving.value = false;
  }
}
watch([search, includeArchived], () => {
  page.value = 1;
  void refresh();
});
watch(page, refresh);
onMounted(async () => {
  await refresh();
  try {
    filaments.value = (
      await $fetch<PaginatedResponse<MasterDataListItem>>('/api/filaments', { query: { pageSize: 100 } })
    ).items;
  } catch (reason) {
    error.value = String(reason);
  }
});
</script>
