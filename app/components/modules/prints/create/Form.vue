<template>
  <UForm ref="formRef" :schema="printDraftFormSchema" :state="form" class="space-y-6" @submit="persist">
    <UAlert v-if="error" color="error" :description="error" />

    <div v-if="loading" class="flex min-h-72 items-center justify-center">
      <UIcon name="i-tabler-loader-2" class="size-8 animate-spin" />
    </div>

    <template v-else>
      <UStepper
        v-model="currentStep"
        color="neutral"
        size="sm"
        :items="stepperItems"
        :ui="{
          header: 'pb-5',
          content: 'min-h-72',
        }"
      >
        <template #general>
          <div class="grid gap-4 md:grid-cols-2">
            <UFormField name="name" :label="t('master.name')" required>
              <UInput v-model="form.name" class="w-full" icon="i-tabler-tag" autofocus />
            </UFormField>
            <UFormField name="customerId" :label="t('nav.customers')">
              <USelect
                v-model="form.customerId"
                class="w-full"
                icon="i-tabler-user"
                value-key="value"
                :items="customerOptions"
              />
            </UFormField>
            <UFormField name="printerId" :label="t('nav.printers')" required>
              <USelect
                v-model="form.printerId"
                class="w-full"
                icon="i-tabler-printer"
                value-key="value"
                :items="printerOptions"
              />
            </UFormField>
            <UFormField name="buildPlateId" :label="t('master.buildPlate')" required>
              <USelect
                v-model="form.buildPlateId"
                class="w-full"
                icon="i-tabler-square"
                value-key="value"
                :items="buildPlateOptions"
                :disabled="!form.printerId"
              />
            </UFormField>
          </div>
        </template>

        <template #hotends>
          <div class="space-y-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h3 class="font-semibold">{{ t('prints.hotends') }}</h3>
                <p class="text-sm text-muted">{{ t('prints.hotendsHelp') }}</p>
              </div>
              <UButton icon="i-tabler-plus" size="sm" :label="t('common.create')" @click="addHotend" />
            </div>
            <div
              v-for="(hotend, index) in form.hotends"
              :key="index"
              class="grid items-start gap-3 rounded-lg border border-default p-3 md:grid-cols-[1fr_8rem_8rem_auto]"
            >
              <UFormField :name="`hotends.${index}.componentId`" :label="t('master.hotend')" required>
                <USelect
                  v-model="hotend.componentId"
                  class="w-full"
                  icon="i-tabler-flame"
                  value-key="value"
                  :items="hotendOptions"
                />
              </UFormField>
              <UFormField :name="`hotends.${index}.hours`" :label="t('prints.hours')">
                <UInput
                  v-model="hotend.hours"
                  class="w-full"
                  type="number"
                  min="0"
                  step="1"
                  icon="i-tabler-clock-hour-4"
                >
                  <template #trailing><span class="text-xs text-muted">h</span></template>
                </UInput>
              </UFormField>
              <UFormField :name="`hotends.${index}.minutes`" :label="t('prints.minutes')">
                <UInput
                  v-model="hotend.minutes"
                  class="w-full"
                  type="number"
                  min="0"
                  max="59"
                  step="1"
                  icon="i-tabler-clock"
                >
                  <template #trailing><span class="text-xs text-muted">min</span></template>
                </UInput>
              </UFormField>
              <UButton
                class="md:mt-6"
                color="error"
                variant="ghost"
                icon="i-tabler-trash"
                :aria-label="t('common.delete')"
                :disabled="form.hotends.length === 1"
                @click="form.hotends.splice(index, 1)"
              />
            </div>
          </div>
        </template>

        <template #materials>
          <div class="space-y-6">
            <UFormField name="otherComponentIds" :label="t('prints.otherComponents')">
              <USelectMenu
                v-model="form.otherComponentIds"
                class="w-full"
                icon="i-tabler-components"
                multiple
                value-key="value"
                :items="otherOptions"
              />
            </UFormField>

            <div class="space-y-4">
              <div class="flex items-center justify-between gap-3">
                <h3 class="font-semibold">{{ t('nav.filaments') }}</h3>
                <UButton icon="i-tabler-plus" size="sm" :label="t('common.create')" @click="addFilament" />
              </div>
              <div
                v-for="(filament, index) in form.filaments"
                :key="index"
                class="grid items-start gap-3 rounded-lg border border-default p-3 md:grid-cols-[1fr_12rem_auto]"
              >
                <UFormField :name="`filaments.${index}.filamentId`" :label="t('nav.filaments')" required>
                  <USelect
                    v-model="filament.filamentId"
                    class="w-full"
                    icon="i-tabler-disc"
                    value-key="value"
                    :items="filamentOptions"
                  />
                </UFormField>
                <UFormField :name="`filaments.${index}.usedGrams`" :label="t('prints.usedGrams')" required>
                  <UInput
                    v-model="filament.usedGrams"
                    class="w-full"
                    type="number"
                    min="0.01"
                    step="0.01"
                    icon="i-tabler-scale"
                  >
                    <template #trailing><span class="text-xs text-muted">g</span></template>
                  </UInput>
                </UFormField>
                <UButton
                  class="md:mt-6"
                  color="error"
                  variant="ghost"
                  icon="i-tabler-trash"
                  :aria-label="t('common.delete')"
                  :disabled="form.filaments.length === 1"
                  @click="form.filaments.splice(index, 1)"
                />
              </div>
            </div>
          </div>
        </template>

        <template #review>
          <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
            <UFormField name="notes" :label="t('master.note')">
              <UTextarea v-model="form.notes" class="w-full" :rows="8" icon="i-tabler-notes" />
            </UFormField>
            <div class="rounded-lg border border-default p-4">
              <div class="mb-4 flex items-center gap-2">
                <h3 class="font-semibold">{{ t('prints.costPreview') }}</h3>
                <UIcon v-if="previewPending" name="i-tabler-loader-2" class="animate-spin" />
              </div>
              <CommonCostBreakdown v-if="costs" v-bind="costs" />
              <p v-else class="text-sm text-muted">{{ t('prints.previewHint') }}</p>
            </div>
          </div>
        </template>
      </UStepper>

      <div class="flex flex-wrap items-center justify-between gap-3 border-t border-default pt-4">
        <div class="flex gap-2">
          <UButton
            type="button"
            color="neutral"
            variant="outline"
            :label="t('common.cancel')"
            :disabled="saving"
            @click="emit('cancel')"
          />
          <UButton
            v-if="currentStep > 0"
            type="button"
            color="neutral"
            variant="soft"
            icon="i-tabler-arrow-left"
            :label="t('common.back')"
            :disabled="saving"
            @click="currentStep -= 1"
          />
        </div>
        <UButton
          v-if="currentStep < stepperItems.length - 1"
          type="button"
          trailing-icon="i-tabler-arrow-right"
          :label="t('common.next')"
          @click="nextStep"
        />
        <UButton
          v-else
          type="submit"
          icon="i-tabler-device-floppy"
          :label="t('prints.saveDraft')"
          :loading="saving"
        />
      </div>
    </template>
  </UForm>
</template>

<script setup lang="ts">
import type { StepperItem } from '@nuxt/ui';
import type { PrintCalculationResult } from '#shared/domain/print-calculation';
import { printDraftFormSchema } from '#shared/schemas/prints';
import type { MasterDataListItem, PaginatedResponse } from '#shared/types/master-data';
import type { PrintJobDto } from '#shared/types/prints';

const emit = defineEmits<{
  cancel: [];
  created: [print: PrintJobDto];
}>();

const { t } = useI18n();
const formRef = ref<{
  validate: (options: { name?: string[] }) => Promise<unknown>;
} | null>(null);
const currentStep = ref(0);
const loading = ref(true);
const saving = ref(false);
const previewPending = ref(false);
const error = ref('');
const costs = ref<PrintCalculationResult | null>(null);
const customers = ref<MasterDataListItem[]>([]);
const printers = ref<MasterDataListItem[]>([]);
const components = ref<MasterDataListItem[]>([]);
const filaments = ref<MasterDataListItem[]>([]);
let previewTimer: ReturnType<typeof setTimeout> | undefined;
let hydrating = true;

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

const stepperItems = computed<StepperItem[]>(() => [
  { slot: 'general', title: t('prints.steps.general'), icon: 'i-tabler-info-circle' },
  { slot: 'hotends', title: t('prints.steps.hotends'), icon: 'i-tabler-clock' },
  { slot: 'materials', title: t('prints.steps.materials'), icon: 'i-tabler-disc' },
  { slot: 'review', title: t('prints.steps.review'), icon: 'i-tabler-calculator' },
]);

const fieldsByStep: Array<Array<keyof typeof form>> = [
  ['name', 'customerId', 'printerId', 'buildPlateId'],
  ['hotends'],
  ['otherComponentIds', 'filaments'],
];

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
    filaments: form.filaments.map((entry) => ({
      filamentId: entry.filamentId,
      usedGrams: entry.usedGrams,
    })),
    notes: form.notes,
  };
}

function addHotend() {
  form.hotends.push({ componentId: '', hours: 1, minutes: 0 });
}

function addFilament() {
  form.filaments.push({ filamentId: '', usedGrams: '1' });
}

async function nextStep() {
  const fields = fieldsByStep[currentStep.value];
  if (!fields) return;

  try {
    await formRef.value?.validate({ name: fields });
    currentStep.value += 1;
  } catch {
    // UForm displays validation errors next to the affected fields.
  }
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
  hydrating = false;
  loading.value = false;
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
    const print = await $fetch<PrintJobDto>('/api/prints', { method: 'POST', body: payload() });
    emit('created', print);
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    saving.value = false;
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
    if (hydrating) return;
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
onBeforeUnmount(() => clearTimeout(previewTimer));
</script>
