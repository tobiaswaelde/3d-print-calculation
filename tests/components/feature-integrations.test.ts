import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime';
import { expect, it, vi } from 'vitest';
import Integrations from '../../app/components/modules/settings/Integrations.vue';

registerEndpoint('/api/settings/integrations', () => ({
  spoolman: {
    enabled: false,
    url: 'http://spoolman:7912',
    authorizationConfigured: false,
  },
  bambubuddy: {
    enabled: false,
    url: 'http://bambubuddy:8000',
    apiKeyConfigured: false,
  },
}));

it('renders integrations as feature cards with direct documentation links', async () => {
  const wrapper = await mountSuspended(Integrations);
  await vi.waitFor(() => expect(wrapper.find('#integration-spoolman').exists()).toBe(true));

  expect(wrapper.findAll('h2').map((heading) => heading.text())).toEqual([
    'Spoolman-Anbindung',
    'Bambuddy-Anbindung',
  ]);
  expect(wrapper.find('#integration-spoolman a').attributes('href')).toBe(
    'https://tobiaswaelde.github.io/ezprint/guide/integrations#spoolman-import-and-ownership',
  );
  expect(wrapper.find('#integration-bambubuddy a').attributes('href')).toBe(
    'https://tobiaswaelde.github.io/ezprint/guide/integrations#bambuddy-printer-and-print-links',
  );
  expect(wrapper.find('#integration-spoolman [data-slot="body"]').exists()).toBe(false);
  expect(wrapper.find('#integration-bambubuddy [data-slot="body"]').exists()).toBe(false);
});
