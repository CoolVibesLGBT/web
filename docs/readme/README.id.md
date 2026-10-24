![CoolVibes](../../public/images/brand/dott-v3/wordmark.png)

# CoolVibes — Bahasa Indonesia

[English](../../README.md) · [नेपाली](README.ne.md) · [ខ្មែរ](README.km.md) · [Türkçe](README.tr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [العربية](README.ar.md) · [বাংলা](README.bn.md) · [فارسی](README.fa.md) · [עברית](README.he.md) · [हिन्दी](README.hi.md) · [繁體中文（香港）](README.hk.md) · [Bahasa Indonesia](README.id.md) · [日本語](README.ja.md) · [조선말](README.kp.md) · [한국어](README.kr.md) · [Polski](README.pl.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [ไทย](README.th.md) · [繁體中文（台灣）](README.tw.md) · [简体中文](README.zh.md) · [Download for VS Code](https://marketplace.visualstudio.com/items?itemName=CoolVibes.coolvibes-vscode-extension)

![CoolVibes — Bahasa Indonesia](../assets/heroes/id.jpg)

## Tentang proyek

CoolVibes menggabungkan media sosial, pertemanan, dan kencan untuk komunitas LGBTIQA+ serta pendukung yang menghormati komunitas, berusia 18 tahun ke atas. Repositori ini berisi klien web, terjemahan, ilustrasi, dan skenario uji lokal. API, basis data, dan pembayaran merupakan layanan terpisah.

## Fitur dan cakupan

Feed menyediakan postingan, foto, video, balasan, reaksi, markah, jajak pendapat, dan acara. Profil mencakup bio, minat, preferensi, pengikut, permintaan pertemanan, dan foto pribadi dengan izin akses. Pencarian, kecocokan, orang terdekat, peta, tempat, check-in, dan iklan komunitas membantu penemuan. Chat pribadi dan grup mendukung balasan, penerusan, pesan tersemat, media, stiker, dan GIF. Siaran langsung, dompet, rujukan, dan Premium bergantung pada layanan serta pengaturan fitur.

## Teknologi dan instalasi

Klien memakai React 19, TypeScript, dan Vite 8, bukan Next.js. Komponen lain meliputi router browser, i18next, Axios, Socket.IO, Lexical, daftar tervirtualisasi, Leaflet/MapLibre, dan Agora. Gunakan Yarn dan Node.js yang kompatibel dengan Vite. Perintah berikut biasanya membuka localhost:5173; API lokal di 4001 dan socket di 4002/4003.

```bash
yarn install --frozen-lockfile
yarn dev

# Checks
yarn lint
yarn build
node scripts/check-documentation.mjs
```

## Bahasa dan merek

Aplikasi memiliki 23 varian bahasa, termasuk Nepal dan Khmer. Setiap halaman bahasa memakai ilustrasi hero wilayahnya. Arab, Persia, dan Ibrani mendukung tata letak RTL. Identitas yang dipilih adalah dott-v3: tulisan CoolVibes, ikon CV, serta warna pirus/ungu. /brandkit menyediakan logo, ikon, sampul sosial, dan unduhan ZIP.

## Verifikasi dan kontribusi

Tangkapan layar berasal dari antarmuka nyata dengan profil fiktif lokal; tidak ada akun produksi atau pesan pribadi nyata yang digunakan. Uji browser bukan sertifikasi perangkat fisik, pembayaran, atau siaran langsung. Teks Nepal dan Khmer baru sebaiknya ditinjau penutur asli. Metadata menyebut ISC tetapi tidak ada teks lisensi di akar repositori; pastikan lisensi sebelum distribusi ulang. Panduan teknis bahasa Inggris menjelaskan layanan, batasan, dan impor GitBook.

![CoolVibes — demo](../assets/screenshots/feed-en.png)

![CoolVibes — demo](../assets/screenshots/profile-mobile-en.png)

[English technical guides](../guide/getting-started.md) · [Product scope](../guide/product.md) · [Architecture](../guide/architecture.md) · [Languages](../guide/localization.md) · [Screenshots](../guide/screenshots.md) · [GitBook](../guide/gitbook.md)
