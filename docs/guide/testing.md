# Testing and contribution

## Routine checks

```bash
yarn lint
yarn build
node scripts/check-interface-regressions.mjs
node scripts/check-public-locales.mjs
node scripts/check-documentation.mjs
```

The build runs lint before bundling. The interface regression script checks JSX bindings and adaptive tab-fit invariants. Locale checks validate keys and interpolation variables. Documentation checks validate local links, hero assets and language coverage.

## Documentation captures

```bash
node scripts/capture-readme.mjs
# DOM checks for the new locale selection/persistence flows
node scripts/check-documentation-locales.mjs
```

The capture script blocks external traffic, uses fictional local API fixtures and never creates backend users. It reuses the existing browser fixture layer. Chrome is used by default on macOS; a different installed channel can be selected through `PLAYWRIGHT_CHANNEL`.

Browser emulation is not a real-device test. Screenshots do not prove payment success, email delivery, moderation response time or live media reliability. Record fixture-only and live-service-dependent states honestly.

## Contributions

Prefer Yarn, the `@/` alias, shared controls and existing feature modules. Preserve authentication, access checks, localized labels, native browser behavior and list virtualization. Add reproduction/verification steps to pull requests. Do not commit credentials or real member data.
