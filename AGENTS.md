# Repository Guidelines

## Project Structure & Module Organization
This is a Vite + React + TypeScript frontend app. Main code lives in `src/`:
- `src/entry/`, `src/router/`, `src/App.tsx`: providers, browser routing and application shell.
- `src/features/`: domain areas (`auth`, `editor`, `map`, `profile`, etc.).
- `src/components/` and `src/components/ui/`: reusable UI building blocks.
- `src/contexts/`, `src/hooks/`, `src/services/`, `src/helpers/`: shared app logic.
- `src/locales/`: translation files by language code.
- `public/`: static assets served as-is.
- `dist/`: production build output (generated; do not edit manually).

**Imports:** Prefer the `@/` path alias for `src/` (e.g. `import { api } from '@/services'`, `import { useAuth } from '@/contexts/AuthContext'`) to avoid deep relative paths. Existing relative imports remain valid.

## Build, Test, and Development Commands
- `npm run dev` (or `yarn dev`): start local Vite dev server.
- `npm run build`: run lint, then create the optimized production bundle in `dist/`.
- `npm run start`: run the production server locally.
- `npm run lint`: run ESLint for `ts/tsx` sources.

Use one package manager consistently per change. Since `yarn.lock` is present, prefer Yarn in CI and local workflows.

## Coding Style & Naming Conventions
- Language: TypeScript (`.ts`/`.tsx`) with React functional components.
- Indentation and formatting: follow existing file style; many files currently use 2-space style and no semicolons.
- Components and context providers: `PascalCase` (example: `ThemeProvider.tsx`).
- Hooks: `useXxx` naming (example: `useInfiniteScroll.ts`).
- Feature and utility files: clear, domain-based names (`placesApi.ts`, `appSettings.tsx`).
- Linting: `eslint.config.js` with `typescript-eslint` and `react-hooks` rules (Next.js compatible).

## Testing Guidelines
No automated test framework is currently configured in `package.json`. For contributions:
- run `npm run lint` before opening a PR,
- verify key user flows manually in `npm run dev`,
- include reproduction and verification steps in the PR description.

If tests are introduced later, place them near related modules (for example, `src/features/map/__tests__/`).

## Commit & Pull Request Guidelines
Git history currently favors short, simple commit titles (for example: `fixes`, `language support`). Prefer clearer, imperative summaries such as:
- `fix map marker clustering on zoom`
- `add Turkish locale editor labels`

For pull requests:
- describe scope and rationale,
- link related issue(s),
- include screenshots/GIFs for UI changes,
- list manual verification steps,
- keep changes focused and avoid unrelated refactors.

## Binding Interface Standard

This standard supersedes older visual references to pixel matching the sibling UIKit demo. It applies to every route and subflow in this web repository. The user requested Apple visual design and typography while retaining web/Android browser behavior; this is not a native iOS app migration. Do not use an iOS simulator or capture screenshots for this task; the user explicitly requested direct implementation and review in the running web app.

- Use the system font stack in `src/styles/interface.css`: San Francisco automatically on Apple devices, the platform system font elsewhere. Never download or embed proprietary Apple fonts. Body 17px/1rem, supporting copy 15px, captions at least 13px, navigation titles 17px semibold, section titles 20px and large page titles 34px. Express new sizes in rem. Avoid decorative uppercase, wide tracking and black weights for UI copy.
- Use `ViewTabs` for view/category navigation: it measures actual labels, pins the selected view and moves overflow into the shared sheet without shrinking text. Keep the existing selection callbacks, permissions and feature gates.
- Use shared `Interface.tsx` controls: `NavigationBar`, `GroupedSection`, `ListRow`, `FormField`, `Sheet` and `AppTabBar`. Keep existing API calls, access checks, feature flags, routes and user preferences intact.
- Use five or fewer visible tab destinations, with names and selected state. Put content creation in a toolbar, not a tab. Expose the full destination list through the More sheet and desktop sidebar. Navigation options are rows, not large illustrated buttons.
- Preserve the two login/register choice cards as the authentication entry point. Back returns to those cards. Do not bypass them from the landing, join or legal buttons.
- Use semantic surfaces, grouped lists, inset separators and modest 10–20px radii. Keep real brand illustrations, photos and domain artwork; use existing vector icons for standard navigation/control actions. Do not substitute emoji or new random artwork for missing assets.
- Use native HTML inputs, selects, buttons and dialogs. `Sheet` supplies modal focus containment, inert background, Escape and focus restoration through `<dialog>`. Never fake UIKit controls or replace the browser Back/edge-swipe behavior with custom gestures.
- Share field labels, accessible descriptions/errors and keyboard/autocomplete settings. Form actions and active inputs must remain reachable when the visual viewport shrinks. Do not autofocus fields on touch entry.
- Use at least 44px touch targets, visible keyboard focus, logical alignment, safe-area insets, zoomable rem typography and reduced-motion/transparency support. Respect dark mode and all supported locales; localize new visible strings everywhere.
- Retain existing virtualization and pagination. Long data lists must use `react-virtuoso` or an existing virtualized collection, not render every fetched record into a scrolling div.
- Record routes, subflows, actual asset availability and visual verification in `docs/interface-inventory.json` and `docs/interface-audit.md`. A successful build or shared stylesheet does not verify an unseen subflow. Mark fixture-only, empty, gated, unvisited and live-service-dependent states honestly.
- When browser checks are requested, verify at small/large phone, tablet and desktop widths; include Turkish, English, Arabic/RTL, dark mode, enlarged text, keyboard/focus and scrolling. Browser emulation is not a real-device test. Do not claim an unseen screen or live payment/media action has passed.

### Runtime regression checks

`yarn build` runs ESLint before bundling. The local `interface/jsx-no-undef` rule rejects missing JSX imports such as an undeclared `<Brand />`. Run `node scripts/check-interface-regressions.mjs` for that regression and tab-fit invariants. Render failures are contained by the route/root error boundaries; never replace an authentication/server failure with a false success.
