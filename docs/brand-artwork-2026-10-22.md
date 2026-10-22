# CoolVibes artwork — 2026-10-22

Built-in image_gen generated three original raster assets, saved in `public/images/brand/dott-v1/`. Original sources remain alongside production exports. Existing assets remain available for rollback. Export resizing/encoding used macOS sips.

## Prompt set

- Icon / logo-brand: original Day of the Tentacle inspired 1990s adventure cartoon, welcoming peach hands cradling a rainbow heart, chunky navy outlines, lavender background, simplified silhouette, no text or frame. Palette navy #082c72, violet #8774e1, coral #ff6055, orange #ff9500, gold #ffd45c, lime #add64b, turquoise #56c8ce. Requested central safe area; generated hands extend beyond maskable safe circle, so manifests correctly advertise `any` only.
- OG / ads-marketing: wide 1.91:1 community plaza with diverse adult queer friends, quirky architecture, navy outlined cel shading, blue/violet/mint/peach palette. Exact text CoolVibes and LGBTIQA+, heart and hands brand motif, full bleed, no UI or watermark. Export 1200×630 JPEG used by static and dynamic SEO; organization logo uses the square icon.
- Wallpaper / illustration-story: transparent navy line doodles of hearts, welcoming hands, smiling chat bubbles, rainbow arcs, sparkles and curly tentacle flourishes. Airy square repeat intended for low opacity over existing user-selected gradients and the existing night mask. Seamless repeat was requested; edge continuity has not been verified in a running browser.

## Scope and verification

Nine icon dimensions (16, 32, 64, 128, 180, 192, 256, 512, 1024), one OG export, one transparent pattern. Generated images inspected directly, without screenshots. No interface geometry, strings, permissions or navigation changes. Existing named themes and custom uploaded wallpaper remain unchanged. Broader landing, legal, authentication, gift and illustration libraries are outside this completed asset set pending scope clarification.

Browser layout across viewports/locales, installed PWA rendering, social crawler refresh and wallpaper tiling remain unverified. This work does not claim a complete application visual audit.

## V2 — original mascot redesign

User requested a genuinely new logo instead of retaining the heart/hands symbol. Built-in image_gen produced `public/images/brand/dott-v2/icon-master.png` and revised `og-master.png`; sips exported the same nine icon sizes and 1200×630 JPEG. Active manifest, favicon, SEO, splash preview and notification references use V2. The V1 chat pattern remains active.

Prompt: completely new original CoolVibes mascot in the Day of the Tentacle 1990s adventure cartoon visual language; angular wonky silhouette, thick irregular navy outlines, asymmetrical expressive eyes, hard cel shadows. Purple #8774e1 and turquoise #56c8ce curling tentacle arms form a friendly V; rainbow forehead detail, large suction cups, smiling face, pale lavender background; no heart, hands, lettering or existing game character. OG edit prompt: replace only the old heart/hands emblem with the new mascot, preserving typography, community plaza, people and composition.

Direct image inspection completed. Actual browser/PWA and notification rendering remain unverified. Assets retain `any` purpose; maskable safe area is not claimed.

## V3 — CoolVibes typographic logo (active)

The user rejected the mascot. Active branding now uses a transparent **CoolVibes** wordmark and a **CV** monogram for small square icons. No octopus/mascot appears in these assets. Files live in `public/images/brand/dott-v3/`; previous versions are retained only as source history. Public Brand header/footer now renders the wordmark with its existing localized home action and 44px minimum target.

Built-in image_gen prompt set:
- Wordmark: exact text CoolVibes, capital C and V, original 1990s adventure-title lettering inspired by Day of the Tentacle; bouncy angular shapes, chunky navy outlines, turquoise Cool, violet Vibes, blue/plum cel shadows, small rainbow strip on V, transparent background. No characters, tentacles, hands, hearts, eyes or faces.
- Icon: CV monogram matching the wordmark C and V, pale lavender square background, legible distinct letters, no mascot or additional symbols.
- OG edit: retain community plaza and people, replace old title with new wordmark and remove mascot completely, preserve LGBTIQA+ subtitle and lavender space.

Source and exported assets inspected; PNG alpha and manifest export dimensions checked. Production build and interface regression checks passed. Composed browser, installed PWA and social crawler rendering remain unverified.

## Final selection

The user explicitly selected **dott-v3** after reviewing the refined V4 proposal. V3 is the active identity: angular turquoise/violet CoolVibes wordmark, CV monogram and community OG cover. All runtime references point to `dott-v3`; `refined-v4` remains an unused draft. V4 was generated using built-in image_gen with a rounded CoolVibes wordmark, connected oo letterform, indigo/violet palette and turquoise i dot; companion CV and minimal OG variants are not active.

## Nepali and Khmer landing heroes

Added `public/images/landing/hero-ne.avif` (Kathmandu) and `hero-km.avif` (Phnom Penh), generated with the built-in image generation tool. Both use the existing illustrated community hero family, not photographs. Direct output inspection and locale-specific browser captures are recorded in the documentation gallery.

Prompt brief, Nepal: wide illustrated Kathmandu/Newar streetscape with Himalayan mountains, an inclusive group of adult queer friends at a cafe on the right, angular cartoon linework and cel shading, warm pink/violet sunset, dark readable space on the left for the existing headline, no baked-in text or logo. Maintain the selected CoolVibes dott-v3 color family.

Prompt brief, Cambodia: wide illustrated Phnom Penh riverfront with Khmer architecture and palms, an inclusive group of adult queer friends at a cafe on the right, warm sunset, pink/violet palette, expressive adventure-cartoon linework, darker left area for the existing headline, no baked-in text or logo. Match the existing localized landing composition.

Final AVIF files are 1536×1024. JPEG documentation exports preserve each locale's artwork. Brand masters and active dott-v3 logo remain the selected identity.
