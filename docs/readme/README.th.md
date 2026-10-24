![CoolVibes](../../public/images/brand/dott-v3/wordmark.png)

# CoolVibes — ไทย

[English](../../README.md) · [नेपाली](README.ne.md) · [ខ្មែរ](README.km.md) · [Türkçe](README.tr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [العربية](README.ar.md) · [বাংলা](README.bn.md) · [فارسی](README.fa.md) · [עברית](README.he.md) · [हिन्दी](README.hi.md) · [繁體中文（香港）](README.hk.md) · [Bahasa Indonesia](README.id.md) · [日本語](README.ja.md) · [조선말](README.kp.md) · [한국어](README.kr.md) · [Polski](README.pl.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [ไทย](README.th.md) · [繁體中文（台灣）](README.tw.md) · [简体中文](README.zh.md) · [Download for VS Code](https://marketplace.visualstudio.com/items?itemName=CoolVibes.coolvibes-vscode-extension)

![CoolVibes — ไทย](../assets/heroes/th.jpg)

## เกี่ยวกับโครงการ

CoolVibes เป็นเว็บแอปสำหรับสังคมออนไลน์ มิตรภาพ และการหาคู่ของชุมชน LGBTIQA+ และผู้สนับสนุนที่เคารพชุมชน อายุ 18 ปีขึ้นไป คลังนี้มีส่วนติดต่อเว็บ คำแปล ภาพประกอบ และการทดสอบภายใน ส่วน API ฐานข้อมูล และการชำระเงินเป็นบริการแยกต่างหาก

## คุณสมบัติและขอบเขต

ฟีดมีโพสต์ รูปภาพ วิดีโอ คำตอบ ปฏิกิริยา บุ๊กมาร์ก แบบสำรวจ และกิจกรรม โปรไฟล์รวมประวัติ ความสนใจ ความชอบ ผู้ติดตาม คำขอเป็นเพื่อน และรูปส่วนตัวที่ควบคุมสิทธิ์ การค้นหา การจับคู่ ผู้คนใกล้เคียง แผนที่ สถานที่ เช็กอิน และประกาศช่วยค้นพบชุมชน แชตส่วนตัวและกลุ่มรองรับการตอบกลับ ส่งต่อ ปักหมุด สื่อ สติกเกอร์ และ GIF ไลฟ์ กระเป๋าเงิน การแนะนำเพื่อน และ Premium ขึ้นอยู่กับบริการและการเปิดใช้คุณสมบัติ

## เทคโนโลยีและการเริ่มต้น

แอปใช้ React 19, TypeScript, Vite 8 รวมถึง i18next, Axios, Socket.IO, Lexical, รายการเสมือน, Leaflet/MapLibre และ Agora ต้องมี Yarn และ Node.js ที่เข้ากับ Vite คำสั่งด้านล่างมักเปิด localhost:5173 ส่วน API ภายในใช้ 4001 และ socket ใช้ 4002/4003

```bash
yarn install --frozen-lockfile
yarn dev

# Checks
yarn lint
yarn build
node scripts/check-documentation.mjs
```

## ภาษาและแบรนด์

มีภาษาและรูปแบบภูมิภาค 23 แบบ รวมภาษาเนปาลและเขมร แต่ละหน้าภาษาใช้ภาพหลักของภูมิภาคนั้น ภาษาอาหรับ เปอร์เซีย และฮีบรูรองรับการจัดวางจากขวาไปซ้าย แบรนด์ที่เลือกคือ dott-v3 ประกอบด้วยตัวอักษร CoolVibes ไอคอน CV และสีเทอร์ควอยซ์กับม่วง /brandkit มีโลโก้ ไอคอน ภาพแชร์ และ ZIP

## การตรวจสอบและการมีส่วนร่วม

ภาพหน้าจอเป็นส่วนติดต่อจริงที่ใช้โปรไฟล์สมมติภายใน ไม่มีบัญชีจริงหรือข้อความส่วนตัวจริง การทดสอบเบราว์เซอร์ไม่ยืนยันอุปกรณ์จริง การชำระเงิน หรือไลฟ์ คำแปลใหม่ยังต้องตรวจโดยเจ้าของภาษา ข้อมูลแพ็กเกจระบุ ISC แต่ไม่มีข้อความใบอนุญาตที่รากโครงการ จึงควรตรวจสอบก่อนแจกจ่ายต่อ คู่มือภาษาอังกฤษอธิบายสถาปัตยกรรม บริการ การทดสอบ และการนำเข้า GitBook

![CoolVibes — demo](../assets/screenshots/feed-en.png)

![CoolVibes — demo](../assets/screenshots/profile-mobile-en.png)

[English technical guides](../guide/getting-started.md) · [Product scope](../guide/product.md) · [Architecture](../guide/architecture.md) · [Languages](../guide/localization.md) · [Screenshots](../guide/screenshots.md) · [GitBook](../guide/gitbook.md)
