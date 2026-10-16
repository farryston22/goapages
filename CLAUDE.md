# GoaPages — notes for Claude (maintainer)

GoaPages.com is the UK Goan community directory. Owner/admin: Farryston (farryston@gmail.com). Contact email shown
on the site: contact@fnunes.co.uk. Every new listing and review needs his approval — never publish user content
yourself unless he asks.

## Stack
- Next.js 15 (App Router, server components + server actions), deployed to **Cloudflare Workers** with
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
- `app/marketplace`, `app/homes` — "coming soon" pages (phase 2)
- `app/actions.ts` member server actions · `app/admin/actions.ts` admin actions
- `lib/supabase/*` clients · `lib/util.ts` helpers · `components/*`

## Everyday jobs
- **Add a listing for the owner**: insert into `listings` (status `published` only if he said so) and
  `listing_categories`. Slug must be unique.
- **Approve/reject**: set `listings.status` / `reviews.status`; add a row to `moderation_log` (actor `claude`).
- **Ads**: insert into `ads` (placement `home_banner` shows on the homepage).
- **Check before any change**: `npm run build`. Push to `main` deploys.
- Don't delete data without the owner's OK. Hidden listings use status `hidden`.

## Never
- Bring back WordPress code, themes or plugins (the old site was hacked). Data and images only.
- Put passwords or secret keys in the repo.
