# Site Builder Skill

這份 skill 用於建立與維護 Miyuki日本水晶花藝網站，也可複用到其他水晶花藝 / 工藝盆栽 / 內容型網站。

## 建立新網站

1. 建立 Astro 專案。
2. 將常改內容集中到：
   - `src/config/site.json`
   - `src/data/home.json`
   - `src/data/classrooms.json`
   - `src/data/contact.json`
   - `src/content/blog/`
   - `public/assets/`
3. 首頁區塊保持模組化：hero、about、works、classrooms、contact。
4. 使用 GitHub Actions 部署到 GitHub Pages。

## 套用品牌

修改 `src/config/site.json`，或啟動本機管理 UI：

```bash
npm run admin
```

然後打開：

```txt
http://127.0.0.1:8787/admin
```

- `name`：完整品牌名稱
- `shortName`：導覽列短名稱
- `description`：SEO 描述
- `logo`：logo 圖片路徑
- `background.image`：全站背景圖

Logo 放在：

```txt
public/assets/brand/logo.jpg
```

## 替換圖片

圖片分類：

```txt
public/assets/hero/
public/assets/backgrounds/
public/assets/works/crystal-flowers/
public/assets/works/craft-bonsai/
public/assets/blog/
```

替換圖片後，到 `src/data/home.json` 或文章 frontmatter 修改路徑。更簡單的做法是使用本機管理 UI 直接上傳並套用。

## 新增文章

在 `src/content/blog/` 新增 `.mdx` 檔，例如：

```mdx
---
title: "新文章標題"
slug: "new-post"
description: "文章摘要"
date: "2026-05-07"
cover: "assets/blog/new-cover.jpg"
category: "水晶花藝"
tags: ["水晶花", "課程"]
draft: false
---

文章內容寫在這裡。
```

`draft: true` 不會出現在網站上。

## 生成背景圖

1. 收集 logo、參考圖片、品牌關鍵字。
2. 讀 `skills/background-generator.md`。
3. 使用 `prompts/background-prompts.md` 產生 3 種版本。
4. 將選定圖片放入 `public/assets/backgrounds/`。
5. 修改 `src/config/site.ts` 的 `background.image`。

## 維護資料

- 首頁輪播：管理 UI「首頁輪播」，或 `src/data/home.json` 的 `heroSlides`
- 關於我們：管理 UI「關於我們」，或 `src/data/home.json` 的 `aboutContent`
- 作品輪播：管理 UI「作品輪播」，或 `src/data/home.json` 的 `workCollections`
- 教室資訊：管理 UI「教室資訊」，或 `src/data/classrooms.json`
- 聯絡方式：管理 UI「聯絡我們」，或 `src/data/contact.json`
- 主色、字型、間距、卡片與陰影：`src/styles/global.css`

## 部署

1. 修改 `.github/workflows/deploy.yml` 的 `SITE` 與 `BASE_PATH`。
2. 修改 `astro.config.mjs` 預設值，或使用 workflow env。
3. push 到 GitHub `main` branch。
4. GitHub repository 設定 Pages source 為 GitHub Actions。
