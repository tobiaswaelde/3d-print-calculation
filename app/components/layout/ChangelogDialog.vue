<template>
  <UModal v-model:open="open" :title="t('changelog.title')" scrollable :ui="{ content: 'sm:max-w-2xl' }">
    <template #body>
      <div class="space-y-6">
        <section v-for="release in releases" :key="release.version" class="space-y-3">
          <div class="flex items-center gap-2">
            <h2 class="font-mono text-base font-semibold">v{{ release.version }}</h2>
            <UBadge v-if="release.version === current" color="primary" variant="subtle" size="sm">
              {{ t('changelog.current') }}
            </UBadge>
          </div>

          <div v-for="group in release.groups" :key="group.title" class="space-y-2">
            <h3 class="text-sm font-semibold text-highlighted">
              {{ group.title || t('changelog.changes') }}
            </h3>
            <ul class="list-disc space-y-1 pl-5 text-sm text-muted">
              <li v-for="item in group.items" :key="item">{{ item }}</li>
            </ul>
          </div>
        </section>

        <UButton
          to="https://github.com/tobiaswaelde/3d-print-calculation/releases"
          target="_blank"
          color="neutral"
          variant="outline"
          icon="i-tabler-external-link"
          :label="t('changelog.viewAll')"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import changelog from '../../../CHANGELOG.md?raw';

interface ChangelogGroup {
  title: string | null;
  items: string[];
}

interface ChangelogRelease {
  version: string;
  groups: ChangelogGroup[];
}

const open = defineModel<boolean>('open', { default: false });
const { t } = useI18n();
const current = useRuntimeConfig().public.appVersion;

const releases = changelog.split('\n').reduce<ChangelogRelease[]>((result, line) => {
  const version = line.match(/^## (\d+\.\d+\.\d+)$/)?.[1];
  if (version) {
    result.push({ version, groups: [] });
    return result;
  }

  const release = result.at(-1);
  if (!release) return result;
  const title = line.match(/^### (.+)$/)?.[1];
  if (title) {
    release.groups.push({ title, items: [] });
    return result;
  }

  const item = line.match(/^- (.+)$/)?.[1];
  if (item) {
    if (!release.groups.length) release.groups.push({ title: null, items: [] });
    release.groups.at(-1)!.items.push(item);
  } else if (line.trim() && release.groups.length === 0) {
    release.groups.push({ title: null, items: [line.trim()] });
  }
  return result;
}, []);
</script>
