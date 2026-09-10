export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return;

  const publicRoutes = new Set(['/setup', '/login']);
  const { initialized } = await $fetch<{ initialized: boolean }>('/api/auth/setup-status');

  if (!initialized && to.path !== '/setup') return navigateTo('/setup');
  if (initialized && to.path === '/setup') return navigateTo('/login');

  const { user, refresh } = useAuth();
  if (!publicRoutes.has(to.path) && !user.value) {
    await refresh().catch(() => null);
    if (!user.value) return navigateTo({ path: '/login', query: { redirect: to.fullPath } });
  }

  if (user.value) {
    const { locale } = useI18n();
    locale.value = user.value.locale;
  }

  if (to.path === '/login' && user.value) return navigateTo('/');
});
