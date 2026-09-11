import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import PrintForm from '../../app/components/modules/prints/create/Form.vue';

registerEndpoint('/api/settings', () => ({
  currency: 'EUR',
  defaultLocale: 'de-DE',
  electricityPricePerKwh: '0.32',
  calculationVersion: '3',
  spoolManagementEnabled: false,
}));
registerEndpoint('/api/settings/features', () => ({
  printSeriesEnabled: true,
  spoolManagementEnabled: false,
}));
for (const resource of ['customers', 'printers', 'components', 'filaments'])
  registerEndpoint(`/api/${resource}`, () => ({ items: [], total: 0, page: 1, pageSize: 100 }));

it('hides spool selection in the print form when spool management is disabled', async () => {
  const wrapper = await mountSuspended(PrintForm, { props: { formId: 'optional-spool-test' } });
  await vi.waitFor(() => expect((wrapper.vm as unknown as { loading: boolean }).loading).toBe(false));
  (wrapper.vm as unknown as { currentStep: number }).currentStep = 2;
  await wrapper.vm.$nextTick();
  await flushPromises();

  expect(wrapper.text()).toContain('Filamente');
  expect(wrapper.text()).not.toContain('Spulen');
});

it('shows explanatory text below its corresponding print input', async () => {
  const wrapper = await mountSuspended(PrintForm, { props: { formId: 'form-help-test' } });
  await vi.waitFor(() => expect((wrapper.vm as unknown as { loading: boolean }).loading).toBe(false));

  const salesInput = wrapper.get('input[name="salesValue"]');
  const salesHelp = wrapper
    .findAll('[data-slot="help"]')
    .find((element) => element.text().includes('Optionaler Gesamtwert des Drucklaufs'));

  expect(salesHelp).toBeDefined();
  expect(
    salesInput.element.compareDocumentPosition(salesHelp!.element) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
});
