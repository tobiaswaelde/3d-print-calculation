<template>
  <section class="space-y-5">
    <div>
      <h2 class="text-lg font-semibold">{{ t('settings.integrations') }}</h2>
      <p class="text-sm text-muted">{{ t('settings.integrationsDescription') }}</p>
    </div>

    <UForm :schema="integrationSettingsSchema" :state="form" class="space-y-5" @submit="save">
      <UCard v-if="spoolManagementEnabled" id="integration-spoolman">
        <template #header>
          <div class="flex items-center justify-between gap-4">
            <div>
              <h3 class="font-semibold">{{ t('integration.spoolman') }}</h3>
              <p class="text-sm text-muted">{{ t('integration.spoolmanConfigDescription') }}</p>
            </div>
            <USwitch v-model="form.spoolman.enabled" :label="t('integration.enabled')" />
          </div>
        </template>
        <div v-if="form.spoolman.enabled" class="grid gap-4 sm:grid-cols-2">
          <UFormField name="spoolman.url" :label="t('integration.url')" required>
            <UInput v-model="form.spoolman.url" class="w-full" placeholder="http://spoolman:7912" />
          </UFormField>
          <UFormField name="spoolman.authorization" :label="t('integration.authorization')">
            <UInput
              v-model="form.spoolman.authorization"
              class="w-full"
              type="password"
              autocomplete="new-password"
              :placeholder="credentialPlaceholder(settings?.spoolman.authorizationConfigured)"
            />
          </UFormField>
          <UCheckbox
            v-if="settings?.spoolman.authorizationConfigured"
            v-model="clearSpoolmanAuthorization"
            :label="t('integration.removeCredential')"
          />
        </div>
      </UCard>

      <UAlert
        v-else
        color="neutral"
        :title="t('integration.spoolman')"
        :description="t('integration.spoolManagementRequired')"
      />

      <UCard id="integration-bambubuddy">
        <template #header>
          <div class="flex items-center justify-between gap-4">
            <div>
              <h3 class="font-semibold">{{ t('integration.bambu') }}</h3>
              <p class="text-sm text-muted">{{ t('integration.bambuConfigDescription') }}</p>
            </div>
            <USwitch v-model="form.bambubuddy.enabled" :label="t('integration.enabled')" />
          </div>
        </template>
        <div v-if="form.bambubuddy.enabled" class="grid gap-4 sm:grid-cols-2">
          <UFormField name="bambubuddy.url" :label="t('integration.url')" required>
            <UInput v-model="form.bambubuddy.url" class="w-full" placeholder="http://bambubuddy:8000" />
          </UFormField>
          <UFormField name="bambubuddy.apiKey" :label="t('integration.apiKey')">
            <UInput
              v-model="form.bambubuddy.apiKey"
              class="w-full"
              type="password"
              autocomplete="new-password"
              :placeholder="credentialPlaceholder(settings?.bambubuddy.apiKeyConfigured)"
            />
          </UFormField>
          <UCheckbox
            v-if="settings?.bambubuddy.apiKeyConfigured"
            v-model="clearBambubuddyApiKey"
            :label="t('integration.removeCredential')"
          />
        </div>
      </UCard>

      <UAlert v-if="message" :color="messageColor" :description="message" />
      <div class="flex justify-end">
        <UButton
          type="submit"
          icon="i-tabler-device-floppy"
          :loading="pending"
          :label="t('integration.saveConfiguration')"
        />
      </div>
    </UForm>

    <ModulesSettingsSpoolman
      v-if="spoolManagementEnabled && settings?.spoolman.enabled"
      :key="`spoolman-${revision}`"
    />
    <ModulesSettingsBambuBuddy v-if="settings?.bambubuddy.enabled" :key="`bambu-${revision}`" />
  </section>
</template>

<script setup lang="ts">
import { integrationSettingsSchema, type IntegrationSettingsDto } from '#shared/schemas/integration-settings';

const { t } = useI18n();
const { spoolManagementEnabled } = useFeatures();
const settings = ref<IntegrationSettingsDto | null>(null);
const pending = ref(false);
const message = ref('');
const messageColor = ref<'success' | 'error'>('success');
const clearSpoolmanAuthorization = ref(false);
const clearBambubuddyApiKey = ref(false);
const revision = ref(0);
const form = reactive({
  spoolman: { enabled: false, url: '', authorization: '' },
  bambubuddy: { enabled: false, url: '', apiKey: '' },
});

function credentialPlaceholder(configured = false) {
  return configured ? t('integration.credentialConfigured') : '';
}

function applySettings(value: IntegrationSettingsDto) {
  settings.value = value;
  form.spoolman.enabled = value.spoolman.enabled;
  form.spoolman.url = value.spoolman.url;
  form.spoolman.authorization = '';
  form.bambubuddy.enabled = value.bambubuddy.enabled;
  form.bambubuddy.url = value.bambubuddy.url;
  form.bambubuddy.apiKey = '';
  clearSpoolmanAuthorization.value = false;
  clearBambubuddyApiKey.value = false;
}

onMounted(async () => {
  applySettings(await $fetch<IntegrationSettingsDto>('/api/settings/integrations'));
});

async function save() {
  pending.value = true;
  message.value = '';
  try {
    const value = await $fetch<IntegrationSettingsDto>('/api/settings/integrations', {
      method: 'PATCH',
      body: {
        spoolman: {
          enabled: form.spoolman.enabled,
          url: form.spoolman.url,
          ...(clearSpoolmanAuthorization.value
            ? { authorization: null }
            : form.spoolman.authorization
              ? { authorization: form.spoolman.authorization }
              : {}),
        },
        bambubuddy: {
          enabled: form.bambubuddy.enabled,
          url: form.bambubuddy.url,
          ...(clearBambubuddyApiKey.value
            ? { apiKey: null }
            : form.bambubuddy.apiKey
              ? { apiKey: form.bambubuddy.apiKey }
              : {}),
        },
      },
    });
    applySettings(value);
    revision.value += 1;
    messageColor.value = 'success';
    message.value = t('integration.configurationSaved');
  } catch (reason) {
    messageColor.value = 'error';
    message.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    pending.value = false;
  }
}
</script>
