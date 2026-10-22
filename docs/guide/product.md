# Product scope

CoolVibes connects social publishing, friendship and dating for LGBTIQA+ adults and respectful allies. The web app contains both public discovery/brand pages and authenticated community workflows.

## Share and participate

The feed and post detail use the shared post renderer. The frontend includes text and media posts, replies, reactions, bookmarks, polls, event composition and event responses. Media galleries and confirmations escape feed containment. Long collections retain pagination and virtualization. Data availability and authorization are decided by the backend.

## Build a profile

Profiles combine biography, identity and optional attributes, interests/preferences, posts and engagement counters. Missing read-only values use localized “Not specified.” Public/private photo collections and friends are existing profile tabs, not separate duplicate destinations. Friend requests and private-photo access have explicit pending, approved and revoked states.

## Find people and places

Search, matches and nearby discovery expose different ways to find connections. Location permission remains a browser decision. Places provide map-based discovery and business/detail views; check-ins connect activity with locations. Advanced discovery modes may be gated by membership settings. Listings and requests cover community opportunities, but a category is not an endorsement or verification of a provider.

## Keep conversations together

Private and group chat include message actions, replies, forwarding, pins, attachments, emoji/stickers/GIFs, member management and invitation links. Disappearing/view-once interfaces depend on server behavior. Do not infer end-to-end encryption from private chat or temporary media controls.

## Live, wallet and referrals

Live screens include stream discovery and camera/microphone setup, using Agora and service-issued connection tokens. Joining or hosting can require Premium depending on configuration. Wallet and referral screens expose balances, transaction history, packages, transfer details and reward flows. These are provider-dependent interfaces, not a promise that every payment method is active. Test real transfers only in an authorized provider environment.

## Make the app your own

Appearance settings provide system/light/dark variants, accents, message sizing, theme previews, gradients, pattern intensity and uploaded wallpaper. The app now includes 23 locale variants with matching public hero artwork. Arabic, Persian and Hebrew use RTL layouts. Nepali and Khmer have local common/auth/landing/legal resources; server-supplied catalog labels still depend on backend translations.

## Route guide

| Route | Purpose |
| --- | --- |
| `/landing` | Public localized introduction and auth entry |
| `/brandkit` | Selected dott-v3 logo, icons, palette and downloads |
| `/legal` and `/legal/*` | Legal, community, accessibility and help pages |
| `/pride`, `/home` | Community feed |
| `/search`, `/nearby`, `/match` | Discovery and dating |
| `/messages` | Private and group conversations |
| `/profile`, `/<username>` | Own or member profile, subject to visibility rules |
| `/places`, `/places/<id>` | Place discovery and details |
| `/classifieds`, `/checkin` | Listings and check-in workflows |
| `/live` | Broadcast discovery and participation |
| `/wallet`, `/referrals`, `/premium` | Account value and feature-gated memberships |
| `/settings`, `/settings/appearance` | Account and appearance settings |
| `/splash` | Explicit preview only; not an automatic loading modal |

[Overview](../../README.md) · [Architecture](architecture.md)
