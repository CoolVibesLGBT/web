![CoolVibes](../../public/images/brand/dott-v3/wordmark.png)

# CoolVibes — 繁體中文（香港）

[English](../../README.md) · [नेपाली](README.ne.md) · [ខ្មែរ](README.km.md) · [Türkçe](README.tr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [العربية](README.ar.md) · [বাংলা](README.bn.md) · [فارسی](README.fa.md) · [עברית](README.he.md) · [हिन्दी](README.hi.md) · [繁體中文（香港）](README.hk.md) · [Bahasa Indonesia](README.id.md) · [日本語](README.ja.md) · [조선말](README.kp.md) · [한국어](README.kr.md) · [Polski](README.pl.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [ไทย](README.th.md) · [繁體中文（台灣）](README.tw.md) · [简体中文](README.zh.md) · [Download for VS Code](https://marketplace.visualstudio.com/items?itemName=CoolVibes.coolvibes-vscode-extension)

![CoolVibes — 繁體中文（香港）](../assets/heroes/hk.jpg)

## 關於專案

CoolVibes 是面向年滿 18 歲的 LGBTIQA+ 社群及尊重社群的支持者的社交、交友與約會網頁應用程式。本儲存庫包含前端、翻譯、插畫及本機測試場景。API、資料庫、即時通訊及付款由獨立服務提供。

## 功能與範圍

動態支援帖文、相片、影片、回覆、互動、收藏、投票及活動。個人檔案包含簡介、興趣、偏好、追蹤者、好友邀請及受權限管理的私人相片。搜尋、配對、附近的人、地圖、地點、打卡及分類廣告方便探索社群。私人及群組聊天支援回覆、轉發、置頂、媒體、貼圖和 GIF。直播、錢包、推薦獎勵及 Premium 依賴後端服務和功能設定。

## 技術與執行

介面採用 React 19、TypeScript、Vite 8，並使用 i18next、Axios、Socket.IO、Lexical、虛擬列表、Leaflet/MapLibre 及 Agora。需要 Yarn 和符合 Vite 要求的 Node.js。以下指令通常啟動 localhost:5173。本機 API 使用 4001，socket 服務使用 4002/4003。

```bash
yarn install --frozen-lockfile
yarn dev

# Checks
yarn lint
yarn build
node scripts/check-documentation.mjs
```

## 語言與品牌

應用程式包含 23 種語言及地區版本，包括尼泊爾語和高棉語。每個語言頁面使用相應地區的主視覺。阿拉伯語、波斯語及希伯來語支援由右至左排版。已選用 dott-v3：CoolVibes 字標、CV 圖示及青綠和紫色色調。/brandkit 提供標誌、圖示、社交封面及 ZIP。

## 驗證與參與

螢幕擷取來自真實介面，使用本機虛構個人檔案，沒有建立正式帳戶或展示真實私人訊息。瀏覽器測試不能證明實體裝置、付款或直播可靠性。新增翻譯仍需母語者覆核。套件資料標明 ISC，但根目錄沒有授權全文；重新發佈前請確認。英文指南介紹架構、服務限制、測試和 GitBook 匯入。

![CoolVibes — demo](../assets/screenshots/feed-en.png)

![CoolVibes — demo](../assets/screenshots/profile-mobile-en.png)

[English technical guides](../guide/getting-started.md) · [Product scope](../guide/product.md) · [Architecture](../guide/architecture.md) · [Languages](../guide/localization.md) · [Screenshots](../guide/screenshots.md) · [GitBook](../guide/gitbook.md)
