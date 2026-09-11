<template>
  <LayoutPagePanel panel-id="series-detail" :title="t('nav.series')">
    <template #toolbar>
      <CommonDetailToolbar
        icon="i-tabler-file-description"
        parent-icon="i-tabler-list-check"
        :parent-title="t('nav.series')"
        parent-to="/series"
        :title="series?.name ?? t('common.loading')"
      >
        <template v-if="series">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-tabler-pencil"
            :label="t('common.edit')"
            @click="editing = true"
          />
          <UButton
            :icon="series.status === 'OPEN' ? 'i-tabler-circle-check' : 'i-tabler-refresh'"
            :label="t(series.status === 'OPEN' ? 'series.complete' : 'series.reopen')"
            :loading="saving"
            @click="setState"
          />
          <UButton
            color="neutral"
            variant="outline"
            :icon="series.archivedAt ? 'i-tabler-archive-off' : 'i-tabler-archive'"
            :label="t(series.archivedAt ? 'common.restore' : 'common.archive')"
            :loading="saving"
            @click="archive"
          />
          <UButton
            v-if="!series.archivedAt"
            icon="i-tabler-file-plus"
            :label="t('prints.new')"
            @click="creating = true"
          />
        </template>
      </CommonDetailToolbar>
    </template>

    <div v-if="loading" class="flex min-h-64 items-center justify-center">
      <UIcon name="i-tabler-loader-2" class="size-8 animate-spin" />
    </div>
    <UAlert v-else-if="error && !series" color="error" :title="t('series.loadFailed')" :description="error" />
    <div v-else-if="series" class="mx-auto w-full max-w-7xl space-y-5">
      <UAlert v-if="error" color="error" :description="error" />

      <section class="space-y-4">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="mb-2 flex flex-wrap items-center gap-2">
              <h1 class="break-words text-2xl font-semibold">{{ series.name }}</h1>
              <UBadge :color="series.status === 'OPEN' ? 'primary' : 'success'" variant="subtle">
                {{ t(`series.${series.status}`) }}
              </UBadge>
              <UBadge v-if="series.archivedAt" color="neutral" variant="subtle">{{
                t('series.archived')
              }}</UBadge>
            </div>
            <NuxtLink
              v-if="series.customer"
              :to="`/customers/${series.customer.id}`"
              class="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <UIcon name="i-tabler-user" />{{ series.customer.name }}
            </NuxtLink>
            <p v-else class="text-muted">{{ t('series.noCustomer') }}</p>
          </div>
          <div v-if="series.targetQuantity" class="w-full max-w-md">
            <div class="mb-2 flex justify-between gap-3 text-sm">
              <span>{{ t('series.produced') }}</span>
              <span class="font-medium"
                >{{ series.summary.producedQuantity }} / {{ series.targetQuantity }}</span
              >
            </div>
            <UProgress
              :model-value="Math.min(series.summary.producedQuantity, series.targetQuantity)"
              :max="series.targetQuantity"
              :aria-label="t('series.produced')"
            />
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <UCard>
            <p class="text-sm text-muted">{{ t('series.runs') }}</p>
            <p class="mt-1 text-2xl font-semibold">{{ series.summary.totalRuns }}</p>
            <p class="text-xs text-muted">
              {{ t('dashboard.completedPrints') }}: {{ series.summary.completedPrints }}
            </p>
          </UCard>
          <UCard>
            <p class="text-sm text-muted">{{ t('series.produced') }}</p>
            <p class="mt-1 text-2xl font-semibold">{{ series.summary.producedQuantity }}</p>
            <p class="text-xs text-muted">{{ t('outcome.PENDING') }}: {{ series.summary.pending }}</p>
          </UCard>
          <UCard>
            <p class="text-sm text-muted">{{ t('outcome.actualCost') }}</p>
            <p class="mt-1 text-2xl font-semibold">{{ money(series.summary.actualCost, series.currency) }}</p>
            <p class="text-xs text-muted">
              {{ t('outcome.failedCost') }}: {{ money(series.summary.failedCost, series.currency) }}
            </p>
          </UCard>
          <UCard>
            <p class="text-sm text-muted">{{ t('sales.realizedMargin') }}</p>
            <p class="mt-1 text-2xl font-semibold">{{ money(series.summary.margin, series.currency) }}</p>
            <p class="text-xs text-muted">
              {{ t('sales.realizedRevenue') }}: {{ money(series.summary.revenue, series.currency) }}
            </p>
          </UCard>
        </div>
      </section>

      <div class="grid gap-5 lg:grid-cols-3">
        <UCard class="lg:col-span-2">
          <template #header
            ><h2 class="font-semibold">{{ t('series.details') }}</h2></template
          >
          <dl class="grid gap-4 sm:grid-cols-2">
            <div>
              <dt class="text-sm text-muted">{{ t('series.state') }}</dt>
              <dd class="mt-1">{{ t(`series.${series.status}`) }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted">{{ t('series.target') }}</dt>
              <dd class="mt-1">{{ series.targetQuantity ?? '—' }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted">{{ t('series.automation') }}</dt>
              <dd class="mt-1">
                {{ t(series.autoComplete ? 'series.autoCompleteEnabled' : 'series.autoCompleteDisabled') }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-muted">{{ t('history.lastActivity') }}</dt>
              <dd class="mt-1">
                {{ series.summary.lastActivity ? dateTime(series.summary.lastActivity) : '—' }}
              </dd>
            </div>
          </dl>
        </UCard>
        <UCard>
          <template #header
            ><h2 class="font-semibold">{{ t('master.note') }}</h2></template
          >
          <p class="whitespace-pre-wrap text-sm" :class="!series.notes && 'text-muted'">
            {{ series.notes || t('series.noNotes') }}
          </p>
        </UCard>
      </div>

      <UCard>
        <ModulesPrintsHistory :key="revision" :series-id="id" :show-summary="false" />
      </UCard>
    </div>

    <UModal
      v-if="series"
      v-model:open="editing"
      :title="t('series.edit')"
      scrollable
      :ui="{ content: 'sm:max-w-3xl' }"
    >
      <template #body><ModulesSeriesForm :key="series.updatedAt" :value="series" @saved="saved" /></template>
    </UModal>
    <ModulesPrintsCreateDialog
      v-if="series"
      v-model:open="creating"
      :initial-series-id="id"
      :initial-customer-id="series.customerId"
    />
  </LayoutPagePanel>
</template>

<script setup lang="ts">
import type { PrintSeriesDto } from '#shared/types/series';

definePageMeta({ middleware: 'print-series' });
const { t } = useI18n();
const { money, dateTime } = useFormatting();
const id = String(useRoute().params.id);
const series = ref<PrintSeriesDto | null>(null);
const error = ref('');
const loading = ref(true);
const saving = ref(false);
const editing = ref(false);
const creating = ref(false);
const revision = ref(0);

function saved(value: PrintSeriesDto) {
  series.value = value;
  editing.value = false;
  revision.value++;
}

async function mutate(path: string, body: Record<string, unknown>) {
  saving.value = true;
  try {
    saved(await $fetch<PrintSeriesDto>(path, { method: 'POST', body }));
    error.value = '';
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    saving.value = false;
  }
}

async function setState() {
  await mutate(`/api/series/${id}/state`, {
    status: series.value?.status === 'OPEN' ? 'COMPLETED' : 'OPEN',
  });
}

async function archive() {
  await mutate(`/api/series/${id}/archive`, { archived: !series.value?.archivedAt });
}

onMounted(async () => {
  try {
    series.value = await $fetch<PrintSeriesDto>(`/api/series/${id}`);
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    loading.value = false;
  }
});
</script>
