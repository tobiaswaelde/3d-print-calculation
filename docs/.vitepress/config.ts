import { defineConfig, type DefaultTheme } from 'vitepress';

const repository = 'https://github.com/tobiaswaelde/ezprint';
const site = 'https://tobiaswaelde.github.io/ezprint/';

const sidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Getting started',
    items: [
      { text: 'Overview', link: '/getting-started/' },
      { text: 'Setup and sign-in', link: '/guide/setup' },
      { text: 'Navigation and search', link: '/guide/navigation-search' },
    ],
  },
  {
    text: 'User guide',
    items: [
      { text: 'Dashboard', link: '/guide/dashboard' },
      { text: 'Master data overview', link: '/guide/master-data' },
      { text: 'Customers', link: '/guide/customers' },
      { text: 'Printers', link: '/guide/printers' },
      { text: 'Components', link: '/guide/components' },
      { text: 'Filaments', link: '/guide/filaments' },
      { text: 'Print workflow', link: '/guide/print-workflow' },
      { text: 'Settings', link: '/guide/settings' },
    ],
  },
  {
    text: 'Operations',
    items: [
      { text: 'Deployment', link: '/operations/deployment' },
      { text: 'Backup and restore', link: '/operations/backup-restore' },
      { text: 'Upgrade and rollback', link: '/operations/upgrades' },
      { text: 'Troubleshooting', link: '/operations/troubleshooting' },
    ],
  },
  {
    text: 'Reference',
    items: [
      { text: 'Architecture', link: '/reference/architecture' },
      { text: 'Data model', link: '/reference/data-model' },
      { text: 'Calculation rules', link: '/reference/calculation' },
      { text: 'HTTP API', link: '/reference/api' },
    ],
  },
  {
    text: 'Development',
    items: [
      { text: 'Contributing', link: '/development/contributing' },
      { text: 'Publishing documentation', link: '/development/publication' },
    ],
  },
];

export default defineConfig({
  title: 'ezPrint',
  description: 'User, operator, and developer documentation for ezPrint.',
  lang: 'en-US',
  base: '/ezprint/',
  cleanUrls: true,
  lastUpdated: true,
  sitemap: { hostname: site },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/ezprint/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#0e7490' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'ezPrint' }],
    [
      'meta',
      { property: 'og:description', content: 'US English user, operator, and developer documentation.' },
    ],
    ['meta', { property: 'og:image', content: `${site}logo.svg` }],
  ],
  transformHead({ pageData }) {
    const relative = pageData.relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '');
    return [['link', { rel: 'canonical', href: new URL(relative, site).href }]];
  },
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'ezPrint',
    nav: [
      { text: 'User guide', link: '/getting-started/' },
      { text: 'Operations', link: '/operations/deployment' },
      { text: 'Reference', link: '/reference/architecture' },
      { text: 'GitHub', link: repository },
    ],
    sidebar,
    outline: { label: 'On this page', level: [2, 3] },
    notFound: {
      title: 'Page not found',
      quote: 'The requested documentation page does not exist or has moved.',
      linkLabel: 'Go to the documentation home page',
      linkText: 'Home',
    },
    docFooter: { prev: 'Previous', next: 'Next' },
    lastUpdated: { text: 'Last updated' },
    editLink: { pattern: `${repository}/edit/main/docs/:path`, text: 'Edit this page' },
    search: { provider: 'local' },
    socialLinks: [{ icon: 'github', link: repository }],
  },
});
