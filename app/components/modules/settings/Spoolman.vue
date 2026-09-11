<template>
  <UCard id="integration-spoolman-tools">
    <template #header>
      <h3 class="font-semibold">{{ t('integration.spoolmanTools') }}</h3>
    </template>
    <div class="space-y-5">
      <p>{{ t('integration.configHelp') }}</p>
      <UAlert v-if="error" color="error" :description="error" />
      <UAlert v-if="status && !status.configured" color="warning" :description="t('integration.disabled')" />
      <template v-if="status?.configured">
        <p>
          {{ t('integration.version') }}: {{ status.version ?? '—' }}
          <span v-if="status.error">{{ t('integration.offline') }}</span>
        </p>
        <UButton :label="t('integration.preview')" :loading="busy" @click="preview" />
        <UFormField :label="t('integration.authority')"
          ><USelect v-model="authority" :items="authorities"
        /></UFormField>
        <UAlert :description="t('integration.authorityHelp')" color="warning" />
        <div v-if="result" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr>
                <th>{{ t('spool.code') }}</th>
                <th>{{ t('nav.filaments') }}</th>
                <th>{{ t('spool.remaining') }}</th>
                <th>{{ t('integration.conflicts') }}</th>
                <th>{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in result.items" :key="item.id">
                <td>{{ item.localCode ?? `SM-${item.id}` }}</td>
                <td>{{ item.filament.vendor?.name }} · {{ item.filament.name }}</td>
                <td>{{ item.remaining_weight ?? '—' }} g</td>
                <td>
                  <p v-for="conflict in item.conflicts" :key="conflict">{{ t(`integration.${conflict}`) }}</p>
                </td>
                <td>
                  <UButton
                    :label="t('integration.import')"
                    :loading="busy"
                    :disabled="
                      item.conflicts.includes('ARCHIVED') || item.conflicts.includes('MISSING_PRICING')
                    "
                    @click="importItem(item)"
                  /><UButton
                    v-if="item.localId"
                    :to="`/spools/${item.localId}`"
                    :label="t('common.open')"
                    color="neutral"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="result" class="flex gap-3">
          <UButton
            :disabled="page === 1 || busy"
            :label="t('common.previous')"
            @click="changePage(-1)"
          /><span>{{ page }}</span
          ><UButton :disabled="!result.hasMore || busy" :label="t('common.next')" @click="changePage(1)" />
        </div>
        <h2 class="font-semibold">{{ t('integration.operations') }}</h2>
        <p>{{ t('integration.reconcileHelp') }}</p>
        <ul class="space-y-3">
          <li
            v-for="operation in status.operations"
            :key="operation.id"
            class="flex flex-wrap items-center gap-2"
          >
            <NuxtLink :to="`/spools/${operation.spoolId}`" class="text-primary underline"
              >{{ operation.grams }} g</NuxtLink
            ><span>{{ t(`integration.${operation.state}`) }}</span
            ><template v-if="operation.state === 'PENDING'"
              ><UButton :label="t('integration.send')" @click="reconcile(operation.id, 'SEND')" /></template
            ><template v-if="['UNKNOWN', 'FAILED'].includes(operation.state)"
              ><UButton
                :label="t('integration.confirmApplied')"
                @click="reconcile(operation.id, 'CONFIRM_APPLIED')" /><UButton
                :label="t('integration.confirmNotApplied')"
                @click="reconcile(operation.id, 'CONFIRM_NOT_APPLIED')"
            /></template>
          </li>
        </ul>
      </template>
    </div>
  </UCard>
</template>
<script setup lang="ts">
import type { SpoolmanPreview, SpoolmanStatus } from '#shared/types/integrations';
const { t } = useI18n();
const status = ref<SpoolmanStatus | null>(null);
const result = ref<SpoolmanPreview | null>(null);
const page = ref(1);
const busy = ref(false);
const error = ref('');
const authority = ref<'SPOOLMAN_READ_ONLY' | 'EZPRINT_CONSUMPTION'>('SPOOLMAN_READ_ONLY');
const authorities = computed(() =>
  ['SPOOLMAN_READ_ONLY', 'EZPRINT_CONSUMPTION'].map((value) => ({ value, label: t(`integration.${value}`) })),
);
async function run(action: () => Promise<void>) {
  busy.value = true;
  error.value = '';
  try {
    await action();
  } catch {
    error.value = t('integration.requestFailed');
  } finally {
    busy.value = false;
  }
}
async function refresh() {
  status.value = await $fetch<SpoolmanStatus>('/api/integrations/spoolman');
}
async function preview() {
  await run(async () => {
    result.value = await $fetch<SpoolmanPreview>('/api/integrations/spoolman', {
      query: { view: 'preview', page: page.value },
    });
  });
}
async function changePage(delta: number) {
  page.value += delta;
  await preview();
}
async function importItem(item: SpoolmanPreview['items'][number]) {
  await run(async () => {
    const imported = await $fetch<{ id: string }>('/api/integrations/spoolman', {
      method: 'POST',
      body: {
        action: 'IMPORT',
        data: { remoteId: item.id, previewHash: item.previewHash, authority: authority.value },
      },
    });
    await navigateTo(`/spools/${imported.id}`);
  });
}
async function reconcile(operationId: string, action: string) {
  await run(async () => {
    await $fetch('/api/integrations/spoolman', {
      method: 'POST',
      body: { action: 'OPERATION', data: { operationId, action } },
    });
    await refresh();
  });
}
onMounted(() => run(refresh));
</script>
<style scoped>
th,
td {
  text-align: left;
  padding: 0.75rem;
  border-bottom: 1px solid var(--ui-border);
}
</style>
