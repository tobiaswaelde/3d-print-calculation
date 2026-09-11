export default defineNuxtRouteMiddleware(async () => {
  const { load } = useSpoolManagement();
  if (!(await load())) return navigateTo('/filaments');
});
