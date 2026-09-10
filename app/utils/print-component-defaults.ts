import type { MasterDataListItem } from '#shared/types/master-data';

export interface PrintComponentDefaults {
  buildPlateId: string;
  hotendIds: string[];
  otherComponentIds: string[];
}

export function getPrintComponentDefaults(
  components: MasterDataListItem[],
  printerId: string,
): PrintComponentDefaults {
  const defaults = components.filter(
    (component) =>
      component.alwaysUsed === true &&
      Array.isArray(component.printerIds) &&
      component.printerIds.includes(printerId),
  );

  return {
    buildPlateId: defaults.find((component) => component.type === 'BUILD_PLATE')?.id ?? '',
    hotendIds: defaults.filter((component) => component.type === 'HOTEND').map((component) => component.id),
    otherComponentIds: defaults
      .filter((component) => component.type === 'OTHER')
      .map((component) => component.id),
  };
}
