# GitBook and GitHub publishing

This repository is prepared for **one GitBook Git Sync space** with an English overview, detailed guides and a language section containing all 23 localized overviews. It also remains readable directly on GitHub.

## Configuration

The root `.gitbook.yaml` declares:

```yaml
root: ./
structure:
  readme: README.md
  summary: SUMMARY.md
```

`SUMMARY.md` explicitly selects the pages to import, avoiding an automatically generated navigation tree containing internal audit JSON or unrelated source files. Images and links use repository-relative paths. Language hero images are JPEG exports for dependable documentation rendering; the app continues using AVIF.

This follows [GitBook's official Git Sync content configuration](https://gitbook.com/docs/docs-as-code/git-sync/content-configuration). The configuration prepares content; it does not connect an account or publish a site.

## Import

1. In your GitBook workspace, connect Git Sync to the repository and the branch you intend to publish.
2. Use the repository root as the content/project location for this single-space setup.
3. Import the repository content, then review the overview, guides, language navigation and images in GitBook preview.
4. Choose visibility, domain and publishing settings in GitBook when ready.

No GitBook workspace, credentials or destination was supplied for this task, so no external publication has been performed. Dedicated translated GitBook spaces are a separate site configuration choice; this version provides explicit language pages in a single space.

## Updating content

Edit the source Markdown in Git, keep `SUMMARY.md` links current, and run `node scripts/check-documentation.mjs`. Update screenshots using the reproducible fixture script. Use `docs/guide/localization.md` to keep locale IDs, hero mapping and translation resources aligned. Avoid absolute developer-machine paths and GitHub-only embedded scripts in documentation.
