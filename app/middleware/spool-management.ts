export default defineNuxtRouteMiddleware(async () => {
  const { load } = useFeatures();
  if (!(await load()).spoolManagementEnabled) return navigateTo('/filaments');
});
