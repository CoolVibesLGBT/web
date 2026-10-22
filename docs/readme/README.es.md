![CoolVibes](../../public/images/brand/dott-v3/wordmark.png)

# CoolVibes — Español

[English](../../README.md) · [नेपाली](README.ne.md) · [ខ្មែរ](README.km.md) · [Türkçe](README.tr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [العربية](README.ar.md) · [বাংলা](README.bn.md) · [فارسی](README.fa.md) · [עברית](README.he.md) · [हिन्दी](README.hi.md) · [繁體中文（香港）](README.hk.md) · [Bahasa Indonesia](README.id.md) · [日本語](README.ja.md) · [조선말](README.kp.md) · [한국어](README.kr.md) · [Polski](README.pl.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [ไทย](README.th.md) · [繁體中文（台灣）](README.tw.md) · [简体中文](README.zh.md)

![CoolVibes — Español](../assets/heroes/es.jpg)

## Acerca del proyecto

CoolVibes combina red social, amistad y citas para la comunidad LGBTIQA+ y personas aliadas respetuosas mayores de 18 años. Este repositorio contiene el cliente web, traducciones, ilustraciones y escenarios de prueba locales. La API, la base de datos y los pagos son servicios independientes.

## Funciones y alcance

El feed incluye publicaciones, fotos, vídeos, respuestas, reacciones, guardados, encuestas y eventos. Los perfiles reúnen biografía, intereses, preferencias, seguidores, solicitudes de amistad y fotos privadas con permisos. La búsqueda, las coincidencias, las personas cercanas, mapas, lugares, registros de visita y anuncios ayudan a descubrir la comunidad. Los chats privados y grupales ofrecen respuestas, reenvíos, mensajes fijados, archivos, stickers y GIF. Directos, cartera, recomendaciones y Premium dependen de servicios y funciones habilitadas.

## Tecnología e instalación

La aplicación usa React 19, TypeScript y Vite 8; no es Next.js. Integra navegación del navegador, i18next, Axios, Socket.IO, Lexical, listas virtualizadas, Leaflet/MapLibre y Agora. Usa Yarn y una versión de Node.js compatible con Vite. Los comandos siguientes inician normalmente localhost:5173. La API local se espera en 4001 y los sockets en 4002/4003.

```bash
yarn install --frozen-lockfile
yarn dev

# Checks
yarn lint
yarn build
node scripts/check-documentation.mjs
```

## Idiomas e identidad

Hay 23 variantes de idioma, incluidas nepalí y jemer. Cada página usa su ilustración regional. Árabe, persa y hebreo admiten disposición RTL. La identidad elegida es dott-v3: logotipo CoolVibes, icono CV y colores turquesa/violeta. /brandkit ofrece logos, iconos, portada social y descarga ZIP.

## Verificación y colaboración

Las capturas muestran la interfaz real con perfiles ficticios locales; no se crean cuentas de producción ni se usan mensajes privados reales. Las pruebas de navegador no certifican dispositivos físicos, pagos ni emisiones en directo. Conviene revisar con hablantes nativos los nuevos textos nepalíes y jemeres. Los metadatos declaran ISC, pero falta un texto de licencia en la raíz; verifica la licencia antes de redistribuir. Las guías en inglés detallan servicios, límites e importación a GitBook.

![CoolVibes — demo](../assets/screenshots/feed-en.png)

![CoolVibes — demo](../assets/screenshots/profile-mobile-en.png)

[English technical guides](../guide/getting-started.md) · [Product scope](../guide/product.md) · [Architecture](../guide/architecture.md) · [Languages](../guide/localization.md) · [Screenshots](../guide/screenshots.md) · [GitBook](../guide/gitbook.md)
