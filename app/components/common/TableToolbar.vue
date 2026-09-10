<template>
  <UDashboardToolbar
    data-table-toolbar
    :ui="{
      root: 'overflow-x-auto',
      left: 'shrink-0',
      right: 'ml-auto min-w-max',
    }"
  >
    <template #left>
      <UBreadcrumb :items="breadcrumbItems" />
    </template>
    <template #right>
      <UInput
        v-model="search"
        class="w-52 sm:w-64"
        type="search"
        icon="i-tabler-search"
        :aria-label="t('common.search')"
        :placeholder="t('common.search')"
      />
      <slot name="filters" />
      <slot name="options" />
      <slot name="create" />
    </template>
  </UDashboardToolbar>
</template>

<script setup lang="ts">
const props = defineProps<{ title: string }>();
const search = defineModel<string>('search', { required: true });
const { t } = useI18n();
const breadcrumbItems = computed(() => [
  { icon: 'i-tabler-home', label: t('nav.dashboard'), to: '/' },
  { label: props.title },
]);
</script>
