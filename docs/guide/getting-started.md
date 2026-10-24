# Getting started

[Download CoolVibes for VS Code](https://marketplace.visualstudio.com/items?itemName=CoolVibes.coolvibes-vscode-extension)

## Requirements

Use Yarn Classic with `yarn.lock` and a Node release supported by the installed Vite version: `^20.19.0 || >=22.12.0`. Node 22.12+ on the 22.x line is a suitable baseline. Browser tests require Playwright and a compatible browser.

```bash
yarn install --frozen-lockfile
yarn dev
```

Vite normally starts on `http://localhost:5173`. Use the port printed by the process. Public routes are `/landing`, `/legal`, and `/brandkit`; account-dependent routes require the separate API.

## Services and configuration

[`src/appSettings.tsx`](../../src/appSettings.tsx) selects API/socket endpoints from the browser hostname and optional extension runtime configuration. Local defaults are `http://localhost:4001`, `ws://localhost:4002`, and `ws://localhost:4003`. Known CoolVibes domains have their own mappings. [`src/platform/runtime.ts`](../../src/platform/runtime.ts) defines optional host-injected runtime settings.

`.env.example` currently lists `VITE_API_URL`, `VITE_SOCKET_URL`, and `VITE_RECAPTCHA_SITE_KEY`, but the endpoint and reCAPTCHA code does **not currently read these variables**. Copying the file alone will not override those values. Inspect and adapt the actual configuration sources for your environment. Never place private service credentials in browser code.

Feature defaults are in [`src/config/featureFlags.ts`](../../src/config/featureFlags.ts): live is enabled; premium membership and advertising switches default off. Local `ff.*`/`featureFlags` overrides exist. The code also names `PUBLIC_FF_*` environment keys, but the current Vite configuration does not expose a custom `PUBLIC_` prefix. Do not assume those variables are wired into the bundle without further configuration.

The backend and database are not part of this repository. Use your own authorized development services or the isolated UI fixtures. No production account is required for the documentation capture script.

## Build and preview

```bash
yarn lint
yarn build
yarn start
```

The build runs ESLint and generates `dist/`. Preview commonly uses port 4173; use the printed address. `yarn start` is Vite preview, not a production web server.

## Hosting

Serve `dist/` through a static host/CDN or web server. Configure unknown app paths to return `index.html` so direct navigation to routes such as `/brandkit` or `/settings/appearance` works. Serve actual asset files normally. Configure backend endpoints, CORS, HTTPS and websocket routing for the deployment environment. The service worker currently has caching disabled; do not present the application as a fully offline client.

[Return to overview](../../README.md)
