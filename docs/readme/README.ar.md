![CoolVibes](../../public/images/brand/dott-v3/wordmark.png)

# CoolVibes — العربية

[English](../../README.md) · [नेपाली](README.ne.md) · [ខ្មែរ](README.km.md) · [Türkçe](README.tr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [العربية](README.ar.md) · [বাংলা](README.bn.md) · [فارسی](README.fa.md) · [עברית](README.he.md) · [हिन्दी](README.hi.md) · [繁體中文（香港）](README.hk.md) · [Bahasa Indonesia](README.id.md) · [日本語](README.ja.md) · [조선말](README.kp.md) · [한국어](README.kr.md) · [Polski](README.pl.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [ไทย](README.th.md) · [繁體中文（台灣）](README.tw.md) · [简体中文](README.zh.md) · [Download for VS Code](https://marketplace.visualstudio.com/items?itemName=CoolVibes.coolvibes-vscode-extension)

![CoolVibes — العربية](../assets/heroes/ar.jpg)

## عن المشروع

CoolVibes تطبيق للتواصل الاجتماعي والصداقة والتعارف لمجتمع LGBTIQA+ وحلفائه المحترمين، للأشخاص بعمر 18 عاماً فأكثر. يضم هذا المستودع واجهة الويب والترجمات والرسومات واختبارات محلية. تعمل واجهة API وقاعدة البيانات وخدمات الدفع بشكل منفصل.

## المزايا والنطاق

يشمل الموجز منشورات وصوراً وفيديو وردوداً وتفاعلات وإشارات مرجعية واستطلاعات وفعاليات. تضم الملفات الشخصية النبذة والاهتمامات والتفضيلات والمتابعين وطلبات الصداقة والصور الخاصة الخاضعة للأذونات. تدعم الخرائط والأماكن وتسجيل الزيارة والبحث والتطابقات والإعلانات اكتشاف المجتمع. توفر المحادثات الفردية والجماعية الرد وإعادة التوجيه والتثبيت والوسائط والملصقات وGIF. يعتمد البث المباشر والمحفظة والإحالات وPremium على الخدمات وإعدادات الميزات.

## التقنية والتشغيل

تستخدم الواجهة React 19 وTypeScript وVite 8، مع i18next وAxios وSocket.IO وLexical وقوائم افتراضية وLeaflet/MapLibre وAgora. يلزم Yarn وإصدار Node.js متوافق مع Vite. تشغّل الأوامر أدناه الموقع عادة على localhost:5173؛ تستخدم API المحلية المنفذ 4001 وخدمات socket المنفذين 4002/4003.

```bash
yarn install --frozen-lockfile
yarn dev

# Checks
yarn lint
yarn build
node scripts/check-documentation.mjs
```

## اللغات والهوية

تتوفر 23 صيغة لغوية تشمل النيبالية والخميرية. تستخدم كل صفحة رسمة رئيسية مرتبطة بلغتها. تدعم العربية والفارسية والعبرية اتجاه اليمين إلى اليسار. الهوية المعتمدة هي dott-v3: شعار CoolVibes الكتابي وأيقونة CV وألوان فيروزية وبنفسجية. يوفر /brandkit الشعارات والأيقونات وصورة المشاركة وملف ZIP.

## التحقق والمساهمة

الصور لواجهة التطبيق الحقيقية بملفات وهمية محلية، دون إنشاء حسابات إنتاجية أو استخدام رسائل خاصة حقيقية. لا تثبت اختبارات المتصفح عمل المدفوعات والبث والأجهزة الفعلية. تحتاج الترجمات الجديدة إلى مراجعة متحدثين أصليين. تشير بيانات الحزمة إلى ISC لكن نص الترخيص الرئيسي غير موجود؛ تحقق منه قبل إعادة التوزيع. توضح الأدلة الإنجليزية البنية والخدمات والاستيراد إلى GitBook.

![CoolVibes — demo](../assets/screenshots/feed-en.png)

![CoolVibes — demo](../assets/screenshots/profile-mobile-en.png)

[English technical guides](../guide/getting-started.md) · [Product scope](../guide/product.md) · [Architecture](../guide/architecture.md) · [Languages](../guide/localization.md) · [Screenshots](../guide/screenshots.md) · [GitBook](../guide/gitbook.md)
