import type { SessionUser } from '#shared/types/auth';

export function useAuth() {
  const user = useState<SessionUser | null>('auth-user', () => null);

  async function refresh() {
    const response = await $fetch<{ user: SessionUser | null }>('/api/auth/session');
    user.value = response.user;
    return user.value;
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' });
    user.value = null;
    await navigateTo('/login');
  }

  async function updateLocale(locale: string) {
    if (!user.value) return;
    const response = await $fetch<{ user: SessionUser }>('/api/auth/preferences', {
      method: 'PATCH',
      body: { locale },
    });
    user.value = response.user;
  }

  return { user, refresh, logout, updateLocale };
}
