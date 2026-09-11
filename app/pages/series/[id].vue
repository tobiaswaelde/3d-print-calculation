<template>
  <LayoutPagePanel panel-id="series-detail" :title="t('nav.series')">
    <UAlert v-if="error" color="error" :description="error" />
    <div v-if="series" class="space-y-5">
      <h1 class="text-xl font-semibold">{{ series.name }}</h1>
      <NuxtLink
        v-if="series.customer"
        :to="`/customers/${series.customer.id}`"
        class="text-primary underline"
        >{{ series.customer.name }}</NuxtLink
      >
      <p>
        {{ t(`series.${series.status}`) }} · {{ t('series.produced') }}:
        {{ series.summary.producedQuantity }} / {{ series.targetQuantity ?? '—' }} · {{ t('series.allRuns') }}
      </p>
      <UProgress
        v-if="series.targetQuantity"
        :model-value="Math.min(series.summary.producedQuantity, series.targetQuantity)"
        :max="series.targetQuantity"
        :aria-label="t('series.produced')"
      />
      <div class="flex flex-wrap gap-3">
        <UButton :label="t('common.edit')" color="neutral" @click="editing = !editing" /><UButton
          :label="t(series.status === 'OPEN' ? 'series.complete' : 'series.reopen')"
          @click="setState"
        /><UButton
          color="neutral"
          :label="t(series.archivedAt ? 'common.restore' : 'common.archive')"
          @click="archive"
        /><UButton v-if="!series.archivedAt" :label="t('prints.new')" @click="creating = true" />
      </div>
      <ModulesSeriesForm v-if="editing" :key="series.updatedAt" :value="series" @saved="saved" />
      <p v-if="series.notes" class="whitespace-pre-wrap">{{ series.notes }}</p>
      <ModulesPrintsHistory :key="revision" :series-id="id" />
      <ModulesPrintsCreateDialog
        v-model:open="creating"
        :initial-series-id="id"
        :initial-customer-id="series.customerId"
      />
    </div>
  </LayoutPagePanel>
</template>
<script setup lang="ts">
import type { PrintSeriesDto } from '#shared/types/series';

definePageMeta({ middleware: 'print-series' });
const { t } = useI18n();
const id = String(useRoute().params.id);
const series = ref<PrintSeriesDto | null>(null);
const error = ref('');
const editing = ref(false);
const creating = ref(false);
const revision = ref(0);
function saved(value: PrintSeriesDto) {
  series.value = value;
  editing.value = false;
  revision.value++;
}
async function setState() {
  try {
    saved(
      await $fetch<PrintSeriesDto>(`/api/series/${id}/state`, {
        method: 'POST',
        body: { status: series.value?.status === 'OPEN' ? 'COMPLETED' : 'OPEN' },
      }),
    );
  } catch (reason) {
    error.value = String(reason);
  }
}
async function archive() {
  try {
    saved(
      await $fetch<PrintSeriesDto>(`/api/series/${id}/archive`, {
        method: 'POST',
        body: { archived: !series.value?.archivedAt },
      }),
    );
  } catch (reason) {
    error.value = String(reason);
  }
}
onMounted(async () => {
  try {
    series.value = await $fetch<PrintSeriesDto>(`/api/series/${id}`);
  } catch (reason) {
    error.value = String(reason);
  }
});
</script>
