![CoolVibes](../../public/images/brand/dott-v3/wordmark.png)

# CoolVibes — 繁體中文（台灣）

[English](../../README.md) · [नेपाली](README.ne.md) · [ខ្មែរ](README.km.md) · [Türkçe](README.tr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [العربية](README.ar.md) · [বাংলা](README.bn.md) · [فارسی](README.fa.md) · [עברית](README.he.md) · [हिन्दी](README.hi.md) · [繁體中文（香港）](README.hk.md) · [Bahasa Indonesia](README.id.md) · [日本語](README.ja.md) · [조선말](README.kp.md) · [한국어](README.kr.md) · [Polski](README.pl.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [ไทย](README.th.md) · [繁體中文（台灣）](README.tw.md) · [简体中文](README.zh.md)

![CoolVibes — 繁體中文（台灣）](../assets/heroes/tw.jpg)

## 專案簡介

CoolVibes 是為年滿 18 歲的 LGBTIQA+ 社群及尊重社群的支持者打造的社群、交友與約會網頁應用程式。此儲存庫包含前端、翻譯、插畫及本機測試情境。API、資料庫、即時通訊與付款由獨立服務提供。

## 功能與範圍

動態包含貼文、照片、影片、回覆、互動、收藏、投票與活動。個人檔案支援簡介、興趣、偏好、追蹤者、好友邀請及受權限控管的私人照片。搜尋、配對、附近的人、地圖、地點、打卡與社群分類廣告協助探索。私人和群組聊天支援回覆、轉傳、置頂、媒體、貼圖及 GIF。直播、錢包、推薦獎勵與 Premium 依賴後端服務及功能開關。

## 技術與執行

應用程式使用 React 19、TypeScript、Vite 8，以及 i18next、Axios、Socket.IO、Lexical、虛擬清單、Leaflet/MapLibre 與 Agora。請使用 Yarn 和符合 Vite 要求的 Node.js。下列指令通常啟動 localhost:5173。本機 API 使用 4001，socket 服務使用 4002/4003。

```bash
yarn install --frozen-lockfile
yarn dev

# Checks
yarn lint
yarn build
node scripts/check-documentation.mjs
```

## 語言與品牌

介面提供 23 種語言與地區版本，包括尼泊爾語和高棉語。各語言頁面使用對應地區的主視覺。阿拉伯語、波斯語、希伯來語支援由右至左排版。採用的 dott-v3 品牌包含 CoolVibes 字標、CV 圖示及青綠與紫色色調。/brandkit 提供標誌、圖示、社群封面與 ZIP。

## 驗證與貢獻

螢幕截圖使用真實介面及本機虛構個人檔案，沒有建立正式帳號或使用真實私人訊息。瀏覽器測試不等於實機、付款或直播驗證。新增翻譯仍需母語者審閱。套件資料標示 ISC，但根目錄沒有授權條款全文；重新散布前請確認。英文指南說明架構、服務限制、測試及 GitBook 匯入方式。

![CoolVibes — demo](../assets/screenshots/feed-en.png)

![CoolVibes — demo](../assets/screenshots/profile-mobile-en.png)

[English technical guides](../guide/getting-started.md) · [Product scope](../guide/product.md) · [Architecture](../guide/architecture.md) · [Languages](../guide/localization.md) · [Screenshots](../guide/screenshots.md) · [GitBook](../guide/gitbook.md)
