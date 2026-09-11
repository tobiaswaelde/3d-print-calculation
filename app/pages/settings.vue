<template>
  <LayoutPagePanel panel-id="settings" :title="t('nav.settings')">
    <div class="mx-auto w-full max-w-3xl space-y-8">
      <UForm :schema="settingsSchema" :state="form" class="space-y-5" @submit="save">
        <UCard>
          <template #header>
            <div class="flex items-center gap-3">
              <UIcon name="i-tabler-adjustments-horizontal" class="size-5 text-primary" />
              <div>
                <h2 class="font-semibold">{{ t('settings.general') }}</h2>
                <p class="text-sm text-muted">{{ t('settings.generalDescription') }}</p>
              </div>
            </div>
          </template>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField name="defaultLocale" :label="t('common.language')" required>
              <USelect
                v-model="form.defaultLocale"
                class="w-full"
                icon="i-tabler-language"
                value-key="value"
                :items="localeOptions"
              />
            </UFormField>
            <UFormField name="theme" :label="t('common.theme')" required>
              <USelect
                v-model="form.theme"
                class="w-full"
                icon="i-tabler-sun-moon"
                value-key="value"
                :items="themeOptions"
              />
            </UFormField>
            <UFormField name="dateFormat" :label="t('settings.dateFormat')" required>
              <USelect
                v-model="form.dateFormat"
                class="w-full"
                icon="i-tabler-calendar"
                value-key="value"
                :items="dateFormatOptions"
              />
            </UFormField>
            <UFormField name="timeFormat" :label="t('settings.timeFormat')" required>
              <USelect
                v-model="form.timeFormat"
                class="w-full"
                icon="i-tabler-clock"
                value-key="value"
                :items="timeFormatOptions"
              />
            </UFormField>
            <UFormField
              name="durationFormat"
              :label="t('settings.durationFormat')"
              required
              class="sm:col-span-2"
            >
              <USelect
                v-model="form.durationFormat"
                class="w-full"
                icon="i-tabler-hourglass"
                value-key="value"
                :items="durationFormatOptions"
              />
            </UFormField>
          </div>
        </UCard>

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
            <UFormField
              name="currency"
              :label="t('auth.currency')"
              required
              :help="t('settings.currencyHelp')"
            >
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
            <UButton
              type="submit"
              icon="i-tabler-device-floppy"
              :loading="pending"
              :label="t('common.save')"
            />
          </div>
        </div>
      </UForm>
      <ModulesSettingsIntegrations />
    </div>
  </LayoutPagePanel>
</template>

<script setup lang="ts">
import { settingsSchema } from '#shared/schemas/master-data';
import {
  DATE_FORMATS,
  TIME_FORMATS,
  type DateFormat,
  type DurationFormat,
  type TimeFormat,
} from '~/utils/display-formatting';

const { t, setLocale } = useI18n();
const colorMode = useColorMode();
const { user, updateLocale } = useAuth();
const { dateFormat, timeFormat, durationFormat, setDateFormat, setTimeFormat, setDurationFormat } =
  useFormatting();
const pending = ref(false);
const message = ref('');
const messageColor = ref<'success' | 'error'>('success');
const form = reactive({
  currency: 'EUR',
  defaultLocale: 'de-DE' as 'de-DE' | 'en-US',
  electricityPricePerKwh: '0',
  theme: 'system' as 'light' | 'dark' | 'system',
  dateFormat: 'DD.MM.YYYY' as DateFormat,
  timeFormat: 'HH:mm' as TimeFormat,
  durationFormat: 'human' as DurationFormat,
});
const localeOptions = computed(() => [
  { label: 'Deutsch', value: 'de-DE' },
  { label: 'English', value: 'en-US' },
]);
const themeOptions = computed(() =>
  (['light', 'dark', 'system'] as const).map((value) => ({ label: t(`common.${value}`), value })),
);
const dateFormatOptions = DATE_FORMATS.map((value) => ({ label: value, value }));
const timeFormatOptions = TIME_FORMATS.map((value) => ({ label: value, value }));
const durationFormatOptions = computed<Array<{ label: string; value: DurationFormat }>>(() => [
  { label: t('settings.durationFormatHuman'), value: 'human' },
  { label: t('settings.durationFormatCompact'), value: 'compact' },
  { label: t('settings.durationFormatClock'), value: 'clock' },
  { label: t('settings.durationFormatDecimal'), value: 'decimal' },
]);

onMounted(async () => {
  Object.assign(form, await $fetch('/api/settings'));
  form.defaultLocale = user.value?.locale ?? form.defaultLocale;
  if (colorMode.preference === 'light' || colorMode.preference === 'dark') form.theme = colorMode.preference;
  else form.theme = 'system';
  form.dateFormat = dateFormat.value;
  form.timeFormat = timeFormat.value;
  form.durationFormat = durationFormat.value;
});

async function save() {
  pending.value = true;
  message.value = '';
  try {
    Object.assign(
      form,
      await $fetch('/api/settings', {
        method: 'PATCH',
        body: {
          currency: form.currency,
          defaultLocale: form.defaultLocale,
          electricityPricePerKwh: form.electricityPricePerKwh,
        },
      }),
    );
    await setLocale(form.defaultLocale);
    localStorage.setItem('print-cost-locale', form.defaultLocale);
    await updateLocale(form.defaultLocale);
    colorMode.preference = form.theme;
    setDateFormat(form.dateFormat);
    setTimeFormat(form.timeFormat);
    setDurationFormat(form.durationFormat);
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
