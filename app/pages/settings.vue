<template>
  <LayoutPagePanel panel-id="settings" :title="t('nav.settings')">
    <UCard class="max-w-2xl">
      <UForm :schema="settingsSchema" :state="form" class="space-y-4" @submit="save">
        <UFormField name="currency" :label="t('auth.currency')" required :help="t('settings.currencyHelp')">
          <USelect v-model="form.currency" class="w-full" :items="['EUR', 'USD', 'CHF', 'GBP']" />
        </UFormField>
        <UFormField name="defaultLocale" :label="t('settings.defaultLocale')" required>
          <USelect v-model="form.defaultLocale" class="w-full" value-key="value" :items="localeOptions" />
        </UFormField>
        <UFormField name="electricityPricePerKwh" :label="t('auth.electricityPrice')" required>
          <UInput v-model="form.electricityPricePerKwh" class="w-full" inputmode="decimal" />
        </UFormField>
        <UAlert v-if="message" :color="messageColor" :description="message" />
        <div class="flex justify-end">
          <UButton type="submit" :loading="pending" :label="t('common.save')" />
        </div>
      </UForm>
    </UCard>
  </LayoutPagePanel>
</template>

<script setup lang="ts">
import { settingsSchema } from '#shared/schemas/master-data';

const { t } = useI18n();
const pending = ref(false);
const message = ref('');
const messageColor = ref<'success' | 'error'>('success');
const form = reactive({ currency: 'EUR', defaultLocale: 'de-DE', electricityPricePerKwh: '0' });
const localeOptions = computed(() => [
  { label: 'Deutsch', value: 'de-DE' },
  { label: 'English', value: 'en-US' },
]);

onMounted(async () => Object.assign(form, await $fetch('/api/settings')));

async function save() {
  pending.value = true;
  message.value = '';
  try {
    Object.assign(form, await $fetch('/api/settings', { method: 'PATCH', body: form }));
    messageColor.value = 'success';
    message.value = t('settings.saved');
  } catch (reason) {
    messageColor.value = 'error';
    message.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    pending.value = false;
  }
}
</script>
