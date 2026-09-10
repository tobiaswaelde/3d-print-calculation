# Security policy

## Supported versions

Security fixes target the latest published release. Upgrade to the newest fixed version after reviewing its release
notes and taking a verified database backup.

## Reporting a vulnerability

Report vulnerabilities privately through GitHub's **Security → Report a vulnerability** flow. Do not open a public
issue for an unpatched vulnerability and do not include real credentials, session cookies, database files, or
personal data in reports.

Include the affected version, deployment model, reproduction steps with synthetic data, expected impact, and any
known mitigations. Rotate credentials and invalidate sessions if exposure is suspected.

Operators remain responsible for TLS termination, network access control, encrypted off-host backups, host updates,
and restricting access to the SQLite volume. The application is designed for a single trusted operator account and
one running replica.
