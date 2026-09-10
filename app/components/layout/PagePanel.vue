<template>
  <UDashboardPanel :id="panelId" class="min-h-0" :ui="{ body: 'min-h-0 gap-0! overflow-hidden p-0!' }">
    <template #header>
      <UDashboardNavbar :title="title">
        <LayoutGlobalSearch />
        <template #right>
          <slot name="actions" />
          <LayoutAppUserMenu />
        </template>
      </UDashboardNavbar>
      <slot name="toolbar" />
    </template>
    <template #body>
      <div v-if="table" class="flex min-h-0 flex-1 flex-col">
        <slot />
      </div>
      <div v-else class="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <slot />
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ panelId: string; title: string; table?: boolean }>(), {
  table: false,
});
</script>
