export default defineNuxtRouteMiddleware(async () => {
  const { load } = useFeatures();
  if (!(await load()).printSeriesEnabled) return navigateTo('/prints');
});
