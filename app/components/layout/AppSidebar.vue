<template>
  <UDashboardSidebar id="navigation" collapsible resizable class="bg-elevated/25">
    <template #header="{ collapsed }">
      <NuxtLink to="/" :aria-label="t('app.name')" class="font-display text-xl font-bold">
        <span class="text-primary">ez</span
        ><span v-if="!collapsed" class="tracking-tight text-highlighted">Print</span>
      </NuxtLink>
    </template>

    <template #default="{ collapsed }">
      <UNavigationMenu orientation="vertical" :collapsed="collapsed" tooltip highlight :items="navigation" />
    </template>

    <template #footer="{ collapsed }">
      <div class="flex w-full items-center gap-1" :class="collapsed && 'flex-col'">
        <UButton
          to="https://github.com/tobiaswaelde/ezprint"
          target="_blank"
          color="neutral"
          variant="ghost"
          icon="i-simple-icons-github"
          square
          :aria-label="t('sidebar.github')"
          :title="t('sidebar.github')"
        />
        <UButton
          to="https://tobiaswaelde.github.io/ezprint/"
          target="_blank"
          color="neutral"
          variant="ghost"
          icon="i-tabler-book-2"
          square
          :aria-label="t('sidebar.docs')"
          :title="t('sidebar.docs')"
        />
        <button
          v-if="!collapsed"
          type="button"
          class="ml-auto flex items-center gap-1.5 rounded-md px-1.5 py-1 font-mono text-xs text-muted transition-colors hover:bg-elevated hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
          :aria-label="t('changelog.open')"
          @click="changelogOpen = true"
        >
          v{{ appVersion }}
          <UBadge v-if="updateAvailable" color="neutral" variant="subtle" size="sm">
            <span data-update-indicator class="size-1.5 rounded-full bg-success" aria-hidden="true" />
            {{ t('changelog.update') }}
          </UBadge>
        </button>
      </div>
    </template>
  </UDashboardSidebar>
</template>

<script setup lang="ts">
const { t } = useI18n();
const appVersion = useRuntimeConfig().public.appVersion;
const changelogOpen = useState('changelog-open', () => false);
const { load: loadVersion, updateAvailable } = useVersionCheck();
const { enabled: spoolManagementEnabled } = useSpoolManagement();
const navigation = computed(() => [
  { label: t('nav.sections.workspace'), type: 'label' as const },
  { label: t('nav.dashboard'), icon: 'i-tabler-layout-dashboard', to: '/' },
  { label: t('nav.prints'), icon: 'i-tabler-printer', to: '/prints' },
  { label: t('nav.series'), icon: 'i-tabler-stack-2', to: '/series' },
  { label: t('nav.customers'), icon: 'i-tabler-users', to: '/customers' },
  { label: t('nav.sections.masterData'), type: 'label' as const },
  { label: t('nav.printers'), icon: 'i-tabler-printer', to: '/printers' },
  { label: t('nav.manufacturers'), icon: 'i-tabler-building-factory-2', to: '/manufacturers' },
  { label: t('nav.components'), icon: 'i-tabler-components', to: '/components' },
  ...(spoolManagementEnabled.value
    ? [{ label: t('nav.spools'), icon: 'i-tabler-qrcode', to: '/spools' }]
    : []),
  { label: t('nav.filaments'), icon: 'i-tabler-disc', to: '/filaments' },
  { label: t('nav.sections.system'), type: 'label' as const },
  { label: t('nav.settings'), icon: 'i-tabler-settings', to: '/settings' },
]);

onMounted(loadVersion);
</script>
