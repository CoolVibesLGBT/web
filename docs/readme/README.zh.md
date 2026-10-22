![CoolVibes](../../public/images/brand/dott-v3/wordmark.png)

# CoolVibes — 简体中文

[English](../../README.md) · [नेपाली](README.ne.md) · [ខ្មែរ](README.km.md) · [Türkçe](README.tr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [العربية](README.ar.md) · [বাংলা](README.bn.md) · [فارسی](README.fa.md) · [עברית](README.he.md) · [हिन्दी](README.hi.md) · [繁體中文（香港）](README.hk.md) · [Bahasa Indonesia](README.id.md) · [日本語](README.ja.md) · [조선말](README.kp.md) · [한국어](README.kr.md) · [Polski](README.pl.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [ไทย](README.th.md) · [繁體中文（台灣）](README.tw.md) · [简体中文](README.zh.md)

![CoolVibes — 简体中文](../assets/heroes/zh.jpg)

## 项目简介

CoolVibes 是面向年满 18 岁的 LGBTIQA+ 社群及尊重社群的支持者的社交、交友和约会网页应用。本仓库包含前端、翻译、插画和本地测试场景。API、数据库、实时通信及支付由独立服务提供。

## 功能与范围

动态支持文字、图片、视频、回复、互动、收藏、投票和活动。个人资料包含简介、兴趣、偏好、关注者、好友请求及受权限控制的私密照片。搜索、匹配、附近的人、地图、地点、签到和社区分类信息帮助用户探索社群。私聊及群聊支持回复、转发、置顶、媒体、贴纸和 GIF。直播、钱包、推荐奖励和 Premium 取决于后端服务及功能开关，不能仅凭前端构建确认其可用性。

## 技术与运行

应用使用 React 19、TypeScript 和 Vite 8，而非 Next.js；并集成 i18next、Axios、Socket.IO、Lexical、虚拟列表、Leaflet/MapLibre 及 Agora。请使用 Yarn 和符合 Vite 要求的 Node.js。以下命令通常启动 localhost:5173。开发环境 API 位于 4001，socket 服务位于 4002/4003。

```bash
yarn install --frozen-lockfile
yarn dev

# Checks
yarn lint
yarn build
node scripts/check-documentation.mjs
```

## 语言与品牌

应用包含 23 种语言及地区变体，新增尼泊尔语和高棉语。各语言文档使用对应地区的主视觉。阿拉伯语、波斯语和希伯来语支持从右向左布局。已选品牌为 dott-v3：CoolVibes 字标、CV 图标以及青绿与紫色色调。/brandkit 提供标志、图标、社交封面和 ZIP 下载。

## 验证与贡献

截图来自真实应用界面，使用本地虚构资料和模拟响应，没有创建生产账户或展示真实私信。浏览器测试不代表真机、支付或直播验证。新增翻译仍需母语者审阅。包元数据标注 ISC，但仓库根目录没有许可证正文；再分发前应确认授权。英文技术指南介绍架构、服务边界、测试和 GitBook 导入步骤。

![CoolVibes — demo](../assets/screenshots/feed-en.png)

![CoolVibes — demo](../assets/screenshots/profile-mobile-en.png)

[English technical guides](../guide/getting-started.md) · [Product scope](../guide/product.md) · [Architecture](../guide/architecture.md) · [Languages](../guide/localization.md) · [Screenshots](../guide/screenshots.md) · [GitBook](../guide/gitbook.md)
