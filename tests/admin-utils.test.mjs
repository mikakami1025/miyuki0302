import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseMdxArticle,
  serializeMdxArticle,
  sanitizeAssetFilename,
  updateCssVariables
} from '../scripts/admin-utils.mjs';

test('sanitizeAssetFilename keeps readable names and removes unsafe path characters', () => {
  assert.equal(sanitizeAssetFilename('../我的 背景!!.jpg'), '我的-背景.jpg');
  assert.equal(sanitizeAssetFilename('hero image.png'), 'hero-image.png');
});

test('parseMdxArticle reads frontmatter, tags, draft flag, and body', () => {
  const article = parseMdxArticle(`---
title: "範例文章"
slug: "sample-post"
description: "摘要"
date: "2026-05-07"
cover: "assets/blog/sample.jpg"
category: "水晶花藝"
tags: ["水晶花", "課程"]
draft: false
---

文章內容`);

  assert.equal(article.title, '範例文章');
  assert.equal(article.slug, 'sample-post');
  assert.deepEqual(article.tags, ['水晶花', '課程']);
  assert.equal(article.draft, false);
  assert.equal(article.body.trim(), '文章內容');
});

test('serializeMdxArticle writes frontmatter that can be parsed again', () => {
  const mdx = serializeMdxArticle({
    title: '新文章',
    slug: 'new-post',
    description: '摘要',
    date: '2026-05-07',
    cover: 'assets/blog/cover.jpg',
    category: '教室資訊',
    tags: ['公告'],
    draft: true,
    body: '內文'
  });

  const parsed = parseMdxArticle(mdx);
  assert.equal(parsed.title, '新文章');
  assert.equal(parsed.draft, true);
  assert.deepEqual(parsed.tags, ['公告']);
  assert.equal(parsed.body.trim(), '內文');
});

test('updateCssVariables changes only requested root variables', () => {
  const css = `:root {\n  --color-primary: #111111;\n  --space-section: 4rem;\n}\nbody { color: red; }\n`;
  const next = updateCssVariables(css, {
    '--color-primary': '#222222'
  });

  assert.match(next, /--color-primary: #222222;/);
  assert.match(next, /--space-section: 4rem;/);
  assert.match(next, /body \{ color: red; \}/);
});
