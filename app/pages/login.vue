<template>
  <div>
    <h1 class="text-2xl font-semibold">{{ t('auth.login') }}</h1>
    <UForm :schema="loginSchema" :state="form" class="mt-6 space-y-4" @submit="submit">
      <UFormField :label="t('auth.email')" name="email" required>
        <UInput v-model="form.email" class="w-full" type="email" autocomplete="email" icon="i-tabler-mail" />
      </UFormField>
      <UFormField :label="t('auth.password')" name="password" required>
        <UInput
          v-model="form.password"
          class="w-full"
          type="password"
          autocomplete="current-password"
          icon="i-tabler-lock"
        />
      </UFormField>
      <UAlert v-if="error" color="error" :description="t('auth.invalid')" />
      <UButton type="submit" block :loading="pending" :label="t('auth.login')" />
    </UForm>
  </div>
</template>

<script setup lang="ts">
import { loginSchema } from '#shared/schemas/auth';

definePageMeta({ layout: 'auth' });
const { t, setLocale } = useI18n();
const route = useRoute();
const { user } = useAuth();
const form = reactive({ email: '', password: '' });
const pending = ref(false);
const error = ref(false);

async function submit() {
  pending.value = true;
  error.value = false;
  try {
    const response = await $fetch<{ user: typeof user.value }>('/api/auth/login', {
      method: 'POST',
      body: form,
    });
    user.value = response.user;
    if (response.user?.locale) await setLocale(response.user.locale);
    await navigateTo(typeof route.query.redirect === 'string' ? route.query.redirect : '/');
  } catch {
    error.value = true;
  } finally {
    pending.value = false;
  }
}
</script>
