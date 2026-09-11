<template>
  <section class="space-y-5">
    <UForm :schema="integrationSettingsSchema" :state="form" class="space-y-5" @submit="emit('submit')">
      <UCard id="integration-spoolman">
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-start gap-3">
              <UIcon name="i-tabler-packages" class="mt-0.5 size-5 text-primary" />
              <div>
                <h2 class="font-semibold">{{ t('integration.spoolman') }}</h2>
                <p class="text-sm text-muted">
                  {{
                    t(
                      spoolManagementEnabled
                        ? 'integration.spoolmanConfigDescription'
                        : 'integration.spoolManagementRequired',
                    )
                  }}
                </p>
              </div>
            </div>
            <div class="flex flex-wrap items-center justify-end gap-2">
              <UButton
                to="https://tobiaswaelde.github.io/ezprint/guide/integrations#spoolman-import-and-ownership"
                target="_blank"
                color="neutral"
                variant="outline"
                icon="i-tabler-book-2"
                :label="t('sidebar.docs')"
              />
              <USwitch
                v-model="form.spoolman.enabled"
                :disabled="!spoolManagementEnabled"
                :label="t('integration.enabled')"
              />
            </div>
          </div>
        </template>
      </UCard>

      <UCard id="integration-bambubuddy">
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-start gap-3">
              <UIcon name="i-tabler-printer" class="mt-0.5 size-5 text-primary" />
              <div>
                <h2 class="font-semibold">{{ t('integration.bambu') }}</h2>
                <p class="text-sm text-muted">{{ t('integration.bambuConfigDescription') }}</p>
              </div>
            </div>
            <div class="flex flex-wrap items-center justify-end gap-2">
              <UButton
                to="https://tobiaswaelde.github.io/ezprint/guide/integrations#bambuddy-printer-and-print-links"
                target="_blank"
                color="neutral"
                variant="outline"
                icon="i-tabler-book-2"
                :label="t('sidebar.docs')"
              />
              <USwitch v-model="form.bambubuddy.enabled" :label="t('integration.enabled')" />
            </div>
          </div>
        </template>
      </UCard>
    </UForm>
  </section>
</template>

<script setup lang="ts">
import { integrationSettingsSchema, type IntegrationSettingsDto } from '#shared/schemas/integration-settings';

const { t } = useI18n();
const emit = defineEmits<{ loaded: []; submit: [] }>();
const { enabled: spoolManagementEnabled } = useSpoolManagement();
const { load, set } = useIntegrationSettings();
const form = reactive({
  spoolman: { enabled: false, url: '' },
  bambubuddy: { enabled: false, url: '' },
});

function applySettings(value: IntegrationSettingsDto) {
  form.spoolman.enabled = value.spoolman.enabled;
  form.spoolman.url = value.spoolman.url;
  form.bambubuddy.enabled = value.bambubuddy.enabled;
  form.bambubuddy.url = value.bambubuddy.url;
  set(value);
}

onMounted(async () => {
  applySettings(await load(true));
  emit('loaded');
});

function input(spoolManagementEnabledValue = spoolManagementEnabled.value) {
  return {
    spoolman: {
      enabled: spoolManagementEnabledValue && form.spoolman.enabled,
      url: form.spoolman.url,
    },
    bambubuddy: {
      enabled: form.bambubuddy.enabled,
      url: form.bambubuddy.url,
    },
  };
}

function validate(spoolManagementEnabledValue: boolean) {
  integrationSettingsSchema.parse(input(spoolManagementEnabledValue));
}

async function save(spoolManagementEnabledValue: boolean) {
  const value = await $fetch<IntegrationSettingsDto>('/api/settings/integrations', {
    method: 'PATCH',
    body: integrationSettingsSchema.parse(input(spoolManagementEnabledValue)),
  });
  applySettings(value);
}

defineExpose({ save, validate });
</script>
