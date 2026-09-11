export default defineNuxtRouteMiddleware(async () => {
  const { load } = useSpoolManagement();
  if (!(await load(true))) return navigateTo('/filaments');
});
