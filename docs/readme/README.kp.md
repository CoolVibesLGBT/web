![CoolVibes](../../public/images/brand/dott-v3/wordmark.png)

# CoolVibes — 조선말

[English](../../README.md) · [नेपाली](README.ne.md) · [ខ្មែរ](README.km.md) · [Türkçe](README.tr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [العربية](README.ar.md) · [বাংলা](README.bn.md) · [فارسی](README.fa.md) · [עברית](README.he.md) · [हिन्दी](README.hi.md) · [繁體中文（香港）](README.hk.md) · [Bahasa Indonesia](README.id.md) · [日本語](README.ja.md) · [조선말](README.kp.md) · [한국어](README.kr.md) · [Polski](README.pl.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [ไทย](README.th.md) · [繁體中文（台灣）](README.tw.md) · [简体中文](README.zh.md) · [Download for VS Code](https://marketplace.visualstudio.com/items?itemName=CoolVibes.coolvibes-vscode-extension)

![CoolVibes — 조선말](../assets/heroes/kp.jpg)

## 프로젝트 소개

CoolVibes는 18살 이상 LGBTIQA+ 공동체와 이를 존중하는 지지자를 위한 사회적 교류, 친구 찾기와 만남의 웹 응용프로그램입니다. 이 저장소에는 웹 화면, 번역, 그림과 지역 시험 자료가 있습니다. API, 자료기지와 지불은 별도 봉사로 구성됩니다.

## 기능과 범위

게시물 목록에는 글, 사진, 동영상, 답글, 반응, 책갈피, 투표와 행사가 있습니다. 개인 소개에는 관심사, 선호, 구독자, 친구 요청과 접근 허가가 필요한 비공개 사진이 포함됩니다. 검색, 연결, 가까운 사람, 지도, 장소, 방문 기록과 공동체 광고를 통해 교류할 수 있습니다. 개인 및 집단 대화는 답장, 전달, 고정, 매체, 스티커와 GIF를 지원합니다. 실시간 방송, 지갑, 추천 보상과 Premium은 봉사 및 기능 설정에 의존합니다.

## 기술과 실행

React 19, TypeScript, Vite 8과 i18next, Axios, Socket.IO, Lexical, 가상 목록, Leaflet/MapLibre, Agora를 사용합니다. Yarn과 Vite에 맞는 Node.js가 필요합니다. 아래 명령은 보통 localhost:5173에서 실행합니다. 지역 API는 4001, socket 봉사는 4002/4003을 사용합니다.

```bash
yarn install --frozen-lockfile
yarn dev

# Checks
yarn lint
yarn build
node scripts/check-documentation.mjs
```

## 언어와 표식

네팔어와 크메르어를 포함한 23개 언어 및 지역 변형이 있습니다. 각 언어 문서는 해당 지역의 대표 그림을 사용합니다. 아랍어, 페르샤어, 히브리어는 오른쪽에서 왼쪽으로 표시합니다. 선택된 dott-v3 표식은 CoolVibes 글자 표식, CV 그림표와 청록색 및 보라색으로 구성됩니다. /brandkit은 표식, 그림표, 공유 그림과 ZIP을 제공합니다.

## 검증과 기여

화면 갈무리는 실제 화면과 가상 인물 자료를 사용하며 실제 계정이나 개인 대화를 사용하지 않습니다. 열람기 시험은 실제 기기, 지불이나 방송의 검증을 대신하지 않습니다. 새 번역은 모어 화자의 검토가 필요합니다. 꾸러미 정보에는 ISC가 있으나 기본 허가문은 없으므로 재배포 전에 확인해야 합니다. 영어 안내서는 구조, 봉사 범위, 시험과 GitBook 가져오기를 설명합니다.

![CoolVibes — demo](../assets/screenshots/feed-en.png)

![CoolVibes — demo](../assets/screenshots/profile-mobile-en.png)

[English technical guides](../guide/getting-started.md) · [Product scope](../guide/product.md) · [Architecture](../guide/architecture.md) · [Languages](../guide/localization.md) · [Screenshots](../guide/screenshots.md) · [GitBook](../guide/gitbook.md)
