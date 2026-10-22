![CoolVibes](../../public/images/brand/dott-v3/wordmark.png)

# CoolVibes — Polski

[English](../../README.md) · [नेपाली](README.ne.md) · [ខ្មែរ](README.km.md) · [Türkçe](README.tr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [العربية](README.ar.md) · [বাংলা](README.bn.md) · [فارسی](README.fa.md) · [עברית](README.he.md) · [हिन्दी](README.hi.md) · [繁體中文（香港）](README.hk.md) · [Bahasa Indonesia](README.id.md) · [日本語](README.ja.md) · [조선말](README.kp.md) · [한국어](README.kr.md) · [Polski](README.pl.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [ไทย](README.th.md) · [繁體中文（台灣）](README.tw.md) · [简体中文](README.zh.md)

![CoolVibes — Polski](../assets/heroes/pl.jpg)

## O projekcie

CoolVibes łączy sieć społecznościową, przyjaźń i randki dla społeczności LGBTIQA+ oraz szanujących ją sojuszników od 18. roku życia. Repozytorium zawiera klienta webowego, tłumaczenia, ilustracje i lokalne scenariusze testowe. API, baza danych i płatności są osobnymi usługami.

## Funkcje i zakres

Strumień obejmuje posty, zdjęcia, filmy, odpowiedzi, reakcje, zakładki, ankiety i wydarzenia. Profile zawierają biografię, zainteresowania, preferencje, obserwujących, zaproszenia do znajomych i prywatne zdjęcia z kontrolą dostępu. Wyszukiwanie, dopasowania, osoby w pobliżu, mapy, miejsca, zameldowania i ogłoszenia wspierają odkrywanie społeczności. Czaty prywatne i grupowe mają odpowiedzi, przekazywanie, przypięcia, multimedia, naklejki i GIF-y. Transmisje, portfel, polecenia i Premium zależą od usług i flag funkcji.

## Technologia i uruchomienie

Klient używa React 19, TypeScript i Vite 8, nie Next.js. Korzysta z routingu przeglądarki, i18next, Axios, Socket.IO, Lexical, list wirtualizowanych, Leaflet/MapLibre i Agora. Użyj Yarn i Node.js zgodnego z Vite. Polecenia poniżej zwykle uruchamiają localhost:5173. Lokalne API działa na 4001, a sockety na 4002/4003.

```bash
yarn install --frozen-lockfile
yarn dev

# Checks
yarn lint
yarn build
node scripts/check-documentation.mjs
```

## Języki i marka

Aplikacja obejmuje 23 warianty językowe, w tym nepalski i khmerski. Każda strona językowa używa regionalnej ilustracji. Arabski, perski i hebrajski obsługują RTL. Wybrana identyfikacja dott-v3 obejmuje napis CoolVibes, ikonę CV oraz turkus i fiolet. /brandkit udostępnia logo, ikony, okładkę społecznościową i ZIP.

## Weryfikacja i współpraca

Zrzuty przedstawiają rzeczywisty interfejs z fikcyjnymi lokalnymi profilami; nie używamy kont produkcyjnych ani prywatnych wiadomości. Testy przeglądarkowe nie potwierdzają działania na prawdziwych urządzeniach, płatności ani transmisji. Nowe tłumaczenia nepalskie i khmerskie warto poddać ocenie rodzimych użytkowników. Metadane wskazują ISC, ale brak głównego tekstu licencji; sprawdź ją przed redystrybucją. Angielskie poradniki opisują usługi i import GitBook.

![CoolVibes — demo](../assets/screenshots/feed-en.png)

![CoolVibes — demo](../assets/screenshots/profile-mobile-en.png)

[English technical guides](../guide/getting-started.md) · [Product scope](../guide/product.md) · [Architecture](../guide/architecture.md) · [Languages](../guide/localization.md) · [Screenshots](../guide/screenshots.md) · [GitBook](../guide/gitbook.md)
