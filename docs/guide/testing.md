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

## Browser fixtures

Run the local app at `http://localhost:5173`, then:

```bash
yarn check:telegram-ui
# Or select suites:
yarn check:telegram-ui profile-tabs appearance posts
```

The suites in `scripts/telegram-ui/` intercept API requests and exercise actual React screens. They cover groups, attachments, stickers, profile permissions, appearance and other composed flows. See [reference mapping](../telegram-ui-reference.md) and the JSON evidence files under `docs/` for exact coverage.

## Documentation captures

```bash
node scripts/capture-readme.mjs
# DOM checks for the new locale selection/persistence flows
node scripts/check-documentation-locales.mjs
```

The documentation request explicitly authorizes these screenshots. The capture script blocks external traffic, uses fictional local API fixtures and never creates backend users. It reuses the existing browser fixture layer. Chrome is used by default on macOS; a different installed channel can be selected through `PLAYWRIGHT_CHANNEL`.

Browser emulation is not a real-device test. Screenshots do not prove payment success, email delivery, moderation response time or live media reliability. Record fixture-only and live-service-dependent states honestly.

## Contributions

Follow [AGENTS.md](../../AGENTS.md). Prefer Yarn, the `@/` alias, shared controls and existing feature modules. Preserve authentication, access checks, localized labels, native browser behavior and list virtualization. Add reproduction/verification steps to pull requests. Include screenshots only where authorized for the task. Do not commit credentials or real member data.
