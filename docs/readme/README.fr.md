![CoolVibes](../../public/images/brand/dott-v3/wordmark.png)

# CoolVibes — Français

[English](../../README.md) · [नेपाली](README.ne.md) · [ខ្មែរ](README.km.md) · [Türkçe](README.tr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [العربية](README.ar.md) · [বাংলা](README.bn.md) · [فارسی](README.fa.md) · [עברית](README.he.md) · [हिन्दी](README.hi.md) · [繁體中文（香港）](README.hk.md) · [Bahasa Indonesia](README.id.md) · [日本語](README.ja.md) · [조선말](README.kp.md) · [한국어](README.kr.md) · [Polski](README.pl.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [ไทย](README.th.md) · [繁體中文（台灣）](README.tw.md) · [简体中文](README.zh.md)

![CoolVibes — Français](../assets/heroes/fr.jpg)

## À propos du projet

CoolVibes réunit réseau social, amitié et rencontres pour la communauté LGBTIQA+ et ses alliés respectueux de 18 ans et plus. Ce dépôt contient le client web, les traductions, les illustrations et les scénarios de test locaux. L’API, la base de données et les paiements sont des services distincts.

## Fonctionnalités

Le fil propose publications, photos, vidéos, réponses, réactions, favoris, sondages et événements. Les profils regroupent biographie, intérêts, préférences, abonnements, demandes d’amitié et photos privées soumises à autorisation. Recherche, rencontres, proximité, cartes, lieux, présences et annonces facilitent la découverte. Les conversations privées et de groupe incluent réponses, transferts, messages épinglés, médias, stickers et GIF. Le direct, le portefeuille, le parrainage et Premium dépendent des services et des options activées.

## Technologie et démarrage

Le client utilise React 19, TypeScript et Vite 8 ; ce n’est pas une application Next.js. Il intègre routage navigateur, i18next, Axios, Socket.IO, Lexical, listes virtualisées, Leaflet/MapLibre et Agora. Utilisez Yarn et une version Node.js compatible avec Vite. Les commandes ci-dessous lancent normalement localhost:5173. L’API locale utilise 4001 et les sockets 4002/4003.

```bash
yarn install --frozen-lockfile
yarn dev

# Checks
yarn lint
yarn build
node scripts/check-documentation.mjs
```

## Langues et identité

L’application comprend 23 variantes linguistiques, dont le népalais et le khmer. Chaque page utilise son illustration régionale. L’arabe, le persan et l’hébreu disposent de mises en page RTL. L’identité retenue est dott-v3 : logo typographique CoolVibes, icône CV et couleurs turquoise/violet. La page /brandkit propose logos, icônes, visuel social et archive ZIP.

## Vérification et contribution

Les captures montrent la véritable interface avec des profils fictifs locaux, sans compte de production ni message privé réel. Les tests navigateur ne certifient pas les appareils physiques, paiements ou diffusions en direct. Une relecture native des nouveaux textes népalais et khmers reste souhaitable. Les métadonnées indiquent ISC mais aucun texte de licence racine n’est présent ; vérifiez la licence avant redistribution. Les guides techniques anglais détaillent les services et l’import GitBook.

![CoolVibes — demo](../assets/screenshots/feed-en.png)

![CoolVibes — demo](../assets/screenshots/profile-mobile-en.png)

[English technical guides](../guide/getting-started.md) · [Product scope](../guide/product.md) · [Architecture](../guide/architecture.md) · [Languages](../guide/localization.md) · [Screenshots](../guide/screenshots.md) · [GitBook](../guide/gitbook.md)
