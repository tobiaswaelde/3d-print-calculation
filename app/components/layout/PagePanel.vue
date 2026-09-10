<template>
  <UDashboardPanel :id="panelId" class="min-h-0">
    <template #header>
      <UDashboardNavbar :title="title">
        <template #right>
          <slot name="actions" />
          <LayoutAppUserMenu />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="min-h-0 overflow-y-auto p-4 sm:p-6">
        <slot />
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
defineProps<{ panelId: string; title: string }>();
</script>
