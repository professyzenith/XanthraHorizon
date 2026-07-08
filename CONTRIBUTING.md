## Contributing to Xanthra Horizon

Thank you for your interest in contributing. This document describes the process for submitting changes.

### What We Accept

- **New RSS sources** — high-quality, AI-focused, with a stable RSS feed URL
- **Ranking and deduplication improvements** — changes to `lib/ranker.ts` or `lib/deduplicator.ts` with measurable improvement rationale
- **Bug fixes** — with a clear description of the problem and reproduction steps
- **Documentation improvements** — corrections, additions, or clarifications

We are not currently accepting UI redesigns, new subscriber-facing features, or changes to the email template without prior discussion.

### Development Setup

```bash
git clone https://github.com/professyzenith/XanthraHorizon.git
cd XanthraHorizon
npm install
cp .env.example .env.local
# Fill in .env.local with your own development keys
npm run dev
```

### Making Changes

1. **Fork** the repository
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
3. **Make changes** with focused, atomic commits following the convention below
4. **Run checks** before pushing:
   ```bash
   npx tsc --noEmit --skipLibCheck   # must pass with 0 errors
   npx eslint app lib components     # must pass with 0 warnings
   npm test                          # must pass
   ```
5. **Open a pull request** against `main` with a clear description

### Commit Convention

| Prefix | Use case |
|---|---|
| `feat:` | New capability |
| `fix:` | Bug fix |
| `refactor:` | Restructuring without changing behavior |
| `docs:` | Documentation only |
| `chore:` | Build system, tooling, dependencies |
| `test:` | Adding or fixing tests |
| `security:` | Security-related change |

Example: `feat: add Reuters AI RSS source to news fetcher`

### Adding a New RSS Source

To add a source to `lib/newsFetcher.ts`:

1. Confirm the feed is a valid RSS 2.0 or Atom feed
2. Confirm it publishes AI-focused content at a frequency of at least weekly
3. Assign it to the appropriate tier:
   - **Tier 1**: Official lab/company blogs (7-day window)
   - **Tier 2**: Quality tech media (48-hour window)
   - **Tier 3**: Aggregators (48-hour window)
4. Add an entry to `SOURCE_SCORES` in `lib/ranker.ts` with an appropriate score (see existing entries for reference)
5. Include the source name and feed URL in your PR description

### Code Style

- TypeScript strict mode is required — no `any`, no ignored type errors
- All exported functions must have parameter and return types annotated
- No `console.log` in UI files — use `console.error`/`console.warn` only
- ESLint v9 flat config (`eslint.config.mjs`) — do not disable rules without justification

### Pull Request Review

All pull requests are reviewed by the maintainer. Reviews typically happen within 5 business days. PRs that pass all automated checks and include a clear description will be prioritized.
