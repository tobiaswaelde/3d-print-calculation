import type { ApplicationSettingsDto } from '#shared/types/settings';

export function useSpoolManagement() {
  const enabled = useState('spool-management-enabled', () => true);
  const loaded = useState('spool-management-loaded', () => false);

  async function load(force = false) {
    if (loaded.value && !force) return enabled.value;
    const settings = await $fetch<ApplicationSettingsDto>('/api/settings');
    enabled.value = settings.spoolManagementEnabled;
    loaded.value = true;
    return enabled.value;
  }

  return { enabled: readonly(enabled), load, setEnabled: (value: boolean) => (enabled.value = value) };
}
