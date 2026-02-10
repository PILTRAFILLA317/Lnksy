# Lnksy

A link-in-bio SaaS platform built with SvelteKit 5, Tailwind CSS 4.1, Supabase, and Stripe.

## Stack

- **Frontend**: SvelteKit 5 (TypeScript), Tailwind CSS 4.1
- **Backend**: Supabase (Postgres, Auth, Storage)
- **Payments**: Stripe Billing
- **Testing**: Vitest

## Features

- Public profile pages at `lnksy.com/{handle}`
- CRUD link editor with drag & drop, duplicate, toggle
- 13 curated themes (3 free, 10 pro)
- Pro plan: unlimited links, custom colors, scheduling, highlights, analytics per link
- Real-time preview in editor
- Analytics: views, uniques, clicks, CTR
- Stripe subscription billing with Customer Portal
- Mobile-first responsive design

## Project Structure

```
lnksy/
├── supabase/
│   ├── schema.sql          # Complete DB schema, RLS policies, triggers
│   └── seed.sql            # Themes and reserved slugs
├── src/
│   ├── app.d.ts            # TypeScript app-level types
│   ├── app.html            # HTML template
│   ├── hooks.server.ts     # Auth middleware
│   ├── lib/
│   │   ├── types.ts        # Shared TypeScript types
│   │   ├── themes.ts       # Theme utilities
│   │   ├── supabase.ts     # Browser Supabase client
│   │   ├── server/
│   │   │   ├── supabase.ts # Server Supabase clients
│   │   │   ├── stripe.ts   # Stripe SDK wrapper
│   │   │   └── rate-limit.ts
│   │   ├── utils/
│   │   │   ├── handle.ts   # Handle validation
│   │   │   └── helpers.ts  # Shared utilities
│   │   └── components/ui/  # UI components
│   │       ├── Button.svelte
│   │       ├── Input.svelte
│   │       ├── Card.svelte
│   │       ├── Modal.svelte
│   │       ├── Tabs.svelte
│   │       ├── Toast.svelte
│   │       ├── PhonePreview.svelte
│   │       └── LinkCard.svelte
│   ├── routes/
│   │   ├── +page.svelte          # Landing page
│   │   ├── auth/                 # Auth flow
│   │   │   ├── +page.svelte      # Login (magic link, Google, Apple)
│   │   │   └── callback/+server.ts
│   │   ├── app/                  # Protected dashboard
│   │   │   ├── +page.svelte      # Link editor
│   │   │   ├── onboarding/confirm/  # Handle claim
│   │   │   ├── appearance/       # Theme picker
│   │   │   ├── analytics/        # Stats dashboard
│   │   │   ├── billing/          # Subscription management
│   │   │   └── settings/         # Profile settings
│   │   ├── api/
│   │   │   ├── handle/check/     # Handle availability
│   │   │   ├── track/            # Analytics tracking
│   │   │   ├── billing/
│   │   │   │   ├── checkout/     # Stripe Checkout
│   │   │   │   ├── portal/       # Stripe Portal
│   │   │   │   └── webhook/      # Stripe webhooks
│   │   │   └── upload/           # Avatar upload
│   │   └── [handle]/             # Public profile (SSR)
│   └── tests/
│       ├── handle.test.ts        # Handle validation tests
│       └── gating.test.ts        # Plan gating tests
├── .env.example
├── package.json
├── svelte.config.js
├── vite.config.ts
└── tsconfig.json
```

## Local Setup

### 1. Install dependencies

```bash
npm install --force
```

### 2. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run:
   - `supabase/schema.sql` — creates all tables, indexes, RLS policies, triggers
   - `supabase/seed.sql` — seeds themes and reserved slugs
3. Go to **Storage** and create a public bucket called `avatars`
4. Add storage policies (uncomment and run the storage section from `schema.sql`)

### 3. Configure Auth Providers

**Email (Magic Link)** — enabled by default in Supabase.

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials (Web Application)
3. Set authorized redirect URI to: `https://your-project.supabase.co/auth/v1/callback`
4. In Supabase Dashboard > Auth > Providers > Google: add Client ID and Secret

**Apple OAuth:**
1. Go to [Apple Developer](https://developer.apple.com/)
2. Create a Services ID with Sign In with Apple capability
3. Set return URL to: `https://your-project.supabase.co/auth/v1/callback`
4. Generate a secret key and note the Key ID, Team ID
5. In Supabase Dashboard > Auth > Providers > Apple: add Client ID, Secret Key, Key ID, Team ID

### 4. Configure Stripe

1. Create a [Stripe](https://stripe.com) account
2. Create a product "Lnksy Pro" with two prices:
   - Monthly: $5/month
   - Yearly: $48/year (save 20%)
3. Copy the price IDs for your `.env`
4. Set up webhook endpoint in Stripe Dashboard:
   - URL: `https://your-domain.com/api/billing/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
5. Copy the webhook signing secret

### 5. Environment Variables

Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `PUBLIC_SUPABASE_URL` | Supabase project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_ID_MONTHLY` | Stripe price ID for monthly plan |
| `STRIPE_PRICE_ID_YEARLY` | Stripe price ID for yearly plan |
| `APP_BASE_URL` | App URL (e.g., `http://localhost:5173`) |

### 6. Run

```bash
# Start dev server
npm run dev

# In another terminal, forward Stripe webhooks locally
npm run stripe:listen
```

### 7. Test

```bash
npm test
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run check` | TypeScript check |
| `npm run lint` | Lint check |
| `npm run stripe:listen` | Forward Stripe webhooks to local server |

## Plans

| Feature | Free | Pro ($5/mo) |
|---|---|---|
| Profiles | 1 | 1 |
| Links | 25 | Unlimited |
| Themes | 3 | 13+ |
| Analytics | 7 days, totals | 30 days, per-link |
| Custom colors | - | Yes |
| Link scheduling | - | Yes |
| Link highlights | - | Yes |
| Remove branding | - | Yes |

## Deployment

### Vercel

```bash
npm i -D @sveltejs/adapter-vercel
```

Update `svelte.config.js` to use the Vercel adapter. Add all env vars in Vercel dashboard.

### Cloudflare Pages

```bash
npm i -D @sveltejs/adapter-cloudflare
```

Update `svelte.config.js` accordingly.

### Fly.io

```bash
npm i -D @sveltejs/adapter-node
```

Use the Node adapter with a Dockerfile.

## Production Checklist

- [ ] All env vars set in production
- [ ] Supabase RLS policies enabled and tested
- [ ] Stripe webhook endpoint configured with production URL
- [ ] Stripe webhook events selected (checkout.session.completed, subscription.*, invoice.payment_failed)
- [ ] Auth providers configured (Google, Apple redirect URIs updated)
- [ ] Storage bucket `avatars` created with public access
- [ ] Custom domain configured for `lnksy.com`
- [ ] SSL certificate active
- [ ] Rate limiting configured (consider Cloudflare WAF or similar)
- [ ] Error monitoring set up (Sentry recommended)
- [ ] Database backups enabled in Supabase
- [ ] Test full flow: sign up -> claim handle -> add links -> view public page
- [ ] Test billing flow: upgrade -> webhook -> plan change -> portal
- [ ] Test soft delete and analytics tracking
- [ ] Performance: verify SSR response times on public pages
- [ ] SEO: verify OG tags render correctly (use og-image debugger)

## Data Model

See `supabase/schema.sql` for the complete schema including:
- `profiles` — user profiles with handle, theme, plan
- `links` — link items with ordering, scheduling, highlight
- `themes` — theme configurations
- `reserved_slugs` — blocked handle names
- `daily_profile_stats` — aggregated profile analytics
- `daily_link_stats` — aggregated link analytics
- `analytics_sessions` — unique visitor dedup
- `billing` — Stripe subscription state
- `stripe_webhook_events` — webhook idempotency

All tables have RLS enabled with appropriate policies. See schema.sql for details.
