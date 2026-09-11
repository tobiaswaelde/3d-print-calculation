export default defineNuxtRouteMiddleware(async () => {
  const { spoolmanEnabled, load } = useIntegrationSettings();
  await load(true);
  if (!spoolmanEnabled.value) return navigateTo('/settings/features');
});
