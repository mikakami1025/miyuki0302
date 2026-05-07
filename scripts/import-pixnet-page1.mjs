import fs from 'node:fs/promises';
import path from 'node:path';
import { serializeMdxArticle } from './admin-utils.mjs';

const SOURCE_URL = 'https://acfr1127.pixnet.net/blog?page=1';
const BLOG_DIR = 'src/content/blog';
const ASSET_DIR = 'public/assets/blog';
const MONTHS = {
  Jan: '01',
  Feb: '02',
  Mar: '03',
  Apr: '04',
  May: '05',
  Jun: '06',
  Jul: '07',
  Aug: '08',
  Sep: '09',
  Oct: '10',
  Nov: '11',
  Dec: '12'
};

function decodeHtml(value = '') {
  return value
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripTags(html = '') {
  return decodeHtml(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<img[^>]*>/gi, '')
      .replace(/<[^>]+>/g, '')
  )
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

function articleBlocks(html) {
  return html.split(/<div class="article" id="article-/).slice(1).map((part) => {
    const id = part.slice(0, part.indexOf('"'));
    return { id, html: part.slice(part.indexOf('>') + 1) };
  });
}

function parseListArticle(block) {
  const titleMatch = block.html.match(/<li class="title"[^>]+data-site-category="([^"]*)"[^>]+data-article-link="([^"]+)"[\s\S]*?<a href="([^"]+)">([\s\S]*?)<\/a>/);
  if (!titleMatch) return null;
  const month = block.html.match(/<span class="month">([^<]+)<\/span>/)?.[1] || 'Jan';
  const day = block.html.match(/<span class="date">([^<]+)<\/span>/)?.[1] || '01';
  const year = block.html.match(/<span class="year">([^<]+)<\/span>/)?.[1] || '2025';
  const imageMatch = block.html.match(/<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/);
  const excerptHtml = block.html.match(/<div class="article-content-inner">([\s\S]*?)<div class="more">/)?.[1] || '';
  return {
    id: block.id,
    category: decodeHtml(titleMatch[1]),
    url: titleMatch[2] || titleMatch[3],
    title: stripTags(titleMatch[4]).replace(/\s+/g, ' ').trim(),
    date: `${year}-${MONTHS[month] || '01'}-${String(day).padStart(2, '0')}`,
    imageAlt: decodeHtml(imageMatch?.[2] || ''),
    excerpt: stripTags(excerptHtml)
  };
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!response.ok) throw new Error(`Fetch failed ${response.status}: ${url}`);
  return new TextDecoder('utf-8').decode(Buffer.from(await response.arrayBuffer()));
}

function parsePostImages(html) {
  const inner = html.match(/<div class="article-content-inner"[^>]*>([\s\S]*?)<div[^>]+article-keyword/)?.[1] || '';
  return [...inner.matchAll(/<img[^>]*>/g)]
    .map((match) => {
      const tag = match[0];
      return {
        url: tag.match(/\ssrc="([^"]+)"/)?.[1] || '',
        alt: decodeHtml(tag.match(/\salt="([^"]*)"/)?.[1] || '')
      };
    })
    .filter((image) => image.url.includes('pic.pimg.tw/acfr1127'));
}

async function downloadImage(url, filename) {
  const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!response.ok) throw new Error(`Image failed ${response.status}: ${url}`);
  await fs.writeFile(path.join(ASSET_DIR, filename), Buffer.from(await response.arrayBuffer()));
}

function topicFromTitle(title) {
  return title
    .replace(/^水晶花教學\s*/, '')
    .replace(/^日本研習作品（113年11月）\s*/, '日本研習作品 ')
    .replace(/>>/g, '：')
    .replace(/\s+/g, ' ')
    .replace(/[。\.]+$/g, '')
    .trim();
}

function seoDescription(title) {
  const topic = topicFromTitle(title);
  if (title.includes('日本研習')) {
    return `${topic}，整理日本水晶花藝研習中的花材造型、色彩配置與作品構成，適合進階學習者參考日系水晶花創作靈感。`;
  }
  if (title.includes('學員作品') || title.includes('學生作品')) {
    return `${topic}，記錄水晶花教學中的學員作品成果，呈現日本水晶花藝的透明花瓣、線條塑形與手作花藝創作靈感。`;
  }
  return `${topic}，分享日本水晶花藝作品紀錄、花材配置與日系手作美感，適合了解水晶花教學與工藝花藝創作。`;
}

function tagsFor(title) {
  const tags = ['水晶花教學', '日本水晶花', '學員作品'];
  if (title.includes('日本研習')) tags.push('日本研習');
  if (title.includes('盆栽')) tags.push('工藝盆栽');
  if (title.includes('玫瑰')) tags.push('玫瑰');
  if (title.includes('百合')) tags.push('百合');
  return [...new Set(tags)];
}

function slugFor(article) {
  return article.title.includes('日本研習')
    ? `japan-crystal-flower-study-${article.id}`
    : `crystal-flower-student-work-${article.id}`;
}

function bodyFor(article, localImages) {
  const topic = topicFromTitle(article.title);
  const images = localImages
    .map((image) => `<img src={import.meta.env.BASE_URL + "${image.path}"} alt="${image.alt || article.title}" />`)
    .join('\n\n');
  return `本文整理自 Miyuki 日本水晶花藝 PIXNET 作品紀錄，主題為「${topic}」。透過作品照片與花材組合，記錄水晶花教學、學員創作與日系手作花藝的細節。\n\n## SEO 作品導讀\n\n${seoDescription(article.title)}\n\n## 原始作品描述\n\n${article.excerpt || topic}\n\n## 作品圖片\n\n${images}\n\n## 原始文章\n\n[查看 PIXNET 原文](${article.url})`;
}

async function main() {
  await fs.mkdir(ASSET_DIR, { recursive: true });
  await fs.mkdir(BLOG_DIR, { recursive: true });
  const html = await fetchText(SOURCE_URL);
  const articles = articleBlocks(html).map(parseListArticle).filter(Boolean);

  await fs.rm(BLOG_DIR, { recursive: true, force: true });
  await fs.mkdir(BLOG_DIR, { recursive: true });

  const imported = [];
  for (const article of articles) {
    const postHtml = await fetchText(article.url);
    const images = parsePostImages(postHtml);
    const localImages = [];
    for (const [index, image] of images.entries()) {
      const ext = path.extname(new URL(image.url).pathname) || '.jpg';
      const filename = `pixnet-${article.id}-${String(index + 1).padStart(2, '0')}${ext}`;
      await downloadImage(image.url, filename);
      localImages.push({ path: `assets/blog/${filename}`, alt: image.alt || article.imageAlt || article.title });
    }
    const mdx = serializeMdxArticle({
      title: article.title,
      slug: slugFor(article),
      description: seoDescription(article.title),
      date: article.date,
      cover: localImages[0]?.path || 'assets/blog/sample-cover.jpg',
      category: article.title.includes('日本研習') ? '日本研習作品' : '水晶花教學',
      tags: tagsFor(article.title),
      sourceUrl: article.url,
      draft: false,
      body: bodyFor(article, localImages)
    });
    await fs.writeFile(path.join(BLOG_DIR, `${slugFor(article)}.mdx`), mdx, 'utf8');
    imported.push({ title: article.title, images: localImages.length });
  }
  console.log(JSON.stringify({ source: SOURCE_URL, articles: imported.length, imported }, null, 2));
}

await main();
