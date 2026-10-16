# Database (Supabase project `goapages`, ref `ejhxfnxfvszqjydwtwqo`, London)

The baseline schema (`init_goapages_schema`, `admin_emails_auto_role`) was applied directly and lives in
Supabase's migration history (`supabase_migrations.schema_migrations`). Run `supabase db pull` to regenerate it
as a file. Later migrations are in `migrations/`.

Tables: profiles, categories, listings, listing_categories, listing_photos, reviews, ads, messages,
listing_stats, moderation_log, claim_requests, admin_emails. Storage bucket: `listing-images` (public).

Key rules (enforced in the database, not just the website):
- Anyone can read published listings, published reviews and live ads.
- A non-admin's new listing is always forced to `pending` (trigger `guard_listing_changes`). Owners can't feature
  or publish themselves; they may set their own listing to `hidden` or `sold`.
- New reviews are always `pending` until an admin publishes them. `refresh_rating` keeps avg_rating/review_count.
- Anyone signing up with an email in `admin_emails` becomes an admin (currently farryston@gmail.com).
- `socials` is a JSON array of `{network, url}`. `work_hours` is `{"Mon": "09:00-17:00" | "open" | "closed" | "by"}`.
- Old WordPress images are stored as `wp:<path under wp-content/uploads>` and served from `/img/<path>.webp`.
