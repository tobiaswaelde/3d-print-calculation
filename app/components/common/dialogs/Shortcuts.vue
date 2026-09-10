<template>
  <UModal
    v-model:open="open"
    :title="t('shortcuts.title')"
    :description="t('shortcuts.description')"
    :ui="{ content: 'sm:max-w-2xl', body: 'pt-2' }"
  >
    <template #body>
      <UTable
        :data="shortcuts"
        :columns="[
          { id: 'scope', accessorKey: 'scope', header: t('shortcuts.scope') },
          { id: 'keys', accessorKey: 'keys', header: t('shortcuts.shortcut') },
          { id: 'action', accessorKey: 'action', header: t('shortcuts.action') },
        ]"
      >
        <template #keys-cell="{ row }">
          <div class="flex items-center gap-1">
            <template v-for="(key, index) in row.original.keys" :key="key">
              <span v-if="index" class="text-xs text-muted">+</span>
              <UKbd :value="key" />
            </template>
          </div>
        </template>
      </UTable>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const { t } = useI18n();
const open = useState('shortcuts-open', () => false);

const shortcuts = computed(() => [
  {
    scope: t('shortcuts.scopes.global'),
    keys: ['/'],
    action: t('shortcuts.actions.search'),
  },
  {
    scope: t('shortcuts.scopes.global'),
    keys: ['?'],
    action: t('shortcuts.actions.showShortcuts'),
  },
  {
    scope: t('shortcuts.scopes.table'),
    keys: ['shift', 'N'],
    action: t('shortcuts.actions.newItem'),
  },
]);

defineShortcuts({
  'shift_/': () => {
    open.value = !open.value;
  },
});
</script>
