<template>
  <div>
    <h1 class="text-2xl font-semibold">{{ t('auth.setup') }}</h1>
    <p class="mt-1 text-sm text-muted">{{ t('auth.setupDescription') }}</p>
    <UForm :schema="setupSchema" :state="form" class="mt-6 grid gap-4 md:grid-cols-2" @submit="submit">
      <UFormField :label="t('auth.displayName')" name="displayName" required>
        <UInput v-model="form.displayName" class="w-full" autocomplete="name" icon="i-tabler-user" />
      </UFormField>
      <UFormField :label="t('auth.email')" name="email" required>
        <UInput v-model="form.email" class="w-full" type="email" autocomplete="email" icon="i-tabler-mail" />
      </UFormField>
      <UFormField :label="t('auth.password')" name="password" class="md:col-span-2" required>
        <UInput
          v-model="form.password"
          class="w-full"
          type="password"
          autocomplete="new-password"
          icon="i-tabler-lock"
        />
      </UFormField>
      <UFormField :label="t('auth.currency')" name="currency" required>
        <USelect
          v-model="form.currency"
          class="w-full"
          icon="i-tabler-currency-euro"
          :items="['EUR', 'USD', 'CHF', 'GBP']"
        />
      </UFormField>
      <UFormField :label="t('auth.electricityPrice')" name="electricityPrice" required>
        <UInput
          v-model="form.electricityPrice"
          class="w-full"
          type="number"
          min="0"
          step="0.001"
          icon="i-tabler-bolt"
        >
          <template #trailing>
            <span class="text-xs text-muted">{{ form.currency }}/kWh</span>
          </template>
        </UInput>
      </UFormField>
      <fieldset class="space-y-3 md:col-span-2">
        <legend class="font-medium">{{ t('settings.features') }}</legend>
        <p class="text-sm text-muted">{{ t('auth.featuresDescription') }}</p>
        <div class="grid gap-3 md:grid-cols-2">
          <div class="flex items-start justify-between gap-4 rounded-lg border border-default p-4">
            <div>
              <p class="font-medium">{{ t('settings.printSeries') }}</p>
              <p class="mt-1 text-sm text-muted">{{ t('settings.printSeriesDescription') }}</p>
            </div>
            <USwitch v-model="form.printSeriesEnabled" :aria-label="t('settings.printSeries')" />
          </div>
          <div class="flex items-start justify-between gap-4 rounded-lg border border-default p-4">
            <div>
              <p class="font-medium">{{ t('settings.spoolManagement') }}</p>
              <p class="mt-1 text-sm text-muted">{{ t('settings.spoolManagementDescription') }}</p>
            </div>
            <USwitch v-model="form.spoolManagementEnabled" :aria-label="t('settings.spoolManagement')" />
          </div>
        </div>
      </fieldset>
      <UAlert v-if="error" class="md:col-span-2" color="error" :description="error" />
      <UButton class="md:col-span-2" type="submit" block :loading="pending" :label="t('auth.setup')" />
    </UForm>
  </div>
</template>

<script setup lang="ts">
import { setupSchema } from '#shared/schemas/auth';

definePageMeta({ layout: 'auth' });
const { t, locale } = useI18n();
const pending = ref(false);
const error = ref('');
const form = reactive({
  displayName: '',
  email: '',
  password: '',
  locale: locale.value,
  currency: 'EUR',
  electricityPrice: '0.30',
  printSeriesEnabled: true,
  spoolManagementEnabled: true,
});

async function submit() {
  pending.value = true;
  error.value = '';
  try {
    await $fetch('/api/auth/setup', { method: 'POST', body: form });
    await navigateTo('/');
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    pending.value = false;
  }
}
</script>
