# Web interface design record

Scope: this web repository only. Apple visual hierarchy and typography; web/Android browser behavior remains native. No hotel flows, UIKit handlers or mobile project were added.

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

Production build passes. ESLint has no errors (two existing map directive warnings). Full TypeScript checking also reports pre-existing errors in editor, map/bubble and related code; it is not claimed as passing. Live API, payment, camera/microphone, real keyboard/device, screen-reader and every populated data state have not been verified in this design pass.

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

A Settings → Appearance row opens `/settings/appearance`; Chat Wallpaper opens `/settings/appearance/background`, with parent navigation in the app header. This is deliberately a saved preview, as requested: selections do not change the application's active light/dark preference or actual messages.

The nine-card strip contains the default home theme and the eight original chick, snowman, diamond, teacher, tulip, heart, tree and game themes. Bundled public theme data includes all four variants (Classic/Night/Day/Dark); each original SVG pattern is stored locally. The default pattern, 49 accent presets, color adaptation and 50×50 mesh-gradient interpolation come from the supplied `tweb-master` source. Tinted wallpapers use its 85% nearest-base blending rule. Colors were not sampled from screenshots. Source attribution and license are in `public/images/chat/NOTICE.txt` and `LICENSE-telegram.txt`.

Controls include system appearance, message text size, gradient stops/rotation, 12 solid colors, pattern intensity, photo upload, blur and reset. Preview preferences persist locally; uploaded images use IndexedDB rather than localStorage. All 21 common locales include the new labels.

DOM checks passed at 320px English/light, 390px Turkish/dark, 820px Arabic/RTL with 150% text, and 1440px English/light. They cover settings navigation, all nine cards/patterns, mode/preset counts, persistence, no overflow, and isolation from the active app theme. Additional 390px fixture checks passed for decoding all nine SVGs, adding/removing gradient stops, rotation, pattern intensity, the 12 solid colors, photo upload, IndexedDB reload persistence, blur and reset. All 264 compared gradient images match the supplied Telegram renderer byte for byte. Results: `appearance-checks.json`. This establishes behavior and source fidelity for those checks, not screenshot equivalence or real-device verification. Actual chat redesign/application is deferred at the user's request.

## Profile layout and classifieds cards (2026-10-21)

The profile header now reserves distinct space for avatar, name, handle, actions and metrics. A cover appears only when an image exists; the obsolete 72px content offset is removed. The shared metrics sheet preserves all ten statistics and existing gates. Fixture DOM/layout and interaction results are in `profile-layout-checks.json`.

Five classifieds template cards share an original Day of the Tentacle-inspired street illustration with separate crops and dark copy panels. The optimized asset is `public/images/classifieds/tentacle-street-v1.webp`; browser fixture results are in `classifieds-layout-checks.json`. Labels, keyboard activation and template prefill remain functional. No live listing was created. The exact image-generation prompt, built-in tool and saved asset paths are recorded in `classifieds-artwork.json`.


## Theme gallery color correction (2026-10-21)

The previous gallery check missed a real defect: all eight cloud Day variants imported the optional zero stop as black. Telegram's `helpers/color.ts:getWallPaperColors` omits zero in additional slots. The import now uses that rule. For the cloud Day entries' otherwise plain-white/no-file wallpapers, the preview retains their Day accent/bubbles and uses the same theme's original Classic gradient/SVG. This is an explicit preview adaptation to keep all nine illustrated cards visible, rather than a claim that upstream's blank Day wallpaper is colored. Explicit user wallpaper choices remain untouched.

The gallery is now a separate `TelegramThemePicker.tsx`, adapted from the supplied `chatThemesPicker.tsx` and `_themes.scss`: `scrollable scrollable-x themes-container`, 4.5rem × 6rem cards, original bubble/emoji positions, an external 2px selection border, horizontal scrolling, RTL-aware arrows and one toolbar tab stop. Wallpaper layers have an explicit foreground stacking order and the source's color placeholder before canvas drawing.

`node scripts/check-appearance-colors.mjs` passes for all 36 theme/mode previews, zero sentinels, original SVG files and explicit custom monochrome wallpapers. DOM/canvas checks passed at 320px Turkish, 390px dark English, 820px Arabic/RTL with 150% text, and 1440px English. Each check samples actual canvas chroma across all 36 combinations, checks dimensions/layers, and exercises keyboard scrolling/selection. Results: `theme-picker-regressions.json`. No screenshot or live chat write was performed.
