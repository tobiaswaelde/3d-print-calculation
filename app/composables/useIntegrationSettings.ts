import type { IntegrationSettingsDto } from '#shared/schemas/integration-settings';

export function useIntegrationSettings() {
  const settings = useState<IntegrationSettingsDto | null>('integration-settings', () => null);
  const loaded = useState('integration-settings-loaded', () => false);

  async function load(force = false) {
    if (!loaded.value || force) {
      settings.value = await $fetch<IntegrationSettingsDto>('/api/settings/integrations');
      loaded.value = true;
    }
    return settings.value!;
  }

  function set(value: IntegrationSettingsDto) {
    settings.value = value;
    loaded.value = true;
  }

  return {
    settings: readonly(settings),
    loaded: readonly(loaded),
    spoolmanEnabled: computed(() => settings.value?.spoolman.enabled ?? false),
    bambubuddyEnabled: computed(() => settings.value?.bambubuddy.enabled ?? false),
    load,
    set,
  };
}
