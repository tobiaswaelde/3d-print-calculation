---
title: Setup and access
description: First-run setup, sign-in, language, appearance, instance settings, and password reset.
---

# Setup and access

## First-run setup

The first request redirects to **First-run setup**. Enter display name, email, a password of at least 12 characters,
language, currency, and electricity price per kWh. Exactly one setup request can succeed; the route is locked after
that and the successful request signs the user in.

Currency applies to the whole instance. Once a printer, component, filament, or print exists, currency changes are
blocked so existing amounts cannot be reinterpreted. Electricity price and default language remain editable.

## Sign-in and personal settings

Sign in with email and password. **Language** switches between German and English and is stored on the account.
**Appearance** offers Light, Dark, and System. **Sign out** deletes the current session.

## Reset a password

There is intentionally no email reset. An operator resets it locally in the running container:

```bash
docker compose exec app pnpm db:reset-password operator@example.test 'new-long-password'
```

The command invalidates every session for that account. Avoid production secrets in shell history; prefer the
host's interactive secret facility.

## Recovery

- For validation failures, check required fields, decimal point syntax, and minimum length.
- If already initialized, use sign-in; setup is not repeatable.
- For invalid credentials, verify the address or use the local reset.
- For an empty view, create the required [master data](/en/guide/master-data) first.
