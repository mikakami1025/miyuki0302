# AGENT.md：Miyuki 網站專案交接筆記

## 1. 專案概況

這是一個「Miyuki 日本水晶花藝 / 工藝盆栽 / 文章內容型網站」。

主要目標：

- 使用 Astro 建立可部署到 GitHub Pages 的靜態網站。
- 支援首頁輪播、作品輪播、教室資訊、聯絡資訊與文章系統。
- 讓非工程師可以透過本機管理介面修改內容、圖片、文章與樣式。
- 常改內容集中在 JSON、MDX 與 assets 目錄，方便維護。

正式 GitHub repo：

```txt
https://github.com/mikakami1025/desktop-tutorial
```

GitHub Pages 網址：

```txt
https://mikakami1025.github.io/desktop-tutorial/
```

本機主要工作目錄：

```txt
E:\網站
```

用來推送 GitHub 的 clone 目錄：

```txt
C:\tmp\desktop-tutorial-miyuki-site
```

重要提醒：

- `E:\網站` 是主要開發與本機管理介面使用的資料來源。
- `E:\網站` 目前不是 git repository。
- 要推送 GitHub 時，需要把修改同步到 `C:\tmp\desktop-tutorial-miyuki-site`，再 commit / push。

## 2. 技術架構

使用技術：

- Astro
- TypeScript
- MDX
- Astro Content Collections
- GitHub Actions
- GitHub Pages
- Node.js 本機管理介面

主要 npm 指令：

```bash
npm run dev       # 啟動前台開發網站
npm run admin     # 啟動本機管理介面
npm run build     # Astro check + build
npm run preview   # 預覽 dist
npm test          # 執行 Node 測試
```

## 3. 本機網址

### 前台網站

啟動：

```powershell
cd E:\網站
npm run dev
```

網址：

```txt
http://127.0.0.1:4321/desktop-tutorial/
```

常用錨點：

```txt
http://127.0.0.1:4321/desktop-tutorial/#works
http://127.0.0.1:4321/desktop-tutorial/#classrooms
http://127.0.0.1:4321/desktop-tutorial/#contact
http://127.0.0.1:4321/desktop-tutorial/blog/
```

### 本機管理介面

啟動：

```powershell
cd E:\網站
npm run admin
```

網址：

```txt
http://127.0.0.1:8787/admin
```

使用者可以直接對 Codex 說：

```txt
幫我開啟管理介面
```

或：

```txt
啟動 Miyuki 本機管理介面
```

此時應執行 `npm run admin`，再確認 `http://127.0.0.1:8787/admin` 可以開啟。

## 4. 主要資料位置

常改內容集中在以下位置：

```txt
src/config/site.json          # 網站名稱、SEO 描述、Logo、背景圖
src/data/home.json            # 首頁輪播、關於我們、作品輪播
src/data/classrooms.json      # 教室資訊
src/data/contact.json         # 聯絡資訊與社群 icon 連結
src/content/blog/             # MDX 文章
src/styles/global.css         # 全站 CSS 與設計變數
public/assets/                # 圖片與靜態資產
```

資產分類：

```txt
public/assets/brand/                  # Logo
public/assets/backgrounds/            # 背景圖
public/assets/hero/                   # 首頁輪播圖
public/assets/works/crystal-flowers/  # 日本水晶花藝作品
public/assets/works/craft-bonsai/     # 工藝盆栽作品
public/assets/blog/                   # 文章圖片
```

## 5. 管理介面目前支援的內容

管理介面檔案：

```txt
scripts/admin-server.mjs
scripts/admin-utils.mjs
```

測試檔：

```txt
tests/admin-utils.test.mjs
```

管理介面目前可修改：

- 網站設定：網站名稱、短名稱、SEO 描述、Logo、背景圖、背景遮罩。
- 樣式：主色、字型、字級、間距、卡片圓角、陰影。
- 首頁輪播：新增、刪除、排序、上傳圖片、修改標題/描述/連結。
- 關於我們：修改小標、大標與內文段落。
- 作品輪播：修改日本水晶花藝與工藝盆栽作品圖片、標題與連結。
- 教室資訊：新增城市、刪除城市、新增教室、修改老師/地址/電話/備註。
- 聯絡我們：修改地址、電話、Email，以及 5 個社群 icon 連結。
- 文章：新增/修改文章標題、slug、摘要、日期、分類、標籤、封面圖與 MDX 內容。

注意：

- 管理介面只在本機執行，不會部署到 GitHub Pages。
- 管理介面儲存後會直接更新 `E:\網站` 的專案檔案。
- 如果改了 `scripts/admin-server.mjs`，需要重啟 `npm run admin` 才會看到新介面。

## 6. 首頁功能狀態

首頁區塊順序：

1. 首頁輪播圖
2. 關於我們
3. 左右雙欄作品輪播
4. 教室資訊
5. 聯絡我們

目前互動：

- 首頁輪播每 10 秒自動切換下一張。
- 作品輪播每 10 秒自動切換下一張。
- 輪播圖片使用 `object-fit: contain`，讓整張圖片完整顯示在輪播視窗中。
- 教室資訊使用城市卡片展開，一次只開一個城市。
- 教室卡片的展開清單可滾動。
- 聯絡我們為左側地址/電話/Email，右側社群 icon。

## 7. 聯絡我們資料結構

檔案：

```txt
src/data/contact.json
```

目前結構包含：

```json
{
  "address": "高雄市三民區明仁路16號",
  "phone": "0929-320-990",
  "facebook": "https://www.facebook.com/Miyuki0302/",
  "instagram": "https://www.instagram.com/miyuki_lin0302/",
  "shopee": "https://shopee.tw/hhh3062417",
  "email": "miyuki@hegroup.com.tw",
  "socialLinks": [
    {
      "label": "水晶花藝 Facebook",
      "type": "facebook",
      "url": "https://www.facebook.com/Miyuki0302/"
    }
  ]
}
```

前台實際使用 `socialLinks` 產生 icon。

`facebook`、`instagram`、`shopee` 是舊欄位，仍保留作為相容與備援。

## 8. 文章系統

文章位置：

```txt
src/content/blog/
```

每篇文章為 `.mdx`。

Frontmatter 範例：

```mdx
---
title: "文章標題"
slug: "article-slug"
description: "SEO 友善摘要"
date: "2026-05-07"
cover: "assets/blog/sample-cover.jpg"
category: "水晶花藝"
tags: ["課程", "作品"]
draft: false
sourceUrl: "https://example.com"
---

文章內容。
```

路由：

```txt
src/pages/blog/index.astro       # 文章列表
src/pages/blog/[slug].astro      # 單篇文章
```

## 9. SEO 與圖片描述規則

原則：

- 圖片 `alt` 優先使用資料中的 `title`。
- 首頁輪播圖片要有具體描述，不要留「請輸入描述」或空白。
- 作品輪播標題不可使用「新作品」這類無意義文字。
- 文章 `description` 要寫成可讀的 SEO 摘要，不要只複製標題。
- 補圖片描述前，應先查看圖片內容，再根據畫面寫描述。

目前已補過的例子：

- 水晶花盆栽 - 楓葉
- 工藝盆栽 - 松樹
- 日本水晶花藝 - 粉色菊花
- 日本水晶花藝 - 粉色陸蓮
- 日本水晶花藝 - 白色曇花

## 10. GitHub Pages 部署

部署 workflow：

```txt
.github/workflows/deploy.yml
```

Astro 設定：

```txt
astro.config.mjs
```

目前 GitHub Pages 使用：

```txt
SITE=https://mikakami1025.github.io
BASE_PATH=/desktop-tutorial
```

推送到 `main` 後，GitHub Actions 會自動部署。

公開網站更新通常需要 1 到 3 分鐘。

## 11. 推送 GitHub 的標準流程

因為 `E:\網站` 不是 git repo，所以推送前要同步到 clone。

常見流程：

```powershell
Copy-Item -LiteralPath "E:\網站\要同步的檔案" -Destination "C:\tmp\desktop-tutorial-miyuki-site\相同路徑"
cd C:\tmp\desktop-tutorial-miyuki-site
npm test
npm run build
git status -sb
git add 明確檔案路徑
git commit -m "清楚描述這次修改"
git push origin main
```

注意：

- 不要使用 `git add -A`，除非確認整個工作區都屬於本次修改。
- 優先明確列出要提交的檔案。
- 推送前至少跑 `npm test`。
- 前台或 Astro 元件有改時，跑 `npm run build`。

## 12. 目前已知注意事項

### PowerShell 顯示中文亂碼

PowerShell 有時會把 UTF-8 中文顯示成亂碼，但檔案本身不一定壞掉。

檢查中文內容時，優先使用：

```powershell
node -e "const fs=require('fs'); console.log(fs.readFileSync('檔案路徑','utf8'))"
```

不要只根據 PowerShell `Get-Content` 的亂碼判斷檔案已損壞。

### 本機管理介面與前台不同步時

可能原因：

- 管理介面 server 尚未重啟。
- 前台 dev server 尚未重新整理。
- 管理介面表單還沒支援新的資料結構。
- 修改只存在 `E:\網站`，尚未同步到 GitHub clone。

排查方式：

1. 重新整理 `http://127.0.0.1:8787/admin`。
2. 重啟 `npm run admin`。
3. 重新整理 `http://127.0.0.1:4321/desktop-tutorial/`。
4. 檢查 `src/data/*.json` 是否真的改到。
5. 若要更新公開網站，記得同步 clone 並 push。

### 不要批量刪除

依照本工作區規則，禁止批量刪除檔案或目錄。

不要使用：

```txt
del /s
rd /s
rmdir /s
Remove-Item -Recurse
rm -rf
```

需要刪除檔案時，只能一次刪除一個明確路徑的檔案。

## 13. 對未來 Codex 的建議

接手這個專案時，建議流程：

1. 先讀 `AGENT.md`。
2. 確認使用者要改的是本機前台、管理介面，還是公開 GitHub Pages。
3. 若要操作管理介面，啟動 `npm run admin`。
4. 若要看前台，啟動 `npm run dev`。
5. 修改內容優先改 `src/data/*.json`、`src/config/site.json`、`src/content/blog/` 或 `public/assets/`。
6. 修改前台版面才動 `src/sections/`、`src/components/`、`src/styles/global.css`。
7. 改完先在 `E:\網站` 驗證。
8. 要上線時，同步到 `C:\tmp\desktop-tutorial-miyuki-site`。
9. 在 clone 跑測試與 build。
10. commit 並 push 到 `main`。

