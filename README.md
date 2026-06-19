# Xanthra Horizon

> **Know What Matters Next.**

A premium AI intelligence platform that delivers a concise daily edition of the most important AI developments — explained in plain English and delivered to your inbox at the time you choose.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Resend](https://img.shields.io/badge/Resend-Email-000000?style=flat-square)](https://resend.com)
[![Gemini](https://img.shields.io/badge/Gemini-Flash-4285F4?style=flat-square&logo=google)](https://aistudio.google.com)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel-000?style=flat-square&logo=vercel)](https://vercel.com)
[![Cost](https://img.shields.io/badge/Cost-₹0-brightgreen?style=flat-square)](https://github.com)

---

## What It Does

Every day, Xanthra Horizon:

1. **Fetches** articles from 8 AI news sources (official lab blogs + quality tech media)
2. **Deduplicates** stories using URL hashing + Jaccard title similarity
3. **Ranks** stories by recency, source credibility, and keyword relevance
4. **Summarizes** the top 7 with Google Gemini Flash — generating a plain-English summary and "Why It Matters" insight for each
5. **Delivers** a beautiful HTML email to every subscriber at their personally chosen local time

---

## Features

- 🗞️ **8 live news sources** — OpenAI Blog, Anthropic, Google DeepMind, VentureBeat, TechCrunch, MIT Tech Review, Google News AI/LLM feeds
- 🧠 **AI summarization** — Gemini Flash generates concise summaries + business insight for each story
- 📬 **Timezone-aware delivery** — subscribers choose their delivery time; the cron job matches it globally
- 🔁 **Smart deduplication** — Jaccard similarity + URL hash dedup prevents the same story appearing twice
- 🏆 **Relevance ranking** — scores by recency (decay), source tier, and AI keyword density
- 🔒 **Secure** — Row Level Security on Supabase, CRON_SECRET on pipeline endpoint
- 📤 **One-click unsubscribe** — compliant email footer with confirmation page
- 🆓 **Zero cost** — runs entirely on free tiers

---

## Tech Stack

| Layer | Tool | Free Tier |
|---|---|---|
| Framework | Next.js 14 App Router | ✅ |
| Language | TypeScript 5 | ✅ |
| Styling | Tailwind CSS | ✅ |
| Database | Supabase (PostgreSQL) | 500 MB, 50k rows |
| Email | Resend | 3,000 emails/month |
| AI | Google Gemini Flash | 1,500 requests/day |
| Hosting | Vercel Hobby | ✅ |
| Cron | Vercel Cron / GitHub Actions | ✅ |

---

## Architecture

```
Vercel Cron (hourly)
    │
    ▼
GET /api/cron
    │
    ▼
POST /api/send-briefing
    │
    ├── fetchAllAINews()      ← 8 RSS sources (Tier 1: 7d window, Tier 2: 48h window)
    │
    ├── deduplicateArticles() ← URL hash + Jaccard similarity (threshold: 0.65)
    │
    ├── rankArticles()        ← Recency decay + source score + keyword hits
    │
    ├── generateBriefing()    ← Gemini Flash: summaries + why it matters
    │
    └── sendBriefingEmail()   ← Resend: HTML email to matched subscribers
            │
            └── Supabase: filter subscribers whose local time == current time (±5 min)
```

---

## Project Structure

```
xanthra-horizon/
├── app/
│   ├── api/
│   │   ├── cron/route.ts           # GET  /api/cron          — Vercel Cron trigger
│   │   ├── send-briefing/route.ts  # POST /api/send-briefing — full pipeline
│   │   ├── subscribe/route.ts      # POST /api/subscribe     — subscriber signup
│   │   ├── unsubscribe/route.ts    # GET  /api/unsubscribe   — deactivate subscriber
│   │   ├── test-pipeline/route.ts  # GET  /api/test-pipeline — dry run (no emails)
│   │   └── status/route.ts         # GET  /api/status        — env key health check
│   ├── unsubscribe/
│   │   ├── page.tsx                # Unsubscribe confirmation page
│   │   └── UnsubscribeContent.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                    # Landing page
├── components/
│   ├── AnimatedSection.tsx
│   ├── AnimatedTimeline.tsx
│   ├── CommandCenter.tsx
│   ├── FloatingParticles.tsx
│   ├── InteractiveBriefing.tsx
│   ├── NetworkOrb.tsx
│   ├── SignatureSection.tsx
│   └── SubscribeForm.tsx
├── lib/
│   ├── deduplicator.ts             # Jaccard + hash deduplication
│   ├── emailSender.ts              # Resend HTML email delivery
│   ├── newsFetcher.ts              # RSS feed collection (8 sources, 2 tiers)
│   ├── ranker.ts                   # Article scoring and ranking
│   ├── supabase.ts                 # Supabase client (anon + admin)
│   └── summarizer.ts               # Gemini Flash AI summarization
├── supabase/
│   └── schema.sql                  # Run once in Supabase SQL editor
├── types/
│   └── index.ts                    # Shared TypeScript types
├── .env.example                    # Environment variable template
├── .gitignore
├── next.config.js
├── package.json
├── tailwind.config.js
└── vercel.json                     # Hourly cron schedule
```

---

## Setup Guide

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free)
- A [Resend](https://resend.com) account (free)
- A [Google AI Studio](https://aistudio.google.com) account (free)

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/professyzenith/XanthraHorizon.git
cd XanthraHorizon
npm install
```

---

### Step 2 — Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste the contents of `supabase/schema.sql` → **Run**
3. Go to **Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

---

### Step 3 — Set Up Resend

1. Sign up at [resend.com](https://resend.com)
2. Go to **API Keys → Create Key**
3. Add and verify your sending domain (or use `onboarding@resend.dev` for testing)
4. Copy key → `RESEND_API_KEY` and set `RESEND_FROM_EMAIL`

---

### Step 4 — Get a Gemini API Key

1. Visit [aistudio.google.com](https://aistudio.google.com)
2. Click **Get API Key** → Create new key
3. Copy → `GEMINI_API_KEY`

---

### Step 5 — Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Resend
RESEND_API_KEY=re_your_key
RESEND_FROM_EMAIL=hello@yourdomain.com

# Gemini
GEMINI_API_KEY=your-gemini-key

# Security
CRON_SECRET=any-random-string-32-chars

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### Step 6 — Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Check which keys are configured:

```
http://localhost:3000/api/status
```

---

### Step 7 — Test the Pipeline

**Dry run (no emails sent):**

```bash
curl http://localhost:3000/api/test-pipeline?skip_ai=1 \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Full pipeline with AI + email:**

```bash
curl -X POST http://localhost:3000/api/send-briefing \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

---

## Deployment to Vercel

### Step 1 — Push to GitHub

```bash
git add .
git commit -m "Initial release"
git push origin main
```

### Step 2 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import this repository
2. Go to **Settings → Environment Variables** → add all variables from `.env.local`
3. Change `NEXT_PUBLIC_APP_URL` to your Vercel production URL
4. Deploy

### Step 3 — Cron Job

The `vercel.json` configures a cron job that runs every hour:

```json
{
  "crons": [{ "path": "/api/cron", "schedule": "0 * * * *" }]
}
```

> **Note:** Vercel Hobby plan supports once-daily cron. For hourly runs, use [cron-job.org](https://cron-job.org) (free) to call your endpoint every hour with the `Authorization` header.

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (server-only) |
| `RESEND_API_KEY` | ✅ | Resend API key for email delivery |
| `RESEND_FROM_EMAIL` | ✅ | Verified sender email address |
| `GEMINI_API_KEY` | ✅ | Google Gemini Flash API key |
| `CRON_SECRET` | ✅ | Random string to protect pipeline endpoint |
| `NEXT_PUBLIC_APP_URL` | ✅ | Your app's public URL |

---

## API Endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/subscribe` | POST | None | Subscribe a new email address |
| `/api/unsubscribe` | GET | None | Deactivate a subscriber (via email link) |
| `/api/send-briefing` | POST | CRON_SECRET | Run full pipeline + send emails |
| `/api/cron` | GET | Vercel | Called by Vercel Cron every hour |
| `/api/test-pipeline` | GET | CRON_SECRET | Dry-run pipeline (no emails) |
| `/api/status` | GET | None | Check which env keys are configured |

---

## News Sources

| Source | Tier | Time Window | Notes |
|---|---|---|---|
| OpenAI Blog | 1 (Primary) | 7 days | Official announcements |
| Anthropic Blog | 1 (Primary) | 7 days | Via feedburner |
| Google DeepMind | 1 (Primary) | 7 days | Research + releases |
| VentureBeat AI | 2 (Media) | 48 hours | Daily AI news |
| TechCrunch AI | 2 (Media) | 48 hours | Startup + product news |
| MIT Tech Review | 2 (Media) | 48 hours | Research coverage |
| Google News — AI | 2 (Aggregator) | 48 hours | Broad AI news |
| Google News — LLM | 2 (Aggregator) | 48 hours | LLM-specific news |

---

## Roadmap

- [ ] Web-based subscriber dashboard (manage delivery time/timezone)
- [ ] Weekly digest mode (in addition to daily)
- [ ] Topic filtering (subscribe to specific AI categories)
- [ ] RSS feed output for Xanthra Horizon content
- [ ] Open Graph preview cards for each edition
- [ ] GitHub Actions alternative to Vercel Cron (for Hobby plan users)
- [ ] Multi-language support

---

## License

MIT — free to use, fork, and deploy.

---

## Contributing

PRs welcome for:
- Additional high-quality news sources
- Improved ranking algorithms
- Better deduplication heuristics
- Internationalization

---

*Built with Next.js · Supabase · Resend · Google Gemini · Vercel*
