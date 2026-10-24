-- Visitor stats (like the old MyListing stats). Cookie-free: no IP stored; `visitor` is a daily-salted hash
-- made in /api/track, so the same person counts once per day and can't be followed across days.
-- Written only through track_event() (called by /api/track). Read only through site_stats() (admins)
-- and listing_stats() (the listing's owner or an admin).

create table if not exists public.analytics_events (
  id bigserial primary key,
  at timestamptz not null default now(),
  type text not null check (type in ('view', 'click', 'ad_view', 'ad_click')),
  path text,
  listing_id uuid references public.listings(id) on delete set null,
  ad_id bigint references public.ads(id) on delete set null,
  action text,          -- for clicks: call | whatsapp | email | website | social | directions
  source text,          -- Direct | Google | Instagram | Facebook | WhatsApp | YouTube | TikTok | Other site name
  referrer text,        -- referring host, e.g. www.google.com
  country text,         -- ISO code from Cloudflare, e.g. GB
  city text,
  device text,          -- mobile | tablet | desktop
  visitor text          -- daily-salted hash, see above
);
create index if not exists analytics_events_at on public.analytics_events (at desc);
create index if not exists analytics_events_listing on public.analytics_events (listing_id, at desc) where listing_id is not null;
create index if not exists analytics_events_ad on public.analytics_events (ad_id, at desc) where ad_id is not null;

alter table public.analytics_events enable row level security;
create policy "admin reads analytics" on public.analytics_events for select using (public.is_admin());

-- One event from /api/track. Looks up the listing from a /listing/<slug> path.
create or replace function public.track_event(e jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  t text := e->>'type';
  p text := left(e->>'path', 300);
  lid uuid;
  aid bigint;
begin
  if t not in ('view', 'click', 'ad_view', 'ad_click') then return; end if;
  if p like '/listing/%' then
    select id into lid from listings where slug = split_part(substr(p, 10), '?', 1) limit 1;
  end if;
  if (e->>'ad') ~ '^[0-9]{1,12}$' then
    select id into aid from ads where id = (e->>'ad')::bigint;
  end if;
  insert into analytics_events (type, path, listing_id, ad_id, action, source, referrer, country, city, device, visitor)
  values (t, p, lid, aid, left(e->>'action', 20), left(e->>'source', 40), left(e->>'referrer', 120),
          left(e->>'country', 2), left(e->>'city', 80), left(e->>'device', 10), left(e->>'visitor', 32));
end $$;
revoke all on function public.track_event(jsonb) from public;
grant execute on function public.track_event(jsonb) to anon, authenticated;

-- Shared builder: stats for events matching an optional listing, over the last `days` days (UK days).
create or replace function public._stats(lid uuid, days int)
returns jsonb language sql stable security definer set search_path = public as $$
  with ev as (
    select *, (at at time zone 'Europe/London')::date d from analytics_events
    where at >= (date_trunc('day', now() at time zone 'Europe/London') - make_interval(days => days - 1)) at time zone 'Europe/London'
      and (lid is null or listing_id = lid)
  ), v as (select * from ev where type = 'view'),
  prev as (
    select count(*) filter (where type = 'view') views, count(distinct visitor || (at at time zone 'Europe/London')::date) filter (where type = 'view') visitors
    from analytics_events
    where at >= now() - make_interval(days => days * 2) and at < now() - make_interval(days => days)
      and (lid is null or listing_id = lid)
  )
  select jsonb_build_object(
    'days', days,
    'views', (select count(*) from v),
    'visitors', (select count(distinct visitor || d) from v),
    'prev_views', (select views from prev),
    'prev_visitors', (select visitors from prev),
    'clicks', (select count(*) from ev where type = 'click'),
    'series', (select coalesce(jsonb_agg(jsonb_build_object('d', g.d::date, 'views', coalesce(x.views, 0), 'visitors', coalesce(x.visitors, 0)) order by g.d), '[]')
               from generate_series((now() at time zone 'Europe/London')::date - (days - 1), (now() at time zone 'Europe/London')::date, interval '1 day') g(d)
               left join (select d, count(*) views, count(distinct visitor) visitors from v group by d) x on x.d = g.d::date),
    'sources', (select coalesce(jsonb_agg(jsonb_build_object('k', k, 'n', n) order by n desc), '[]') from (select coalesce(source, 'Direct') k, count(*) n from v group by 1 order by 2 desc limit 10) s),
    'countries', (select coalesce(jsonb_agg(jsonb_build_object('k', k, 'n', n) order by n desc), '[]') from (select coalesce(country, '??') k, count(distinct visitor || d) n from v group by 1 order by 2 desc limit 10) s),
    'cities', (select coalesce(jsonb_agg(jsonb_build_object('k', k, 'n', n) order by n desc), '[]') from (select city k, count(distinct visitor || d) n from v where city is not null group by 1 order by 2 desc limit 10) s),
    'devices', (select coalesce(jsonb_agg(jsonb_build_object('k', k, 'n', n) order by n desc), '[]') from (select coalesce(device, 'desktop') k, count(*) n from v group by 1) s),
    'actions', (select coalesce(jsonb_agg(jsonb_build_object('k', k, 'n', n) order by n desc), '[]') from (select action k, count(*) n from ev where type = 'click' and action is not null group by 1) s),
    'pages', case when lid is null then (select coalesce(jsonb_agg(jsonb_build_object('k', k, 'n', n) order by n desc), '[]') from (select path k, count(*) n from v group by 1 order by 2 desc limit 10) s) end,
    'listings', case when lid is null then (select coalesce(jsonb_agg(jsonb_build_object('k', l.title, 'slug', l.slug, 'n', s.n, 'clicks', s.c) order by s.n desc), '[]')
                  from (select listing_id, count(*) filter (where type = 'view') n, count(*) filter (where type = 'click') c from ev where listing_id is not null group by 1 order by 2 desc limit 10) s
                  join listings l on l.id = s.listing_id) end,
    'ads', case when lid is null then (select coalesce(jsonb_agg(jsonb_build_object('k', a.advertiser, 'placement', a.placement, 'shown', s.shown, 'clicks', s.clicks) order by s.shown desc), '[]')
                  from (select ad_id, count(*) filter (where type = 'ad_view') shown, count(*) filter (where type = 'ad_click') clicks from ev where ad_id is not null group by 1) s
                  join ads a on a.id = s.ad_id) end
  );
$$;
revoke all on function public._stats(uuid, int) from public, anon, authenticated;

create or replace function public.site_stats(days int default 30)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admins only'; end if;
  return _stats(null, greatest(1, least(days, 365)));
end $$;
revoke all on function public.site_stats(int) from public, anon;
grant execute on function public.site_stats(int) to authenticated;

create or replace function public.listing_stats(lid uuid, days int default 30)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not (is_admin() or exists (select 1 from listings where id = lid and owner_id = auth.uid())) then
    raise exception 'not your listing';
  end if;
  return _stats(lid, greatest(1, least(days, 365)));
end $$;
revoke all on function public.listing_stats(uuid, int) from public, anon;
grant execute on function public.listing_stats(uuid, int) to authenticated;
