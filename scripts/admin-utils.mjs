import fs from 'node:fs/promises';
import path from 'node:path';

export const PROJECT_ROOT = process.cwd();

export const DATA_FILES = {
  site: 'src/config/site.json',
  home: 'src/data/home.json',
  classrooms: 'src/data/classrooms.json',
  contact: 'src/data/contact.json',
  styles: 'src/styles/global.css',
  blogDir: 'src/content/blog',
  assetsDir: 'public/assets'
};

export const ASSET_FOLDERS = [
  'hero',
  'backgrounds',
  'works/crystal-flowers',
  'works/craft-bonsai',
  'blog',
  'brand'
];

export function resolveProjectPath(relativePath) {
  const target = path.resolve(PROJECT_ROOT, relativePath);
  const root = path.resolve(PROJECT_ROOT);
  if (target !== root && !target.startsWith(root + path.sep)) {
    throw new Error(`Unsafe path: ${relativePath}`);
  }
  return target;
}

export async function readJson(relativePath) {
  const file = await fs.readFile(resolveProjectPath(relativePath), 'utf8');
  return JSON.parse(file);
}

export async function writeJson(relativePath, value) {
  await fs.writeFile(resolveProjectPath(relativePath), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function sanitizeSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'new-post';
}

export function sanitizeAssetFilename(filename) {
  const parsed = path.parse(String(filename || 'image.jpg').replace(/\\/g, '/'));
  const ext = (parsed.ext || '.jpg').toLowerCase().replace(/[^.a-z0-9]/g, '') || '.jpg';
  const base = parsed.name
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}._-]+/gu, '-')
    .replace(/[._-]{2,}/g, '-')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 80) || 'image';
  return `${base}${ext}`;
}

export function parseFrontmatterValue(value) {
  const trimmed = value.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed.startsWith('[')) return JSON.parse(trimmed);
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function parseMdxArticle(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error('Article is missing frontmatter');
  const [, frontmatter, body] = match;
  const data = {};
  for (const line of frontmatter.split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1);
    data[key] = parseFrontmatterValue(value);
  }
  return {
    title: '',
    slug: '',
    description: '',
    date: '',
    cover: '',
    category: '',
    tags: [],
    draft: false,
    ...data,
    body
  };
}

export function quoteFrontmatter(value) {
  return JSON.stringify(String(value ?? ''));
}

export function serializeMdxArticle(article) {
  const slug = sanitizeSlug(article.slug || article.title);
  const tags = Array.isArray(article.tags)
    ? article.tags.map((tag) => String(tag).trim()).filter(Boolean)
    : String(article.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);
  const body = String(article.body || '').trimEnd();
  return `---\n` +
    `title: ${quoteFrontmatter(article.title)}\n` +
    `slug: ${quoteFrontmatter(slug)}\n` +
    `description: ${quoteFrontmatter(article.description)}\n` +
    `date: ${quoteFrontmatter(article.date)}\n` +
    `cover: ${quoteFrontmatter(article.cover)}\n` +
    `category: ${quoteFrontmatter(article.category)}\n` +
    `tags: ${JSON.stringify(tags)}\n` +
    `draft: ${article.draft ? 'true' : 'false'}\n` +
    `---\n\n${body}\n`;
}

export async function readArticles() {
  const dir = resolveProjectPath(DATA_FILES.blogDir);
  const entries = await fs.readdir(dir);
  const articles = [];
  for (const entry of entries.filter((name) => name.endsWith('.mdx')).sort()) {
    const source = await fs.readFile(path.join(dir, entry), 'utf8');
    articles.push({ file: entry, ...parseMdxArticle(source) });
  }
  return articles;
}

export async function writeArticle(article, oldSlug = '') {
  const slug = sanitizeSlug(article.slug || article.title);
  const dir = resolveProjectPath(DATA_FILES.blogDir);
  await fs.mkdir(dir, { recursive: true });
  const nextFile = `${slug}.mdx`;
  await fs.writeFile(path.join(dir, nextFile), serializeMdxArticle({ ...article, slug }), 'utf8');
  if (oldSlug && sanitizeSlug(oldSlug) !== slug) {
    const oldFile = path.join(dir, `${sanitizeSlug(oldSlug)}.mdx`);
    await fs.rm(oldFile, { force: true });
  }
  return nextFile;
}

export function extractCssVariables(css) {
  const rootMatch = css.match(/:root\s*\{([\s\S]*?)\}/);
  if (!rootMatch) return {};
  const variables = {};
  for (const match of rootMatch[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    variables[match[1]] = match[2].trim();
  }
  return variables;
}

export function updateCssVariables(css, updates) {
  let next = css;
  for (const [key, value] of Object.entries(updates)) {
    const safeValue = String(value).replace(/[;\n\r]/g, '').trim();
    const pattern = new RegExp(`(${key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*:\\s*)([^;]+)(;)`);
    if (pattern.test(next)) {
      next = next.replace(pattern, `$1${safeValue}$3`);
    }
  }
  return next;
}

export async function readCssVariables() {
  const css = await fs.readFile(resolveProjectPath(DATA_FILES.styles), 'utf8');
  return extractCssVariables(css);
}

export async function writeCssVariables(updates) {
  const file = resolveProjectPath(DATA_FILES.styles);
  const css = await fs.readFile(file, 'utf8');
  await fs.writeFile(file, updateCssVariables(css, updates), 'utf8');
}

export async function listAssets() {
  const result = {};
  for (const folder of ASSET_FOLDERS) {
    const dir = resolveProjectPath(path.join(DATA_FILES.assetsDir, folder));
    try {
      const entries = await fs.readdir(dir);
      result[folder] = entries
        .filter((entry) => /\.(jpe?g|png|webp|gif|svg)$/i.test(entry))
        .sort()
        .map((entry) => `assets/${folder}/${entry}`.replaceAll('\\', '/'));
    } catch {
      result[folder] = [];
    }
  }
  return result;
}

export async function saveDataUrlAsset(folder, filename, dataUrl) {
  if (!ASSET_FOLDERS.includes(folder)) throw new Error('Unsupported asset folder');
  const match = String(dataUrl).match(/^data:(image\/(?:jpeg|png|webp|gif|svg\+xml));base64,(.+)$/);
  if (!match) throw new Error('Only image data URLs are supported');
  const safeName = sanitizeAssetFilename(filename);
  const dir = resolveProjectPath(path.join(DATA_FILES.assetsDir, folder));
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, safeName), Buffer.from(match[2], 'base64'));
  return `assets/${folder}/${safeName}`.replaceAll('\\', '/');
}
