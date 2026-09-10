<template>
  <UDropdownMenu :items="items" :content="{ align: 'end', sideOffset: 8 }">
    <UButton color="neutral" variant="ghost" class="max-w-56 px-2" :aria-label="t('user.openMenu')">
      <UAvatar :text="initials" color="primary" size="sm" />
      <span class="hidden min-w-0 text-left sm:block">
        <span class="block truncate text-sm font-medium text-highlighted">{{ user?.displayName }}</span>
        <span class="block truncate text-xs text-muted">{{ user?.email }}</span>
      </span>
      <UIcon name="i-lucide-chevrons-up-down" class="hidden size-4 text-muted sm:block" />
    </UButton>
  </UDropdownMenu>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';

const { t, locales: localeDefinitions, setLocale } = useI18n();
const colorMode = useColorMode();
const { user, logout, updateLocale } = useAuth();

const themes = ['light', 'dark', 'system'] as const;
const locales = computed(() =>
  localeDefinitions.value.map((entry) =>
    typeof entry === 'string'
      ? { code: entry, name: entry }
      : { code: entry.code, name: entry.name ?? entry.code },
  ),
);
const initials = computed(() =>
  (user.value?.displayName ?? '?')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
);
const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: t('common.language'),
      icon: 'i-lucide-languages',
      children: locales.value.map((option) => ({
        label: option.name,
        icon: user.value?.locale === option.code ? 'i-lucide-check' : undefined,
        onSelect: () => setLanguage(option.code),
      })),
    },
    {
      label: t('common.theme'),
      icon: 'i-lucide-sun-moon',
      children: themes.map((theme) => ({
        label: t(`common.${theme}`),
        icon: colorMode.preference === theme ? 'i-lucide-check' : undefined,
        onSelect: () => {
          colorMode.preference = theme;
        },
      })),
    },
  ],
  [
    {
      label: t('auth.logout'),
      icon: 'i-lucide-log-out',
      color: 'error',
      onSelect: () => logout(),
    },
  ],
]);

async function setLanguage(value: string) {
  if (value !== 'de-DE' && value !== 'en-US') return;
  await setLocale(value);
  localStorage.setItem('print-cost-locale', value);
  await updateLocale(value);
}
</script>
