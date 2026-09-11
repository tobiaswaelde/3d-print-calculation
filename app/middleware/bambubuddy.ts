export default defineNuxtRouteMiddleware(async () => {
  const { bambubuddyEnabled, load } = useIntegrationSettings();
  await load(true);
  if (!bambubuddyEnabled.value) return navigateTo('/settings/features');
});
