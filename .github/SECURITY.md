# Security Policy

## Supported Versions

Only the latest version of Xanthra Horizon (deployed from `main`) receives security updates.

| Version | Supported |
|---|---|
| `main` (latest) | ✅ |
| Older branches | ❌ |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Report vulnerabilities privately via one of these methods:

1. **GitHub Private Vulnerability Reporting** (preferred): [Security tab → Report a vulnerability](https://github.com/professyzenith/XanthraHorizon/security/advisories/new)
2. **Email**: Open a GitHub issue marked `[SECURITY]` with minimal reproduction steps — we will respond within 72 hours to arrange a private channel.

## What to Include in a Report

- A description of the vulnerability and its potential impact
- Steps to reproduce (proof-of-concept code if applicable)
- The component affected (`lib/`, `app/api/`, database, etc.)
- Your suggested remediation (optional but appreciated)

## Scope

The following are in scope:

- Authentication bypass on protected API endpoints (`/api/send-briefing`, `/api/status`, `/api/test-pipeline`)
- HMAC token forgery for unsubscribe URLs
- SQL injection or Row Level Security bypass in Supabase
- Server-Side Request Forgery (SSRF) via RSS feed URLs
- Exposure of environment secrets (service role key, `CRON_SECRET`, Gemini key)
- Cross-Site Scripting (XSS) in the subscriber-facing email or web pages

The following are **out of scope**:

- Rate limiting (this project has no auth layer on the subscribe endpoint by design)
- Email spam / subscriber list harvesting (mitigated by Resend's sender reputation)
- Security issues in third-party services (Supabase, Resend, Vercel, Google)
- Vulnerabilities requiring physical access to the server

## Response Timeline

| Milestone | Target |
|---|---|
| Initial acknowledgement | 72 hours |
| Severity assessment | 5 business days |
| Fix deployed to `main` | 14 business days (critical issues expedited) |
| Public disclosure | After fix is live |

We follow responsible disclosure and will credit reporters in the CHANGELOG unless anonymity is requested.
