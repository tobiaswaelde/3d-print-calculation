<template>
  <UForm :schema="settingsSchema" :state="form" class="mx-auto w-full max-w-3xl space-y-5" @submit="save">
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
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="font-semibold">{{ t('settings.spoolManagement') }}</h2>
            <p class="text-sm text-muted">{{ t('settings.spoolManagementDescription') }}</p>
          </div>
          <USwitch v-model="form.spoolManagementEnabled" :label="t('settings.spoolManagementEnabled')" />
        </div>
      </template>
      <UAlert
        v-if="!form.spoolManagementEnabled"
        color="neutral"
        :description="t('settings.spoolManagementDisabledHelp')"
      />
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
const {
  dateFormatOptions,
  durationFormatOptions,
  form,
  load,
  localeOptions,
  message,
  messageColor,
  pending,
  save,
  themeOptions,
  timeFormatOptions,
} = useApplicationSettings();

onMounted(load);
</script>
