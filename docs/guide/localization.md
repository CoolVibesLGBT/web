# Languages and regional artwork

CoolVibes includes **23 locale variants**. The English README is the full project entry point; translated overviews explain the purpose, scope, setup, brand and verification boundaries in each supported locale. Detailed engineering guides are currently in English.

| Locale code | Language | Documentation hero |
| --- | --- | --- |
| `en` | English | [Artwork](../assets/heroes/en.jpg) |
| `ne` | नेपाली | [Artwork](../assets/heroes/ne.jpg) |
| `km` | ខ្មែរ | [Artwork](../assets/heroes/km.jpg) |
| `tr` | Türkçe | [Artwork](../assets/heroes/tr.jpg) |
| `de` | Deutsch | [Artwork](../assets/heroes/de.jpg) |
| `es` | Español | [Artwork](../assets/heroes/es.jpg) |
| `fr` | Français | [Artwork](../assets/heroes/fr.jpg) |
| `ar` | العربية | [Artwork](../assets/heroes/ar.jpg) |
| `bn` | বাংলা | [Artwork](../assets/heroes/bn.jpg) |
| `fa` | فارسی | [Artwork](../assets/heroes/fa.jpg) |
| `he` | עברית | [Artwork](../assets/heroes/he.jpg) |
| `hi` | हिन्दी | [Artwork](../assets/heroes/hi.jpg) |
| `hk` | 繁體中文（香港） | [Artwork](../assets/heroes/hk.jpg) |
| `id` | Bahasa Indonesia | [Artwork](../assets/heroes/id.jpg) |
| `ja` | 日本語 | [Artwork](../assets/heroes/ja.jpg) |
| `kp` | 조선말 | [Artwork](../assets/heroes/kp.jpg) |
| `kr` | 한국어 | [Artwork](../assets/heroes/kr.jpg) |
| `pl` | Polski | [Artwork](../assets/heroes/pl.jpg) |
| `pt` | Português | [Artwork](../assets/heroes/pt.jpg) |
| `ru` | Русский | [Artwork](../assets/heroes/ru.jpg) |
| `th` | ไทย | [Artwork](../assets/heroes/th.jpg) |
| `tw` | 繁體中文（台灣） | [Artwork](../assets/heroes/tw.jpg) |
| `zh` | 简体中文 | [Artwork](../assets/heroes/zh.jpg) |

## Runtime resources

`src/seo/seoConfig.ts` declares the locale registry. `src/i18n/index.ts` registers resources from `src/locales/<code>/`; namespaces are `common`, `landing`, `auth` and `legal`. `src/components/ui/LanguageSelector.tsx` handles selection and language display names. The selected language is persisted using the existing preference flow.

Nepali (`ne`) and Khmer (`km`, Cambodia) now include all four namespaces. Indonesian (`id`) was already supported and remains included. Existing `zh`, `tw`, `hk`, `kr` and `kp` codes are retained for compatibility; they represent regional variants, not five unrelated languages. Arabic, Persian and Hebrew use RTL layout.

API-provided catalogs and user-generated content are separate from bundled interface translations. A complete local dictionary does not guarantee that a backend returns every catalog in the selected language. New Nepali and Khmer strings and translated documentation have not been reviewed by native speakers; linguistic review remains a release task.

## Locale-specific heroes

`src/features/landing/localizedHero.ts` resolves each landing illustration. Turkish uses `istanbul-hero.avif`; other locales use `hero-<code>.avif`. The new Nepal illustration depicts Kathmandu and the Khmer illustration depicts Phnom Penh, following the selected illustrated brand family. These are stylized artwork, not documentary photographs.

Documentation uses JPEG exports in `docs/assets/heroes/` for broad GitHub/GitBook rendering support. These exports preserve the actual locale artwork. Do not replace every translated page with the English hero or use a screenshot of one language as evidence of another language's interface.

## Adding or editing a locale

1. Update the locale registry and all four namespace files; preserve interpolation placeholders.
2. Register common resources, language names and flag mappings.
3. Add the matching hero and location label in the shared resolver.
4. Add a translated overview, JPEG export and navigation links in README and SUMMARY.
5. Run the locale/documentation checks and verify language selection, persistence, layout and any RTL behavior in the running app.

```bash
node scripts/check-public-locales.mjs
node scripts/check-documentation.mjs
```

Public namespace parity is checked for all locales. The documentation check also compares all four new Nepali/Khmer namespaces with English, including interpolation tokens. Key parity is not a substitute for translation review.
