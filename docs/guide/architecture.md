# Architecture and integrations

## Application flow

`src/main.tsx` mounts the React application. `src/entry/` supplies the root/provider composition, `src/router/` implements browser-history navigation, and `src/App.tsx` chooses route screens and application shell behavior. Public pages have their own header/footer composition; authenticated screens retain permission and feature gates.

Screens compose domain modules from `src/features/` and shared primitives from `src/components/ui/`. Authentication, themes, settings, sockets and other shared state live in contexts/hooks. HTTP/API actions and response types live in `src/services/`. This is a client-rendered Vite application, not a Next.js server application.

## Important boundaries

- **Frontend → API:** account state, posts, profiles, media access, memberships, listings, wallet and referral data. Server permissions remain authoritative.
- **Frontend → sockets:** real-time chat/activity; local defaults are ports 4002 and 4003.
- **Frontend → RTC provider:** Agora media connections require valid server-issued tokens and browser permissions.
- **Frontend → assets:** packaged artwork, avatars/icons, Roboto fonts, patterns and animation resources under `public/`.
- **Frontend → localization:** i18next uses common/auth/landing/legal JSON; server catalogs can carry their own labels.
- **Frontend → browser:** native inputs/dialogs, Back navigation, downloads, geolocation, camera/microphone and notification permissions.

## Rendering and performance

Existing large lists use React Virtuoso or other established virtualized collections with pagination. Route/root error boundaries contain render failures; content loading uses RouteLoader rather than forced splash modals. The Lexical editor supports richer post composition. Maps use Leaflet/React Leaflet and MapLibre where appropriate.

## Styling and assets

Shared interface foundations and panels implement the project's Telegram visual reference. Product illustration and logo assets use the separately selected dott-v3 art direction. Do not replace API behavior with mock success states or confuse a screenshot with verification of a live backend workflow.

[Repository map](../../README.md#repository-map) · [Interface audit](../interface-audit.md)
