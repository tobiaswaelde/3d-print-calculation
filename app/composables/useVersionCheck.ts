interface LatestVersionResponse {
  latest: string | null;
}

export function useVersionCheck() {
  const current = useRuntimeConfig().public.appVersion;
  const latest = useState<string | null>('latest-app-version', () => null);
  const loaded = useState('latest-app-version-loaded', () => false);

  async function load() {
    if (loaded.value) return;
    try {
      const response = await $fetch<LatestVersionResponse>('/api/version-latest');
      latest.value = response.latest;
    } catch {
      latest.value = null;
    } finally {
      loaded.value = true;
    }
  }

  const updateAvailable = computed(() => Boolean(latest.value) && compareSemver(latest.value!, current) > 0);

  return { current, latest, load, updateAvailable };
}
