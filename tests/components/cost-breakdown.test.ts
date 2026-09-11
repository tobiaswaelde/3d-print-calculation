import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import CostBreakdown from '../../app/components/common/CostBreakdown.vue';

describe('CostBreakdown', () => {
  it('renders every authoritative cost category and the total', async () => {
    const wrapper = await mountSuspended(CostBreakdown, {
      props: {
        currency: 'EUR',
        printerCost: '1',
        componentCost: '2',
        filamentCost: '3',
        electricityCost: '4',
        totalCost: '10',
        costPerUnit: '2.5',
      },
    });
    expect(wrapper.text()).toContain('Drucker');
    expect(wrapper.text()).toContain('Komponenten');
    expect(wrapper.text()).toContain('Filament');
    expect(wrapper.text()).toContain('Strom');
    expect(wrapper.text()).toContain('Gesamtkosten');
    expect(wrapper.text()).toContain('Kosten pro Stück');
    expect(wrapper.text()).toContain('2,50');
  });
});
