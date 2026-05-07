# Background Generator Skill

用途：依據 logo、參考圖片、競品網站與品牌文字，使用 image2.0 產生網站背景圖。

## 固定輸出

每次產生 3 種版本：

1. `site-bg-a.jpg`：清新淡雅，適合全站背景。
2. `site-bg-b.jpg`：高質感暖色，適合首頁或活動頁。
3. `site-bg-c.jpg`：更低對比留白版，適合文章頁背景。

## 品牌方向

- 水晶花藝
- 工藝盆栽
- 清新
- 高質感
- 日系
- 柔和
- 適合內容型網站

## 必守規則

- 背景不可影響文字閱讀性。
- 主體不可過滿，中央與文字常出現區域要保留乾淨留白。
- 色彩需與 logo 和既有參考圖保持一致。
- 避免強烈邊框、明顯人物、商標、水印、過亮高光。
- 輸出比例建議：桌面 `16:9`，若要手機版再補 `9:16`。

## 操作流程

1. 收集輸入：logo、參考圖、品牌關鍵字、用途頁面。
2. 讀取 `prompts/background-prompts.md`。
3. 依三種版本 prompt 產生圖片。
4. 檢查可讀性：用白底透明遮罩或淡色內容卡覆蓋測試。
5. 將最終圖放入 `public/assets/backgrounds/`。
6. 在 `src/config/site.ts` 修改 `background.image`。

## 檔名規則

- `site-bg.jpg`：目前啟用的全站背景。
- `site-bg-warm.jpg`：暖色備用背景。
- `site-bg-low-contrast.jpg`：文章頁或高閱讀性背景。
