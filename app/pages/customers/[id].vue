<template>
  <LayoutPagePanel panel-id="customer-detail" :title="t('nav.customers')">
    <UAlert v-if="error" color="error" :description="error" />
    <div v-if="customer" class="space-y-5">
      <h1 class="text-xl font-semibold">{{ customer.name }}</h1>
      <p v-if="customer.email">{{ customer.email }}</p>
      <p v-if="customer.note" class="whitespace-pre-wrap">{{ customer.note }}</p>
      <UButton
        :to="`/customers?search=${encodeURIComponent(customer.name)}`"
        :label="t('common.edit')"
        color="neutral"
      /><UButton v-if="!customer.archivedAt" :label="t('prints.new')" @click="creating = true" />
      <ModulesPrintsHistory :customer-id="id" />
      <ModulesPrintsCreateDialog v-model:open="creating" :initial-customer-id="id" />
    </div>
  </LayoutPagePanel>
</template>
<script setup lang="ts">
const { t } = useI18n();
const id = String(useRoute().params.id);
const creating = ref(false);
const error = ref('');
const customer = ref<{
  name: string;
  email: string | null;
  note: string | null;
  archivedAt: string | null;
} | null>(null);
onMounted(async () => {
  try {
    customer.value = await $fetch(`/api/customers/${id}`);
  } catch (reason) {
    error.value = String(reason);
  }
});
</script>
