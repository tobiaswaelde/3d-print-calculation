<template>
  <main class="mx-auto max-w-sm space-y-4 bg-white p-6 text-center text-black">
    <template v-if="spool"
      ><h1 class="break-all font-semibold">{{ spool.code }}</h1>
      <p>{{ spool.filamentName }}</p>
      <!-- prettier-ignore -->
      <img
        :src="`/api/spools/${spool.id}/qr`"
        :alt="t('spool.qrAlt', { code: spool.code })"
        width="256"
        height="256"
        class="mx-auto"
      >
      <p class="break-all text-xs">{{ url }}</p></template
    >
    <p v-if="error" role="alert">{{ error }}</p>
    <div class="flex justify-center gap-3 print:hidden">
      <UButton :label="t('spool.print')" @click="printLabel" /><UButton
        :to="`/spools/${id}`"
        :label="t('common.back')"
      />
    </div>
  </main>
</template>
<script setup lang="ts">
import type { SpoolDto } from '#shared/types/spools';
definePageMeta({ layout: false });
const { t } = useI18n();
const id = String(useRoute().params.id);
const spool = ref<SpoolDto | null>(null);
const error = ref('');
const url = computed(() => `${window.location.origin}/spools/${id}`);
const printLabel = () => window.print();
onMounted(async () => {
  try {
    spool.value = await $fetch<SpoolDto>(`/api/spools/${id}`);
  } catch (reason) {
    error.value = String(reason);
  }
});
</script>
