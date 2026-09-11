<template>
  <UForm :schema="spoolmanConfigurationSchema" :state="form" class="space-y-5" @submit="save">
    <UCard id="spoolman-configuration">
      <template #header>
        <div class="flex items-start gap-3">
          <UIcon name="i-tabler-packages" class="mt-0.5 size-5 text-primary" />
          <div>
            <h2 class="font-semibold">{{ t('integration.spoolmanConfiguration') }}</h2>
            <p class="text-sm text-muted">{{ t('integration.spoolmanConfigurationDescription') }}</p>
          </div>
        </div>
      </template>
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField name="url" :label="t('integration.url')" required>
          <UInput v-model="form.url" class="w-full" placeholder="http://spoolman:7912" />
        </UFormField>
        <UFormField name="authorization" :label="t('integration.authorization')">
          <UInput
            v-model="form.authorization"
            class="w-full"
            type="password"
            autocomplete="new-password"
            :placeholder="credentialPlaceholder"
          />
        </UFormField>
        <UCheckbox
          v-if="settings?.spoolman.authorizationConfigured"
          v-model="clearAuthorization"
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

const spoolmanConfigurationSchema = integrationSettingsSchema.shape.spoolman.pick({
  url: true,
  authorization: true,
});
const { t } = useI18n();
const emit = defineEmits<{ saved: [] }>();
const { settings, load, set } = useIntegrationSettings();
const form = reactive({ url: '', authorization: '' });
const clearAuthorization = ref(false);
const pending = ref(false);
const message = ref('');
const messageColor = ref<'success' | 'error'>('success');
const credentialPlaceholder = computed(() =>
  settings.value?.spoolman.authorizationConfigured ? t('integration.credentialConfigured') : '',
);

function applySettings(value: IntegrationSettingsDto) {
  form.url = value.spoolman.url;
  form.authorization = '';
  clearAuthorization.value = false;
}

async function save() {
  if (!settings.value) return;
  pending.value = true;
  message.value = '';
  try {
    const input = spoolmanConfigurationSchema.parse(form);
    const value = await $fetch<IntegrationSettingsDto>('/api/settings/integrations', {
      method: 'PATCH',
      body: {
        spoolman: {
          enabled: true,
          url: input.url,
          ...(clearAuthorization.value
            ? { authorization: null }
            : input.authorization
              ? { authorization: input.authorization }
              : {}),
        },
        bambubuddy: {
          enabled: settings.value.bambubuddy.enabled,
          url: settings.value.bambubuddy.url,
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
