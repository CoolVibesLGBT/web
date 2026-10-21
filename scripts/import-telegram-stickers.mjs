// Imports public sticker sets through this project's own Telegram bot.
// Never writes bot tokens, download URLs, file IDs, access hashes or account data.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const envIndex = args.indexOf('--env');
if (envIndex !== -1) {
 const env = await fs.readFile(args[envIndex + 1], 'utf8');
 const line = env.split('\n').find(line => /^TELEGRAM_BOT_TOKEN\s*=/.test(line));
 if (line && !process.env.TELEGRAM_BOT_TOKEN) process.env.TELEGRAM_BOT_TOKEN = line.slice(line.indexOf('=') + 1).trim().replace(/^(['"])(.*)\1$/, '$2');
 args.splice(envIndex, 2);
}
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('Set TELEGRAM_BOT_TOKEN or pass --env <project env file>');
const names = args.length ? args : ['UtyaDuck', 'HotCherry', 'TidyTieTom', 'Animals', 'Bunnyta', 'MelieTheCavy', 'OfficeTurkey', 'ResistanceDog', 'TheFoods', 'Utya3D', 'VitaminParty'];
if (names.some(name => !/^[a-zA-Z0-9_]{1,64}$/.test(name))) throw new Error('Invalid public sticker set name');
async function api(method, body) {
 const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) });
 const data = await response.json();
 if (!response.ok || !data.ok) throw new Error(`Telegram ${method} failed (${response.status})`);
 return data.result;
}
const directory = path.join(root, 'public/animations/telegram/packs');
await fs.mkdir(directory, { recursive: true });
const packs = [];
for (const name of names) {
 const set = await api('getStickerSet', { name });
 const documents = new Array(set.stickers.length);
 let cursor = 0;
 await Promise.all(Array.from({ length: 3 }, async () => {
  while (cursor < set.stickers.length) {
   const index = cursor++, sticker = set.stickers[index];
   if (sticker.type !== 'regular') continue;
   const format = sticker.is_animated ? 'tgs' : sticker.is_video ? 'webm' : 'webp';
   const id = createHash('sha256').update(sticker.file_unique_id).digest('hex').slice(0, 16);
   const filename = `${id}.${format}`, destination = path.join(directory, filename);
   if (!(await fs.stat(destination).catch(() => null))) {
    const file = await api('getFile', { file_id: sticker.file_id });
    const response = await fetch(`https://api.telegram.org/file/bot${token}/${file.file_path}`, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`Sticker download failed (${response.status})`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || bytes.length > 2097152) throw new Error('Invalid sticker size');
    await fs.writeFile(destination, bytes);
   }
   documents[index] = { kind: 'sticker', id, url: `/animations/telegram/packs/${filename}`, emoji: sticker.emoji || '', width: sticker.width, height: sticker.height, pack: set.name, format };
  }
 }));
 packs.push({ id: set.name, title: set.title, documents: documents.filter(Boolean) });
 console.log(`${set.name}: ${documents.filter(Boolean).length} public stickers`);
}
await fs.writeFile(path.join(root, 'src/features/emoticons/sticker-packs.json'), JSON.stringify(packs, null, 2) + '\n');
console.log(`Imported ${packs.reduce((n, pack) => n + pack.documents.length, 0)} stickers; no Telegram credentials included.`);
