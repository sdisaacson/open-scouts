# Open Scouts — Agent Guide

This file contains everything an AI coding agent needs to know to work effectively in this codebase. Read it carefully before making any changes.

## Project Overview

Open Scouts is an AI-powered monitoring platform built with Next.js. Users create "scouts" — automated tasks that run on a schedule to continuously search the web and notify them when new information is found. Each scout is backed by an OpenAI agent that uses Firecrawl for web search/scraping and can send email alerts via Resend.

The project was originally built by the Firecrawl team and shares the Firecrawl design system and branding conventions.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15.2.6 (App Router) |
| React | 19.2.0 |
| Language | TypeScript 5.3+ |
| Styling | Tailwind CSS 3.4.17 (heavily customized) |
| UI Components | shadcn/ui + Radix UI + custom Firecrawl-branded components |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (email/password + Google OAuth) |
| AI/LLM | OpenAI GPT-4.1-mini / GPT-5.1 (via `ai` SDK) |
| Embeddings | OpenAI `text-embedding-3-small` |
| Web Scraping | Firecrawl API (`@mendable/firecrawl-js`) |
| Email | Resend |
| Analytics | PostHog |
| Package Manager | bun (preferred), npm/pnpm also work |
| Edge Runtime | Supabase Edge Functions (Deno) |

## Project Structure

```
app/                    # Next.js App Router pages and API routes
├── page.tsx            # Homepage (landing + scout creation)
├── layout.tsx          # Root layout (fonts, providers, metadata)
├── globals.css         # Global styles + CSS variables
├── error.tsx           # Global error boundary
├── not-found.tsx       # 404 page
├── [id]/page.tsx       # Scout execution results (top-level dynamic route)
├── admin/page.tsx      # Admin dashboard (domain-restricted)
├── api/                # API routes
│   ├── chat/route.ts           # AI streaming chat for scout config
│   ├── scout/execute/route.ts  # Trigger manual scout execution
│   ├── firecrawl/              # Firecrawl credit/regenerate endpoints
│   ├── send-test-email/route.ts
│   └── admin/route.ts          # Admin user management
├── auth/callback/route.ts      # OAuth callback handler
├── login/page.tsx              # Auth page
├── scout/[id]/page.tsx         # Scout configuration chat
├── scouts/page.tsx             # Dashboard listing all scouts
├── settings/page.tsx           # User settings
└── template/page.tsx           # Marketing/template page

components/             # React components (~748 files)
├── ui/                 # Core UI primitives
│   ├── shadcn/         # Firecrawl-branded shadcn components
│   ├── shadcn-default/ # Standard shadcn fallback components
│   ├── magic/          # Magic UI animated effects
│   ├── motion/         # Motion/animation utilities
│   └── tremor/         # Data visualization components
├── shared/             # App-wide shared components (effects, layout, icons)
├── app/                # Page-specific components
│   └── (home)/sections/# Deeply nested per-section components
├── ai-elements/        # AI chat UI (messages, code blocks, loaders)
├── marketing/          # Marketing providers
├── hooks/              # Component-level hooks
└── providers/          # Theme provider

contexts/               # React contexts
├── AuthContext.tsx     # Supabase auth session management
└── CurrencyContext.tsx # Currency formatting context

hooks/                  # Global custom hooks
lib/                    # Library code
├── app/                # App-specific utilities (chart utils, etc.)
├── supabase/
│   ├── client.ts       # Browser Supabase client
│   ├── server.ts       # Server Component + service-role clients
│   └── proxy.ts        # (deprecated, see root proxy.ts)
├── firecrawl.ts        # Firecrawl client setup
├── firecrawl-partner.ts# Partner API key creation/management
├── posthog-server.ts   # Server-side PostHog tracking
└── utils.ts            # `cn()` (clsx + tailwind-merge), deepEqual, normalizeEmail

styles/                 # Fire Design System styles
├── main.css
├── design-system/      # fonts, colors, typography, animations, utilities
└── components/         # Component-level CSS (e.g., button.css)

styles-marketing/       # Marketing page styles (imported in root layout)

supabase/
├── functions/
│   ├── scout-cron/     # Main edge function (AI agent execution)
│   │   ├── index.ts    # HTTP entry point
│   │   ├── agent.ts    # OpenAI agent orchestration (~800 lines)
│   │   ├── tools.ts    # Firecrawl search/scrape tools
│   │   ├── email.ts    # Resend email notifications
│   │   ├── helpers.ts  # DB helpers, Firecrawl key management
│   │   ├── posthog.ts  # Edge function analytics
│   │   ├── constants.ts# CORS, blacklists, helpers
│   │   ├── types.ts    # TypeScript types
│   │   └── deno.json   # Deno imports
│   └── send-test-email/# Test email edge function
├── migrations/
│   ├── 00000000000000_schema.sql   # Consolidated schema
│   └── old_migrations/             # Previous migration files
└── config.toml                     # Supabase CLI config

scripts/
├── setup-db.mjs        # Database setup: migrations, realtime, cron, vault secrets
├── migrate.ts          # Run latest migration via postgres client
├── check-rls.ts        # Check RLS status on tables
└── test-scout-cron.sh  # Manual curl test for edge function

utils/                  # General utilities (animation helpers, formatters, etc.)
types/                  # Global TypeScript declarations
public/                 # Static assets
```

## Build and Development Commands

```bash
# Development server (http://localhost:3000)
bun run dev

# Production build
bun run build

# Start production server
bun run start

# Lint (ESLint — non-blocking during builds)
bun run lint

# Database setup (migrations, extensions, cron jobs, vault secrets)
bun run setup:db

# Run latest migration only
bun run migrate
```

## Design System & Styling Conventions

This is the **most critical** thing to understand. The project uses a custom Firecrawl design system with a **pixel-based Tailwind configuration**.

### ⚠️ Pixel-Based Sizing System

Numeric Tailwind utility values map to **literal pixels**, not rem units.

| Class | Standard Tailwind | This Project |
|-------|------------------|--------------|
| `w-3` | 0.75rem (12px) | **3px** |
| `p-12` | 3rem (48px) | **12px** |
| `h-9` | 2.25rem (36px) | **9px** |
| `gap-24` | 6rem (96px) | **24px** |

**This applies to:** `spacing`, `width`, `height`, `size`, `inset`, `borderWidth`.

**Typography is NOT affected** — it uses semantic tokens like `text-title-h1`, `text-body-medium`.

### Correct Usage Examples

```tsx
// ✅ Spacing (padding, margin, gap) — works as expected
<div className="p-24 gap-16 mb-8">  {/* 24px padding, 16px gap, 8px margin */}

// ✅ Border radius — pixel-based
<div className="rounded-4">   {/* 4px */}
<div className="rounded-6">   {/* 6px */}
<div className="rounded-8">   {/* 8px */}
<div className="rounded-16">  {/* 16px */}

// ✅ Border width — explicit
<div className="border-1">    {/* 1px border */}

// ❌ WRONG — do NOT use standard Tailwind radius names
<div className="rounded-sm rounded-md rounded-lg">

// ❌ WRONG — `h-9` creates a 9px-tall button, not 36px
<Button className="h-9" />

// ✅ CORRECT — use explicit pixel values for dimensions
<Button className="h-36 px-16 gap-8" />
<Icon className="w-16 h-16" />
<Input className="h-40 px-12 py-8 rounded-6 border-1" />
```

### Color Tokens

Colors come from `colors.json` and are exposed as CSS custom properties:

- Brand: `heat-4` through `heat-100` (orange #fa5d19 with opacity variants)
- Accents: `accent-black`, `accent-white`, `accent-amethyst`, `accent-bluetron`, `accent-crimson`, `accent-forest`, `accent-honey`
- Borders: `border-faint`, `border-muted`, `border-loud`
- Backgrounds: `background-lighter`, `background-base`
- Alpha overlays: `black-alpha-1` through `black-alpha-88`, `white-alpha-56`, `white-alpha-72`

### Typography Tokens

- Titles: `title-h1` (60px) → `title-h5` (24px)
- Body: `body-x-large` (20px) → `body-small` (13px)
- Labels: `label-x-large` (20px) → `label-x-small` (12px), weight 450
- Mono: `mono-medium`, `mono-small`, `mono-x-small`

### shadcn/ui Setup

- Config: `components.json` (style: default, RSC, TSX, no CSS variables)
- Two variants exist:
  - `components/ui/shadcn/` — Firecrawl-branded (custom variants, loading states, P3 box-shadows)
  - `components/ui/shadcn-default/` — Standard shadcn fallback
- Use `cn()` from `@/lib/utils` for conditional class merging everywhere.

### Responsive Breakpoints

- `xs`: 390px, `sm`: 576px, `md`: 768px, `lg`: 996px, `xl`: 1200px
- Plus `*-max` variants for max-width queries.

## Database Architecture

### Tables

| Table | Purpose |
|-------|---------|
| `scouts` | User-created monitoring agents (goal, queries, location, frequency, is_active) |
| `scout_messages` | Conversation history per scout |
| `scout_executions` | Individual run tracking (status, results, summary, embedding vector) |
| `scout_execution_steps` | Step-by-step execution log (search/scrape/analyze/summarize) |
| `user_preferences` | Per-user settings (location, Firecrawl API keys, key status) |
| `firecrawl_usage_logs` | Usage tracking per execution |

### Key Features

- **Row Level Security (RLS)** is enabled on all tables. Policies ensure users can only access their own data.
- **Vector embeddings** (`summary_embedding`, 1536-dim) with HNSW index for duplicate detection via cosine similarity.
- **pg_cron + pg_net**: Scheduled dispatcher runs every minute to trigger due scouts.
- **Supabase Vault**: Stores `project_url` and `service_role_key` securely for the dispatcher.
- **Realtime**: Enabled on `scout_executions` and `scout_execution_steps` for live UI updates.

### Database Functions

- `should_run_scout(frequency, last_run_at, ...)` — Determines if a scout is due.
- `dispatch_due_scouts()` — Finds up to 20 due scouts and dispatches them via HTTP to the edge function.
- `cleanup_scout_executions()` — Marks stuck executions as failed (>10 min) and cleans old cron logs.

## Authentication & Authorization

- **Methods**: Email/password and Google OAuth via Supabase Auth.
- **No Next.js middleware.ts** — auth route protection is handled by a custom proxy utility (`proxy.ts`) and client-side checks.
- **Protected routes**: `/scouts`, `/settings`, `/scout`, `/template` redirect unauthenticated users to `/login`.
- **Auth routes**: `/login` redirects authenticated users to `/scouts`.
- **OAuth flow**: `/login` → Google → `/auth/callback` → exchange code → create Firecrawl partner key (first signup) → redirect.
- **Admin access**: Hardcoded to `@sideguide.dev` email domain. Enforced client-side and server-side (`/api/admin`).
- **API route pattern**: Use `createServerSupabaseClient()` + `getUser()`, then verify ownership with service-role client if needed.

## Edge Functions

### `scout-cron` (Main Execution)

- Triggered by HTTP POST from `dispatch_due_scouts()` or manual run via `/api/scout/execute`.
- Validates scout is active and configuration is complete.
- Creates a `scout_executions` row with status `running`.
- Fetches user's Firecrawl API key (custom key → sponsored key → shared partner fallback).
- Queries up to 20 recent successful executions with embeddings for context.
- Calls OpenAI `gpt-5.1-2025-11-13` with function calling (max 7 loops).
- Available tools: `searchWeb`, `scrapeWebsite` (both Firecrawl-powered).
- On completion:
  - Generates one-sentence summary via OpenAI.
  - Generates embedding via `text-embedding-3-small`.
  - Checks cosine similarity against previous executions (threshold 0.85).
  - Skips email if duplicate/similar result detected.
  - Sends email via Resend if new results found.
  - Tracks events in PostHog.
- Error handling:
  - 401 from Firecrawl → marks key invalid.
  - 402 from Firecrawl → disables ALL user scouts, marks key invalid.
  - 3 consecutive tool errors → aborts.
  - Max loops reached → forces completion with `partial` status.
  - 3 consecutive failures → auto-disables scout.

### `send-test-email`

- Simple endpoint to verify Resend configuration.
- Sends branded HTML test email to the authenticated user's email.

## Cron Jobs

| Job | Schedule | Action |
|-----|----------|--------|
| `dispatch-scouts` | `* * * * *` (every minute) | `SELECT dispatch_due_scouts()` |
| `cleanup-scouts` | `*/5 * * * *` (every 5 min) | `SELECT cleanup_scout_executions()` |

## Environment Variables

Copy `.env.example` to `.env` and fill in all values.

| Variable | Required | Used By |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Client, server, edge functions |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Client, server |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server admin ops, edge functions, DB setup |
| `DATABASE_URL` | Yes | Migration scripts |
| `OPENAI_API_KEY` | Yes | Edge function (agent, embeddings, summaries) |
| `FIRECRAWL_API_KEY` | Yes | Edge function (partner key creation) |
| `RESEND_API_KEY` | Yes | Edge function (email notifications) |
| `RESEND_FROM_EMAIL` | Yes | Edge function (from address) |
| `NEXT_PUBLIC_SITE_URL` | Yes | OAuth redirects, OG images |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional | Client-side analytics |

**Edge function secrets** (`OPENAI_API_KEY`, `FIRECRAWL_API_KEY`, `RESEND_*`) are synced to Supabase via `setup:db` or set manually with `bunx supabase secrets set`.

## Code Style Guidelines

### TypeScript

- `strict: true` in `tsconfig.json`, but `noImplicitAny: false`.
- Path alias `@/*` maps to project root.
- `supabase/functions` is excluded from TS compilation.

### ESLint / Prettier

- Config: `.eslintrc.js` extends `next/core-web-vitals`, `next/typescript`, `prettier`.
- **ESLint is ignored during builds** (`ignoreDuringBuilds: true` in `next.config.js`).
- Many rules are currently set to `warn` rather than `error` — this is a transitional state.
- `supabase/functions` is ignored by ESLint.

### Component Conventions

- Use PascalCase for component files and exports.
- Use kebab-case for directories.
- Forward refs with `displayName` for branded shadcn components.
- Import organization: third-party → shared/components → local/relative.
- Use `cn()` from `@/lib/utils` for all conditional class merging.

### File Organization

- Reusable components go in `components/shared/` or `components/ui/`.
- Page-specific components go in `components/app/` under the relevant route section.
- Hooks go in `hooks/` (global) or `components/hooks/` (component-level).
- Utils go in `utils/` (general) or `lib/` (app-specific / library code).

## Testing Strategy

**There are currently no automated tests in this project.** No Jest, Vitest, Playwright, or other test frameworks are configured.

Testing is done manually:
- Use `/api/test-scout` for dev endpoint testing.
- Use `scripts/test-scout-cron.sh` to manually curl the edge function.
- Use the Settings page "Send Test Email" button to verify email configuration.

If you add tests, place them alongside the code they test or in a `__tests__/` directory, and update `package.json` scripts accordingly.

## Security Considerations

- **RLS is mandatory** on all user-facing tables. Never disable RLS without adding proper policies.
- **Service role key** (`SUPABASE_SERVICE_ROLE_KEY`) bypasses RLS. Only use it in server-side code and edge functions. Never expose it to the client.
- **Firecrawl API keys**: Custom user keys are stored in `user_preferences.firecrawl_custom_api_key`. Server-side shared keys are set as edge function secrets. Partner keys are created per-user via the Firecrawl admin API.
- **Admin access** is gated by email domain (`@sideguide.dev`).
- **Security headers** are set globally in `next.config.js` (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).

## Deployment

The project is configured for deployment on **Vercel** (evidenced by `.vercel/` directory and `vercel` dependency).

Build command: `bun run build`
Start command: `bun run start`

Edge functions are deployed separately to Supabase:
```bash
bunx supabase functions deploy scout-cron
bunx supabase functions deploy send-test-email
```

## Important Notes & Pitfalls

1. **Top-level dynamic route `/:id`** catches any single-segment URL. Adding new top-level routes requires careful ordering to avoid conflicts.
2. **No `middleware.ts`** — auth is handled client-side and via `proxy.ts`. Do not create a `middleware.ts` expecting standard Next.js middleware behavior without checking `proxy.ts` first.
3. **Two chat API endpoints exist**: `/api/chat` (newer, gpt-4.1-mini, more aggressive system prompt) and `/api/scout` (legacy, gpt-5.1). The scout config page uses `/api/chat`.
4. **DESIGN_SYSTEM.md references `components-new/`** but the actual directory is `components/`. This is a known discrepancy from a migration.
5. **Tailwind v3 is used**, not v4. `package.json` lists `@tailwindcss/postcss` v4 as a devDependency but `tailwindcss` is pinned to `3.4.17`.
6. **`components.json` incorrectly references `tailwind.config.js`** — the actual file is `tailwind.config.ts`.
7. **PostHog key is not in `.env.example`** but is required for analytics (`NEXT_PUBLIC_POSTHOG_KEY`).
8. **The app forces light mode** (`color-scheme: light` in `globals.css`). Dark mode is not supported.

## Useful Reference Files

- `DESIGN_SYSTEM.md` — Detailed design system docs (note: references `components-new/` which is now `components/`)
- `POSTHOG.md` — Catalog of tracked analytics events
- `colors.json` — Design system color palette
- `tailwind.config.ts` — Custom Tailwind configuration (critical to understand)
- `supabase/migrations/00000000000000_schema.sql` — Full database schema
- `scripts/setup-db.mjs` — Database setup and cron job configuration
