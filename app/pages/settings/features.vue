<template>
  <div class="mx-auto w-full max-w-3xl space-y-5">
    <div v-if="loading" class="flex min-h-72 items-center justify-center">
      <UIcon name="i-tabler-loader-2" class="size-8 animate-spin" />
    </div>
    <template v-else>
      <UForm
        id="feature-settings-form"
        :schema="featureSettingsSchema"
        :state="form"
        class="space-y-5"
        @submit="save"
      >
        <UCard>
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-start gap-3">
              <UIcon name="i-tabler-list-check" class="mt-0.5 size-5 text-primary" />
              <div>
                <h2 class="font-semibold">{{ t('settings.printSeries') }}</h2>
                <p class="text-sm text-muted">{{ t('settings.printSeriesDescription') }}</p>
              </div>
            </div>
            <USwitch v-model="form.printSeriesEnabled" :aria-label="t('settings.printSeries')" />
          </div>
          <UAlert
            v-if="!form.printSeriesEnabled"
            class="mt-4"
            color="neutral"
            icon="i-tabler-info-circle"
            variant="subtle"
            :description="t('settings.printSeriesDisabledHelp')"
          />
        </UCard>

        <UCard>
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-start gap-3">
              <UIcon name="i-tabler-qrcode" class="mt-0.5 size-5 text-primary" />
              <div>
                <h2 class="font-semibold">{{ t('settings.spoolManagement') }}</h2>
                <p class="text-sm text-muted">{{ t('settings.spoolManagementDescription') }}</p>
              </div>
            </div>
            <USwitch v-model="form.spoolManagementEnabled" :aria-label="t('settings.spoolManagement')" />
          </div>
          <UAlert
            v-if="!form.spoolManagementEnabled"
            class="mt-4"
            color="neutral"
            icon="i-tabler-info-circle"
            variant="subtle"
            :description="t('settings.spoolManagementDisabledHelp')"
          />
        </UCard>
      </UForm>

      <ModulesSettingsIntegrations ref="integrations" @loaded="integrationsLoaded = true" @submit="save" />
      <div class="space-y-3">
        <UAlert v-if="message" :color="messageColor" :description="message" />
        <div class="flex justify-end">
          <UButton
            type="submit"
            form="feature-settings-form"
            icon="i-tabler-device-floppy"
            :disabled="!integrationsLoaded"
            :loading="pending"
            :label="t('common.save')"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { featureSettingsSchema, type FeatureSettings } from '#shared/schemas/features';

const { t } = useI18n();
const { load, set } = useFeatures();
const integrations = ref<{
  save: (spoolManagementEnabled: boolean) => Promise<void>;
  validate: (spoolManagementEnabled: boolean) => void;
} | null>(null);
const form = reactive<FeatureSettings>({ printSeriesEnabled: true, spoolManagementEnabled: true });
const loading = ref(true);
const integrationsLoaded = ref(false);
const pending = ref(false);
const message = ref('');
const messageColor = ref<'success' | 'error'>('success');

async function save() {
  pending.value = true;
  message.value = '';
  try {
    const input = featureSettingsSchema.parse(form);
    integrations.value?.validate(input.spoolManagementEnabled);
    const value = await $fetch<FeatureSettings>('/api/settings/features', {
      method: 'PATCH',
      body: input,
    });
    Object.assign(form, value);
    set(value);
    await integrations.value?.save(input.spoolManagementEnabled);
    messageColor.value = 'success';
    message.value = t('settings.saved');
  } catch (reason) {
    messageColor.value = 'error';
    message.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    pending.value = false;
  }
}

onMounted(async () => {
  try {
    Object.assign(form, await load(true));
  } finally {
    loading.value = false;
  }
});
</script>
