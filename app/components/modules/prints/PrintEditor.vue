<template>
  <div class="space-y-5">
    <UAlert v-if="error" color="error" :description="error" />
    <UAlert
      v-if="job?.status === 'COMPLETED'"
      color="success"
      icon="i-lucide-lock"
      :title="t('prints.completed')"
      :description="t('prints.immutable')"
    />

    <UForm
      ref="editorForm"
      :schema="printDraftFormSchema"
      :state="form"
      class="space-y-5"
      @submit="submitValidated"
      @error="resetSubmitIntent"
    >
      <fieldset :disabled="job?.status === 'COMPLETED' || loading" class="space-y-5 disabled:opacity-75">
        <UCard>
          <div class="grid gap-4 md:grid-cols-2">
            <UFormField name="name" :label="t('master.name')" required
              ><UInput v-model="form.name" class="w-full"
            /></UFormField>
            <UFormField name="customerId" :label="t('nav.customers')"
              ><USelect v-model="form.customerId" class="w-full" value-key="value" :items="customerOptions"
            /></UFormField>
            <UFormField name="printerId" :label="t('nav.printers')" required
              ><USelect v-model="form.printerId" class="w-full" value-key="value" :items="printerOptions"
            /></UFormField>
            <UFormField name="buildPlateId" :label="t('master.buildPlate')" required
              ><USelect
                v-model="form.buildPlateId"
                class="w-full"
                value-key="value"
                :items="buildPlateOptions"
            /></UFormField>
            <UFormField name="notes" :label="t('master.note')" class="md:col-span-2"
              ><UTextarea v-model="form.notes" class="w-full"
            /></UFormField>
          </div>
        </UCard>

        <UCard>
          <template #header
            ><div class="flex items-center justify-between">
              <h2 class="font-semibold">{{ t('prints.hotends') }}</h2>
              <UButton icon="i-lucide-plus" size="sm" :label="t('common.create')" @click="addHotend" /></div
          ></template>
          <div class="space-y-3">
            <div
              v-for="(hotend, index) in form.hotends"
              :key="index"
              class="grid items-end gap-3 md:grid-cols-[1fr_8rem_8rem_auto]"
            >
              <UFormField :name="`hotends.${index}.componentId`" :label="t('master.hotend')" required
                ><USelect
                  v-model="hotend.componentId"
                  class="w-full"
                  value-key="value"
                  :items="hotendOptions"
              /></UFormField>
              <UFormField :name="`hotends.${index}.hours`" :label="t('prints.hours')"
                ><UInput v-model="hotend.hours" type="number" min="0" step="1"
              /></UFormField>
              <UFormField :name="`hotends.${index}.minutes`" :label="t('prints.minutes')"
                ><UInput v-model="hotend.minutes" type="number" min="0" max="59" step="1"
              /></UFormField>
              <UButton
                color="error"
                variant="ghost"
                icon="i-lucide-trash-2"
                :aria-label="t('common.delete')"
                :disabled="form.hotends.length === 1"
                @click="form.hotends.splice(index, 1)"
              />
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header
            ><h2 class="font-semibold">{{ t('prints.components') }}</h2></template
          >
          <div class="grid gap-4 md:grid-cols-2">
            <UFormField name="otherComponentIds" :label="t('prints.otherComponents')"
              ><USelectMenu
                v-model="form.otherComponentIds"
                class="w-full"
                multiple
                value-key="value"
                :items="otherOptions"
            /></UFormField>
          </div>
        </UCard>

        <UCard>
          <template #header
            ><div class="flex items-center justify-between">
              <h2 class="font-semibold">{{ t('nav.filaments') }}</h2>
              <UButton icon="i-lucide-plus" size="sm" :label="t('common.create')" @click="addFilament" /></div
          ></template>
          <div class="space-y-3">
            <div
              v-for="(filament, index) in form.filaments"
              :key="index"
              class="grid items-end gap-3 md:grid-cols-[1fr_12rem_auto]"
            >
              <UFormField :name="`filaments.${index}.filamentId`" :label="t('nav.filaments')" required
                ><USelect
                  v-model="filament.filamentId"
                  class="w-full"
                  value-key="value"
                  :items="filamentOptions"
              /></UFormField>
              <UFormField :name="`filaments.${index}.usedGrams`" :label="t('prints.usedGrams')" required
                ><UInput v-model="filament.usedGrams" inputmode="decimal"
              /></UFormField>
              <UButton
                color="error"
                variant="ghost"
                icon="i-lucide-trash-2"
                :aria-label="t('common.delete')"
                :disabled="form.filaments.length === 1"
                @click="form.filaments.splice(index, 1)"
              />
            </div>
          </div>
        </UCard>
      </fieldset>

      <UCard>
        <template #header
          ><div class="flex items-center gap-2">
            <h2 class="font-semibold">{{ t('prints.costPreview') }}</h2>
            <UIcon v-if="previewPending" name="i-lucide-loader-circle" class="animate-spin" /></div
        ></template>
        <CommonCostBreakdown v-if="costs" v-bind="costs" />
        <p v-else class="text-sm text-muted">{{ t('prints.previewHint') }}</p>
      </UCard>

      <UCard v-if="job?.status === 'COMPLETED' && job.snapshot">
        <template #header>
          <div>
            <h2 class="font-semibold">{{ t('prints.snapshotSources') }}</h2>
            <p class="text-xs text-muted">
              {{ t('prints.formulaVersion') }} {{ job.snapshot.formulaVersion }} ·
              {{ new Date(job.snapshot.calculatedAt).toLocaleString() }}
            </p>
          </div>
        </template>
        <ul class="divide-y divide-default text-sm">
          <li class="flex justify-between gap-4 py-2">
            <span>{{ job.snapshot.printerName }}</span>
            <span
              >{{ job.snapshot.printerPurchasePrice }} /
              {{ job.snapshot.printerExpectedLifetimeHours }} h</span
            >
          </li>
          <li v-for="usage in job.componentUsages" :key="usage.id" class="flex justify-between gap-4 py-2">
            <span>{{ usage.name }}</span
            ><span>{{ money(usage.lineCost, job.currency) }}</span>
          </li>
          <li v-for="usage in job.filamentUsages" :key="usage.id" class="flex justify-between gap-4 py-2">
            <span>{{ usage.name }} · {{ usage.usedGrams }} g</span
            ><span>{{ money(usage.lineCost, job.currency) }}</span>
          </li>
        </ul>
      </UCard>

      <div
        class="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-default bg-default/95 py-3 backdrop-blur"
      >
        <UButton
          v-if="job"
          color="neutral"
          variant="outline"
          icon="i-lucide-copy"
          :label="t('prints.duplicate')"
          @click="duplicate"
        />
        <UButton
          v-if="job?.status !== 'COMPLETED'"
          type="submit"
          color="neutral"
          variant="outline"
          icon="i-lucide-save"
          :loading="saving"
          :label="t('prints.saveDraft')"
          @click="submitIntent = 'save'"
        />
        <CommonConfirmButton
          v-if="job?.status === 'DRAFT'"
          icon="i-lucide-check"
          :label="t('prints.complete')"
          :confirmation="t('prints.completeConfirmation')"
          @confirm="triggerComplete"
        />
      </div>
    </UForm>
  </div>
</template>

<script setup lang="ts">
import type { PrintCalculationResult } from '#shared/domain/print-calculation';
import { printDraftFormSchema } from '#shared/schemas/prints';
import type { MasterDataListItem, PaginatedResponse } from '#shared/types/master-data';
import type { PrintJobDto } from '#shared/types/prints';

const props = defineProps<{ printId?: string }>();
const { t } = useI18n();
const { money } = useFormatting();
const job = ref<PrintJobDto | null>(null);
const loading = ref(true);
const saving = ref(false);
const previewPending = ref(false);
const error = ref('');
const costs = ref<PrintCalculationResult | null>(null);
const editorForm = ref<{ submit: () => Promise<void> } | null>(null);
const customers = ref<MasterDataListItem[]>([]);
const printers = ref<MasterDataListItem[]>([]);
const components = ref<MasterDataListItem[]>([]);
const filaments = ref<MasterDataListItem[]>([]);
let previewTimer: ReturnType<typeof setTimeout> | undefined;
let hydrating = true;
const submitIntent = ref<'save' | 'complete'>('save');

const form = reactive({
  name: '',
  customerId: null as string | null,
  printerId: '',
  buildPlateId: '',
  hotends: [{ componentId: '', hours: 1, minutes: 0 }],
  otherComponentIds: [] as string[],
  filaments: [{ filamentId: '', usedGrams: '1' }],
  notes: '',
});

const options = (values: MasterDataListItem[]) =>
  values.map((item) => ({ label: item.name, value: item.id }));
const customerOptions = computed(() => [{ label: '—', value: null }, ...options(customers.value)]);
const printerOptions = computed(() => options(printers.value));
const compatibleComponents = computed(() =>
  components.value.filter(
    (item) => Array.isArray(item.printerIds) && item.printerIds.includes(form.printerId),
  ),
);
const buildPlateOptions = computed(() =>
  options(compatibleComponents.value.filter((item) => item.type === 'BUILD_PLATE')),
);
const hotendOptions = computed(() =>
  options(compatibleComponents.value.filter((item) => item.type === 'HOTEND')),
);
const otherOptions = computed(() =>
  options(compatibleComponents.value.filter((item) => item.type === 'OTHER')),
);
const filamentOptions = computed(() => options(filaments.value));

function payload() {
  return {
    name: form.name,
    customerId: form.customerId,
    printerId: form.printerId,
    buildPlateId: form.buildPlateId,
    hotends: form.hotends.map((entry) => ({
      componentId: entry.componentId,
      durationSeconds: Number(entry.hours) * 3600 + Number(entry.minutes) * 60,
    })),
    otherComponentIds: form.otherComponentIds,
    filaments: form.filaments.map((entry) => ({ filamentId: entry.filamentId, usedGrams: entry.usedGrams })),
    notes: form.notes,
  };
}

function hydrate(value: PrintJobDto) {
  job.value = value;
  form.name = value.name;
  form.customerId = value.customerId;
  form.printerId = value.printerId;
  form.buildPlateId = value.componentUsages.find((entry) => entry.type === 'BUILD_PLATE')?.componentId ?? '';
  form.hotends = value.componentUsages
    .filter((entry) => entry.type === 'HOTEND')
    .map((entry) => ({
      componentId: entry.componentId,
      hours: Math.floor(entry.appliedDurationSeconds / 3600),
      minutes: Math.floor((entry.appliedDurationSeconds % 3600) / 60),
    }));
  form.otherComponentIds = value.componentUsages
    .filter((entry) => entry.type === 'OTHER')
    .map((entry) => entry.componentId);
  form.filaments = value.filamentUsages.map((entry) => ({
    filamentId: entry.filamentId,
    usedGrams: entry.usedGrams,
  }));
  form.notes = value.notes ?? '';
  if (value.snapshot)
    costs.value = {
      ...value.snapshot,
      calculationVersion: value.snapshot.formulaVersion,
      totalDurationSeconds: value.totalDurationSeconds,
      lines: [],
    };
}

async function load() {
  const [customerResponse, printerResponse, componentResponse, filamentResponse] = await Promise.all([
    $fetch<PaginatedResponse<MasterDataListItem>>('/api/customers', { query: { pageSize: 100 } }),
    $fetch<PaginatedResponse<MasterDataListItem>>('/api/printers', { query: { pageSize: 100 } }),
    $fetch<PaginatedResponse<MasterDataListItem>>('/api/components', { query: { pageSize: 100 } }),
    $fetch<PaginatedResponse<MasterDataListItem>>('/api/filaments', { query: { pageSize: 100 } }),
  ]);
  customers.value = customerResponse.items;
  printers.value = printerResponse.items;
  components.value = componentResponse.items;
  filaments.value = filamentResponse.items;
  if (props.printId) hydrate(await $fetch<PrintJobDto>(`/api/prints/${props.printId}`));
  hydrating = false;
  loading.value = false;
}

function addHotend() {
  form.hotends.push({ componentId: '', hours: 1, minutes: 0 });
}
function addFilament() {
  form.filaments.push({ filamentId: '', usedGrams: '1' });
}

async function preview() {
  if (!printDraftFormSchema.safeParse(form).success) {
    costs.value = null;
    return;
  }
  previewPending.value = true;
  try {
    costs.value = await $fetch<PrintCalculationResult>('/api/prints/calculate', {
      method: 'POST',
      body: payload(),
    });
    error.value = '';
  } catch (reason) {
    costs.value = null;
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    previewPending.value = false;
  }
}

async function persist() {
  saving.value = true;
  try {
    const value = props.printId
      ? await $fetch<PrintJobDto>(`/api/prints/${props.printId}`, { method: 'PATCH', body: payload() })
      : await $fetch<PrintJobDto>('/api/prints', { method: 'POST', body: payload() });
    hydrate(value);
    if (!props.printId) await navigateTo(`/prints/${value.id}`);
    return true;
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
    return false;
  } finally {
    saving.value = false;
  }
}

async function submitValidated() {
  const intent = submitIntent.value;
  submitIntent.value = 'save';
  if (!(await persist()) || intent !== 'complete' || !job.value) return;
  hydrate(await $fetch<PrintJobDto>(`/api/prints/${job.value.id}/complete`, { method: 'POST' }));
}

function resetSubmitIntent() {
  submitIntent.value = 'save';
}

async function triggerComplete() {
  submitIntent.value = 'complete';
  await editorForm.value?.submit();
}

async function duplicate() {
  if (!job.value) return;
  try {
    const duplicate = await $fetch<PrintJobDto>(`/api/prints/${job.value.id}/duplicate`, {
      method: 'POST',
    });
    await navigateTo(`/prints/${duplicate.id}`);
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  }
}

watch(
  () => form.printerId,
  (_current, previous) => {
    if (hydrating || !previous) return;
    form.buildPlateId = '';
    form.hotends = [{ componentId: '', hours: 1, minutes: 0 }];
    form.otherComponentIds = [];
  },
);
watch(
  form,
  () => {
    if (hydrating || job.value?.status === 'COMPLETED') return;
    clearTimeout(previewTimer);
    previewTimer = setTimeout(preview, 300);
  },
  { deep: true },
);

onMounted(() =>
  load().catch((reason) => {
    error.value = reason instanceof Error ? reason.message : String(reason);
    loading.value = false;
  }),
);
</script>
