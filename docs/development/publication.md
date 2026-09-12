---
title: Publishing documentation
description: GitHub Pages deployment, version alignment, verification, and documentation rollback.
---

# Publishing documentation

Pull requests build and verify the documentation without publishing. A push to `main` builds the checked-in
documentation with `contents: read`, `pages: write`, and `id-token: write`; the resulting
`docs/.vitepress/dist` is deployed without repository secrets.

Screenshot generation runs independently for relevant application changes. It is non-blocking so a flaky capture
cannot hold up CI or documentation deployment. Failures emit a workflow warning and retain Playwright artifacts
for seven days. Regenerate and commit screenshots locally whenever a documented UI changes.

`https://tobiaswaelde.github.io/ezprint/` documents current `main`. Changesets align the application
version, Git tag, GitHub release, and container tag. Immutable historical documentation remains in `docs/` at each
Git tag.

The release workflow uses the `CHANGESETS_PR_TOKEN` repository secret only to create and update the
`Version Packages` pull request. Configure it with a fine-grained personal access token limited to this repository,
with read and write access to **Contents** and **Pull requests**. This lets the pull request workflows start without
manual approval. Image publication, Git tags, and GitHub Releases continue to use the short-lived `GITHUB_TOKEN`.
Rotate the personal access token before it expires and update the secret without committing or logging its value.

## Verify publication

1. Confirm the documentation check, build, and browser smoke test passed in CI.
2. Inspect any warning from the non-blocking Documentation Screenshots workflow.
3. Open the home page, local search, sitemap, and at least one deep user-guide link.
4. Confirm the logo gradient, application screenshots, favicon, keyboard navigation, and 390-pixel viewport.
5. Check that no legacy `/en/` or German documentation navigation remains.

## Roll back

Revert the faulty documentation commit on `main` with a new Changeset and allow the normal workflow to redeploy.
Do not rewrite history or upload an old build artifact manually. If documentation intentionally returns to an older
application contract, revert content and navigation together and state the supported version visibly.
