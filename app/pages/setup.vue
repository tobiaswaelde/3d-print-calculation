<template>
  <div>
    <h1 class="text-2xl font-semibold">{{ t('auth.setup') }}</h1>
    <p class="mt-1 text-sm text-muted">{{ t('auth.setupDescription') }}</p>
    <UForm :schema="setupSchema" :state="form" class="mt-6 space-y-4" @submit="submit">
      <UFormField :label="t('auth.displayName')" name="displayName" required>
        <UInput v-model="form.displayName" class="w-full" autocomplete="name" icon="i-tabler-user" />
      </UFormField>
      <UFormField :label="t('auth.email')" name="email" required>
        <UInput v-model="form.email" class="w-full" type="email" autocomplete="email" icon="i-tabler-mail" />
      </UFormField>
      <UFormField :label="t('auth.password')" name="password" required>
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
      <UAlert v-if="error" color="error" :description="error" />
      <UButton type="submit" block :loading="pending" :label="t('auth.setup')" />
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
