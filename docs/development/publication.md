---
title: Publishing documentation
description: GitHub Pages deployment, version alignment, verification, and documentation rollback.
---

# Publishing documentation

Pull requests regenerate the application screenshots, build the documentation, and verify it without publishing.
A push to `main` runs the same Playwright screenshot generator before GitHub Pages is built with `contents: read`,
`pages: write`, and `id-token: write`; the resulting `docs/.vitepress/dist` is deployed without repository secrets.

`https://tobiaswaelde.github.io/3d-print-calculation/` documents current `main`. Changesets align the application
version, Git tag, GitHub release, and container tag. Immutable historical documentation remains in `docs/` at each
Git tag.

## Verify publication

1. Confirm the Playwright screenshot generator, documentation check, build, and browser smoke test passed in CI.
2. Open the home page, local search, sitemap, and at least one deep user-guide link.
3. Confirm the logo gradient, application screenshots, favicon, keyboard navigation, and 390-pixel viewport.
4. Check that no legacy `/en/` or German documentation navigation remains.

## Roll back

Revert the faulty documentation commit on `main` with a new Changeset and allow the normal workflow to redeploy.
Do not rewrite history or upload an old build artifact manually. If documentation intentionally returns to an older
application contract, revert content and navigation together and state the supported version visibly.
