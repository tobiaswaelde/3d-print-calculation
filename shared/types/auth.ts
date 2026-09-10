export type SupportedLocale = 'de-DE' | 'en-US';

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  locale: SupportedLocale;
}
