<template>
  <UDashboardSidebar id="navigation" collapsible resizable class="bg-elevated/25">
    <template #header="{ collapsed }">
      <UButton
        to="/"
        color="neutral"
        variant="ghost"
        icon="i-tabler-cube"
        :label="collapsed ? undefined : t('app.name')"
        :square="collapsed"
        block
        class="font-mono font-semibold"
      />
    </template>

    <template #default="{ collapsed }">
      <UNavigationMenu orientation="vertical" :collapsed="collapsed" tooltip highlight :items="navigation" />
    </template>

    <template #footer="{ collapsed }">
      <div class="flex w-full items-center gap-1" :class="collapsed && 'flex-col'">
        <UButton
          to="https://github.com/tobiaswaelde/3d-print-calculation"
          target="_blank"
          color="neutral"
          variant="ghost"
          icon="i-simple-icons-github"
          :label="collapsed ? undefined : 'GitHub'"
          :square="collapsed"
          :aria-label="t('sidebar.github')"
        />
        <span v-if="!collapsed" class="ml-auto font-mono text-xs text-muted">v{{ appVersion }}</span>
        <UDashboardSidebarCollapse
          :aria-label="t(collapsed ? 'sidebar.expand' : 'sidebar.collapse')"
          :class="!collapsed && 'ml-1'"
        />
      </div>
    </template>
  </UDashboardSidebar>
</template>

<script setup lang="ts">
const { t } = useI18n();
const appVersion = useRuntimeConfig().public.appVersion;
const navigation = computed(() => [
  { label: t('nav.sections.workspace'), type: 'label' as const },
  { label: t('nav.dashboard'), icon: 'i-tabler-layout-dashboard', to: '/' },
  { label: t('nav.prints'), icon: 'i-tabler-printer', to: '/prints' },
  { label: t('nav.sections.masterData'), type: 'label' as const },
  { label: t('nav.customers'), icon: 'i-tabler-users', to: '/customers' },
  { label: t('nav.printers'), icon: 'i-tabler-printer', to: '/printers' },
  { label: t('nav.components'), icon: 'i-tabler-components', to: '/components' },
  { label: t('nav.filaments'), icon: 'i-tabler-spool', to: '/filaments' },
  { label: t('nav.sections.system'), type: 'label' as const },
  { label: t('nav.settings'), icon: 'i-tabler-settings', to: '/settings' },
]);
</script>
