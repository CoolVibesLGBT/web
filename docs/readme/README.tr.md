![CoolVibes](../../public/images/brand/dott-v3/wordmark.png)

# CoolVibes — Türkçe

[English](../../README.md) · [नेपाली](README.ne.md) · [ខ្មែរ](README.km.md) · [Türkçe](README.tr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [العربية](README.ar.md) · [বাংলা](README.bn.md) · [فارسی](README.fa.md) · [עברית](README.he.md) · [हिन्दी](README.hi.md) · [繁體中文（香港）](README.hk.md) · [Bahasa Indonesia](README.id.md) · [日本語](README.ja.md) · [조선말](README.kp.md) · [한국어](README.kr.md) · [Polski](README.pl.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [ไทย](README.th.md) · [繁體中文（台灣）](README.tw.md) · [简体中文](README.zh.md)

![CoolVibes — Türkçe](../assets/heroes/tr.jpg)

## Proje hakkında

CoolVibes, 18 yaş ve üzerindeki LGBTIQA+ topluluğu ve topluluğa saygı duyan kişiler için sosyal medya, arkadaşlık ve tanışma uygulamasıdır. Bu depo web arayüzünü, çevirileri, görselleri ve yerel test senaryolarını içerir. API, veritabanı ve ödeme altyapısı ayrı servislerdir.

## Özellikler ve kapsam

Akışta yazı, fotoğraf, video, yanıt, tepki, yer imi, anket ve etkinlik araçları bulunur. Profiller; biyografi, ilgi alanları, tercihler, takipçiler, arkadaşlık istekleri ve izin kontrollü özel fotoğrafları bir araya getirir. Arama, eşleşme, yakındaki kişiler, harita, mekânlar, check-in ve topluluk ilanları keşfi destekler. Özel/grup sohbetlerinde yanıt, yönlendirme, sabitleme, medya, çıkartma ve GIF araçları vardır. Canlı yayın, cüzdan, referans ödülleri ve Premium ekranları servis ve özellik bayraklarına bağlıdır.

## Teknoloji ve yerel kurulum

Arayüz React 19, TypeScript ve Vite 8 ile geliştirilmiştir; Next.js uygulaması değildir. Tarayıcı yönlendirmesi, i18next, Axios, Socket.IO, Lexical, sanallaştırılmış listeler, Leaflet/MapLibre ve Agora kullanılır. Yarn ve Vite ile uyumlu Node.js sürümü gerekir. Aşağıdaki komutlarla başlayın; varsayılan adres localhost:5173’tür. Yerel API 4001, socket servisleri 4002/4003 portlarında beklenir.

```bash
yarn install --frozen-lockfile
yarn dev

# Checks
yarn lint
yarn build
node scripts/check-documentation.mjs
```

## Diller ve marka

Uygulama 23 yerel ayar içerir; Nepalce ve Khmerce de arayüze eklenmiştir. Her dil sayfası uygulamanın ilgili hero görselini kullanır. Arapça, Farsça ve İbranice sağdan sola düzenleri destekler. Marka kimliği dott-v3’tür: CoolVibes yazı logosu, CV ikonu ve mor–turkuaz renkler. /brandkit sayfası logo, ikon, paylaşım kapağı ve ZIP indirmesi sunar.

## Doğrulama ve katkı

Ekran görüntüleri gerçek arayüzün yerel, kurgusal profillerle çekimleridir; üretim hesabı veya gerçek mesaj kullanılmaz. Tarayıcı testleri gerçek cihaz, ödeme veya canlı yayın başarısını kanıtlamaz. Yeni Nepalce/Khmerce metinlerin anadili konuşan kişilerce gözden geçirilmesi faydalıdır. Paket bilgisi ISC belirtir fakat kökte lisans metni yoktur; yeniden dağıtımdan önce lisansı doğrulayın. İngilizce teknik rehberler kurulum, servis sınırları ve GitBook içe aktarma ayrıntılarını içerir.

![CoolVibes — demo](../assets/screenshots/feed-en.png)

![CoolVibes — demo](../assets/screenshots/profile-mobile-en.png)

[English technical guides](../guide/getting-started.md) · [Product scope](../guide/product.md) · [Architecture](../guide/architecture.md) · [Languages](../guide/localization.md) · [Screenshots](../guide/screenshots.md) · [GitBook](../guide/gitbook.md)
