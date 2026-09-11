import type { FeatureSettings } from '#shared/schemas/features';

export function useFeatures() {
  const flags = useState<FeatureSettings>('feature-settings', () => ({
    printSeriesEnabled: false,
    spoolManagementEnabled: false,
  }));
  const loaded = useState('feature-settings-loaded', () => false);

  async function load(force = false) {
    if (!loaded.value || force) {
      flags.value = await $fetch<FeatureSettings>('/api/settings/features');
      loaded.value = true;
    }
    return flags.value;
  }

  function set(value: FeatureSettings) {
    flags.value = value;
    loaded.value = true;
  }

  return {
    flags: readonly(flags),
    loaded: readonly(loaded),
    load,
    printSeriesEnabled: computed(() => flags.value.printSeriesEnabled),
    set,
    spoolManagementEnabled: computed(() => flags.value.spoolManagementEnabled),
  };
}
