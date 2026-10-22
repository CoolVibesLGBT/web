![CoolVibes](../../public/images/brand/dott-v3/wordmark.png)

# CoolVibes — हिन्दी

[English](../../README.md) · [नेपाली](README.ne.md) · [ខ្មែរ](README.km.md) · [Türkçe](README.tr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [العربية](README.ar.md) · [বাংলা](README.bn.md) · [فارسی](README.fa.md) · [עברית](README.he.md) · [हिन्दी](README.hi.md) · [繁體中文（香港）](README.hk.md) · [Bahasa Indonesia](README.id.md) · [日本語](README.ja.md) · [조선말](README.kp.md) · [한국어](README.kr.md) · [Polski](README.pl.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [ไทย](README.th.md) · [繁體中文（台灣）](README.tw.md) · [简体中文](README.zh.md)

![CoolVibes — हिन्दी](../assets/heroes/hi.jpg)

## परियोजना के बारे में

CoolVibes, 18 वर्ष और उससे अधिक उम्र के LGBTIQA+ समुदाय तथा सम्मानजनक सहयोगियों के लिए सोशल मीडिया, दोस्ती और डेटिंग का वेब ऐप है। इस रिपॉज़िटरी में वेब इंटरफ़ेस, अनुवाद, चित्र और स्थानीय परीक्षण शामिल हैं। API, डेटाबेस और भुगतान सेवाएँ अलग हैं।

## सुविधाएँ और दायरा

फ़ीड में पोस्ट, तस्वीरें, वीडियो, जवाब, प्रतिक्रियाएँ, बुकमार्क, सर्वेक्षण और आयोजन हैं। प्रोफ़ाइल में परिचय, रुचियाँ, प्राथमिकताएँ, फ़ॉलोअर, मित्र अनुरोध और अनुमति वाले निजी फ़ोटो शामिल हैं। खोज, मैच, आस-पास के लोग, नक्शे, स्थान, चेक-इन और सामुदायिक विज्ञापन लोगों को जोड़ते हैं। निजी और समूह चैट में जवाब, फ़ॉरवर्ड, पिन, मीडिया, स्टिकर और GIF हैं। लाइव प्रसारण, वॉलेट, रेफ़रल और Premium सेवाओं व फ़ीचर सेटिंग पर निर्भर हैं।

## तकनीक और शुरुआत

ऐप React 19, TypeScript और Vite 8 पर बना है। i18next, Axios, Socket.IO, Lexical, वर्चुअल सूचियाँ, Leaflet/MapLibre और Agora भी उपयोग होते हैं। Yarn और Vite-संगत Node.js चाहिए। नीचे दिए आदेश सामान्यतः localhost:5173 पर ऐप शुरू करते हैं। स्थानीय API का पोर्ट 4001 और socket के पोर्ट 4002/4003 हैं।

```bash
yarn install --frozen-lockfile
yarn dev

# Checks
yarn lint
yarn build
node scripts/check-documentation.mjs
```

## भाषाएँ और पहचान

ऐप में नेपाली और खमेर सहित 23 भाषा रूप हैं। प्रत्येक भाषा पृष्ठ अपना क्षेत्रीय मुख्य चित्र उपयोग करता है। अरबी, फ़ारसी और हिब्रू में दाएँ से बाएँ लेआउट है। चुनी गई dott-v3 पहचान में CoolVibes शब्दचिह्न, CV आइकन और फ़िरोज़ी-बैंगनी रंग हैं। /brandkit पर लोगो, आइकन, सोशल कवर और ZIP मिलते हैं।

## जाँच और योगदान

स्क्रीनशॉट असली इंटरफ़ेस में स्थानीय काल्पनिक प्रोफ़ाइल दिखाते हैं; वास्तविक खाते या निजी संदेश उपयोग नहीं किए गए। ब्राउज़र परीक्षण वास्तविक उपकरणों, भुगतान या लाइव प्रसारण का प्रमाण नहीं हैं। नए अनुवादों की मूल वक्ताओं से समीक्षा बाकी है। पैकेज मेटाडेटा ISC बताता है, लेकिन मुख्य लाइसेंस पाठ नहीं है; पुनर्वितरण से पहले पुष्टि करें। अंग्रेज़ी गाइड सेवाओं, संरचना और GitBook आयात को समझाते हैं।

![CoolVibes — demo](../assets/screenshots/feed-en.png)

![CoolVibes — demo](../assets/screenshots/profile-mobile-en.png)

[English technical guides](../guide/getting-started.md) · [Product scope](../guide/product.md) · [Architecture](../guide/architecture.md) · [Languages](../guide/localization.md) · [Screenshots](../guide/screenshots.md) · [GitBook](../guide/gitbook.md)
