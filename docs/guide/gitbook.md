# GitBook and GitHub publishing

[Download CoolVibes for VS Code](https://marketplace.visualstudio.com/items?itemName=CoolVibes.coolvibes-vscode-extension)

This repository is prepared for **one GitBook Git Sync space** with an English overview, detailed guides and a language section containing all 23 localized overviews. It also remains readable directly on GitHub.

## Configuration

The root `gitbook-docs.yaml` defines the site structure for **site-wide Git Sync**:

```yaml
$schema: https://api.gitbook.com/gitbook-docs.yaml

site:
  title: CoolVibes
  structure:
    - type: space
      key: coolvibes-documentation
      title: CoolVibes Documentation
      path: docs
      default: true
      content:
        directory: ./
        language: en
```

This maps **CoolVibes Documentation → `./`**. The space's primary language is English; all 23 localized overviews remain pages within it. Keep the space key stable across updates. The site structure follows [GitBook's official configuration schema](https://api.gitbook.com/gitbook-docs.yaml).

The separate root `.gitbook.yaml` declares the content entry points for that space:

```yaml
root: ./
structure:
  readme: README.md
  summary: SUMMARY.md
```

`SUMMARY.md` explicitly selects the pages to import, avoiding an automatically generated navigation tree containing internal audit JSON or unrelated source files. Images and links use repository-relative paths. Language hero images are JPEG exports for dependable documentation rendering; the app continues using AVIF.

This follows [GitBook's official Git Sync content configuration](https://gitbook.com/docs/docs-as-code/git-sync/content-configuration). The configuration prepares content; it does not connect an account or publish a site.

## Import

1. Ensure `gitbook-docs.yaml`, `.gitbook.yaml`, `README.md`, `SUMMARY.md` and their linked documentation/assets are committed and pushed to the branch you select in GitBook.
2. Connect the site's Git Sync to `CoolVibesLGBT/web` and that branch. Set **Project directory** to the repository root (blank, or `./` if the UI requests a value).
3. Under **Content mapping → Site structure**, select **`gitbook-docs.yaml`**. The declared space maps to **`./`**, not `./docs`; the README and SUMMARY are in the repository root.
4. For the initial import, sync **GitHub → GitBook**. Review the overview, guides, language navigation and images in GitBook preview.
5. Choose visibility, domain and publishing settings in GitBook when ready.

No GitBook workspace, credentials or destination was supplied for this task, so no external publication has been performed. Dedicated translated GitBook spaces are a separate site configuration choice; this version provides explicit language pages in a single space.

## Updating content

Edit the source Markdown in Git, keep `SUMMARY.md` links current, and run `node scripts/check-documentation.mjs`. Edit `gitbook-docs.yaml` when changing site/space mapping; edit `.gitbook.yaml` when changing this space's entry files. Update screenshots using the reproducible fixture script. Use `docs/guide/localization.md` to keep locale IDs, hero mapping and translation resources aligned. Avoid absolute developer-machine paths and GitHub-only embedded scripts in documentation.
