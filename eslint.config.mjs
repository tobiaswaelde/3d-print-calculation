import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt({
  rules: {
    'vue/block-order': ['error', { order: ['template', 'script', 'style'] }],
  },
}).append({
  files: ['app/**/*.{ts,vue}', 'shared/**/*.ts'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/server/**', '**/prisma/**'],
            message: 'Client and shared code must not import server or Prisma modules.',
          },
        ],
      },
    ],
  },
});
