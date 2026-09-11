<template>
  <USelectMenu
    v-model="selected"
    v-model:search-term="search"
    :items="options"
    value-key="value"
    :loading="loading"
    :aria-label="t('nav.series')"
    class="w-full"
  />
  <p v-if="error" role="alert" class="text-sm text-error">{{ error }}</p>
</template>
<script setup lang="ts">
import type { PrintSeriesDto } from '#shared/types/series';
import type { PaginatedResponse } from '#shared/types/master-data';
const selected = defineModel<string | null>({ default: null });
const emit = defineEmits<{ customer: [id: string | null] }>();
const { t } = useI18n();
const search = ref('');
const loading = ref(false);
const error = ref('');
const items = ref<PrintSeriesDto[]>([]);
const options = computed(() => [
  { label: '—', value: null },
  ...items.value.map((item) => ({ label: item.name, value: item.id })),
]);
async function load() {
  loading.value = true;
  try {
    items.value = (
      await $fetch<PaginatedResponse<PrintSeriesDto>>('/api/series', {
        query: { search: search.value, pageSize: 100 },
      })
    ).items;
    if (selected.value && !items.value.some((item) => item.id === selected.value))
      items.value.push(await $fetch<PrintSeriesDto>(`/api/series/${selected.value}`));
  } catch (reason) {
    error.value = String(reason);
  } finally {
    loading.value = false;
  }
}
watch(search, load);
watch(selected, (value) => {
  const series = items.value.find((item) => item.id === value);
  if (series?.customerId) emit('customer', series.customerId);
});
onMounted(load);
</script>
