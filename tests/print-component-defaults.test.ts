import { describe, expect, it } from 'vitest';
import { getPrintComponentDefaults } from '../app/utils/print-component-defaults';
import type { MasterDataListItem } from '../shared/types/master-data';

describe('print component defaults', () => {
  it('groups always-used components compatible with the selected printer', () => {
    const components: MasterDataListItem[] = [
      {
        id: 'plate',
        name: 'Plate',
        type: 'BUILD_PLATE',
        alwaysUsed: true,
        printerIds: ['printer'],
        archivedAt: null,
      },
      {
        id: 'hotend',
        name: 'Hotend',
        type: 'HOTEND',
        alwaysUsed: true,
        printerIds: ['printer'],
        archivedAt: null,
      },
      {
        id: 'filter',
        name: 'Filter',
        type: 'OTHER',
        alwaysUsed: true,
        printerIds: ['printer'],
        archivedAt: null,
      },
      {
        id: 'optional',
        name: 'Optional',
        type: 'OTHER',
        alwaysUsed: false,
        printerIds: ['printer'],
        archivedAt: null,
      },
      {
        id: 'foreign',
        name: 'Foreign',
        type: 'OTHER',
        alwaysUsed: true,
        printerIds: ['other'],
        archivedAt: null,
      },
    ];

    expect(getPrintComponentDefaults(components, 'printer')).toEqual({
      buildPlateId: 'plate',
      hotendIds: ['hotend'],
      otherComponentIds: ['filter'],
    });
  });
});
