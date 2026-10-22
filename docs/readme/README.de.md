![CoolVibes](../../public/images/brand/dott-v3/wordmark.png)

# CoolVibes — Deutsch

[English](../../README.md) · [नेपाली](README.ne.md) · [ខ្មែរ](README.km.md) · [Türkçe](README.tr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [العربية](README.ar.md) · [বাংলা](README.bn.md) · [فارسی](README.fa.md) · [עברית](README.he.md) · [हिन्दी](README.hi.md) · [繁體中文（香港）](README.hk.md) · [Bahasa Indonesia](README.id.md) · [日本語](README.ja.md) · [조선말](README.kp.md) · [한국어](README.kr.md) · [Polski](README.pl.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [ไทย](README.th.md) · [繁體中文（台灣）](README.tw.md) · [简体中文](README.zh.md)

![CoolVibes — Deutsch](../assets/heroes/de.jpg)

## Über das Projekt

CoolVibes verbindet soziale Medien, Freundschaft und Dating für die LGBTIQA+ Community und respektvolle Verbündete ab 18 Jahren. Dieses Repository enthält den Webclient, Übersetzungen, Grafiken und lokale Test-Fixtures. API, Datenbank und Zahlungsdienste werden separat betrieben.

## Funktionen und Umfang

Der Feed unterstützt Beiträge, Fotos, Videos, Antworten, Reaktionen, Lesezeichen, Umfragen und Veranstaltungen. Profile bündeln Biografie, Interessen, Präferenzen, Follower, Freundschaftsanfragen und zugriffsgeschützte private Fotos. Suche, Matches, Personen in der Nähe, Karten, Orte, Check-ins und Community-Anzeigen erleichtern die Entdeckung. Private Chats und Gruppen bieten Antworten, Weiterleitung, angeheftete Nachrichten, Medien, Sticker und GIFs. Liveübertragungen, Wallet, Empfehlungen und Premium hängen von Diensten und Funktionsschaltern ab.

## Technik und Installation

Der Client basiert auf React 19, TypeScript und Vite 8, nicht auf Next.js. Er nutzt Browser-Routing, i18next, Axios, Socket.IO, Lexical, virtualisierte Listen, Leaflet/MapLibre und Agora. Verwenden Sie Yarn und eine von Vite unterstützte Node.js-Version. Die Befehle unten starten die App gewöhnlich auf localhost:5173; lokale API- und Socket-Dienste werden auf 4001 beziehungsweise 4002/4003 erwartet.

```bash
yarn install --frozen-lockfile
yarn dev

# Checks
yarn lint
yarn build
node scripts/check-documentation.mjs
```

## Sprachen und Marke

Die App bietet 23 Sprachvarianten, einschließlich Nepali und Khmer. Jede Sprachseite verwendet das passende regionale Hero-Bild. Arabisch, Persisch und Hebräisch unterstützen RTL-Layouts. Die gewählte Markenfamilie dott-v3 umfasst den CoolVibes-Schriftzug, das CV-Symbol und Türkis/Violett. Unter /brandkit stehen Logos, Symbole, Social-Cover und ein ZIP-Paket bereit.

## Prüfung und Mitarbeit

Die Screenshots zeigen die echte Oberfläche mit fiktiven lokalen Profilen; es werden keine Produktionskonten oder privaten Nachrichten verwendet. Browsertests ersetzen keine Tests auf echten Geräten oder mit Zahlungs- und Live-Diensten. Die neuen Nepali-/Khmer-Texte profitieren von muttersprachlicher Prüfung. Die Paketmetadaten nennen ISC, aber im Stammverzeichnis fehlt ein Lizenztext; klären Sie die Lizenz vor einer Weiterverteilung. Die englischen Leitfäden erläutern Betrieb, Grenzen und GitBook-Import.

![CoolVibes — demo](../assets/screenshots/feed-en.png)

![CoolVibes — demo](../assets/screenshots/profile-mobile-en.png)

[English technical guides](../guide/getting-started.md) · [Product scope](../guide/product.md) · [Architecture](../guide/architecture.md) · [Languages](../guide/localization.md) · [Screenshots](../guide/screenshots.md) · [GitBook](../guide/gitbook.md)
