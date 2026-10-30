# Web interface design record

Current standard: the supplied Telegram source, as documented in `telegram-ui-reference.md`, supersedes the earlier Apple and preview-only entries below. Current profiles use embedded Photos/Friends tabs, shared popup tones, real photo-permission actions and the existing source Lottie lock. Earlier entries are historical verification records.

Scope: this web repository only. Apple visual hierarchy and typography; web/Android browser behavior remains native. No hotel flows, UIKit handlers or mobile project were added.

## Messages discover-group fetch lifecycle — 2026-10-30

The Groups tab's discover strip made `chat.group.list` requests whose lifecycle raced with its own loading state: the loading flag was part of the fetch effect's dependencies, so the re-run triggered by that flag cancelled the in-flight response and left `isLoadingPublicGroups` set. Any browser failure (for example a core hot-reload restart) or an empty-but-successful response then produced an unbounded retry storm plus skeletons that never resolved, and the strip appeared permanently frozen. The effect now tracks its request through refs and an invalidated sequence number: one request per Groups-tab visit, no response after the filter leaves the tab, batches resolved once, and loading always settles. A failed fetch reraises as a compact localized error row (`chat_actions.action_failed`) with the existing `nearby.try_again` retry pill; an empty public list simply keeps the strip hidden without a retry row.

Verified against the live local core at localhost:4001 with throwaway registered accounts (deleted afterwards): the strip renders seeded public groups with avatar, cover, hero and `public_username`, join updates the chat list, and browser scenarios confirmed (a) 200 → strip cards with exactly one request, (b) forced 500 → skeleton settles, error row + bounded retry per visit, no request storm, (c) empty success → strip hidden and no retry row. Turkish mobile and desktop-width DOM checks; no screenshots, no production accounts touched. Note: the deployed `api.coolvibes.lgbt`/`app` backends still answer `Unknown action` for `chat.group.list` and have no seeded country groups, so the strip cannot load there until the core build is deployed. Lint and `check-interface-regressions` passed.

Follow-up — discover-card avatar auth and fallback: the card's `<ChatAvatarImage>` omitted the `protectedMedia` flag that every other group avatar render (`TelegramChatListRow`, `ForwardPicker`, `ChatPeerHeader`, `GroupDetails`) sets, so it requested the group's `avatar`/`cover`/`hero` thumbnail as a plain unauthenticated `<img>` against the same auth-gated upload path those components fetch with a Bearer token — on an auth-gated host this renders a broken-image glyph instead of the group photo. The avatar markup also swapped the title-initial letter out for the image (ternary) instead of layering the image over the always-rendered letter, so a failed/empty image left the slot blank rather than falling back to the letter. Fixed to always render the letter and overlay `<ChatAvatarImage protectedMedia .../>` on top, matching the sibling components; `ChatAvatarImage` already renders nothing on a failed protected fetch, so the letter shows through. Lint and `check-interface-regressions` passed; not re-verified against a live auth-gated core in this pass.

## Groups directory (`/messages/groups`) — 2026-10-30

Three more problems surfaced once the strip above was verified against the local core: (1) `discoverableGroups` only excluded a cached chat by its `public_username`, so an already-joined group with no public username (or one outside the sidebar's loaded page) stayed offered; (2) the strip's join handler swallowed every failure silently and never inserted the joined chat locally, so a failed join looked identical to a stuck UI and a successful one didn't reliably flip state until the next full chats refetch; (3) the strip caps at a handful of cards — there was no way to browse the full public directory from the web app, where the mobile app already has one.

Root cause for (1)/(2) traced into `core/`: `chat.fetch_chats` defaults to `DEFAULT_LIMIT = 20` (`core/constants/constants.go`) and the web client never paginated it (`api.fetchChats()` sent an empty body), so `chatsList` — the only source MessagesScreen had for "am I already a member" — silently dropped every group beyond a viewer's 20 most-recently-active chats. Confirmed against the local Postgres (`datingdb`): the seeded `admin` account has 260 joined groups against a `chat.fetch_chats` page size of 20. `chat.group.list`'s preview rows use the same `chats.id` as everywhere else (`core/application/usecases/chat_group_list.go`), so there was no ID-space mismatch — the membership snapshot itself was just incomplete.

Fixed: `api.fetchChats` now accepts `{ limit, cursor }`; a new `fetchJoinedGroupIds()` (`src/features/chat/groupChatItem.ts`) walks every page (100 rows/request, 25-page safety cap) to build the viewer's complete joined group-ID/username set, independent of the sidebar's capped list. The Messages discover strip unions this with its existing `chatsList`-derived set; a failed join now sets a per-card inline error (`chat_actions.action_failed`) instead of failing silently, and a successful join inserts the real chat immediately via the shared `buildGroupChatItem` helper rather than waiting on a background refresh.

Added a full directory screen at `/messages/groups` (`src/screens/GroupsBrowseScreen.tsx`, linked from the strip's new "See all" header action), built on the same cursor-paginated `chat.group.list` call, `react-virtuoso` for the row list, and the fully-paginated membership set above. Each row shows Join when not a member and Leave (via the existing `removeChatParticipant`/leave-confirmation pattern from `GroupDetails`) when already one; tapping the row body (not the action pill) opens the group — an already-cached chat selects directly, one outside the sidebar's 20-row cap is rebuilt from the preview and handed to `MessagesScreen` via the same `groupChat` navigation-state path `GroupInviteScreen` already uses, and a not-yet-joined group opens the existing `/group/:username` preview route. `ListRow` renders onClick rows as a single `<button>`, which can't also host the action pill, so the row is hand-built from the same `cv-list-row`/`cv-list-icon`/`cv-list-copy` tokens inside a `cv-grouped-list`-style card (Virtuoso gives every row its own wrapper div, so the shared sibling-separator CSS doesn't apply here — the card frame substitutes for it). An All/Joined/Not-joined segmented `ViewTabs` filters the loaded page client-side. Lint, `tsc --noEmit` and `check-interface-regressions` passed; verified by reading the local core's handlers/usecases and querying the local `datingdb` directly, not by a live authenticated browser session in this pass.

Follow-up round after live local testing: (a) the Join/Leave pill had no matching `box-shadow` base value, so the ring that appears on Leave couldn't transition (CSS can't tween from the keyword `none`) and snapped in instantly — given a transparent baseline shadow plus a fixed `min-width` so the label swap doesn't reflow the row; the row's own press state (`:active`) was also unstyled next to the pill's, so it got `var(--cv-list-pressed)` to match. (b) The Not-joined/Joined tabs filter client-side on top of server-paginated pages; for a viewer who's joined nearly everything (or nearly nothing) the first page can filter down to a handful of rows, which makes the virtualized list too short to scroll, so `endReached` never fires and no further pages ever load — added a backfill effect that keeps requesting pages while a non-"all" scope has fewer than 15 matching rows and more pages exist, and gates the empty-state off `hasMore` so a still-backfilling scope shows the skeleton instead of a premature "none found". (c) Tapping a row navigated straight into the chat thread; added an `openGroupInfo` navigation-state flag (`MessagesScreen.tsx`) so this directory's row tap opens the group's info panel (`GroupDetails`) instead, which is what a browse/preview screen should land on.

`GroupInviteScreen` (`/group/:username`, `/invite/:token`) follow-up: it only ever showed the avatar (no `protectedMedia`, same auth-gated-image bug fixed in the strip earlier) and sat on a flat page background. Two rounds of live feedback shaped the fix: the backdrop is the group's own `hero` photo (falling back to `cover`), not the viewer's personal `ChatWallpaper` pattern (that stays only as the fallback when a group has neither); shown at its original sharpness with no blur/dim treatment (a first pass added a blurred+scaled+dimmed version for card legibility, which was explicitly rejected — the photo is meant to read clearly, not as a decorative backdrop); and the section now fills the actual viewport height (`height: 100%` down the `cv-app-shell → cv-interface-screen` chain) instead of a `70dvh` minimum, which had been leaving a bare gray strip below the card on tall viewports. The card itself keeps its own `cover`/`hero` banner-behind-a-notched-avatar treatment from the previous round. Its join handler and the strip's now both build the post-join `ChatItem` through the one shared `buildGroupChatItem` helper instead of three near-duplicate inline copies. Lint, `tsc --noEmit` and `check-interface-regressions` passed; not re-verified against a live browser session in this pass.

Directory row highlight bug: the Join/Leave row's hover/press background was wired as `.cv-groups-browse-row:has(.cv-groups-browse-row-main:hover/:active)`, a plain CSS pseudo-class. Virtuoso virtualizes by recycling each visible slot's DOM node for whatever item scrolls into it next; a pseudo-class stays pinned to that node, so wheel-scrolling under a stationary cursor lit up unrelated rows ("Birleşik Arap Emirlikleri" highlighted blue while untouched, reported live). Replaced with `hoveredRowId`/`pressedRowId` React state keyed by the group's own id and set from `onPointerEnter`/`Leave`/`Down`/`Up`/`Cancel` (hover gated to `pointerType === 'mouse'` so it can't stick after a touch tap either); the row's `is-hovered`/`is-pressed` class is now computed fresh against whatever group Virtuoso actually rendered into that slot, so it can't desync from recycling.

Two more rounds on the same screen: the highlight still didn't reach the card's rounded top/bottom edges — `.cv-groups-browse-list` carried its own `padding-block`, and because Virtuoso inserts a measuring wrapper between the card and each row, the usual `.cv-grouped-list` fix (moving that padding onto the first/last `> .cv-list-row` child via `:has()`) can't reach through it; dropped the padding entirely so rows run flush to the card edges and `overflow: hidden` alone rounds off whichever is first/last. Separately, joining from the Not-joined scope (or leaving from Joined) filtered the row out of `visibleGroups` the instant the request resolved, snapping every row below it up into place with no transition ("çok dandik" per live feedback) — added a `leavingRowId` grace period (`scheduleRowLeave`, 260ms) that keeps a just-(un)joined row included in `visibleGroups` long enough for a `.is-leaving` opacity/scale fade to play before it actually drops out. Lint, `tsc --noEmit` and `check-interface-regressions` passed; not re-verified against a live browser session in this pass.

Group search, two gaps: (1) the Messages screen's search box only filters `chatsList`, which — same 20-row `chat.fetch_chats` cap as the membership bugs above — meant a joined group outside that cap couldn't be found by name at all; added an effect that, while the Groups tab is active with a non-empty query, walks every `chat.fetch_chats` page (`searchJoinedGroupChats` in `groupChatItem.ts`, sharing its pagination loop with `fetchJoinedGroupIds` via a new internal `walkJoinedChats`) and merges any title/username match into `chatsList`, where the existing filter already picks it up. (2) The discover strip never searched public groups at all, despite the backend already supporting it end-to-end (`chat.group.list` reads a `query` form field — not `search`, confirmed by reading the handler — and filters server-side in `ListPublicGroups`); wired the Messages search box into it too, resetting the strip's cursor/results whenever the trimmed query changes while on the Groups tab. (3) `/search` (the dedicated search screen) never requested or rendered groups either, even though `search.global`'s response already carries a `groups` array end to end (`types.GlobalSearchResult.Groups`, scope value `"groups"`) — added a `groups` search filter/tab, result type, card (reusing `getPublicGroupImage`/`ChatAvatarImage`), and routing to `/group/:username` on open, alongside the existing people/events/posts/places ones. Lint, `tsc --noEmit` and `check-interface-regressions` passed; verified by reading the local core's handlers/usecases, not by a live browser session in this pass.

## Profile follow state — 2026-10-26

The web profile now derives its initial follow state from the existing authenticated `engagements.engagement_details` list (with the optional profile relationship hint), normalizes legacy ID types, and uses the toggle API’s boolean `status` and returned account. If userinfo omits the details, the existing paginated `user.fetch_engagements` following list resolves the relationship; the toggle stays disabled until it is known and read failures expose retry. The duplicate follow-state synchronization and fetch-skip flags were removed. Failed mutations restore the exact previous count and show localized feedback; pending actions cannot submit twice. No backend contract changes are included.

`yarn check:telegram-ui profile-follow` passed in Turkish/mobile, Arabic/tablet with enlarged text, and English/desktop fixtures. These cover initial state, reload, follow/unfollow, pending, failure, server disagreement, privacy gating and legacy IDs. This is fixture verification of the supplied userinfo-list contract, not verification of a signed-in live account. See `profile-follow-checks.json`.

## Shared implementation

- System font stack replaces Basel Grotesk. Body 17px; supporting text 15px; captions at least 13px; labels medium and headings/actions semibold. UI sizes use rem.
- `Interface.tsx`: AppHeader, NavigationBar, AppTabBar, GroupedSection, ListRow, FormField, native HTML Sheet and visual viewport handling.
- PublicHeader is shared by landing and every legal document. Mobile secondary controls move into a named menu instead of crowding the header.
- AppHeader occupies normal layout space; shared columns use the remaining height. Removed duplicated screen Back/title bars and old floating-header spacers. Absolute conversation panels are anchored to the screen container.
- Desktop navigation uses illustrated rows. Mobile tabs contain destinations; creation is in the toolbar; More contains every available destination.
- Authentication retains its two choice cards and form Back behavior. Form labels/errors are associated with their fields. Dialogs keep native focus containment and Escape behavior.
- Existing domain artwork and image files remain available. The catalog audit found all 524 illustrated icon files. System navigation uses existing vector symbols.
- The shared surface, touch, focus, dark-mode, RTL and reduced-motion rules cover every route. Existing virtualization, API calls, permission checks and feature flags are preserved.

## Screen and subflow coverage

| Source | Routes / subflows | Shared treatment | Verification |
| --- | --- | --- | --- |
| CheckInScreen | /checkin; list, map, composer, tags, post detail | Interface shell, typography, form/control tokens | Source updated; no visual verification claimed |
| ClassifiedDetailScreen | /classifieds/:id; listing, author and replies | Interface shell, typography, form/control tokens; shared AppHeader and Back | Source updated; no visual verification claimed |
| ClassifiedsScreen | /classifieds; hiring, seeking, create listing, metadata form | Interface shell, typography, form/control tokens | Source updated; no visual verification claimed |
| HomeScreen | /pride; feed, people, stories, vibes, live, composer | Interface shell, typography, form/control tokens | Source updated; no visual verification claimed |
| LandingPage | /; /landing; discovery, safety, FAQ, join, language, theme | Interface shell, typography, form/control tokens; PublicHeader / Sheet | Source updated; no visual verification claimed |
| LegalScreen | /legal/*; document navigation, contents, contact and login | Interface shell, typography, form/control tokens; PublicHeader / Sheet | Source updated; no visual verification claimed |
| LiveScreen | /live; LiveTab wrapper | Interface shell, typography, form/control tokens | Source updated; no visual verification claimed |
| LiveTab | embedded in live and home; broadcasts, join setup, creation, viewer, mic/camera and premium gate | Interface shell, typography, form/control tokens | Source updated; no visual verification claimed |
| MatchScreen | /match; match now, matches, liked, passed, profile detail | Interface shell, typography, form/control tokens | Source updated; no visual verification claimed |
| MessagesScreen | /messages; conversation list, thread, attachments, recording, media viewer, delete dialogs | Interface shell, typography, form/control tokens | Source updated; no visual verification claimed |
| NearbyScreen | /nearby; grid, list, card, bubble, map, profile selection | Interface shell, typography, form/control tokens | Source updated; no visual verification claimed |
| NotificationsScreen | /notifications; all, messages, matches, likes, follows, gifts, other | Interface shell, typography, form/control tokens | Source updated; no visual verification claimed |
| PlaceDetailsScreen | /places/:id; place overview, contact, map and posts | Interface shell, typography, form/control tokens; shared AppHeader and Back | Source updated; no visual verification claimed |
| PlacesScreen | /places; grid, map, search, filters, place selection | Interface shell, typography, form/control tokens | Source updated; no visual verification claimed |
| PostDetails | /:username/status/:id; /status/:id; /checkin/:id; post, replies and deletion states | Interface shell, typography, form/control tokens; shared AppHeader and Back | Source updated; no visual verification claimed |
| PremiumScreen | /premium; feature-flagged membership and plans | Interface shell, typography, form/control tokens | Source updated; no visual verification claimed |
| ProfileBio | embedded in ProfileScreen; attributes and descriptions | Interface shell, typography, form/control tokens | Source updated; no visual verification claimed |
| ProfileEngagementsScreen | /:username/:engagement; followers, following, blocks, likes, dislikes, matches and views | Interface shell, typography, form/control tokens | Source updated; no visual verification claimed |
| ProfileScreen | /profile; /:username; ?edit=1; bio, posts, replies, likes, media, profile fields, interests, fantasies, password and location | Interface shell, typography, form/control tokens | Source updated; no visual verification claimed |
| ReferralHandler | /ref/:code; referral storage and redirect | Interface shell, typography, form/control tokens | Source updated; no visual verification claimed |
| ReferralsScreen | /referrals; invitation, sharing, stats, history | Interface shell, typography, form/control tokens | Source updated; no visual verification claimed |
| SearchScreen | embedded helper | Interface shell, typography, form/control tokens | Source updated; no visual verification claimed |
| SettingsScreen | /settings; appearance, notifications, privacy, language, account, logout and deletion | Interface shell, typography, form/control tokens; GroupedSection / ListRow / Switch / Sheet | Source updated; no visual verification claimed |
| TestPage | /testpage; internal editor preview | Interface shell, typography, form/control tokens | Source updated; no visual verification claimed |
| WalletScreen | /wallet; overview, history, deposit method/amount/payment states, withdrawal | Interface shell, typography, form/control tokens | Source updated; no visual verification claimed |

## Verification limits

The user requested direct implementation and review in the running website, then explicitly prohibited screenshots and simulator work. Visual capture stopped. Do not interpret source migration or a successful build as completed visual verification of every subflow. `interface-inventory.json` retains pending visual status for each source.

Production build passes. ESLint has no errors; the concurrent rendering pass also removed the two unused map directive warnings. Full TypeScript checking also reports pre-existing errors in editor, map/bubble and related code; it is not claimed as passing. Live API, payment, camera/microphone, real keyboard/device, screen-reader and every populated data state have not been verified in this design pass.

Preview: http://localhost:5173

Design references: [Apple typography](https://developer.apple.com/design/human-interface-guidelines/typography), [navigation and search](https://developer.apple.com/design/human-interface-guidelines/navigation-and-search), [lists](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables), [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility).

## Crash, registration and tab corrections

- Restored the footer `Brand` imports in both landing and legal screens. Added `interface/jsx-no-undef` to ESLint and made the production build run lint first. `check-interface-regressions.mjs` checks the missing-import regression and width-fitting invariants.
- Root and route boundaries contain render errors, retain chunk reload protection, and show localized recovery controls. Route changes reset the route boundary. Optional background chunk warming now consumes rejected imports.
- Registration's step was named `text` while the form renderer expected `nickname`; those names now match. Username normalization, password confirmation, captcha reset/error handling and API error messages are retained. Fixed the reCAPTCHA error callback name and added an accessible Back label.
- `ViewTabs` replaces every main application's old tab row, including home, nearby, check-in, places, matches, classifieds, search, messages, profile/edit, wallet and notifications. It measures labels/counts, pins the selected view, and opens overflow in the shared native HTML sheet. Existing selection callbacks and permission gates are unchanged.
- Tab focus updates synchronously after keyboard selection and sheet closing. RTL arrow behavior, Home/End, large text, counters and 44px targets are supported without shrinking fonts.

DOM-only browser results (no screenshots or simulator): five public routes render with API/socket unavailable; registration form, validation, captcha/submission fixture, API failure recovery, Back and login pass; 12 tabs at 320px Turkish, seven at 390px English, 12 at 820px Arabic with 150% text and four at 1440px English pass without horizontal overflow; an injected render failure produces recovery controls instead of a blank screen. Detailed results are in `runtime-regressions.json`.

Registration submission was intercepted in the browser test; no real account was created. After the DOM checks, the live API initial sync on port 4001 returned HTTP 200 with 21 languages; the Socket.IO handshake on port 4002 also returned HTTP 200. No real registration/account creation was performed.

## Profile biography correction

`ProfileBio.tsx` previously appended imported text nodes directly to the Lexical root. Plain text and inline HTML produced `rootNode.splice: Only element or decorator nodes can be inserted to the root node`, leaving both the profile biography and editor empty. Preview and editing now share paragraph wrapping for inline nodes while retaining block nodes.

DOM-only Playwright checks at `localhost:5173`, with intercepted API fixtures, passed for `/profile` and `/profile?edit=1`: plain text at 390px, inline HTML at 1280px, mixed text/blocks at 768px, and Turkish/Arabic content. Editing and saving passed at 390px in English, Turkish and Arabic/RTL with dark appearance and 24px root text; the outgoing fixture request contained the edited biography. No Lexical/page errors or document horizontal overflow occurred. `yarn build` and `node scripts/check-interface-regressions.mjs` passed. No screenshots, simulator or live profile writes were used; this does not verify other profile flows or establish that the user's unspecified profile issue is fully resolved.


## Appearance settings preview (2026-10-21)

Superseded behavior: appearance now applies to the site, chat bubbles and text; see the source contract and `appearance-input-checks.json`. The original preview-only checks below describe the earlier implementation.

A Settings → Appearance row opens `/settings/appearance`; Chat Wallpaper opens `/settings/appearance/background`, with parent navigation in the app header. This is deliberately a saved preview, as requested: selections do not change the application's active light/dark preference or actual messages.

The nine-card strip contains the default home theme and the eight original chick, snowman, diamond, teacher, tulip, heart, tree and game themes. Bundled public theme data includes all four variants (Classic/Night/Day/Dark); each original SVG pattern is stored locally. The default pattern, 49 accent presets, color adaptation and 50×50 mesh-gradient interpolation come from the supplied `tweb-master` source. Tinted wallpapers use its 85% nearest-base blending rule. Colors were not sampled from screenshots. Source attribution and license are in `licenses/THIRD-PARTY-NOTICES.txt` and `LICENSE-telegram.txt`.

Controls include system appearance, message text size, gradient stops/rotation, 12 solid colors, pattern intensity, photo upload, blur and reset. Preview preferences persist locally; uploaded images use IndexedDB rather than localStorage. All 21 common locales include the new labels.

DOM checks passed at 320px English/light, 390px Turkish/dark, 820px Arabic/RTL with 150% text, and 1440px English/light. They cover settings navigation, all nine cards/patterns, mode/preset counts, persistence, no overflow, and isolation from the active app theme. Additional 390px fixture checks passed for decoding all nine SVGs, adding/removing gradient stops, rotation, pattern intensity, the 12 solid colors, photo upload, IndexedDB reload persistence, blur and reset. All 264 compared gradient images match the supplied Telegram renderer byte for byte. Results: `appearance-checks.json`. This establishes behavior and source fidelity for those checks, not screenshot equivalence or real-device verification. Actual chat redesign/application is deferred at the user's request.

## Profile layout and classifieds cards (2026-10-21)

The profile header now reserves distinct space for avatar, name, handle, actions and metrics. A cover appears only when an image exists; the obsolete 72px content offset is removed. The shared metrics sheet preserves all ten statistics and existing gates. Fixture DOM/layout and interaction results are in `profile-layout-checks.json`.

Five classifieds template cards share an original Day of the Tentacle-inspired street illustration with separate crops and dark copy panels. The optimized asset is `public/images/classifieds/tentacle-street-v1.webp`; browser fixture results are in `classifieds-layout-checks.json`. Labels, keyboard activation and template prefill remain functional. No live listing was created. The exact image-generation prompt, built-in tool and saved asset paths are recorded in `classifieds-artwork.json`.


## Theme gallery color correction (2026-10-21)

The previous gallery check missed a real defect: all eight cloud Day variants imported the optional zero stop as black. Telegram's `helpers/color.ts:getWallPaperColors` omits zero in additional slots. The import now uses that rule. For the cloud Day entries' otherwise plain-white/no-file wallpapers, the preview retains their Day accent/bubbles and uses the same theme's original Classic gradient/SVG. This is an explicit preview adaptation to keep all nine illustrated cards visible, rather than a claim that upstream's blank Day wallpaper is colored. Explicit user wallpaper choices remain untouched.

The gallery is now a separate `TelegramThemePicker.tsx`, adapted from the supplied `chatThemesPicker.tsx` and `_themes.scss`: `scrollable scrollable-x themes-container`, 4.5rem × 6rem cards, original bubble/emoji positions, an external 2px selection border, horizontal scrolling, RTL-aware arrows and one toolbar tab stop. Wallpaper layers have an explicit foreground stacking order and the source's color placeholder before canvas drawing.

`node scripts/check-appearance-colors.mjs` passes for all 36 theme/mode previews, zero sentinels, original SVG files and explicit custom monochrome wallpapers. DOM/canvas checks passed at 320px Turkish, 390px dark English, 820px Arabic/RTL with 150% text, and 1440px English. Each check samples actual canvas chroma across all 36 combinations, checks dimensions/layers, and exercises keyboard scrolling/selection. Results: `theme-picker-regressions.json`. No screenshot or live chat write was performed.


## Telegram profile, media and shared-control pass (2026-10-21)

Source mapping, finite sticker availability and verification limits are recorded in `telegram-ui-reference.md`. The shared foundation uses original Roboto files, tgico outlines, source popup/section geometry and the selected Appearance palette. List hover/press colors follow the chosen accent as explicitly requested.

The profile keeps Friends and Photos in its own adaptive tabs. It removes the extra owner action card; album browsing and friendship requests do not open a second page. Photo privacy, owner access requests and incoming/outgoing friendship scopes remain backed by their existing APIs. An empty album has a compact state; populated grids reserve their measured rows. Photo upload uses native selection plus explicit preview/confirmation, with truthful transport/processing states and retained files after failure. The locked album uses the existing Telegram safe-lock Lottie through the shared worker. Property rows display actual values or localized “Not specified”, with a separate owner edit action and no misleading selection prompt/yellow markers.

Shared modal colors, cards, header geometry, border, radius, shadow and backdrop are centralized in `telegram-panels.css`; `ContentPanel` supports both embedded and native-dialog presentation. Adaptive tabs retain keyboard operation. The 2026-10-22 user override removes visible focus rings through the shared foundation. Search fields share logical icon/text layout; native base styles no longer override component padding. Referrals uses Settings section surfaces, while groups and history retain virtualized lists. Member selection includes accepted contacts without prior chats. Forward recent peers have an inner card inset.

Browser evidence is recorded in `private-photo-ui-checks.json`, `profile-tab-checks.json`, `profile-social-checks.json`, `chat-compose-checks.json`, `group-member-checks.json` and `theme-list-checks.json`, alongside the group, sticker, GIF-fixture, forward, appearance and message-action artifacts. Cases use Turkish/English/Arabic, dark/light, 320–1440px widths and enlarged RTL text. They use isolated HTTP fixtures, block external sockets and do not capture screenshots or mutate real accounts. No claim of pixel identity for unseen routes or live GIF service is made. The current core working tree has unrelated GIF handler/bridge removals; they are preserved.

## Profile preference catalogs and unified member selection (2026-10-21)

The public `system.initial_sync` response already supplies 32 attribute categories, 13 interest categories (274 items), and five fantasy categories (66 items). The missing profile catalogs came from rendering only existing selections. Shared `PreferenceSection` now exposes the full owner catalog in place, with compact native category accordions and virtualized choices using the existing profile scroll parent. Traits initially show six categories with View all for the remainder. Visitors retain selected-only interest/fantasy views and cannot edit. Empty values remain localized. Initial-sync failure offers retry; failed saves restore selections, and high-bit preference updates preserve other categories.

All 274 interest and 66 fantasy item IDs map to the existing designed AVIF illustrations. Option rows and selected chips now render those item-specific illustrations, in addition to category illustrations. No replacement artwork or runtime copy of the catalog was introduced. `profile-catalog-checks.json` covers the sanitized public catalog fixture, responsive/RTL/dark cases, real image decoding, save/clear/reload behavior, failure rollback and visitors. The existing profile, photo, member and list suites passed again after the change.

Group member selection is one native button with switch semantics and a decorative indicator. The whole row shares hover, press and bounded ripple, including the indicator area; pointer and keyboard activation toggle once. `group-row-interaction-checks.json` records the four responsive cases with normal-motion ripple geometry and reduced-motion behavior. Production build, interface regression checks and all 524 existing illustration assets pass. Full TypeScript checking still reports pre-existing editor/post/map errors outside these changes.

### Saved preference switches (2026-10-21)

The first catalog fixture incorrectly returned the entire persistence-shaped user, including `preferences_flags`. The real `AuthUserResponse` deliberately excludes that stored bitset, so updates persisted while switches appeared off. Authenticated login/user-info/update responses now carry owner-only `selected_preference_bits`, decoded from the persisted hexadecimal flags. Public profiles retain their existing boundary. The profile reads these indexes before legacy flags; empty arrays clear prior selections, optimistic fantasy updates carry the same state, and older update responses without preference fields preserve the confirmed local choice.

`profile-catalog-checks.json` now uses the safe account response without raw flags, checks the actual switch indicator and thumb position, and reopens saved choices after reload in four responsive/theme/language cases. Backend projection tests cover bit indexes 0, 63, 511, 784 and 849, explicit empty choices and exclusion from public profiles. Targeted Go suites for use cases, HTTP handlers, user domain and repositories passed, as did the frontend production build and interface regression checks. The updated local backend was rebuilt and restarted on port 4001. Fixture tests do not mutate a real account.

### Restored authentication artwork (2026-10-21)

`AuthWizard` now uses the existing shared `AuthIllustration` on both login/register choice cards and their form headings. The original `login-bear.avif` and `register-bear.avif` remain uncropped and are included in the production output; asset URLs also respect the extension asset base. Selection, Continue, Back and form behavior are preserved.

Production build and lint pass with existing warnings. `auth-artwork-checks.json` records successful original-image decoding, card/form navigation, reachable actions and no horizontal dialog overflow at 320/390/820/1440px across Turkish/English/Arabic, light/dark and enlarged text cases. These are DOM checks without screenshots or simulator; APIs were blocked and no real account was created.


## Discovery, posts, empty states and loading (2026-10-22)

The automatic boot splash/modal, forced 800ms delay and pointer blocking are removed. Session readiness and lazy routes use a small inline `RouteLoader` progress indicator. `/splash` remains an explicit preview only. The slow-session fixture asserts that no splash or dialog appears and that progress disappears after readiness.

`AnimatedEmptyState` reuses the same packaged TGS files and player as messages. Match, Vibes, Live, Cool, profile posts/replies/media/likes, friends, photos and engagement lists now share it. Loaded empty collections in search, nearby, notifications, places, classifieds, check-ins, wallet, referrals and constrained pickers also use it. Loading, transport errors, access restrictions, inline missing values and the interactive conversation greeting keep their own meaning. All new visible strings are present in the 21 common locales.

The shared people card now wraps long labels and chooses columns from actual available width. List mode exposes Message/Like/Dislike/Block directly; compact/card modes keep the existing secondary action sheet. Right-rail search is removed, and refresh reserves a fixed control width with one rotating icon. Vibes starts one initial request, handles empty data without a fetch loop, bounds request/media readiness and offers retry after failure.

Cool and detail use the same `Post` renderer and real API actions, including media, polls and permissions. Cool outer corners are square and cards have no outer borders. Responsive controls retain 44px minimum targets; galleries and confirmations escape feed containment through body portals. Post detail fills its column without outer horizontal gutters. Shared global styles remove focus rings as explicitly requested while retaining focus and keyboard actions.

Profile engagement lists keep the avatar/name/handle card visible above their Back/navigation row, retain the return route, and render people through shared `ListRow`. Settings now has a sticky navigation/search header. Login/register retain the two original illustrated cards; the shared auth dialog has one header and a reachable action footer at short viewport heights.

| Evidence | Verified fixture states |
| --- | --- |
| `auth-artwork-checks.json` | Both original AVIFs decode, two cards, login/register forms, validation and mocked failure, Back, Escape/focus restoration, short viewport actions |
| `discovery-checks.json` | People layouts/long names, four list actions and compact menu, search/sidebar/refresh geometry, Match sticker playback, Vibes empty/error/media recovery |
| `post-parity-checks.json` | Feed/detail poll and media parity, six actions, intercepted mutation/rollback, saved state, reply, border/radius, full-width detail, viewport gallery portal |
| `empty-state-checks.json` | Profile activity/photos/friends, sticky identity and Back in follow/like lists, Settings, Live/Cool/notifications, delayed session without loading modal |
| `chat-forward-checks.json` | Forwarding/partial retry and visibility of forwarded content in current conversation |

These cases cover 320/390/820/1440px, Turkish/English/Arabic, light/dark, RTL and enlarged text. They inspect real DOM, Canvas/image decoding and isolated HTTP fixtures, without screenshots, simulator or real account writes. Sources migrated without route-specific runtime evidence are explicitly marked `source-migrated; runtime-unverified` in `interface-inventory.json`; this is not completion of all-screen visual verification. Live registration, streaming, payment, provider services and unvisited gated states remain unverified. Existing full-TypeScript errors outside the changed components remain; production lint/build and the JSX/tab regression checks pass separately.

### Landing wide-screen text layout — 2026-10-22

The desktop chapter copy applied `(100vw - 1380px) / 2` padding to both sides of a half-width grid cell. Isolated browser DOM checks reproduced a 39px text area at 2560px and a zero-width text area at 3840/5120px. Desktop padding is now capped at 100px, with a centered 48rem maximum copy box. All five chapter text areas measure 616px at the tested 1920–5120px widths with the default font size.

`landing-wide-checks.json` records geometry at 320/820/1440/1920/2560/3840/5120px, including Turkish, English, Arabic/RTL, light/dark and enlarged-text samples. No screenshots or simulator were used. Existing artwork is unchanged; asset decoding, authentication dialogs, real devices and live services were not verified in this pass. `yarn build` (including lint) and `node scripts/check-interface-regressions.mjs` passed.

Follow-up for the user’s 25% browser zoom case: the whole landing canvas now has `max-width: 1920px` and automatic inline margins. Hero bottom controls use the canvas width rather than viewport width for their insets. DOM fixtures pass at 5760/7680/15360 CSS px (layout equivalents of 25% zoom on 1440/1920/3840px windows), with a centered canvas, bounded chapter copy and contained hero controls. These are layout-equivalent checks, not interaction with the browser zoom UI. Production lint/build and interface regressions passed again.

### Brand artwork — 2026-10-22

New generated artwork in `public/images/brand/dott-v1/` supplies manifest/favicon/Apple icons, the static and dynamic default social cover, and the default Appearance/chat pattern. Original assets remain available. Manifests use `any` rather than claiming unverified maskable safety. Named Telegram themes and uploaded backgrounds retain their own sources. See `brand-artwork-2026-10-22.md` for prompts, scope and limitations. Generated artwork was inspected directly; composed browser flows, wallpaper seam continuity, installed PWA and live social crawlers remain unverified. No screenshots or simulator used.

Brand V2 follow-up: replaced the heart/hands logo with an original purple/turquoise V-shaped tentacle mascot, including the OG emblem. Active icon references, explicit splash preview and notification icon now use `dott-v2`. V1 wallpaper remains active. Direct artwork inspection only; browser and installed-device rendering remain unverified.

Brand V3 correction: user rejected the mascot. Active public Brand, manifest/favicon, splash preview, notifications and OG now use CoolVibes lettering / CV monogram in `dott-v3`. The OG mascot is removed. The shared Brand keeps its localized home action and at least 44px height. Build and interface regressions passed; browser composition remains unverified.

Final user selection: **dott-v3** restored across public branding, metadata, manifest, splash preview and notification icon after reviewing the refined V4 proposal. V4 is an unused draft. No new composed-browser verification claimed.

### Brandkit — 2026-10-22

Public `/brandkit` provides selected dott-v3 wordmark, CV icon, OG cover, palette, usage guidance and native individual/ZIP downloads. Landing and legal footers link to it. All 21 landing locales include the new copy. No authentication gate; login still opens AuthWizard. `brandkit-checks.json` records 320/390/820/1440px DOM/image/download checks with tr/en/ar RTL, light/dark, enlarged text, scrolling, keyboard ZIP activation and footer navigation/Back. No screenshots or simulator. Real-device rendering and live authentication remain unverified.

### Istanbul guidelines illustration — 2026-10-22

Replaced `legal-guidelines-3.avif` with a dott-v3-compatible illustration retaining the cafe community and adding Kiz Kulesi, historic city walls, Galata Bridge, Bosphorus bridge, sea and two cats. Mosque/minaret skyline removed. 1254×578 AVIF retains the prior 627:289 display ratio. Generated composition inspected directly; four-width DOM/decode checks recorded in `istanbul-guidelines-checks.json`. No screenshots or simulator. Artistic montage, not geographically literal.

### GitBook documentation and new locales — 2026-10-22

Replaced the obsolete README with the English project entry, 22 translated overviews and seven technical guides. `.gitbook.yaml` and `SUMMARY.md` prepare a single Git Sync space; no external site was published. Each of the 23 locale pages uses its matching hero via JPEG export. Nepali and Khmer now have all four runtime namespaces, language selection/flags, SEO locale entries and Kathmandu/Phnom Penh heroes. The sidebar create-post label now uses the existing translated `create_post.title` key instead of a missing key with a Turkish fallback.

The user explicitly requested screenshots for this documentation work, overriding the older prohibition for these captures only. `scripts/capture-readme.mjs` produces 16 actual application captures with fictional Alex Rivera/Deniz Kaya profiles and intercepted API responses. No real accounts, messages or database records were created. Feed, messages, appearance, mobile profile, brandkit, nine localized landings and ne/km authentication choices are captured; evidence is in `docs/assets/screenshots/capture-manifest.json`. The single-image feed attachment renderer's existing forced portrait ratio was observed; documentation demonstrates the existing two-image grid instead, without changing that unrelated renderer.

`yarn build` passed (existing lint, asset-resolution and large-bundle warnings remain). Interface regressions, public namespace coverage in 23 locales, documentation links and new-locale interpolation parity passed. Native-speaker review, real-device testing, API-provided translated catalogs, live payments/broadcasts and GitBook-hosted rendering remain unverified. Detailed technical guides remain in English; language pages are localized project overviews, not full translations of every guide.

New-locale browser checks passed in eight cases (ne/km × 320/390/820/1440px): selection through the public language menu, reload persistence, HTML language, corresponding hero decode, horizontal containment, authentication dialog/Escape and brandkit image decode. The 390px cases use dark mode and 820px cases use enlarged text. See `documentation-locale-checks.json`; browser emulation only, no additional screenshots.

### Documentation footer link — 2026-10-22

Landing, legal and brandkit footers, plus the legacy Footer component, now expose a native link to https://docs.coolvibes.lgbt/. The label is translated in all 23 landing dictionaries. Existing footer layout and native same-tab navigation are retained. Composed browser layout and the external documentation service were not verified in this pass.

### Chat media and view-once interaction — 2026-10-23

Media send uses the source popup shell (420px, 40px corner, no outer border/shadow, 30% backdrop), shared theme surfaces and a caption surface with Send inside it. Caption surface uses the existing section shadow and 24px radius; original SVG icons replace alternate icon outlines. Interactive targets retain the repository's 44px minimum. Fullscreen viewer uses a native modal dialog, unframed media, flat controls and the source 88% black desktop overlay / solid black phone background. No pixel-equivalence claim: supplied screenshots were inaccessible and live visual comparison was not performed.

View-once photos use a tiny JPEG preview (at most 12px per side) under the adapted GPU dust renderer. First activation reveals the original inline in a temporary session; second opens the viewer. Closing the viewer retains that active inline session and does not repeat consumption. Sender previews do not consume recipient views. Transient open failures remain retryable. Older messages without preview metadata retain the fallback background. Local backend was rebuilt/restarted with sender preview handling; targeted unit tests passed, database integration skipped without TEST_DATABASE_URL.

`docs/view-once-spoiler-checks.json` records intercepted API/DOM/canvas fixtures at 320/390/820/1440px with Turkish, English, Arabic/RTL, dark mode, enlarged text, keyboard, reduced motion, album removal and caption cancellation. These are browser emulation checks, not authenticated live-service or real-device verification. No screenshots captured. Build, interface regression and public locale checks passed.

### Media upload lifecycle — 2026-10-23

The message composer now retains selected files and caption until upload succeeds, blocks duplicate sends and dismissal during upload, and displays failures inside the modal for retry. Temporary view-once message IDs cannot trigger an open request. `scripts/telegram-ui/media-upload.mjs` passed at 390px Turkish with intercepted delayed success and failure responses, Escape and retry; lint and interface regression checks passed. Existing four-width view-once fixtures also passed. No screenshots captured. The reported live upload failure and its server-side cause remain unverified.

### Protected chat photo requests — 2026-10-23

The reported PNG originals and landscape_md.webp variants both exist in the local backend upload directory. The Go media handler deliberately returns 404 when private-media authorization is absent; chat thumbnails and viewer previously used unauthenticated image requests. They now use authorized fetches for configured API upload origins, render temporary blob URLs, and revoke those URLs on cleanup. Video sources/posters use the same loader. Public/external, optimistic blob and view-once data sources retain their direct URLs. Four-width DOM/API fixture coverage lives in `scripts/telegram-ui/protected-chat-media.mjs`; authenticated live-service and video playback remain unverified. No screenshots captured.

### Message bubble layout — 2026-10-23

Compared local tweb `_chatBubble.scss` and `_chatVariables.scss`. Applied its 56px text minimum, bubble shadow, 420px/400px attachment bounds and edge-to-edge media structure. Removed obsolete circular thumbnail sizing/hover zoom and reserved measured time/status width in text. Photo-only timestamps overlay media; captions retain inner text spacing. Existing 15px/5px grouping, source SVG tails for text, theme tokens and protected-media authorization remain in use. DOM fixture covers four widths, Turkish/English/Arabic RTL, dark mode and enlarged text. User screenshot inaccessible; no screenshots captured and no pixel-equivalence claim. Live media service unverified this pass.

### Photo scroll stability — 2026-10-23

Corrected the previous bubble layout regression: a protected photo initially rendered no image, so its auto-height row grew after fetch/decode and collapsed again when remounted by virtualization. Attachment frames now reserve a metadata-based aspect ratio (stable 4:3 fallback when absent), with media absolutely contained inside. Album cells remain square. Virtuoso keeps 400px of extra content mounted on either side while retaining virtualization. `scripts/telegram-ui/chat-media-scroll.mjs` passed delayed photo loads and rapid wheel reversals with 70 messages at 390/820/1440px, Turkish/English/Arabic RTL, dark mode and enlarged text. Lint and interface checks passed. No screenshots; physical-device momentum and live network unverified.

### Default wallpaper source correction — 2026-10-23

Appearance and chat default pattern CSS incorrectly referenced the Dott PNG. Both the background-image and night mask now reference `/images/chat/telegram-pattern.svg`, verified byte-identical by SHA-1 to tweb-master/public/assets/img/pattern.svg. Explicit theme pattern selections remain intact. `check-appearance-colors.mjs` passed; no screenshots or new visual verification.

### Gradient animation setting — 2026-10-23

The previous canvas only drew one static frame. Added a localized persisted gradient-animation switch under chat background settings and a bounded 30fps animation using the existing tweb-derived phase interpolation. Default enabled for gradient wallpapers, with static theme thumbnails and paused offscreen/hidden/reduced-motion states. Four-width DOM/canvas fixtures verify pixel changes, toggle persistence and chat playback; lint, appearance color and interface checks passed. No screenshots; real-device performance unverified.

### iOS message palettes and accent isolation — 2026-10-23

The user selected Telegram-iOS-master as the updated color reference. Curated bubble stops are preserved in source order instead of being averaged or derived from wallpaper. Regular accent fills use DefaultDayPresentationTheme.swift, DefaultDarkPresentationTheme.swift and DefaultDarkTintedPresentationTheme.swift calculations; Night blue retains its explicit three-stop purple-to-blue gradient. Lightness and channel conversion follow UIKitUtils.swift. Palette buttons, settings previews and chat share the same resolved fill. The editor preserves up to four stops and saves them without altering the selected accent. Old automatic followWallpaper overrides are discarded; explicitly picked colors remain.

Model checks passed for 14 curated palettes read directly from ThemeColorPresets.swift, 36 wallpaper previews, regular blue defaults, accent/surface isolation and stored three-stop gradients. Interface regression checks passed. The 49 accent options passed DOM fixtures at 320/390/820/1440px with Turkish/English/Arabic RTL and enlarged text: displayed accent equals applied accent, default circle remains first, reset works, selections survive reload, and chat uses the resolved fill. Lint passed with two existing map warnings. No screenshots or simulators; live-service and real-device appearance remain unverified.

The default circular control remains in its original position. Gradient animation is also exposed directly beneath Wallpaper in Appearance, sharing the background editor’s persisted preference; it remains visible but disabled for non-gradient backgrounds.

Animation DOM/canvas fixtures passed across four widths/locales: the main Appearance switch persists through reload, background-editor toggle changes actual pixels, reduced motion pauses, and chat animates. Final lint passed with the same two existing map warnings.

### Settings list interaction and switch accents — 2026-10-23

DOM inspection found 8px (12px with enlarged text) of section padding above the first row that belonged to the container, so it received neither row clicks nor hover. Shared grouped lists now place that space inside their edge rows. Settings toggle rows now expose one full-row switch with native button keyboard handling and an inert visual indicator. Enabled shared switches use the chosen brand/hover tokens instead of fixed green. Lint passed with two existing map warnings; interface regression checks passed. Settings DOM fixtures passed at 320/390/820/1440px, Turkish/English/Arabic RTL, light/dark and enlarged text: upper-edge hover/navigation, full-row toggle, keyboard and switch/accent equality. No screenshots; the supplied image was inaccessible.

### Accent palette wrapping — 2026-10-23

Accent circles now wrap instead of scrolling horizontally, preserving existing sizes, spacing and selection order. Target inferred from the recent accent discussion because the supplied screenshot was inaccessible. CSS reviewed; no browser layout or real-device verification this pass.

### Color theme two-column layout — 2026-10-23

Per explicit user clarification, Color theme preview cards now use two equal columns at all widths with natural height. Removed horizontal scrolling classes and automatic centering; Up/Down move by two cards and keyboard focus reveals the destination through normal page scrolling. Existing previews and selection actions remain. Source reviewed; browser layout unverified this pass. No screenshots.

User follow-up: changed Color theme grid to five columns and Up/Down keyboard navigation to five-card steps. Browser layout remains unverified this pass.

### Chat-style post blur and reveal — 2026-10-23

Post single photos and album tiles reuse the chat particle renderer with clipped 1rem blur. The renderer retains reduced-motion/offscreen/hidden pauses; CSS travels with the component so feed does not depend on chat route CSS. First photo click reveals that attachment without opening a modal; next click uses the existing gallery. Other attachments remain concealed and global blur preferences are untouched. Disabling blur removes the effect. Empty read-only post content no longer shows a perpetual Loading placeholder. Actual image loading/error states remain. Lint passed with two existing map warnings; interface checks passed. DOM/API fixtures passed at 320/390/820/1440px, Turkish/English/Arabic RTL, light/dark and enlarged text for single/album concealment, first-click isolated reveal, second-click gallery, blur disabled and empty-text placeholder removal. No screenshots or live-service validation.

### Published sticker concealment — 2026-10-23

Post stickers are Lexical image nodes rather than attachments. Published Post content now opts those nodes into the same blur and decorative particle renderer. Each reveals on its own first click or Enter/Space, consuming that event so it does not navigate the post; editable composers remain unchanged. Lint and interface checks passed. Extended post DOM fixtures passed at 320/390/820/1440px in tr/en/ar RTL, light/dark and enlarged text using actual serialized Lexical image data: sticker concealment, isolated first-click reveal without navigation, and global blur disabled. No screenshots or live-service checks.

### Send Tip as Telegram gift cards — 2026-10-23

Replaced the bespoke moving glass modal and full-screen success celebration with the shared native Sheet: fixed 44px close control, constrained scrolling body, persistent footer and inline success. Ported the source gift grid (three columns, 10px gap/radius, sticker artwork and price pill) and centered recipient layout. Existing local Gift3/Gift6/Gift12 JSON assets match tweb source SHA-256; these three artworks repeat by amount tier, with USD prices rather than Telegram Stars. No remote collectible catalog is assumed. Selected/hovered cards animate with existing reduced-motion/offscreen handling. All 24 tip amounts, custom entry, balance ratios, wallet navigation, recipient/post id, actual API call and balance update remain. Labels localized in all 23 locales. Final DOM/API fixtures passed at 320/390/820/1440px in Turkish/English/Arabic RTL, light/dark and enlarged text: three columns, artwork loaded, selected-card mark, fixed close on hover/scroll, focus restoration, Escape, insufficient balance, custom decimal entry, failure and mock success. Lint passed with two existing map warnings; interface checks passed. No screenshots, real payments or real-device validation.

## Concurrent rendering — 2026-10-24

`ViewTabs` now owns `useTransition` for all consumers, including Home/post, chat, Nearby, Places, check-in, search and profile tabs. Selection callbacks, permission gates, overflow sheets and RTL keyboard behavior remain intact; `aria-busy` reports pending selection. Rapid keyboard navigation uses the pending destination. Header-driven Places/Nearby/check-in changes and search show-all actions retain explicit local transitions where needed.

Chat and Places search keep input state immediate and defer result filtering. Chat filtering is memoized once instead of repeated in JSX. Shared GameMap defers nearby/place/check-in marker data through a memoized marker layer; player position and camera controls stay separate. Places waits for its initial location before constructing the persistent map, preventing the initial fallback center from leaving fetched markers outside the viewport; grid/map switches preserve the map instance. Existing Jotai mutations, request guards, pagination, message sends and optimistic post actions retain their scheduling. Transitions do not make network requests faster or defer imperative MapLibre commits.

Search, place detail and post detail apply successful responses and the end of loading in the same transition. Place detail now exits loading on errors and validates route-provided place identity. Place/post request cleanups discard responses from obsolete routes and cancel obsolete post-deletion redirects. The post attachment memo uses a stable dependency expression accepted by the React Compiler lint rule. Removed two unused map lint suppression comments.

The earlier post fixture timeout was caused by expecting the first photo click to open the gallery when photo concealment is enabled by default. The fixture now verifies first-click reveal and second-click gallery opening, preserving that preference. Post fixtures passed all four configured phone/tablet/desktop and locale/theme cases, including gallery containment, API actions, failure rollback and detail parity. Discovery, profile-tabs and groups fixtures also passed all four configured cases. Existing list fixtures passed in the preceding pass.

`yarn build` and `node scripts/check-interface-regressions.mjs` passed. The new `transitions` suite passed at 320px/TR/light, 390px/EN/dark, 820px/AR/dark/enlarged text and 1440px/EN/light. It checks chat search/clear, keyboard focus, RTL/overflow selection, Places filters, mocked map marker addition/removal and navigation, retained grid/map state, check-in views/player marker, and place detail success/errors. Its report is `transition-checks.json`. No screenshots, live-service, real-device or measured latency improvement is claimed.
