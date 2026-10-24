![CoolVibes](../../public/images/brand/dott-v3/wordmark.png)

# CoolVibes — 한국어

[English](../../README.md) · [नेपाली](README.ne.md) · [ខ្មែរ](README.km.md) · [Türkçe](README.tr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [العربية](README.ar.md) · [বাংলা](README.bn.md) · [فارسی](README.fa.md) · [עברית](README.he.md) · [हिन्दी](README.hi.md) · [繁體中文（香港）](README.hk.md) · [Bahasa Indonesia](README.id.md) · [日本語](README.ja.md) · [조선말](README.kp.md) · [한국어](README.kr.md) · [Polski](README.pl.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [ไทย](README.th.md) · [繁體中文（台灣）](README.tw.md) · [简体中文](README.zh.md) · [Download for VS Code](https://marketplace.visualstudio.com/items?itemName=CoolVibes.coolvibes-vscode-extension)

![CoolVibes — 한국어](../assets/heroes/kr.jpg)

## 프로젝트 소개

CoolVibes는 만 18세 이상 LGBTIQA+ 커뮤니티와 이를 존중하는 지지자를 위한 소셜 네트워크, 친구 찾기 및 데이팅 웹 앱입니다. 이 저장소에는 프런트엔드, 번역, 일러스트와 로컬 테스트가 있습니다. API, 데이터베이스와 결제는 별도 서비스입니다.

## 기능과 범위

피드는 게시물, 사진, 동영상, 답글, 반응, 북마크, 투표와 이벤트를 제공합니다. 프로필은 소개, 관심사, 선호도, 팔로워, 친구 요청과 권한이 필요한 비공개 사진을 지원합니다. 검색, 매칭, 주변 사람, 지도, 장소, 체크인과 커뮤니티 광고로 교류를 넓힙니다. 개인 및 그룹 채팅은 답장, 전달, 고정, 미디어, 스티커와 GIF를 지원합니다. 라이브 방송, 지갑, 추천 보상과 Premium은 서비스 및 기능 설정에 따라 제공됩니다.

## 기술과 실행

React 19, TypeScript, Vite 8과 함께 i18next, Axios, Socket.IO, Lexical, 가상 목록, Leaflet/MapLibre, Agora를 사용합니다. Yarn과 Vite에 맞는 Node.js가 필요합니다. 아래 명령은 보통 localhost:5173에서 앱을 실행합니다. 로컬 API는 4001, socket 서비스는 4002/4003 포트를 사용합니다.

```bash
yarn install --frozen-lockfile
yarn dev

# Checks
yarn lint
yarn build
node scripts/check-documentation.mjs
```

## 언어와 브랜드

네팔어와 크메르어를 포함하여 23개 언어 및 지역 변형이 있습니다. 각 언어 페이지는 해당 지역의 대표 그림을 사용합니다. 아랍어, 페르시아어, 히브리어는 오른쪽에서 왼쪽으로 표시됩니다. 선택한 dott-v3 브랜드는 CoolVibes 워드마크, CV 아이콘, 청록색과 보라색으로 구성됩니다. /brandkit에서 로고, 아이콘, 소셜 이미지와 ZIP을 제공합니다.

## 검증과 기여

스크린샷은 실제 인터페이스와 로컬 가상 프로필을 사용하며 운영 계정이나 실제 개인 메시지를 사용하지 않습니다. 브라우저 테스트는 실제 기기, 결제 또는 방송의 검증을 대신하지 않습니다. 새 번역은 원어민 검토가 필요합니다. 패키지에는 ISC가 명시되어 있으나 루트 라이선스 본문이 없으므로 재배포 전에 확인하세요. 영어 가이드는 구조, 서비스 경계, 테스트와 GitBook 가져오기를 설명합니다.

![CoolVibes — demo](../assets/screenshots/feed-en.png)

![CoolVibes — demo](../assets/screenshots/profile-mobile-en.png)

[English technical guides](../guide/getting-started.md) · [Product scope](../guide/product.md) · [Architecture](../guide/architecture.md) · [Languages](../guide/localization.md) · [Screenshots](../guide/screenshots.md) · [GitBook](../guide/gitbook.md)
