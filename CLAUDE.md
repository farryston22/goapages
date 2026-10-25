# GoaPages — notes for Claude (maintainer)

GoaPages.com is the UK Goan community directory. Owner/admin: Farryston (farryston@gmail.com). Contact email shown
on the site: contact@fnunes.co.uk. Every new listing and review needs his approval — never publish user content
yourself unless he asks.

## Stack
- Next.js 16 (App Router, server components + server actions), deployed to **Cloudflare Workers** with
  `@opennextjs/cloudflare`. Cloudflare Workers Builds deploys automatically on every push to `main`.
- **Supabase** (Postgres + Auth + Storage) — see `supabase/README.md`. Auth is email magic link.
- Public config is in `wrangler.jsonc` `vars` and `.env.production` (publishable key only — never commit secret keys).

## Design rules (must keep)
- Brand: navy `#242C41` + yellow `#FDC703` (from the logo). **Never yellow-on-black.** Background `#F2F4F8`.
- Fonts: Montserrat (headings), DM Sans (body). Layout follows the Anesta theme: dark navy sidebar with grouped
  icon-tile nav, white top bar, white rounded cards. On phones: navy header + bottom tab bar.
- All styles live in `app/globals.css` (CSS variables at the top). No CSS framework.
- Text from WordPress may contain HTML entities — always render through `clean()` / `plain()` from `lib/util.ts`.

## Where things are
- `app/page.tsx` home · `app/directory` · `app/search` · `app/listing/[slug]` · `app/events`
- `app/post` add/edit listing · `app/my` member area · `app/admin` approvals (admin only)
- `app/marketplace` (items), `app/homes` (rooms + property), `app/obituaries` — lists of approved posts (`components/KindList.tsx`)
- `app/actions.ts` member server actions · `app/admin/actions.ts` admin actions
- `lib/supabase/*` clients · `lib/util.ts` helpers · `components/*`

## Everyday jobs
- **Add a listing for the owner**: insert into `listings` and `listing_categories`. Slug must be unique.
  **When Farryston himself asks you to add something (business, event, item…), publish it straight away**
  (status `published`, log `approved` in `moderation_log`) — don't ask him to approve it again. Posts from
  members through the site still wait for his approval.
- **Approve/reject**: set `listings.status` / `reviews.status`; add a row to `moderation_log` (actor `claude`).
- **Ads**: insert into `ads`. Slots (`components/AdSlot.tsx`): `home_banner` (under the hero), `home_mid` (between Events
  and Most loved), `directory_banner`, `events_banner`. Several live ads in one slot rotate at random. Video ads: put the
  MP4s in `public/ads/` (wide 1600×400 + square 1080×1080, each with a same-name `.jpg` poster) and set `video_url` /
  `video_square_url`; otherwise the slot shows the yellow text strip from `title`/`body`. Any slot with no live ad
  shows the GoaPages "Advertise here" video. Banner videos are made with Remotion (Fotobooth Rental UK is the first).
- **Featured listings** (paid): set `listings.featured_until` to the paid end date. While it's in the future the listing
  shows first in the directory (navy "Featured" row, page 1, its category or All) and gets a Featured badge on cards
  and its page; it switches off by itself after that date. Sheene Mill (first paid advertiser, Oct 2026) is featured.
- **Visitor stats**: `components/Tracker.tsx` (in layout) → `/api/track` → `track_event()` into `analytics_events`.
  Cookie-free; no IPs stored (visitor = daily-salted hash; optional Cloudflare secret `STATS_SALT`). Reports:
  `/admin/stats` (`site_stats()`, admins) and `/my/stats?id=` (`listing_stats()`, owner or admin), drawn by
  `components/StatsView.tsx`. Tracks page views, source, country/city (Cloudflare), device, contact clicks on listing
  pages, and ad views/clicks (`data-ad-id` on ad slots). Bots and `/admin` are skipped.
- **Check before any change**: `npm run build`. Push to `main` deploys.
  The real deploy runs `opennextjs-cloudflare build`; it refuses Next.js versions past their 2-year support window
  (Next 15 hit this on 22 Oct 2026, so the site moved to Next 16). Run `npx opennextjs-cloudflare build` if a deploy fails.
- Don't delete data without the owner's OK. Hidden listings use status `hidden`.

## Never
- Bring back WordPress code, themes or plugins (the old site was hacked). Data and images only.
- Put passwords or secret keys in the repo.

## Notification emails
- `lib/email.ts` sends (via Resend) when an admin decides something a member submitted: listing, review and claim
  approved / rejected, plus a "new review" email to the listing owner when a review goes live. Called from
  `app/admin/actions.ts`; only fires when the item was `pending`. The reject buttons have an optional "Reason" box
  that goes into the email and `moderation_log` (review decisions log as `review_published` / `review_rejected`).
- `/admin` shows a red "Emails aren't going out" banner (`emailProblem()`) when the key is missing, Resend refuses
  it, or the sender domain isn't verified in Resend. Send failures are logged in Workers logs ("email send failed").
- Needs the Cloudflare secret `RESEND_API_KEY`; sender defaults to `GoaPages <contact@fnunes.co.uk>` (override with
  `EMAIL_FROM`). Without the key nothing is sent and moderation still works. Sign-in emails are Supabase's own
  (templates in `supabase/email-templates`; links use `token_hash`, not `ConfirmationURL`).

## AI assistant (homepage "Ask anything Goan")
- `components/AskBox.tsx` (chat UI) → `app/api/ask/route.ts` → searches listings (`lib/search.ts`) and asks Claude
  with the matches plus web search (max 2 searches per question).
- Needs the Cloudflare secret `ANTHROPIC_API_KEY` (Workers → goapages → Settings → Variables and Secrets).
  Without it, the box still works as a plain search. Model defaults to `claude-haiku-5-5` (override with `AI_MODEL`).
- Every question is saved (after the reply, via `after()`) with `log_ai_query()` into `ai_queries`: outcome
  `answered` / `fallback` (no key) / `error` (API failed — visitor sees "assistant is busy"), number of listing
  matches, city/device and the same cookie-free visitor hash as `/api/track` (`lib/visitor.ts`). Admin-only; rows
  older than 90 days are deleted. Shown on `/admin/stats` ("What people asked", `components/AiQuestions.tsx`,
  `ai_query_stats()`), with a red notice when questions failed. 24 Oct 2026 outage: the API key had an expiry date.

## Add a listing (one smart form)
- `/post` with no `kind` shows the type picker + auto-fill box; `/post?kind=<kind>` shows the form for that type.
- Types and their extra fields live in `lib/kinds.ts` (business, event, item, room, property, obituary). Extra
  answers are saved in `listings.attributes` (jsonb) and shown in the listing page "Details" card. To add a field or
  a type, edit `lib/kinds.ts` only (a new type also needs a `listing_kind` enum value).
- Business boxes depend on the category: fields have `cats` (category slugs); businesses have no price box (owner asked to remove it),
  opening hours from `hoursCats`; the groups are `G` at the top of `lib/kinds.ts`. `components/CategoryFields.tsx`
  switches boxes as the category changes (hidden boxes are disabled fieldsets, so they aren't saved). A new
  business category gets no extra boxes until its slug is added to a group.
- Auto-fill: `components/AutoFill.tsx` → `app/api/autofill/route.ts` (signed-in only, uses `ANTHROPIC_API_KEY`) →
  sessionStorage → `components/Prefill.tsx` fills the form. Nothing is saved until the member submits; posts still
  need approval. Items/rooms/property get `expires_at` (see `expiresDays`). Reviews and claims are business-only.
