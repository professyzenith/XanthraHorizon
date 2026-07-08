# Changelog

All notable changes to Xanthra Horizon are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Subscriber web dashboard for managing delivery preferences
- Weekly digest mode
- Topic category filtering
- RSS output of each edition
- GitHub Actions alternative cron for Vercel Hobby users

---

## [1.3.0] — 2026-07-08

### Added
- `briefings` table in Supabase — pipeline now persists each generated briefing to the database
- `GET /api/latest-briefing` public endpoint — returns the most recent briefing with 5-minute CDN caching
- `InteractiveBriefing` component now fetches live data from the database on mount, replacing static demo content
- `LIVE` / `PREVIEW` indicator on the homepage briefing card — shows whether real pipeline data has loaded
- `LICENSE` file (MIT)
- `CONTRIBUTING.md` — contributor guidelines and development setup
- `CHANGELOG.md` — this file
- `.github/SECURITY.md` — vulnerability reporting policy
- `.github/workflows/ci.yml` — GitHub Actions CI running TypeScript checks, ESLint, and tests on every push and PR
- Unit tests for `deduplicateArticles` and `rankArticles` core pipeline logic
- Real screenshots committed to `docs/screenshots/`
- Animated typing header SVG in README

### Fixed
- **Critical**: `InteractiveBriefing` was displaying hardcoded demo stories from project inception — never connected to the live pipeline. Now displays today's real AI headlines.
- Git author email was set to `professyzenith@github.com` (non-existent) in local repo config, preventing contributions from appearing on GitHub profile. Corrected to `professy69@gmail.com` and rewrote affected commit history.

---

## [1.2.0] — 2026-07-07

### Added
- ESLint upgraded from v8 to v9 with flat config (`eslint.config.mjs`) — eliminates all deprecated `@humanwhocodes/*` package warnings in Vercel build logs
- `.npmrc` to suppress cosmetic deprecation noise in CI logs

### Removed
- `.eslintrc.json` (replaced by `eslint.config.mjs`)
- `/api/test-email` endpoint — was an unauthenticated route that could trigger email delivery without authentication

### Changed
- `package.json` overrides updated: removed conflicting `minimatch` override that broke `@eslint/eslintrc@3`

---

## [1.1.0] — 2026-07-07

### Added
- Cross-day deduplication: `articles_seen` table stores SHA-256 hashes of delivered articles for 7 days, preventing the same story from appearing in consecutive briefings
- `CRON_SECRET` environment variable to protect all pipeline endpoints from unauthorized invocation
- Supabase Row Level Security on `articles_seen` table
- `update_updated_at` trigger function secured with `SET search_path = ''` and execute permissions revoked from `anon`/`authenticated`/`public` roles — resolves Supabase Security Advisor warnings

### Fixed
- `send-briefing` route had a fire-and-forget bug where `sendWelcomeEmail` was not awaited, causing Vercel to kill the function before the email was sent
- Supabase Security Advisor: "Function Search Path Mutable" warning resolved

---

## [1.0.0] — 2026-07-06

### Added
- Initial release
- 8-source RSS news ingestion pipeline (3 tiers: lab blogs, tech media, aggregators)
- Jaccard similarity + SHA-256 URL hash deduplication
- Composite article ranking (source tier weight, recency decay, keyword density)
- Google Gemini 2.0 Flash summarization — summary + "Why It Matters" per story
- Timezone-aware email delivery (±5-minute window matching per subscriber)
- Resend HTML email delivery — welcome email + daily briefing template
- HMAC-SHA256 signed unsubscribe tokens (CAN-SPAM compliant)
- Supabase subscriber management with Row Level Security
- Next.js 16 App Router with TypeScript strict mode
- Tailwind CSS dark-mode UI
- Vercel deployment with hourly cron schedule
- `GET /api/status` environment health check
- `GET /api/test-pipeline` dry-run endpoint (no emails, no DB writes)
