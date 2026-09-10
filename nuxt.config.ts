import packageJson from './package.json' with { type: 'json' };

export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  ssr: false,
  modules: ['@nuxt/ui', '@nuxtjs/i18n', '@pinia/nuxt', '@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  nitro: {
    preset: 'node-server',
    externals: { external: ['better-sqlite3'] },
  },
  runtimeConfig: {
    sessionTtlHours: 168,
    public: { siteUrl: 'http://localhost:3000', appVersion: packageJson.version },
  },
  i18n: {
    langDir: '../app/i18n/locales',
    defaultLocale: 'de-DE',
    strategy: 'no_prefix',
    detectBrowserLanguage: false,
    locales: [
      { code: 'de-DE', name: 'Deutsch', file: 'de-DE.json' },
      { code: 'en-US', name: 'English', file: 'en-US.json' },
    ],
  },
  colorMode: {
    preference: 'system',
    fallback: 'light',
    storageKey: 'print-cost-color-mode',
  },
  typescript: { strict: true, typeCheck: true },
});
