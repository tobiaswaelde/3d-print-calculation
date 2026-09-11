export interface ApplicationSettingsDto {
  currency: string;
  defaultLocale: 'de-DE' | 'en-US';
  electricityPricePerKwh: string;
  calculationVersion: string;
  spoolManagementEnabled: boolean;
}
