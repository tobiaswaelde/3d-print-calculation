<template>
  <UModal
    v-model:open="open"
    :title="`${value ? t('common.edit') : t('common.create')} · ${t('nav.customers')}`"
    :dismissible="!saving"
    scrollable
    :ui="{ content: 'sm:max-w-3xl' }"
  >
    <template #body>
      <UAlert v-if="error" class="mb-4" color="error" :description="error" />
      <UForm
        id="customer-form"
        :schema="customerSchema"
        :state="form"
        class="grid gap-4 md:grid-cols-2"
        @submit="save"
      >
        <UFormField name="name" :label="t('master.name')" required>
          <UInput v-model="form.name" class="w-full" icon="i-tabler-tag" autofocus />
        </UFormField>
        <UFormField name="email" :label="t('master.email')">
          <UInput v-model="form.email" class="w-full" type="email" icon="i-tabler-mail" />
        </UFormField>
        <UFormField name="excludeFromDashboard" class="md:col-span-2">
          <UCheckbox
            v-model="form.excludeFromDashboard"
            :label="t('master.excludeFromDashboard')"
            :description="t('master.excludeFromDashboardDescription')"
          />
        </UFormField>
        <UFormField name="note" :label="t('master.note')" class="md:col-span-2">
          <UTextarea v-model="form.note" class="w-full" icon="i-tabler-notes" />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          type="button"
          color="neutral"
          variant="outline"
          :disabled="saving"
          :label="t('common.cancel')"
          @click="open = false"
        />
        <UButton
          type="submit"
          form="customer-form"
          icon="i-tabler-device-floppy"
          :loading="saving"
          :label="t('common.save')"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { customerSchema } from '#shared/schemas/master-data';
import type { CustomerDto } from '#shared/types/master-data';

const props = defineProps<{ value?: CustomerDto | null }>();
const emit = defineEmits<{ saved: [customer: CustomerDto] }>();
const open = defineModel<boolean>('open', { default: false });
const { t } = useI18n();
const saving = ref(false);
const error = ref('');
const form = reactive({ name: '', email: '', excludeFromDashboard: false, note: '' });

function reset() {
  Object.assign(form, {
    name: props.value?.name ?? '',
    email: props.value?.email ?? '',
    excludeFromDashboard: props.value?.excludeFromDashboard ?? false,
    note: props.value?.note ?? '',
  });
  error.value = '';
}

async function save() {
  saving.value = true;
  error.value = '';
  try {
    const customer = await $fetch<CustomerDto>(
      props.value ? `/api/customers/${props.value.id}` : '/api/customers',
      {
        method: props.value ? 'PATCH' : 'POST',
        body: form,
      },
    );
    open.value = false;
    emit('saved', customer);
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    saving.value = false;
  }
}

watch(open, (isOpen) => {
  if (isOpen) reset();
});
</script>
