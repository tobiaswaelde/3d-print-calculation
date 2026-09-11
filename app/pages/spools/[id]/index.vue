<template>
  <LayoutPagePanel panel-id="spool" :title="t('nav.spools')">
    <UAlert v-if="error" color="error" :description="error" />
    <div v-if="spool" class="space-y-5">
      <div class="flex flex-wrap items-center gap-3">
        <h1 class="break-all text-xl font-semibold">{{ spool.code }}</h1>
        <UButton :to="`/spools/${spool.id}/label`" :label="t('spool.label')" icon="i-tabler-qrcode" /><UButton
          color="neutral"
          :label="t(spool.archivedAt ? 'common.restore' : 'common.archive')"
          :loading="saving"
          @click="archive"
        />
      </div>
      <p>{{ spool.filamentName }} · {{ spool.remainingGrams ?? '—' }} g</p>
      <UAlert v-if="spool.stale" color="warning" :description="t('integration.stale')" />
      <div v-if="spool.stockAuthority !== 'NATIVE'" class="space-y-3 rounded-lg border border-default p-4">
        <p>
          {{ t(`integration.${spool.stockAuthority}`) }} · {{ t(`integration.${spool.remoteState}`) }} ·
          {{ spool.syncedAt ?? '—' }}
        </p>
        <UButton :label="t('integration.sync')" @click="syncRemote" /><UButton
          :to="{ path: '/settings/integrations', hash: '#integration-spoolman' }"
          :label="t('integration.spoolman')"
          color="neutral"
        />
        <UFormField :label="t('integration.nativeBalance')"
          ><UInput v-model="nativeBalance" inputmode="decimal"
        /></UFormField>
        <UButton :label="t('integration.unlink')" color="neutral" @click="unlinkRemote" />
      </div>
      <UAlert v-if="spool.legacy" color="warning" :description="t('spool.legacyHelp')" />
      <UAlert v-if="Number(spool.remainingGrams) < 0" color="error" :description="t('spool.negative')" />
      <UAlert v-if="stock?.lowStock" color="warning" :description="t('spool.lowStock')" />
      <UForm
        v-if="spool.stockAuthority === 'NATIVE'"
        :schema="spoolSchema"
        :state="form"
        class="grid gap-4 sm:grid-cols-2"
        @submit="save"
      >
        <UFormField name="location" :label="t('spool.location')"
          ><UInput v-model="form.location" class="w-full"
        /></UFormField>
        <UFormField name="purchaseLot" :label="t('spool.lot')"
          ><UInput v-model="form.purchaseLot" class="w-full"
        /></UFormField>
        <UFormField name="acquiredAt" :label="t('spool.acquired')"
          ><UInput v-model="form.acquiredAt" type="date" class="w-full"
        /></UFormField>
        <UFormField name="purchasePrice" :label="t('master.purchasePrice')"
          ><UInput v-model="form.purchasePrice" inputmode="decimal" class="w-full"
        /></UFormField>
        <p>{{ t('spool.initialWeight') }}: {{ spool.initialNetWeightGrams }} g</p>
        <UButton type="submit" :label="t('common.save')" :loading="saving" class="justify-center" />
      </UForm>
      <UForm
        v-if="stock"
        :schema="stockThresholdSchema"
        :state="stock"
        class="flex flex-wrap items-end gap-3"
        @submit="saveThreshold"
      >
        <UFormField name="minimumStockGrams" :label="t('spool.minimum')"
          ><UInput v-model="stock.minimumStockGrams" inputmode="decimal"
        /></UFormField>
        <UButton type="submit" :label="t('spool.saveThreshold')" :loading="saving" />
        <p>{{ t('spool.filamentTotal') }}: {{ stock.remainingGrams ?? '—' }} g</p>
      </UForm>
      <UForm
        v-if="!spool.archivedAt && spool.stockAuthority === 'NATIVE'"
        :schema="stockMovementSchema"
        :state="movement"
        class="grid gap-4 rounded-lg border border-default p-4 sm:grid-cols-2"
        @submit="move"
      >
        <UFormField name="kind" :label="t('spool.movement')"
          ><USelect v-model="movement.kind" :items="movementOptions" class="w-full"
        /></UFormField>
        <UFormField name="grams" :label="t('spool.delta')" required
          ><UInput v-model="movement.grams" inputmode="decimal" class="w-full"
        /></UFormField>
        <UFormField name="note" :label="t('master.note')" required
          ><UInput v-model="movement.note" class="w-full"
        /></UFormField>
        <UButton type="submit" :label="t('spool.record')" :loading="saving" class="self-end justify-center" />
      </UForm>
      <h2 class="font-semibold">{{ t('spool.history') }}</h2>
      <ul class="divide-y divide-default">
        <li v-for="entry in spool.movements" :key="entry.id" class="space-y-1 py-3">
          <p>{{ dateTime(entry.createdAt) }} · {{ t(`spool.${entry.kind}`) }} · {{ entry.grams }} g</p>
          <p class="break-words">{{ entry.note }}</p>
          <NuxtLink
            v-if="entry.printJobId"
            :to="`/prints/${entry.printJobId}`"
            class="text-primary underline"
            >{{ t('nav.prints') }}</NuxtLink
          >
        </li>
      </ul>
      <UPagination v-model:page="page" :total="spool.movementCount" :items-per-page="25" />
    </div>
  </LayoutPagePanel>
</template>
<script setup lang="ts">
import { spoolSchema, stockMovementSchema, stockThresholdSchema } from '#shared/schemas/spools';
import type { SpoolDetailDto } from '#shared/types/spools';
const { t } = useI18n();
const { dateTime } = useFormatting();
const id = String(useRoute().params.id);
const spool = ref<SpoolDetailDto | null>(null);
const error = ref('');
const saving = ref(false);
const page = ref(1);
const nativeBalance = ref('');
async function syncRemote() {
  try {
    await $fetch('/api/integrations/spoolman', { method: 'POST', body: { action: 'SYNC', spoolId: id } });
    await refresh();
  } catch {
    error.value = t('integration.requestFailed');
  }
}
async function unlinkRemote() {
  try {
    await $fetch('/api/integrations/spoolman', {
      method: 'POST',
      body: {
        action: 'UNLINK',
        data: { spoolId: id, ownership: 'NATIVE', openingBalance: nativeBalance.value },
      },
    });
    await refresh();
  } catch {
    error.value = t('integration.requestFailed');
  }
}
const stock = ref<{ remainingGrams: string | null; minimumStockGrams: string; lowStock: boolean } | null>(
  null,
);
const form = reactive({
  code: '',
  filamentId: '',
  purchasePrice: '0',
  initialNetWeightGrams: '1',
  location: '',
  purchaseLot: '',
  acquiredAt: '',
});
const movement = reactive({ kind: 'CORRECTION', grams: '0', note: '', operationKey: crypto.randomUUID() });
const movementOptions = computed(() =>
  ['RECEIPT', 'CORRECTION'].map((value) => ({ value, label: t(`spool.${value}`) })),
);
async function refresh() {
  try {
    spool.value = await $fetch<SpoolDetailDto>(`/api/spools/${id}`, { query: { page: page.value } });
    Object.assign(form, {
      ...spool.value,
      location: spool.value.location ?? '',
      purchaseLot: spool.value.purchaseLot ?? '',
      acquiredAt: spool.value.acquiredAt ?? '',
    });
    stock.value = await $fetch(`/api/filaments/${spool.value.filamentId}/stock`);
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  }
}
async function mutate(path: string, method: 'POST' | 'PATCH', body: unknown) {
  saving.value = true;
  try {
    await $fetch(path, { method, body: body as Record<string, unknown> });
    error.value = '';
    await refresh();
    return true;
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
    return false;
  } finally {
    saving.value = false;
  }
}
async function save() {
  await mutate(`/api/spools/${id}`, 'PATCH', form);
}
async function saveThreshold() {
  if (spool.value) await mutate(`/api/filaments/${spool.value.filamentId}/stock`, 'PATCH', stock.value);
}
async function archive() {
  await mutate(`/api/spools/${id}/archive`, 'POST', { archived: !spool.value?.archivedAt });
}
async function move() {
  if (await mutate(`/api/spools/${id}/movements`, 'POST', movement)) {
    movement.operationKey = crypto.randomUUID();
    movement.grams = '0';
    movement.note = '';
  }
}
watch(page, refresh);
onMounted(refresh);
</script>
