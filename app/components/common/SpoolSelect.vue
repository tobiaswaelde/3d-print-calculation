<template>
  <USelectMenu
    v-model="selected"
    v-model:search-term="search"
    :items="options"
    value-key="value"
    :loading="loading"
    :aria-label="t('nav.spools')"
    class="w-full"
  />
  <p v-if="error" role="alert" class="text-sm text-error">{{ error }}</p>
</template>

<script setup lang="ts">
import type { SpoolDto } from '#shared/types/spools';
import type { PaginatedResponse } from '#shared/types/master-data';
const props = defineProps<{ filamentId: string }>();
const selected = defineModel<string | undefined>({ default: undefined });
const { t } = useI18n();
const search = ref('');
const loading = ref(false);
const error = ref('');
const items = ref<SpoolDto[]>([]);
const options = computed(() =>
  items.value.map((item) => ({
    label: `${item.code} · ${item.remainingGrams ?? '—'} g`,
    value: item.id,
    disabled:
      ['ARCHIVED', 'MISSING'].includes(item.remoteState ?? '') ||
      (item.remainingGrams !== null && Number(item.remainingGrams) <= 0),
  })),
);
let request = 0;
watch(
  [() => props.filamentId, search],
  async () => {
    const current = ++request;
    if (!props.filamentId) {
      items.value = [];
      return;
    }
    loading.value = true;
    try {
      const result = await $fetch<PaginatedResponse<SpoolDto>>('/api/spools', {
        query: { filamentId: props.filamentId, search: search.value, pageSize: 100, availableOnly: true },
      });
      if (current !== request) return;
      items.value = result.items;
      if (selected.value && !result.items.some((item) => item.id === selected.value)) {
        const selectedSpool = await $fetch<SpoolDto>(`/api/spools/${selected.value}`);
        if (current !== request) return;
        if (selectedSpool.filamentId === props.filamentId) items.value.push(selectedSpool);
        else selected.value = undefined;
      }
      if (!selected.value && result.total === 1 && result.items.length === 1)
        selected.value = result.items[0]!.id;
      error.value = '';
    } catch (reason) {
      if (current === request) error.value = reason instanceof Error ? reason.message : String(reason);
    } finally {
      if (current === request) loading.value = false;
    }
  },
  { immediate: true },
);
</script>
