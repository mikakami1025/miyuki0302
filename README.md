# Miyuki日本水晶花藝 | アメリカンフラワー

Astro + MDX 製作的水晶花藝 / 工藝盆栽 / 文章內容型網站。適合本地修改後 push 到 GitHub，並透過 GitHub Pages 自動部署。

## 本地啟動

```bash
npm install
npm run dev
```

開發伺服器通常會在 `http://localhost:4321/miyuki-crystal-flower/`。

## 建置與預覽

```bash
npm run build
npm run preview
```

## GitHub Pages 部署

1. 將專案 push 到 GitHub。
2. 到 repo 的 Settings → Pages。
3. Source 選擇 GitHub Actions。
4. 修改 `.github/workflows/deploy.yml`：

```yml
env:
  SITE: https://你的帳號.github.io
  BASE_PATH: /你的-repo-name
```

5. 若 repo 是 `你的帳號.github.io`，請把 `BASE_PATH` 改成空字串，並同步調整 `astro.config.mjs`。

## 最常修改檔案

- `src/config/site.ts`：網站名稱、SEO 描述、logo、背景圖、導覽列。
- `src/data/home.ts`：首頁輪播、關於我們、作品輪播。
- `src/data/classrooms.ts`：教室資訊。
- `src/data/contact.ts`：地址、電話、社群、蝦皮。
- `src/content/blog/`：文章內容。
- `src/styles/global.css`：主色、字型、字級、卡片、間距、陰影。
- `public/assets/`：所有圖片。

## 如何新增文章

1. 把文章封面放到 `public/assets/blog/`。
2. 在 `src/content/blog/` 新增 `.mdx`。
3. 複製以下格式：

```mdx
---
title: "文章標題"
slug: "article-slug"
description: "文章摘要，會出現在列表與 SEO 描述。"
date: "2026-05-07"
cover: "assets/blog/sample-cover.jpg"
category: "水晶花藝"
tags: ["日本水晶花", "作品"]
draft: false
---

文章內容寫在這裡。
```

`slug` 會變成網址：`/blog/article-slug/`。

## 如何替換背景

1. 把新背景圖放到 `public/assets/backgrounds/`。
2. 修改 `src/config/site.ts`：

```ts
background: {
  image: 'assets/backgrounds/site-bg.jpg',
  overlay: 'rgba(255, 250, 246, 0.84)'
}
```

如果文字太難閱讀，把 `overlay` 的透明度調高，例如 `0.9`。

## 如何替換輪播圖

首頁輪播在 `src/data/home.ts` 的 `heroSlides`。

```ts
{
  title: '晶透花藝，留住四季的光',
  image: 'assets/hero/hero-01.jpg',
  link: '#works'
}
```

作品輪播在同一檔案的 `workCollections`。調整陣列順序即可改排序。

## 如何更新教室資訊

修改 `src/data/classrooms.ts`：

```ts
{
  city: '高雄市',
  summary: '南部認證與預約制教室',
  schools: [
    {
      name: 'Miyuki 日本水晶花藝教室',
      teacher: '林美雪 Miyuki 老師',
      address: '高雄市三民區明仁路16號',
      phone: '0929-320-990',
      note: '採預約制'
    }
  ]
}
```

## 如何修改 CSS 與品牌風格

主要調整在 `src/styles/global.css` 的 `:root`：

```css
--color-primary: #8f3f4c;
--color-secondary: #41685c;
--font-body: "Noto Serif TC", "PingFang TC", "Microsoft JhengHei", serif;
--text-xl: clamp(2.2rem, 5vw, 4.8rem);
--radius-card: 8px;
--shadow-card: 0 18px 55px rgba(75, 45, 35, 0.16);
```

## image2.0 背景圖工作流

文件位置：

- `skills/background-generator.md`
- `prompts/background-prompts.md`

每次固定產生 3 種版本：

1. 清新水晶花藝背景
2. 暖色工藝盆栽背景
3. 低對比文章閱讀背景

選定後放入 `public/assets/backgrounds/`，再修改 `src/config/site.ts`。

## 專案重點

- GitHub Pages 友好
- Markdown / MDX 文章系統
- 圖片與內容集中管理
- 首頁區塊模組化
- 背景圖不寫死在元件內
- 非工程師可透過少數資料檔維護內容
