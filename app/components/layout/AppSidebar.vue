<template>
  <UDashboardSidebar id="navigation" collapsible resizable class="bg-elevated/25">
    <template #header="{ collapsed }">
      <UButton
        to="/"
        color="neutral"
        variant="ghost"
        icon="i-lucide-box"
        :label="collapsed ? undefined : t('app.name')"
        :square="collapsed"
        block
      />
    </template>

    <template #default="{ collapsed }">
      <UNavigationMenu orientation="vertical" :collapsed="collapsed" :items="navigation" />
    </template>

    <template #footer="{ collapsed }">
      <div class="flex w-full flex-col gap-1">
        <UPopover>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-languages"
            :label="collapsed ? undefined : t('common.language')"
            :square="collapsed"
            block
          />
          <template #content>
            <div class="flex min-w-40 flex-col p-2">
              <UButton
                v-for="option in locales"
                :key="option.code"
                color="neutral"
                variant="ghost"
                :label="option.name"
                @click="setLanguage(option.code)"
              />
            </div>
          </template>
        </UPopover>
        <UPopover>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-sun-moon"
            :label="collapsed ? undefined : t('common.theme')"
            :square="collapsed"
            block
          />
          <template #content>
            <div class="flex min-w-40 flex-col p-2">
              <UButton
                v-for="theme in themes"
                :key="theme"
                color="neutral"
                variant="ghost"
                :label="t(`common.${theme}`)"
                @click="colorMode.preference = theme"
              />
            </div>
          </template>
        </UPopover>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-log-out"
          :label="collapsed ? undefined : t('auth.logout')"
          :square="collapsed"
          block
          @click="logout"
        />
      </div>
    </template>
  </UDashboardSidebar>
</template>

<script setup lang="ts">
const { t, locale, locales: localeDefinitions } = useI18n();
const colorMode = useColorMode();
const { logout, updateLocale } = useAuth();

const themes = ['light', 'dark', 'system'] as const;
const locales = computed(() =>
  localeDefinitions.value.map((entry) =>
    typeof entry === 'string'
      ? { code: entry, name: entry }
      : { code: entry.code, name: entry.name ?? entry.code },
  ),
);
const navigation = computed(() => [
  { label: t('nav.dashboard'), icon: 'i-lucide-layout-dashboard', to: '/' },
  { label: t('nav.prints'), icon: 'i-lucide-printer', to: '/prints' },
  { label: t('nav.customers'), icon: 'i-lucide-users', to: '/customers' },
  { label: t('nav.printers'), icon: 'i-lucide-box', to: '/printers' },
  { label: t('nav.components'), icon: 'i-lucide-component', to: '/components' },
  { label: t('nav.filaments'), icon: 'i-lucide-circle-dot', to: '/filaments' },
  { label: t('nav.settings'), icon: 'i-lucide-settings', to: '/settings' },
]);

async function setLanguage(value: string) {
  if (value !== 'de-DE' && value !== 'en-US') return;
  locale.value = value;
  localStorage.setItem('print-cost-locale', value);
  await updateLocale(value);
}
</script>
