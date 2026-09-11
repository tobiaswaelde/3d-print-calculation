<template>
  <dl v-if="value.salesValue !== null" class="grid gap-3 rounded-lg border border-default p-4 sm:grid-cols-2">
    <div>
      <dt class="text-sm text-muted">{{ t('sales.value') }}</dt>
      <dd>
        {{ money(value.salesValue, currency) }} · {{ money(value.salesPerUnit!, currency) }}
        {{ t('sales.perUnit') }}
      </dd>
    </div>
    <div>
      <dt class="text-sm text-muted">{{ t('sales.plannedMargin') }}</dt>
      <dd :class="Number(value.plannedMargin) < 0 && 'text-error'">
        {{ money(value.plannedMargin!, currency) }} · {{ money(value.plannedMarginPerUnit!, currency) }}
        {{ t('sales.perUnit') }}
      </dd>
    </div>
    <div v-if="value.realizedRevenue !== null">
      <dt class="text-sm text-muted">{{ t('sales.realizedRevenue') }}</dt>
      <dd>{{ money(value.realizedRevenue, currency) }}</dd>
    </div>
    <div v-if="value.realizedMargin !== null">
      <dt class="text-sm text-muted">{{ t('sales.realizedMargin') }}</dt>
      <dd :class="Number(value.realizedMargin) < 0 && 'text-error'">
        {{ money(value.realizedMargin, currency) }} · {{ money(value.realizedMarginPerUnit!, currency) }}
        {{ t('sales.perUnit') }}
      </dd>
    </div>
  </dl>
</template>
<script setup lang="ts">
import type { PrintFinancials } from '#shared/domain/print-financials';
defineProps<{ value: PrintFinancials; currency: string }>();
const { t } = useI18n();
const { money } = useFormatting();
</script>
