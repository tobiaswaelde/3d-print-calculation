<template>
  <LayoutPagePanel panel-id="settings" :title="t('nav.settings')">
    <template #toolbar>
      <UDashboardToolbar>
        <UNavigationMenu highlight class="-mx-1 flex-1" :items="navigation" />
      </UDashboardToolbar>
    </template>

    <NuxtPage />
  </LayoutPagePanel>
</template>

<script setup lang="ts">
const { t } = useI18n();

const navigation = computed(() => [
  [
    {
      label: t('settings.general'),
      icon: 'i-tabler-adjustments-horizontal',
      to: '/settings',
      exact: true,
    },
    {
      label: t('settings.calculation'),
      icon: 'i-tabler-calculator',
      to: '/settings/calculation',
    },
    {
      label: t('settings.integrations'),
      icon: 'i-tabler-plug-connected',
      to: '/settings/integrations',
    },
  ],
]);
</script>
