import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime';
import { expect, it, vi } from 'vitest';
import BambuBuddy from '../../app/components/modules/settings/BambuBuddy.vue';

let spoolRequests = 0;

registerEndpoint('/api/settings', () => ({
  currency: 'EUR',
  defaultLocale: 'de-DE',
  electricityPricePerKwh: '0.32',
  calculationVersion: '3',
  spoolManagementEnabled: false,
}));
registerEndpoint('/api/spools', () => {
  spoolRequests += 1;
  return { items: [], total: 0, page: 1, pageSize: 100 };
});
registerEndpoint('/api/integrations/bambubuddy', () => ({
  configured: true,
  version: 'test-1',
  error: null,
  remotePrinters: [{ id: 7, name: 'Remote X1C' }],
  printers: [],
  link: null,
}));

it('loads Bambuddy printers without requesting disabled spool management', async () => {
  const wrapper = await mountSuspended(BambuBuddy);

  await vi.waitFor(() => expect(wrapper.text()).toContain('test-1'));

  expect(spoolRequests).toBe(0);
  expect(wrapper.text()).not.toContain('Anfrage fehlgeschlagen');
  expect(wrapper.text()).toContain('Remote X1C');
  expect(wrapper.text()).toContain('#7');
});
