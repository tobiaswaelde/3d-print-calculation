<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-2">
      <UInput
        v-model="search"
        class="min-w-56 flex-1"
        icon="i-lucide-search"
        :placeholder="t('common.search')"
      />
      <UCheckbox v-model="includeArchived" :label="t('master.includeArchived')" />
      <UButton icon="i-lucide-plus" :label="t('common.create')" @click="startCreate" />
    </div>

    <UAlert v-if="error" color="error" :description="error" />

    <UCard v-if="editing" :ui="{ body: 'space-y-4' }">
      <template #header>
        <h2 class="font-semibold">{{ editingId ? t('common.edit') : t('common.create') }} · {{ title }}</h2>
      </template>
      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="save">
        <UFormField :label="t('master.name')" required>
          <UInput v-model="form.name" class="w-full" />
        </UFormField>
        <UFormField v-if="resource === 'customers'" :label="t('master.email')">
          <UInput v-model="form.email" class="w-full" type="email" />
        </UFormField>
        <template v-if="resource === 'printers' || resource === 'components'">
          <UFormField :label="t('master.manufacturer')"
            ><UInput v-model="form.manufacturer" class="w-full"
          /></UFormField>
          <UFormField :label="t('master.model')"><UInput v-model="form.model" class="w-full" /></UFormField>
          <UFormField :label="t('master.purchasePrice')" required
            ><UInput v-model="form.purchasePrice" class="w-full" inputmode="decimal"
          /></UFormField>
          <UFormField :label="t('master.lifetime')" required
            ><UInput v-model="form.expectedLifetimeHours" class="w-full" inputmode="decimal"
          /></UFormField>
          <UFormField v-if="resource === 'printers'" :label="t('master.power')" required
            ><UInput v-model="form.averagePowerWatts" class="w-full" type="number" min="0" step="1"
          /></UFormField>
          <UFormField v-if="resource === 'components'" :label="t('master.type')" required>
            <USelect v-model="form.type" class="w-full" value-key="value" :items="componentTypes" />
          </UFormField>
          <UFormField
            v-if="resource === 'components'"
            :label="t('master.compatiblePrinters')"
            class="md:col-span-2"
          >
            <USelectMenu
              v-model="form.printerIds"
              class="w-full"
              multiple
              value-key="value"
              :items="printerOptions"
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
          <UFormField :label="t('master.manufacturer')" required
            ><UInput v-model="form.manufacturer" class="w-full"
          /></UFormField>
          <UFormField :label="t('master.material')" required
            ><UInput v-model="form.material" class="w-full"
          /></UFormField>
          <UFormField :label="t('master.color')"><UInput v-model="form.color" class="w-full" /></UFormField>
          <UFormField :label="t('master.purchasePrice')" required
            ><UInput v-model="form.purchasePrice" class="w-full" inputmode="decimal"
          /></UFormField>
          <UFormField :label="t('master.netWeight')" required
            ><UInput v-model="form.netWeightGrams" class="w-full" inputmode="decimal"
          /></UFormField>
          <UAlert
            class="md:col-span-2"
            color="neutral"
            variant="subtle"
            :description="`${t('master.costPerGram')}: ${derivedRate}`"
          />
        </template>
        <UFormField :label="t('master.note')" class="md:col-span-2"
          ><UTextarea v-model="form.note" class="w-full"
        /></UFormField>
        <div class="flex justify-end gap-2 md:col-span-2">
          <UButton color="neutral" variant="ghost" :label="t('common.cancel')" @click="editing = false" />
          <UButton type="submit" :loading="saving" :label="t('common.save')" />
        </div>
      </form>
    </UCard>

    <div v-if="loading" class="flex min-h-40 items-center justify-center">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin" />
    </div>
    <CommonEmptyState v-else-if="!items.length" :title="t('common.empty')">
      <UButton icon="i-lucide-plus" :label="t('common.create')" @click="startCreate" />
    </CommonEmptyState>
    <div v-else class="overflow-x-auto rounded-lg border border-default">
      <table class="w-full min-w-180 text-sm">
        <thead class="bg-elevated text-left">
          <tr>
            <th class="p-3">{{ t('master.name') }}</th>
            <th class="p-3">{{ t('master.details') }}</th>
            <th class="p-3">{{ t('master.rate') }}</th>
            <th class="p-3 text-right">{{ t('master.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in items"
            :key="item.id"
            class="border-t border-default"
            :class="item.archivedAt && 'opacity-60'"
          >
            <td class="p-3 font-medium">{{ item.name }}</td>
            <td class="p-3 text-muted">{{ details(item) }}</td>
            <td class="p-3">{{ rate(item) }}</td>
            <td class="p-3">
              <div class="flex justify-end gap-1">
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-pencil"
                  :aria-label="t('common.edit')"
                  @click="startEdit(item)"
                />
                <UButton
                  color="neutral"
                  variant="ghost"
                  :icon="item.archivedAt ? 'i-lucide-archive-restore' : 'i-lucide-archive'"
                  :aria-label="item.archivedAt ? t('common.restore') : t('common.archive')"
                  @click="toggleArchive(item)"
                />
                <CommonConfirmButton
                  color="error"
                  variant="ghost"
                  icon="i-lucide-trash-2"
                  :label="''"
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
  </div>
</template>

<script setup lang="ts">
import Decimal from 'decimal.js';
import type { MasterDataListItem, MasterDataResource, PaginatedResponse } from '#shared/types/master-data';

const props = defineProps<{ resource: MasterDataResource; title: string }>();
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
const currency = ref('EUR');
const printerOptions = ref<{ label: string; value: string }[]>([]);
let debounceTimer: ReturnType<typeof setTimeout> | undefined;

const componentTypes = computed(() => [
  { label: t('master.hotend'), value: 'HOTEND' },
  { label: t('master.buildPlate'), value: 'BUILD_PLATE' },
  { label: t('master.other'), value: 'OTHER' },
]);

function emptyForm() {
  return {
    name: '',
    email: '',
    manufacturer: '',
    model: '',
    purchasePrice: '0',
    expectedLifetimeHours: '1',
    averagePowerWatts: 0,
    type: 'HOTEND',
    printerIds: [] as string[],
    material: '',
    color: '',
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
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    loading.value = false;
  }
}

function startCreate() {
  Object.assign(form, emptyForm());
  editingId.value = null;
  editing.value = true;
}

function startEdit(item: MasterDataListItem) {
  Object.assign(form, emptyForm(), item);
  form.printerIds = Array.isArray(item.printerIds) ? ([...item.printerIds] as string[]) : [];
  editingId.value = item.id;
  editing.value = true;
}

async function save() {
  saving.value = true;
  error.value = '';
  try {
    const method = editingId.value ? 'PATCH' : 'POST';
    const url = editingId.value ? `/api/${props.resource}/${editingId.value}` : `/api/${props.resource}`;
    await $fetch(url, { method, body: form });
    editing.value = false;
    await refresh();
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
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
  if (props.resource === 'filaments')
    return [item.manufacturer, item.material, item.color].filter(Boolean).join(' · ');
  if (props.resource === 'components')
    return `${t(`master.${String(item.type).toLowerCase()}`)} · ${[item.manufacturer, item.model].filter(Boolean).join(' ')}`;
  return `${[item.manufacturer, item.model].filter(Boolean).join(' ')} · ${item.averagePowerWatts} W`;
}

function rate(item: MasterDataListItem) {
  if (props.resource === 'customers') return '—';
  const value = props.resource === 'filaments' ? item.costPerGram : item.hourlyRate;
  return `${money(value, currency.value)}${props.resource === 'filaments' ? '/g' : '/h'} · ${decimal(props.resource === 'filaments' ? item.netWeightGrams : item.expectedLifetimeHours)}${props.resource === 'filaments' ? ' g' : ' h'}`;
}

watch([search, includeArchived], () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(refresh, 250);
});
onMounted(refresh);
</script>
