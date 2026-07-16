# Repository Guidelines

## Project Structure & Module Organization
This is a Next.js (App Router) + React + TypeScript frontend app. Main code lives in `src/`:
- `src/app/`: Next.js App Router entry points (layout, head, catch-all route).
- `src/features/`: domain areas (`auth`, `editor`, `map`, `profile`, etc.).
- `src/components/` and `src/components/ui/`: reusable UI building blocks.
- `src/contexts/`, `src/hooks/`, `src/services/`, `src/helpers/`: shared app logic.
- `src/locales/`: translation files by language code.
- `public/`: static assets served as-is.
- `.next/`: production build output (generated; do not edit manually).

**Imports:** Prefer the `@/` path alias for `src/` (e.g. `import { api } from '@/services'`, `import { useAuth } from '@/contexts/AuthContext'`) to avoid deep relative paths. Existing relative imports remain valid.

## Build, Test, and Development Commands
- `npm run dev` (or `yarn dev`): start local Next.js dev server.
- `npm run build`: create optimized production bundle in `.next/`.
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
