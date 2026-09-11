<template>
  <UForm :schema="settingsSchema" :state="form" class="mx-auto w-full max-w-3xl space-y-5" @submit="save">
    <UCard>
      <template #header>
        <div class="flex items-center gap-3">
          <UIcon name="i-tabler-calculator" class="size-5 text-primary" />
          <div>
            <h2 class="font-semibold">{{ t('settings.calculation') }}</h2>
            <p class="text-sm text-muted">{{ t('settings.calculationDescription') }}</p>
          </div>
        </div>
      </template>

      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField name="currency" :label="t('auth.currency')" required :help="t('settings.currencyHelp')">
          <USelect
            v-model="form.currency"
            class="w-full"
            icon="i-tabler-currency-euro"
            :items="['EUR', 'USD', 'CHF', 'GBP']"
          />
        </UFormField>
        <UFormField name="electricityPricePerKwh" :label="t('auth.electricityPrice')" required>
          <UInput
            v-model="form.electricityPricePerKwh"
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
      </div>
    </UCard>

    <div class="space-y-3">
      <UAlert v-if="message" :color="messageColor" :description="message" />
      <div class="flex justify-end">
        <UButton type="submit" icon="i-tabler-device-floppy" :loading="pending" :label="t('common.save')" />
      </div>
    </div>
  </UForm>
</template>

<script setup lang="ts">
import { settingsSchema } from '#shared/schemas/master-data';

const { t } = useI18n();
const { form, load, message, messageColor, pending, save } = useApplicationSettings();

onMounted(load);
</script>
