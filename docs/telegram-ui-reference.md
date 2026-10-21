# Telegram source contract

The user's shared reference is `/Users/ersanyakit/Downloads/tweb-master`. This applies across the web app: colors, typography, icons, input borders, radius, shadows, hover/press states, spacing and composition. It supersedes older Apple appearance values. One instruction covers these properties; they do not need to be requested separately for each screen.

Suggested reusable instruction:

> Use `/Users/ersanyakit/Downloads/tweb-master` as the visual and interaction reference for the entire web app. Read its implementation. Adapt its shared controls, colors, typography, icons, borders, shadows, spacing and state behavior to our React application and existing APIs. Verify populated, empty, loading, failed, disabled, hover, keyboard and touch states. Include light/dark themes, small/large viewports, enlarged text and RTL. Record unverified or externally dependent flows explicitly. A stylesheet change or passing build does not establish that every screen is identical.

## Source mapping

Paths in the first column are relative to the supplied reference's `src/`.

| Reference | CoolVibes adaptation |
| --- | --- |
| `scss/variables.scss`, `scss/fonts/_roboto.scss` | `styles/telegram-foundation.css`, `styles/telegram-fonts.css`, `public/fonts/telegram/`; source font sizes normalized from 16px to this app's 17px rem baseline |
| `scss/partials/_section.scss`, `_input.scss`, `_button.scss` | Shared `Interface.tsx` controls; section/row spacing, floating field labels, source hover and inset focus styles |
| `scss/partials/popups/_popup.scss`, button menus | Shared native `Sheet`, `Popover`, confirmation and forward components; backdrop, surface, radius and shadows |
| `scss/partials/_themes.scss`, `components/chatThemesPicker.tsx`, theme/color helpers | Nine theme cards, four base appearances, 49 accent choices, original wallpaper patterns and mesh gradient renderer; `ThemeContext` applies saved settings to app and chat variables |
| `scss/partials/_chatBubble.scss`, `_chatTopbar.scss`, `_chatlist.scss`, `_chat.scss` | `MessagesScreen`, chat styles and original tgico SVGs; bubble grouping/tails, metadata, composer helpers, menus and list rows |
| `components/emoticonsDropdown/`, `lib/appManagers/appStickersManager.ts` | Shared `EmoticonPicker`, indexed `AppStickersManager`, virtualized five-column sticker grid, pack rail, actual emoji metadata, recent/tone selection |
| `SuperStickerRenderer`, Lottie wrappers/player | Shared `StickerMedia`, original bundled Lottie worker/player, visibility-aware animated media and full viewport native-popover `StickerPreview` |
| `lib/appManagers/appGifsManager.ts`, `emoticonsDropdown/tabs/gifs.ts` | `AppGifsManager` calls our authenticated API; native video/search/pagination fixtures cover the frontend boundary; the live provider is not available in the current core working tree |
| Group creation/editor, `sidebarRight/tabs/editChat.tsx`, `_profile.scss` | `GroupComposer`, shared avatar crop field and single-scroll `GroupDetails`; CoolVibes server membership, group visibility and invitations remain authoritative |

The upstream application is coupled to Telegram authorization, managers and MTProto. Its entire application root is not mounted over CoolVibes. Reusable presentation, algorithms and compatible interactions are adapted; CoolVibes authentication and domain permissions remain in force. Friendships and private photo grants are CoolVibes features and use the shared visual foundation with their real server APIs.

## Implemented flow corrections

- Group avatar uses a native file chooser, cancellable crop, zoom/rotation and a 640px JPEG upload. Cancel/reselect and failed-submit retention are covered.
- Group details replace the thread header and use one parent scroll area for summary, settings and virtualized members. They never open a user profile. Wallpaper stays behind the chat and does not cover profile/group surfaces.
- Public/private groups, public usernames, invitation export/rotation/preview/join, owner/moderator editing and membership checks use server state.
- Clipboard feedback is temporary and replaces previous feedback; a failed clipboard operation never reports success.
- Profiles expose actual friendship request/cancel/accept/reject/remove states and private album request/approve/grant/revoke controls. Revoking access closes an open photo and clears fetched private assets. Following is not treated as friendship.
- Sticker picker contains 294 real documents in 11 sets (TGS/WEBP/WEBM). Its source-inspired manager indexes actual set/emoji metadata; bundled theme icons are not presented as a sticker catalog. It is a finite bundled catalog, not Telegram's complete account/cloud catalog.
- The frontend GIF flow uses an API adapter and native MP4 rendering, search cursor/reset, retry, typed sends and history. Current GIF checks are isolated fixtures, not live provider verification.

## Shared surfaces and profile composition

- `styles/telegram-panels.css` owns popup background/surface, radius, border, shadow and backdrop tokens. Forward, native content panels and confirmations use those tokens. `ContentPanel` shares composition between a native `Sheet` and an embedded profile section. Popup height follows content, with a viewport cap; empty albums never mount a blank virtual grid.
- Profiles keep Photos and (for the owner) Friends in the existing adaptive profile tab bar. Photos contains Private/Public/Access requests; Friends contains Friends/Incoming/Outgoing. These views do not navigate away or open an album modal. The native file chooser and upload confirmation retain a separate review step.
- Profile traits use shared rows: label above the actual server value, localized “Not specified” for an empty optional value, no yellow warning dots or “Select…” editing prompt. Six categories appear initially; View all exposes all 32. Owners expand a category and change its choices on the same profile page. Following/follower counters remain separate from the compact statistics action.
- `PreferenceSection` consumes the public initial-sync catalogs: 13 interest categories with 274 choices and five fantasy categories with 66 choices. Owners can browse categories before selecting anything; visitors see selected interests/fantasies only. Each choice and selected chip uses its original item illustration from the existing catalog. Expanded choices use the actual profile scroll parent and virtualization. Failed initial sync offers retry; preference errors restore the previous selection, and saves preserve the other categories' bit flags.
- Authenticated account responses include `selected_preference_bits`, derived from the persisted hex bitset, so saved choices survive the safe account projection. The raw stored bitset remains absent from public/account responses; the selected indexes are owner-only. The profile gives these indexes precedence over legacy local flags, including an explicit empty array after clearing. Successful mutations from older servers without either preference field retain their calculated local state. The catalog suite checks actual indicator state and thumb position after save and reload, using this account projection rather than returning the raw model as a fixture.
- The locked private album renders the supplied `assets/UtyanPasscode.json` through the existing shared Lottie worker/player, including visibility and reduced-motion behavior. Denied/pending states contain no protected image URLs.
- Photo selection previews multiple local files, supports remove/reselect/drop, revokes object URLs, enforces supported formats and the server ten-file batch limit, retains files after failure and uploads once after confirmation. Progress reflects transport bytes; processing is shown separately from completion.
- Search uses shared `SearchField`, with logical RTL layout and a container focus border. Native control defaults are low-specificity `:where(...)`, so component padding/borders can override them.
- Per the user's explicit preference, list/menu/group hover and press backgrounds use the chosen accent on the current theme surface. This replaces upstream's neutral-only list hover. Selected-chat colors remain a separate state.
- Attachment expiry is a source-style submenu, not a native select inside the popup. Cancelling an explicit one-time photo chooser leaves text/sticker sending available. Failed sticker sends retain a retry action; completed sends preserve typed emoticons, including ID-only responses.
- Group member selection combines private-chat peers, accepted friends and global lookup, with normalized public identities and correct exclusion/deduplication. Empty states have no collapsed card or disabled floating action. Referrals uses the same sections as Settings, with virtualized history.
- Each group member is one native switch action across avatar, name and decorative switch indicator. Theme hover, press and bounded ripple cover the whole row; the indicator is not a nested button or separate focus target. Role-switch rows explicitly opt into ripple with `data-ripple="on"`; standalone switch behavior remains intact.
- Recent peers in Forward have an explicit 8px inner card inset (scaled with type). Chat history reserves an estimated row size, then follows actual virtual-list measurements while entering a chat or sending; pointer/keyboard/scroll input releases that anchoring.

## Repeatable checks

Use Yarn. Start the frontend on `http://localhost:5173` with `yarn dev`, then run:

```sh
yarn check:telegram-ui
yarn build
node scripts/check-interface-regressions.mjs
node scripts/check-appearance-colors.mjs
```

`check:telegram-ui` uses `@playwright/test` and Chrome on macOS (or bundled Chromium elsewhere). Install the latter with `yarn playwright install chromium` if necessary; `PLAYWRIGHT_CHANNEL` selects an installed browser channel. These tests use fresh browser contexts and isolated API fixtures. They block external network/API/socket traffic, never use personal browser sessions, never mutate real users and capture no screenshots.

| Evidence | Coverage |
| --- | --- |
| `chat-group-avatar-checks.json` | 320/390/820/1440 widths, short 480px viewport, TR/EN/AR, dark, 150% text; avatar/crop/multipart, single group scroll with 120 virtualized members, aligned headers, clipboard success/denial/expiry |
| `chat-sticker-checks.json` | Four responsive/language/theme cases; actual bundled Lottie pixels, five columns, pack/filter metadata, full viewport preview, hold/release safety, static sticker send/history |
| `profile-social-checks.json` | Four responsive/language/theme cases; real frontend friendship and photo permission actions against fixtures, denied album has no URLs, protected image fetch, revoke closes preview, owner uploads and album movement |
| `chat-gif-checks.json` | Four responsive/language/theme cases; unavailable/retry, real native test-video decoding, reduced-motion behavior, search/cursor/reset, send/history against isolated API fixtures |
| `chat-forward-checks.json` | Four responsive/language/theme cases; source popup/card/icon/text geometry and hover colors, single-recipient composer preview, multiple recipients, atomic caption, partial-failure retry and history |
| `appearance-input-checks.json` | Nine colored cards in dark/light themes, native borderless range/keyboard/persistence, chosen theme applied to actual outgoing bubble and text |
| `chat-compose-checks.json` | Source attachment submenu, cancel/reselect, Send never opens a file chooser, typed TGS/WEBP/WEBM persistence and failure/retry |
| `theme-list-checks.json` | Chosen-accent hover across Settings/referrals/chat/group rows; shared card geometry; 150 virtualized referrals |
| `group-member-checks.json` | Friends without prior chats, identity dedup/exclusion, @ search, full-row/switch selection, add failure/retry and empty state |
| `private-photo-ui-checks.json` | Real lock Lottie pixels/motion, shared upload popup tokens, embedded empty album sizing, native previews/remove/cancel, validation, multipart failure/retry |
| `profile-tab-checks.json` | Embedded Photos/Friends, adaptive/RTL tabs, all 32 property rows and real values, localized empty values, incoming acceptance into Friends |
| `group-row-interaction-checks.json` | Four responsive/theme/language cases; one full-row action and chosen-theme hover over the switch, bounded pointer ripple, avatar/indicator clicks, keyboard and reduced motion |
| `profile-catalog-checks.json` | Public initial-sync catalog shape; all 340 original sub-item icon mappings, option/chip image decoding, in-place owner selection, visitor permissions, high-bit persistence, rollback and sync retry |
| `chat-action-checks.json` | Context menu keyboard/Escape, clipboard, reply composer/history, edit/pin, selection and gated deletion confirmation |

The core tests include isolated PostgreSQL schemas for group settings/invites, friendship/direct grants and forwarded-file access. They cover real transaction/authorization behavior without changing application records; `TEST_DATABASE_URL` must target the local test database. Standard targeted Go tests also cover transport, handlers, domain and architecture boundaries.

## Verification limits

Live GIF search is unverified. The current core working tree has removed the GIF handler and `tools/telegram-media` bridge; those unrelated removals were preserved during the profile work. The frontend fixture does not prove that the running or rebuilt backend supports GIF search. Telegram inline GIF queries require an authorized user session; a Bot API token is insufficient. Do not copy another application's credentials or browser sessions.

`interface-inventory.json` records all discovered screens/subflows. Shared styles apply widely; custom routes still marked pending have not been demonstrated to match Telegram. In particular, fixture checks do not establish pixel identity across all wallet, payment, map, classified, live-stream, registration or gated states. Original Lucide icons still exist outside the adapted chat controls. Native browser dialogs, Arabic fallback fonts and OS file choosers follow platform behavior. Full TypeScript checking still reports existing errors outside the changed flows; production ESLint/Vite build results are tracked separately.

Source attribution: `public/images/chat/NOTICE.txt`, `LICENSE-telegram.txt`, font license and sticker set metadata. Test video is a synthetic FFmpeg test pattern, not Telegram content.
