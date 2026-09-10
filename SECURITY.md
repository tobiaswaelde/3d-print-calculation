# Security policy

## Supported versions

| Version                  | Supported |
| ------------------------ | --------- |
| Latest published release | Yes       |
| Older releases           | No        |

Security fixes target the latest published release. Upgrade to the newest fixed version after reviewing its release
notes and taking a verified database backup.

## Reporting a vulnerability

Report vulnerabilities through GitHub's private
[security advisory form](https://github.com/tobiaswaelde/ezprint/security/advisories/new). Do not open a
public issue for an unpatched vulnerability and do not include real credentials, session cookies, database files,
or personal data in reports.

Include the affected version, deployment model, reproduction steps with synthetic data, expected impact, and any
known mitigations. Reports are reviewed privately and coordinated disclosure is preferred. Rotate credentials and
invalidate sessions if exposure is suspected.

## Security scope

Reports are especially useful for authentication or session bypasses, unauthorized data access, injection,
container privilege escalation, and flaws that expose the SQLite database or application secrets. General support,
feature requests, and hardening suggestions without a concrete vulnerability belong in a regular issue.

## Operator responsibilities

Operators remain responsible for TLS termination, network access control, encrypted off-host backups, host updates,
and restricting access to the SQLite volume. The application is designed for a single trusted operator account and
one running replica.
