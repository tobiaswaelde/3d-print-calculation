---
title: Documentation publishing
description: GitHub Pages workflow, version alignment, security boundaries, and documentation rollback.
---

# Documentation publishing

Pull requests build and verify docs but never publish. Only a push to `main` starts Pages with `contents: read`,
`pages: write`, and `id-token: write`; `docs/.vitepress/dist` is deployed without repository secrets.

`https://tobiaswaelde.github.io/3d-print-calculation/` documents current `main`. Changesets align application
version, Git tag, GitHub release, and container tag. Immutable historical documentation remains under `docs/` at
each Git tag, and release notes link to that tag.

After deployment, open the home page, language switch, search, sitemap, and a deep link. Check keyboard navigation
and a 390-pixel viewport. The browser test provides a minimum gate.

To roll back docs, revert the faulty commit on `main` with a new Changeset and let the normal workflow redeploy.
Do not rewrite history or upload an old artifact manually. If documentation intentionally returns to an older app
contract, revert content and navigation together and state the supported version visibly.
