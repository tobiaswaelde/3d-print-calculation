<template>
  <div class="contents">
    <ModulesPrintsTableView
      panel-id="customer-detail"
      :title="t('nav.customers')"
      :customer-id="id"
      :customer-name="customer?.name"
      :customer-archived="Boolean(customer?.archivedAt)"
    >
      <template #actions="{ openCreate }">
        <template v-if="customer">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-tabler-pencil"
            :label="t('common.edit')"
            @click="editing = true"
          />
          <UButton
            v-if="!customer.archivedAt"
            icon="i-tabler-file-plus"
            :label="t('prints.new')"
            @click="openCreate"
          />
        </template>
      </template>

      <template #details>
        <UAlert v-if="error" class="mb-4" color="error" :description="error" />
        <div v-if="customer" class="flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="break-words text-2xl font-semibold">{{ customer.name }}</h1>
              <UBadge v-if="customer.archivedAt" color="neutral" variant="subtle">
                {{ t('common.archived') }}
              </UBadge>
            </div>
            <p v-if="customer.email" class="mt-2 text-sm text-muted">{{ customer.email }}</p>
            <p v-if="customer.note" class="mt-3 whitespace-pre-wrap">{{ customer.note }}</p>
          </div>
        </div>
        <div v-else-if="!error" class="flex min-h-24 items-center justify-center">
          <UIcon name="i-tabler-loader-2" class="size-8 animate-spin" />
        </div>
      </template>
    </ModulesPrintsTableView>

    <ModulesCustomersDialog v-model:open="editing" :value="customer" @saved="customer = $event" />
  </div>
</template>

<script setup lang="ts">
import type { CustomerDto } from '#shared/types/master-data';

const { t } = useI18n();
const id = String(useRoute().params.id);
const editing = ref(false);
const error = ref('');
const customer = ref<CustomerDto | null>(null);

onMounted(async () => {
  try {
    customer.value = await $fetch<CustomerDto>(`/api/customers/${id}`);
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  }
});
</script>
