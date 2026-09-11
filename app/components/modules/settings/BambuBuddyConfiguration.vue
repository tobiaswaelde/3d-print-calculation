<template>
  <UForm :schema="bambubuddyConfigurationSchema" :state="form" class="space-y-5" @submit="save">
    <UCard id="bambubuddy-configuration">
      <template #header>
        <div class="flex items-start gap-3">
          <UIcon name="i-tabler-printer" class="mt-0.5 size-5 text-primary" />
          <div>
            <h2 class="font-semibold">{{ t('integration.bambuConfiguration') }}</h2>
            <p class="text-sm text-muted">{{ t('integration.bambuConfigurationDescription') }}</p>
          </div>
        </div>
      </template>
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField name="url" :label="t('integration.url')" required>
          <UInput v-model="form.url" class="w-full" placeholder="http://bambubuddy:8000" />
        </UFormField>
        <UFormField name="apiKey" :label="t('integration.apiKey')">
          <UInput
            v-model="form.apiKey"
            class="w-full"
            type="password"
            autocomplete="new-password"
            :placeholder="credentialPlaceholder"
          />
        </UFormField>
        <UCheckbox
          v-if="settings?.bambubuddy.apiKeyConfigured"
          v-model="clearApiKey"
          :label="t('integration.removeCredential')"
        />
      </div>
    </UCard>

    <UAlert v-if="message" :color="messageColor" :description="message" />
    <div class="flex justify-end">
      <UButton type="submit" icon="i-tabler-device-floppy" :loading="pending" :label="t('common.save')" />
    </div>
  </UForm>
</template>

<script setup lang="ts">
import { integrationSettingsSchema, type IntegrationSettingsDto } from '#shared/schemas/integration-settings';

const bambubuddyConfigurationSchema = integrationSettingsSchema.shape.bambubuddy.pick({
  url: true,
  apiKey: true,
});
const { t } = useI18n();
const emit = defineEmits<{ saved: [] }>();
const { settings, load, set } = useIntegrationSettings();
const form = reactive({ url: '', apiKey: '' });
const clearApiKey = ref(false);
const pending = ref(false);
const message = ref('');
const messageColor = ref<'success' | 'error'>('success');
const credentialPlaceholder = computed(() =>
  settings.value?.bambubuddy.apiKeyConfigured ? t('integration.credentialConfigured') : '',
);

function applySettings(value: IntegrationSettingsDto) {
  form.url = value.bambubuddy.url;
  form.apiKey = '';
  clearApiKey.value = false;
}

async function save() {
  if (!settings.value) return;
  pending.value = true;
  message.value = '';
  try {
    const input = bambubuddyConfigurationSchema.parse(form);
    const value = await $fetch<IntegrationSettingsDto>('/api/settings/integrations', {
      method: 'PATCH',
      body: {
        spoolman: {
          enabled: settings.value.spoolman.enabled,
          url: settings.value.spoolman.url,
        },
        bambubuddy: {
          enabled: true,
          url: input.url,
          ...(clearApiKey.value ? { apiKey: null } : input.apiKey ? { apiKey: input.apiKey } : {}),
        },
      },
    });
    set(value);
    applySettings(value);
    emit('saved');
    messageColor.value = 'success';
    message.value = t('settings.saved');
  } catch (reason) {
    messageColor.value = 'error';
    message.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    pending.value = false;
  }
}

onMounted(async () => applySettings(await load(true)));
</script>
