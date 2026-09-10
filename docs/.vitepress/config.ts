import { defineConfig, type DefaultTheme } from 'vitepress';

const repository = 'https://github.com/tobiaswaelde/3d-print-calculation';
const site = 'https://tobiaswaelde.github.io/3d-print-calculation/';

const deSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Erste Schritte',
    items: [
      { text: 'Überblick', link: '/getting-started/' },
      { text: 'Einrichtung und Zugang', link: '/guide/setup' },
    ],
  },
  {
    text: 'Benutzerhandbuch',
    items: [
      { text: 'Stammdaten', link: '/guide/master-data' },
      { text: 'Druckkosten berechnen', link: '/guide/print-workflow' },
    ],
  },
  {
    text: 'Betrieb',
    items: [
      { text: 'Deployment', link: '/operations/deployment' },
      { text: 'Backup und Restore', link: '/operations/backup-restore' },
      { text: 'Upgrade und Rollback', link: '/operations/upgrades' },
      { text: 'Fehlerbehebung', link: '/operations/troubleshooting' },
    ],
  },
  {
    text: 'Referenz',
    items: [
      { text: 'Architektur', link: '/reference/architecture' },
      { text: 'Datenmodell', link: '/reference/data-model' },
      { text: 'Berechnung', link: '/reference/calculation' },
      { text: 'HTTP API', link: '/reference/api' },
    ],
  },
  {
    text: 'Entwicklung',
    items: [
      { text: 'Mitwirken', link: '/development/contributing' },
      { text: 'Veröffentlichung', link: '/development/publication' },
    ],
  },
];

const enSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Getting started',
    items: [
      { text: 'Overview', link: '/en/getting-started/' },
      { text: 'Setup and access', link: '/en/guide/setup' },
    ],
  },
  {
    text: 'User guide',
    items: [
      { text: 'Master data', link: '/en/guide/master-data' },
      { text: 'Calculate print costs', link: '/en/guide/print-workflow' },
    ],
  },
  {
    text: 'Operations',
    items: [
      { text: 'Deployment', link: '/en/operations/deployment' },
      { text: 'Backup and restore', link: '/en/operations/backup-restore' },
      { text: 'Upgrade and rollback', link: '/en/operations/upgrades' },
      { text: 'Troubleshooting', link: '/en/operations/troubleshooting' },
    ],
  },
  {
    text: 'Reference',
    items: [
      { text: 'Architecture', link: '/en/reference/architecture' },
      { text: 'Data model', link: '/en/reference/data-model' },
      { text: 'Calculation', link: '/en/reference/calculation' },
      { text: 'HTTP API', link: '/en/reference/api' },
    ],
  },
  {
    text: 'Development',
    items: [
      { text: 'Contributing', link: '/en/development/contributing' },
      { text: 'Publishing', link: '/en/development/publication' },
    ],
  },
];

export default defineConfig({
  title: '3D Print Costing',
  description: 'Deterministische Kostenberechnung für selbst gehostete 3D-Druck-Workflows.',
  lang: 'de-DE',
  base: '/3d-print-calculation/',
  cleanUrls: true,
  lastUpdated: true,
  sitemap: { hostname: site },
  head: [
    ['meta', { name: 'theme-color', content: '#2563eb' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: '3D Print Costing' }],
    [
      'meta',
      { property: 'og:description', content: 'Bilingual user, operator, and developer documentation.' },
    ],
    ['meta', { property: 'og:image', content: `${site}logo.svg` }],
  ],
  transformHead({ pageData }) {
    const relative = pageData.relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '');
    return [['link', { rel: 'canonical', href: new URL(relative, site).href }]];
  },
  locales: {
    root: {
      label: 'Deutsch',
      lang: 'de-DE',
      description: 'Dokumentation für Anwender, Betrieb und Entwicklung.',
      themeConfig: {
        nav: [
          { text: 'Handbuch', link: '/getting-started/' },
          { text: 'Betrieb', link: '/operations/deployment' },
          { text: 'Referenz', link: '/reference/architecture' },
          { text: 'GitHub', link: repository },
        ],
        sidebar: deSidebar,
        outline: { label: 'Auf dieser Seite' },
        notFound: {
          title: 'Seite nicht gefunden',
          quote: 'Die angeforderte Dokumentationsseite existiert nicht oder wurde verschoben.',
          linkLabel: 'Zur deutschen Startseite',
          linkText: 'Startseite',
        },
        docFooter: { prev: 'Zurück', next: 'Weiter' },
        lastUpdated: { text: 'Zuletzt aktualisiert' },
        editLink: { pattern: `${repository}/edit/main/docs/:path`, text: 'Diese Seite bearbeiten' },
      },
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      description: 'Documentation for users, operators, and contributors.',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/en/getting-started/' },
          { text: 'Operations', link: '/en/operations/deployment' },
          { text: 'Reference', link: '/en/reference/architecture' },
          { text: 'GitHub', link: repository },
        ],
        sidebar: enSidebar,
        outline: { label: 'On this page' },
        notFound: {
          title: 'Page not found',
          quote: 'The requested documentation page does not exist or has moved.',
          linkLabel: 'Go to the English home page',
          linkText: 'Home',
        },
        editLink: { pattern: `${repository}/edit/main/docs/:path`, text: 'Edit this page' },
      },
    },
  },
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: '3D Print Costing',
    search: { provider: 'local' },
    socialLinks: [{ icon: 'github', link: repository }],
  },
});
