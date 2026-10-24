import { spawn } from 'node:child_process';

try { const response = await fetch('http://localhost:5173'); if (!response.ok) throw new Error(); }
catch { throw new Error('Start the local web app with yarn dev on port 5173 before running the UI checks.'); }
const suites = ['groups', 'stickers', 'profile', 'gifs', 'forward', 'appearance', 'actions', 'compose', 'lists', 'members', 'photos', 'profile-tabs', 'group-row', 'profile-catalog', 'discovery', 'posts', 'empty-states', 'view-once', 'transitions'];
const requested = process.argv.slice(2);
for (const suite of requested) if (!suites.includes(suite)) throw new Error(`Unknown UI suite: ${suite}`);
for (const suite of requested.length ? requested : suites) {
 const status = await new Promise(resolve => {
  const child = spawn(process.execPath, [`scripts/telegram-ui/${suite}.mjs`], { stdio: 'inherit', env: process.env });
  child.on('error', () => resolve(1)); child.on('exit', code => resolve(code ?? 1));
 });
 if (status !== 0) process.exit(status);
}
console.log('Telegram UI fixtures passed. Live Telegram login and real-device behavior are separate checks.');
