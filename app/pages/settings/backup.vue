<template>
  <div class="mx-auto w-full max-w-3xl space-y-5">
    <UCard>
      <template #header>
        <div class="flex items-center gap-3">
          <UIcon name="i-tabler-database-export" class="size-5 text-primary" />
          <div>
            <h2 class="font-semibold">{{ t('backup.createTitle') }}</h2>
            <p class="text-sm text-muted">{{ t('backup.createDescription') }}</p>
          </div>
        </div>
      </template>

      <UAlert
        class="mb-4"
        color="warning"
        icon="i-tabler-lock-open"
        variant="subtle"
        :title="t('backup.sensitiveTitle')"
        :description="t('backup.sensitiveDescription')"
      />
      <div class="flex justify-end">
        <UButton icon="i-tabler-download" :label="t('backup.download')" @click="downloadBackup" />
      </div>
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center gap-3">
          <UIcon name="i-tabler-database-import" class="size-5 text-error" />
          <div>
            <h2 class="font-semibold">{{ t('backup.restoreTitle') }}</h2>
            <p class="text-sm text-muted">{{ t('backup.restoreDescription') }}</p>
          </div>
        </div>
      </template>

      <UAlert
        class="mb-4"
        color="error"
        icon="i-tabler-alert-triangle"
        variant="subtle"
        :title="t('backup.restoreWarningTitle')"
        :description="t('backup.restoreWarningDescription')"
      />
      <UFormField :label="t('backup.file')" required>
        <!-- eslint-disable vue/html-self-closing -->
        <input
          class="block w-full rounded-md border border-default bg-default px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-elevated file:px-3 file:py-1.5 file:text-sm file:font-medium"
          type="file"
          accept=".ezprint-backup,application/vnd.ezprint.backup"
          :aria-label="t('backup.file')"
          @change="selectFile"
        />
        <!-- eslint-enable vue/html-self-closing -->
      </UFormField>
      <div class="mt-4 flex justify-end">
        <UButton
          color="error"
          icon="i-tabler-database-import"
          :disabled="!selectedFile"
          :label="t('backup.restore')"
          @click="restoreDialogOpen = true"
        />
      </div>
    </UCard>

    <UAlert v-if="message" :color="messageColor" :description="message" />

    <UModal
      v-model:open="restoreDialogOpen"
      :dismissible="!restoring"
      :title="t('backup.confirmTitle')"
      :description="t('backup.confirmDescription', { name: selectedFile?.name ?? '' })"
    >
      <template #body>
        <UForm class="space-y-4" @submit="restoreBackup">
          <UFormField :label="t('auth.password')" required>
            <UInput
              v-model="password"
              class="w-full"
              type="password"
              autocomplete="current-password"
              icon="i-tabler-lock"
              :disabled="restoring"
              autofocus
            />
          </UFormField>
          <UAlert v-if="restoreError" color="error" :description="restoreError" />
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              :disabled="restoring"
              :label="t('common.cancel')"
              @click="restoreDialogOpen = false"
            />
            <UButton
              type="submit"
              color="error"
              icon="i-tabler-refresh"
              :loading="restoring"
              :disabled="!password"
              :label="t(restoring ? 'backup.restarting' : 'backup.confirmRestore')"
            />
          </div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { RestoreStatus } from '#shared/schemas/backups';

const { t, te } = useI18n();
const { user } = useAuth();
const selectedFile = ref<File | null>(null);
const restoreDialogOpen = ref(false);
const password = ref('');
const restoring = ref(false);
const restoreError = ref('');
const message = ref('');
const messageColor = ref<'success' | 'error'>('success');

function downloadBackup() {
  window.location.assign('/api/backups/download');
}

function selectFile(event: Event) {
  selectedFile.value = (event.target as HTMLInputElement).files?.[0] ?? null;
  message.value = '';
}

async function responseError(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    data?: { messageKey?: string };
    message?: string;
  } | null;
  const key = body?.data?.messageKey;
  return key && te(key) ? t(key) : body?.message || t('backup.restoreFailed');
}

function requestError(reason: unknown) {
  const body = reason as { data?: { data?: { messageKey?: string }; messageKey?: string } };
  const key = body.data?.data?.messageKey ?? body.data?.messageKey;
  return key && te(key) ? t(key) : reason instanceof Error ? reason.message : t('backup.restoreFailed');
}

async function waitForRestore(id: string) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      const result = await $fetch<{ status: RestoreStatus }>(`/api/backups/restores/${id}`);
      if (result.status === 'succeeded') {
        user.value = null;
        await navigateTo({ path: '/login', query: { restored: 'true' } });
        return;
      }
      if (result.status === 'rolled_back') {
        restoreError.value = t('backup.rolledBack');
        restoring.value = false;
        return;
      }
    } catch {
      // The application is expected to be temporarily unavailable while restarting.
    }
  }
  restoreError.value = t('backup.restartTimeout');
  restoring.value = false;
}

async function restoreBackup() {
  if (!selectedFile.value || restoring.value) return;
  restoring.value = true;
  restoreError.value = '';
  try {
    const authorization = await $fetch<{ token: string }>('/api/backups/restore-authorizations', {
      method: 'POST',
      body: { password: password.value },
    });
    const response = await fetch('/api/backups/restores', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: {
        'content-type': 'application/vnd.ezprint.backup',
        'x-ezprint-restore-token': authorization.token,
      },
      body: selectedFile.value,
    });
    if (!response.ok) throw new Error(await responseError(response));
    const result = (await response.json()) as { id: string };
    await waitForRestore(result.id);
  } catch (reason) {
    restoring.value = false;
    restoreError.value = requestError(reason);
  } finally {
    password.value = '';
  }
}
</script>
