<template>
  <LayoutPagePanel :panel-id="resource" :title="title" table>
    <template #toolbar>
      <CommonTableToolbar v-model:search="search" :icon="resourceIcon" :title="title">
        <template #options>
          <CommonTableOptionsMenu v-model:include-archived="includeArchived" />
        </template>
        <template #create>
          <CommonButtonsNew @click="startCreate" />
        </template>
      </CommonTableToolbar>
    </template>

    <UAlert v-if="error" class="m-4 shrink-0 sm:m-6" color="error" :description="error" />

    <UModal
      v-model:open="editing"
      :title="dialogTitle"
      :dismissible="!saving"
      scrollable
      :ui="{ content: 'sm:max-w-3xl' }"
    >
      <template #body>
        <UAlert v-if="dialogError" class="mb-4" color="error" :description="dialogError" />
        <UForm
          :id="`${resource}-form`"
          :schema="formSchema"
          :state="form"
          class="grid gap-4 md:grid-cols-2"
          @submit="save"
        >
          <UFormField name="name" :label="t('master.name')" required>
            <UInput
              v-model="form.name"
              class="w-full"
              icon="i-tabler-tag"
              :autofocus="resource !== 'filaments'"
              :readonly="resource === 'filaments'"
            />
          </UFormField>
          <UFormField v-if="resource === 'customers'" name="email" :label="t('master.email')">
            <UInput v-model="form.email" class="w-full" type="email" icon="i-tabler-mail" />
          </UFormField>
          <template v-if="resource === 'printers' || resource === 'components'">
            <UFormField
              name="manufacturerId"
              :label="t('master.manufacturer')"
              :required="resource === 'printers'"
            >
              <USelectMenu
                v-model="form.manufacturerId"
                class="w-full"
                icon="i-tabler-building-factory-2"
                :aria-label="t('master.manufacturer')"
                value-key="value"
                :items="manufacturerOptions"
                :clear="resource === 'components'"
              />
            </UFormField>
            <UFormField name="model" :label="t('master.model')"
              ><UInput v-model="form.model" class="w-full" icon="i-tabler-barcode"
            /></UFormField>
            <UFormField name="purchasePrice" :label="t('master.purchasePrice')" required
              ><UInput
                v-model="form.purchasePrice"
                class="w-full"
                type="number"
                min="0"
                step="0.01"
                icon="i-tabler-cash"
              >
                <template #trailing>
                  <span class="text-xs text-muted">{{ currency }}</span>
                </template>
              </UInput></UFormField
            >
            <UFormField name="expectedLifetimeHours" :label="t('master.lifetime')" required
              ><UInput
                v-model="form.expectedLifetimeHours"
                class="w-full"
                type="number"
                min="0.01"
                step="0.01"
                icon="i-tabler-clock-hour-4"
              >
                <template #trailing>
                  <span class="text-xs text-muted">h</span>
                </template>
              </UInput></UFormField
            >
            <UFormField
              v-if="resource === 'printers'"
              name="averagePowerWatts"
              :label="t('master.power')"
              required
              ><UInput
                v-model="form.averagePowerWatts"
                class="w-full"
                type="number"
                min="0"
                step="1"
                icon="i-tabler-bolt"
              >
                <template #trailing>
                  <span class="text-xs text-muted">W</span>
                </template>
              </UInput></UFormField
            >
            <UFormField v-if="resource === 'components'" name="type" :label="t('master.type')" required>
              <USelect
                v-model="form.type"
                class="w-full"
                icon="i-tabler-category"
                value-key="value"
                :items="componentTypes"
              />
            </UFormField>
            <UFormField
              v-if="resource === 'components'"
              name="printerIds"
              :label="t('master.compatiblePrinters')"
              class="md:col-span-2"
            >
              <USelectMenu
                v-model="form.printerIds"
                class="w-full"
                icon="i-tabler-printer"
                multiple
                value-key="value"
                :items="printerOptions"
              />
            </UFormField>
            <UFormField v-if="resource === 'components'" name="alwaysUsed" class="md:col-span-2">
              <UCheckbox
                v-model="form.alwaysUsed"
                :label="t('master.alwaysUsed')"
                :description="t('master.alwaysUsedDescription')"
              />
            </UFormField>
            <UAlert
              class="md:col-span-2"
              color="neutral"
              variant="subtle"
              :description="`${t('master.hourlyRate')}: ${derivedRate}`"
            />
          </template>
          <template v-if="resource === 'filaments'">
            <UFormField name="manufacturerId" :label="t('master.manufacturer')" required>
              <USelectMenu
                v-model="form.manufacturerId"
                class="w-full"
                icon="i-tabler-building-factory-2"
                :aria-label="t('master.manufacturer')"
                value-key="value"
                :items="manufacturerOptions"
              />
            </UFormField>
            <UFormField name="material" :label="t('master.material')" required
              ><UInput v-model="form.material" class="w-full" icon="i-tabler-box"
            /></UFormField>
            <UFormField name="colorName" :label="t('master.colorName')" required>
              <UInput v-model="form.colorName" class="w-full" icon="i-tabler-palette" />
            </UFormField>
            <UFormField name="colorHex" :label="t('master.colorHex')" required>
              <div class="flex gap-2">
                <UInput v-model="form.colorHex" class="min-w-0 flex-1" icon="i-tabler-hash" />
                <UPopover :content="{ align: 'end', sideOffset: 8 }">
                  <UButton
                    color="neutral"
                    variant="outline"
                    :aria-label="t('master.pickColor')"
                    :title="t('master.pickColor')"
                  >
                    <span
                      class="size-5 rounded-sm border border-default"
                      :style="{ backgroundColor: form.colorHex || '#ffffff' }"
                    />
                  </UButton>
                  <template #content>
                    <UColorPicker v-model="form.colorHex" class="p-3" format="hex" />
                  </template>
                </UPopover>
              </div>
            </UFormField>
            <UFormField name="purchasePrice" :label="t('master.purchasePrice')" required
              ><UInput
                v-model="form.purchasePrice"
                class="w-full"
                type="number"
                min="0"
                step="0.01"
                icon="i-tabler-cash"
              >
                <template #trailing>
                  <span class="text-xs text-muted">{{ currency }}</span>
                </template>
              </UInput></UFormField
            >
            <UFormField name="netWeightGrams" :label="t('master.netWeight')" required
              ><UInput
                v-model="form.netWeightGrams"
                class="w-full"
                type="number"
                min="0.01"
                step="0.01"
                icon="i-tabler-scale"
              >
                <template #trailing>
                  <span class="text-xs text-muted">g</span>
                </template>
              </UInput></UFormField
            >
            <UAlert
              class="md:col-span-2"
              color="neutral"
              variant="subtle"
              :description="`${t('master.costPerGram')}: ${derivedRate}`"
            />
          </template>
          <UFormField name="note" :label="t('master.note')" class="md:col-span-2"
            ><UTextarea v-model="form.note" class="w-full" icon="i-tabler-notes"
          /></UFormField>
        </UForm>
      </template>

      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            type="button"
            color="error"
            variant="outline"
            :disabled="saving"
            :label="t('common.cancel')"
            @click="editing = false"
          />
          <UButton
            type="submit"
            :form="`${resource}-form`"
            color="primary"
            variant="solid"
            icon="i-tabler-device-floppy"
            :loading="saving"
            :label="t('common.save')"
          />
        </div>
      </template>
    </UModal>

    <div data-table-region class="min-h-0 flex-1 overflow-auto">
      <div v-if="loading" class="flex min-h-full items-center justify-center">
        <UIcon name="i-tabler-loader-2" class="size-8 animate-spin" />
      </div>
      <CommonEmptyState
        v-else-if="!items.length"
        class="min-h-full rounded-none border-0"
        :title="t('common.empty')"
      >
        <UButton icon="i-tabler-plus" label="New" @click="startCreate" />
      </CommonEmptyState>
      <table v-else class="w-full min-w-180 text-sm">
        <thead class="sticky top-0 z-10 bg-elevated text-left text-xs text-muted uppercase">
          <tr>
            <th class="px-4 py-3 font-medium sm:first:pl-6">{{ t('master.name') }}</th>
            <th class="px-4 py-3 font-medium">{{ t('master.details') }}</th>
            <th class="px-4 py-3 font-medium">{{ t('master.rate') }}</th>
            <th class="w-1 px-4 py-3 text-right font-medium sm:pr-6">{{ t('master.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in items"
            :key="item.id"
            class="border-t border-default transition-colors hover:bg-elevated/50"
            :class="item.archivedAt && 'opacity-60'"
          >
            <td class="px-4 py-2.5 font-medium sm:first:pl-6">
              <NuxtLink
                v-if="resource === 'customers'"
                :to="`/customers/${item.id}`"
                class="text-primary underline"
                >{{ item.name }}</NuxtLink
              ><template v-else>{{ item.name }}</template>
            </td>
            <td class="px-4 py-2.5 text-muted">{{ details(item) }}</td>
            <td class="px-4 py-2.5">{{ rate(item) }}</td>
            <td class="px-4 py-2.5 sm:pr-6">
              <div class="flex justify-end gap-1">
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-tabler-pencil"
                  :aria-label="t('common.edit')"
                  @click="startEdit(item)"
                />
                <UButton
                  color="neutral"
                  variant="ghost"
                  :icon="item.archivedAt ? 'i-tabler-archive-off' : 'i-tabler-archive'"
                  :aria-label="item.archivedAt ? t('common.restore') : t('common.archive')"
                  @click="toggleArchive(item)"
                />
                <CommonConfirmButton
                  color="error"
                  variant="ghost"
                  icon="i-tabler-trash"
                  :aria-label="t('common.delete')"
                  :confirmation="t('master.deleteConfirmation')"
                  @confirm="remove(item)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </LayoutPagePanel>
</template>

<script setup lang="ts">
import Decimal from 'decimal.js';
import {
  componentSchema,
  createPrinterSchema,
  customerSchema,
  filamentSchema,
  manufacturerSchema,
} from '#shared/schemas/master-data';
import type { MasterDataListItem, MasterDataResource, PaginatedResponse } from '#shared/types/master-data';

const props = defineProps<{ resource: MasterDataResource; title: string }>();
const resourceIcon = computed(
  () =>
    ({
      customers: 'i-tabler-users',
      printers: 'i-tabler-printer',
      manufacturers: 'i-tabler-building-factory-2',
      components: 'i-tabler-components',
      filaments: 'i-tabler-disc',
    })[props.resource],
);
const { t } = useI18n();
const route = useRoute();
const { money, decimal } = useFormatting();
const items = ref<MasterDataListItem[]>([]);
const search = ref(typeof route.query.search === 'string' ? route.query.search : '');
const includeArchived = ref(false);
const loading = ref(true);
const saving = ref(false);
const editing = ref(false);
const editingId = ref<string | null>(null);
const error = ref('');
const dialogError = ref('');
const currency = ref('EUR');
const printerOptions = ref<{ label: string; value: string }[]>([]);
const manufacturerOptions = ref<{ label: string; value: string }[]>([]);
let debounceTimer: ReturnType<typeof setTimeout> | undefined;

const componentTypes = computed(() => [
  { label: t('master.hotend'), value: 'HOTEND' },
  { label: t('master.buildPlate'), value: 'BUILD_PLATE' },
  { label: t('master.other'), value: 'OTHER' },
]);
const dialogTitle = computed(
  () => `${editingId.value ? t('common.edit') : t('common.create')} · ${props.title}`,
);
const printerValidationMessages = computed(() => ({
  manufacturerRequired: t('validation.printerManufacturerRequired'),
}));

const formSchema = computed(() => {
  switch (props.resource) {
    case 'customers':
      return customerSchema;
    case 'printers':
      return createPrinterSchema(printerValidationMessages.value);
    case 'manufacturers':
      return manufacturerSchema;
    case 'components':
      return componentSchema;
    case 'filaments':
      return filamentSchema;
    default:
      return customerSchema;
  }
});

function emptyForm() {
  return {
    name: '',
    email: '',
    manufacturer: '',
    manufacturerId: '',
    model: '',
    purchasePrice: '0',
    expectedLifetimeHours: '1',
    averagePowerWatts: 0,
    type: 'HOTEND',
    alwaysUsed: false,
    printerIds: [] as string[],
    material: '',
    colorName: '',
    colorHex: '#FFFFFF',
    netWeightGrams: '1000',
    note: '',
  };
}
const form = reactive(emptyForm());

const derivedRate = computed(() => {
  try {
    const divisor = props.resource === 'filaments' ? form.netWeightGrams : form.expectedLifetimeHours;
    const value = new Decimal(form.purchasePrice || 0).div(divisor || 1).toString();
    return `${money(value, currency.value)}${props.resource === 'filaments' ? '/g' : '/h'}`;
  } catch {
    return '—';
  }
});

async function loadManufacturerOptions() {
  const firstPage = await $fetch<PaginatedResponse<MasterDataListItem>>('/api/manufacturers', {
    query: { page: 1, pageSize: 100 },
  });
  const pageCount = Math.ceil(firstPage.total / firstPage.pageSize);
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
      $fetch<PaginatedResponse<MasterDataListItem>>('/api/manufacturers', {
        query: { page: index + 2, pageSize: 100 },
      }),
    ),
  );
  manufacturerOptions.value = [firstPage, ...remainingPages].flatMap((page) =>
    page.items.map((item) => ({ label: item.name, value: item.id })),
  );
}

async function refresh() {
  loading.value = true;
  error.value = '';
  try {
    const [response, settings] = await Promise.all([
      $fetch<PaginatedResponse<MasterDataListItem>>(`/api/${props.resource}`, {
        query: { search: search.value, includeArchived: includeArchived.value },
      }),
      $fetch<{ currency: string }>('/api/settings'),
    ]);
    items.value = response.items;
    currency.value = settings.currency;
    if (props.resource === 'components') {
      const printers = await $fetch<PaginatedResponse<MasterDataListItem>>('/api/printers', {
        query: { pageSize: 100 },
      });
      printerOptions.value = printers.items.map((item) => ({ label: item.name, value: item.id }));
    }
    if (props.resource === 'printers' || props.resource === 'components' || props.resource === 'filaments') {
      await loadManufacturerOptions();
    }
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    loading.value = false;
  }
}

function startCreate() {
  Object.assign(form, emptyForm());
  editingId.value = null;
  dialogError.value = '';
  editing.value = true;
}

function startEdit(item: MasterDataListItem) {
  Object.assign(form, emptyForm(), item);
  if (
    typeof item.manufacturerId === 'string' &&
    typeof item.manufacturer === 'string' &&
    !manufacturerOptions.value.some((option) => option.value === item.manufacturerId)
  ) {
    manufacturerOptions.value.push({ label: item.manufacturer, value: item.manufacturerId });
  }
  if (props.resource === 'filaments' && typeof item.colorHex !== 'string') form.colorHex = '#FFFFFF';
  form.printerIds = Array.isArray(item.printerIds) ? ([...item.printerIds] as string[]) : [];
  editingId.value = item.id;
  dialogError.value = '';
  editing.value = true;
}

async function save() {
  saving.value = true;
  dialogError.value = '';
  try {
    const method = editingId.value ? 'PATCH' : 'POST';
    const url = editingId.value ? `/api/${props.resource}/${editingId.value}` : `/api/${props.resource}`;
    await $fetch(url, { method, body: form });
    editing.value = false;
    await refresh();
  } catch (reason) {
    dialogError.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    saving.value = false;
  }
}

async function toggleArchive(item: MasterDataListItem) {
  await $fetch(`/api/${props.resource}/${item.id}`, {
    method: 'PATCH',
    body: { archived: !item.archivedAt },
  });
  await refresh();
}

async function remove(item: MasterDataListItem) {
  try {
    await $fetch(`/api/${props.resource}/${item.id}`, { method: 'DELETE' });
    await refresh();
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  }
}

function details(item: MasterDataListItem) {
  if (props.resource === 'customers') return String(item.email ?? '—');
  if (props.resource === 'manufacturers') return String(item.note ?? '—');
  if (props.resource === 'filaments')
    return [item.manufacturer, item.material, item.colorName, item.colorHex].filter(Boolean).join(' · ');
  if (props.resource === 'components')
    return [
      t(`master.${String(item.type).toLowerCase()}`),
      [item.manufacturer, item.model].filter(Boolean).join(' '),
      item.alwaysUsed ? t('master.alwaysUsed') : '',
    ]
      .filter(Boolean)
      .join(' · ');
  return `${[item.manufacturer, item.model].filter(Boolean).join(' ')} · ${item.averagePowerWatts} W`;
}

function rate(item: MasterDataListItem) {
  if (props.resource === 'customers' || props.resource === 'manufacturers') return '—';
  const value = props.resource === 'filaments' ? item.costPerGram : item.hourlyRate;
  return `${money(value, currency.value)}${props.resource === 'filaments' ? '/g' : '/h'} · ${decimal(props.resource === 'filaments' ? item.netWeightGrams : item.expectedLifetimeHours)}${props.resource === 'filaments' ? ' g' : ' h'}`;
}

watch([search, includeArchived], () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(refresh, 250);
});
watchEffect(() => {
  if (props.resource !== 'filaments') return;
  const manufacturer =
    manufacturerOptions.value.find((option) => option.value === form.manufacturerId)?.label ?? '';
  const material = form.material.trim();
  const colorName = form.colorName.trim();
  form.name = `${manufacturer}${manufacturer && material ? ' ' : ''}${material}${colorName ? ` - ${colorName}` : ''}`;
});
onMounted(refresh);
</script>
