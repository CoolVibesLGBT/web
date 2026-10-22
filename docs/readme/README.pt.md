![CoolVibes](../../public/images/brand/dott-v3/wordmark.png)

# CoolVibes — Português

[English](../../README.md) · [नेपाली](README.ne.md) · [ខ្មែរ](README.km.md) · [Türkçe](README.tr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [العربية](README.ar.md) · [বাংলা](README.bn.md) · [فارسی](README.fa.md) · [עברית](README.he.md) · [हिन्दी](README.hi.md) · [繁體中文（香港）](README.hk.md) · [Bahasa Indonesia](README.id.md) · [日本語](README.ja.md) · [조선말](README.kp.md) · [한국어](README.kr.md) · [Polski](README.pl.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [ไทย](README.th.md) · [繁體中文（台灣）](README.tw.md) · [简体中文](README.zh.md)

![CoolVibes — Português](../assets/heroes/pt.jpg)

## Sobre o projeto

O CoolVibes reúne rede social, amizade e encontros para a comunidade LGBTIQA+ e pessoas aliadas respeitosas com 18 anos ou mais. Este repositório contém o cliente web, traduções, ilustrações e cenários de teste locais. API, banco de dados e pagamentos são serviços separados.

## Recursos e escopo

O feed oferece publicações, fotos, vídeos, respostas, reações, favoritos, enquetes e eventos. Perfis reúnem biografia, interesses, preferências, seguidores, pedidos de amizade e fotos privadas com controle de acesso. Busca, combinações, pessoas próximas, mapas, locais, check-ins e classificados ajudam na descoberta. Conversas privadas e grupos incluem respostas, encaminhamento, mensagens fixadas, mídia, figurinhas e GIFs. Transmissões, carteira, indicações e Premium dependem dos serviços e das opções habilitadas.

## Tecnologia e instalação

O cliente usa React 19, TypeScript e Vite 8; não é Next.js. Inclui roteamento do navegador, i18next, Axios, Socket.IO, Lexical, listas virtualizadas, Leaflet/MapLibre e Agora. Use Yarn e uma versão de Node.js compatível com Vite. Os comandos abaixo normalmente iniciam localhost:5173. A API local usa 4001 e os sockets 4002/4003.

```bash
yarn install --frozen-lockfile
yarn dev

# Checks
yarn lint
yarn build
node scripts/check-documentation.mjs
```

## Idiomas e marca

O aplicativo inclui 23 variantes de idioma, com nepalês e khmer. Cada página apresenta sua ilustração regional. Árabe, persa e hebraico têm layouts RTL. A identidade escolhida é dott-v3: logotipo CoolVibes, ícone CV e cores turquesa/violeta. /brandkit disponibiliza logos, ícones, capa social e arquivo ZIP.

## Verificação e contribuição

As capturas mostram a interface real com perfis fictícios locais, sem contas de produção ou mensagens privadas reais. Testes de navegador não certificam aparelhos reais, pagamentos ou transmissões. É recomendável revisão nativa dos novos textos em nepalês e khmer. Os metadados indicam ISC, mas não há texto de licença na raiz; confirme antes de redistribuir. Os guias técnicos em inglês explicam serviços, limites e importação no GitBook.

![CoolVibes — demo](../assets/screenshots/feed-en.png)

![CoolVibes — demo](../assets/screenshots/profile-mobile-en.png)

[English technical guides](../guide/getting-started.md) · [Product scope](../guide/product.md) · [Architecture](../guide/architecture.md) · [Languages](../guide/localization.md) · [Screenshots](../guide/screenshots.md) · [GitBook](../guide/gitbook.md)
