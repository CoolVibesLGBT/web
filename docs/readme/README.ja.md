![CoolVibes](../../public/images/brand/dott-v3/wordmark.png)

# CoolVibes — 日本語

[English](../../README.md) · [नेपाली](README.ne.md) · [ខ្មែរ](README.km.md) · [Türkçe](README.tr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [العربية](README.ar.md) · [বাংলা](README.bn.md) · [فارسی](README.fa.md) · [עברית](README.he.md) · [हिन्दी](README.hi.md) · [繁體中文（香港）](README.hk.md) · [Bahasa Indonesia](README.id.md) · [日本語](README.ja.md) · [조선말](README.kp.md) · [한국어](README.kr.md) · [Polski](README.pl.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [ไทย](README.th.md) · [繁體中文（台灣）](README.tw.md) · [简体中文](README.zh.md)

![CoolVibes — 日本語](../assets/heroes/ja.jpg)

## プロジェクトについて

CoolVibes は、18歳以上の LGBTIQA+ コミュニティと、その人々を尊重するアライに向けたソーシャル・友達づくり・デーティング用のウェブアプリです。このリポジトリにはフロントエンド、翻訳、イラスト、ローカルテストが含まれます。API、データベース、決済は別のサービスです。

## 機能と範囲

フィードには投稿、写真、動画、返信、リアクション、ブックマーク、投票、イベントがあります。プロフィールでは自己紹介、関心、設定、フォロワー、友達申請、アクセス権付きの非公開写真を扱います。検索、マッチ、近くの人、地図、場所、チェックイン、コミュニティ広告から交流を広げられます。個人・グループチャットは返信、転送、ピン留め、メディア、ステッカー、GIFに対応します。ライブ配信、ウォレット、紹介特典、Premium はサービスと機能フラグに依存します。

## 技術と起動

React 19、TypeScript、Vite 8 に加え、i18next、Axios、Socket.IO、Lexical、仮想リスト、Leaflet/MapLibre、Agora を使用します。Yarn と Vite に対応する Node.js が必要です。以下のコマンドで通常 localhost:5173 が起動します。ローカル API は 4001、socket は 4002/4003 を使用します。

```bash
yarn install --frozen-lockfile
yarn dev

# Checks
yarn lint
yarn build
node scripts/check-documentation.mjs
```

## 言語とブランド

ネパール語とクメール語を含む23の言語・地域バリエーションがあります。各言語ページでは対応する地域のヒーロー画像を使います。アラビア語、ペルシャ語、ヘブライ語は右から左の表示に対応します。採用したブランドは dott-v3：CoolVibes のワードマーク、CV アイコン、ターコイズと紫の配色です。/brandkit からロゴ、アイコン、ソーシャル画像、ZIP を入手できます。

## 検証と貢献

スクリーンショットは本物の画面とローカルの架空プロフィールを使用し、本番アカウントや実際の私信は使っていません。ブラウザテストは実機、決済、ライブ配信の保証ではありません。新しい翻訳には母語話者の確認が必要です。パッケージには ISC と記載されていますが、ルートにライセンス本文がありません。再配布前に確認してください。英語ガイドには構成、サービスの境界、テスト、GitBook への取り込み手順があります。

![CoolVibes — demo](../assets/screenshots/feed-en.png)

![CoolVibes — demo](../assets/screenshots/profile-mobile-en.png)

[English technical guides](../guide/getting-started.md) · [Product scope](../guide/product.md) · [Architecture](../guide/architecture.md) · [Languages](../guide/localization.md) · [Screenshots](../guide/screenshots.md) · [GitBook](../guide/gitbook.md)
