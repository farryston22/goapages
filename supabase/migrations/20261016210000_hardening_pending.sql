-- PENDING: not yet applied (UPDATE/REVOKE statements were refused through the connector).
-- Apply from the Supabase SQL editor or `supabase db push` when convenient.

-- Trigger functions should not be callable directly through the API.
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.guard_listing_changes() from anon, authenticated, public;
revoke execute on function public.refresh_rating() from anon, authenticated, public;
revoke execute on function public.touch_updated_at() from anon, authenticated, public;

-- Decode HTML entities left over from WordPress (the site also cleans these at display time).
update public.reviews set body = replace(replace(replace(body, '&amp;', '&'), '&#039;', ''''), '&quot;', '"') where body ~ '&(amp|#039|quot);';
update public.reviews set author_name = replace(author_name, '&amp;', '&') where author_name like '%&amp;%';
update public.listings set title = replace(title, '&amp;', '&'), tagline = replace(tagline, '&amp;', '&') where title like '%&amp;%' or tagline like '%&amp;%';
