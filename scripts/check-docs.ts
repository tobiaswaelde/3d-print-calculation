import { readdirSync, readFileSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';

const root = resolve('docs');
const config = readFileSync(resolve(root, '.vitepress/config.ts'), 'utf8');

function markdownFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === '.vitepress' || entry.name === 'public') return [];
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? markdownFiles(path) : entry.name.endsWith('.md') ? [path] : [];
  });
}

function routeFor(file: string) {
  let path = relative(root, file).split(sep).join('/').replace(/\.md$/, '');
  if (path === 'index') return '/';
  if (path.endsWith('/index')) path = `${path.slice(0, -'/index'.length)}/`;
  return `/${path}`;
}

const files = markdownFiles(root);
const relativeFiles = files.map((file) => relative(root, file).split(sep).join('/'));
const german = relativeFiles.filter((file) => !file.startsWith('en/') && file !== '404.md');
const english = relativeFiles.filter((file) => file.startsWith('en/')).map((file) => file.slice(3));
const errors: string[] = [];

for (const file of files) {
  const name = relative(root, file).split(sep).join('/');
  const source = readFileSync(file, 'utf8');
  const frontmatter = source.match(/^---\n([\s\S]*?)\n---/);
  if (
    !frontmatter ||
    !/^title:\s*.+$/m.test(frontmatter[1]) ||
    !/^description:\s*.+$/m.test(frontmatter[1])
  ) {
    errors.push(`${name}: required title and description frontmatter is missing`);
  }
  for (const image of source.matchAll(/!\[([^\]]*)\]\([^)]+\)/g)) {
    if (!image[1].trim()) errors.push(`${name}: image is missing alternative text`);
  }
  if (/<img\b(?![^>]*\balt=)[^>]*>/i.test(source)) errors.push(`${name}: HTML image is missing alt`);
  if (/\b(?:TODO|TBD)\b/.test(source)) errors.push(`${name}: unresolved placeholder`);

  const route = routeFor(file);
  if (!['/', '/en/', '/404'].includes(route) && !config.includes(`link: '${route}'`)) {
    errors.push(`${name}: page is not linked from the VitePress navigation`);
  }
}

for (const page of german)
  if (!english.includes(page)) errors.push(`${page}: English translation is missing`);
for (const page of english)
  if (!german.includes(page)) errors.push(`en/${page}: German translation is missing`);

if (errors.length) throw new Error(`Documentation quality check failed:\n- ${errors.join('\n- ')}`);
process.stdout.write(`Documentation quality check passed (${german.length} translated page pairs).\n`);
