-- Questions asked to "Ask GoaPages AI" (app/api/ask → log_ai_query). Admin-only reads; kept 90 days.
-- Applied to production on 25 Oct 2026.
create table if not exists public.ai_queries (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  question text not null,
  outcome text not null default 'answered',   -- answered | fallback | error
  results int,
  ms int,
  country text, city text, device text, visitor text
);
create index if not exists ai_queries_at_idx on public.ai_queries (at desc);
alter table public.ai_queries enable row level security;
drop policy if exists "admins read ai_queries" on public.ai_queries;
create policy "admins read ai_queries" on public.ai_queries for select to authenticated using (public.is_admin());

create or replace function public.log_ai_query(e jsonb)
returns void language plpgsql security definer set search_path to 'public' as $$
declare q text := btrim(left(e->>'question', 500));
begin
  if q is null or q = '' then return; end if;
  insert into ai_queries (question, outcome, results, ms, country, city, device, visitor)
  values (q,
          case when e->>'outcome' in ('answered','fallback','error') then e->>'outcome' else 'answered' end,
          case when (e->>'results') ~ '^[0-9]{1,6}$' then (e->>'results')::int end,
          case when (e->>'ms') ~ '^[0-9]{1,7}$' then (e->>'ms')::int end,
          left(e->>'country', 2), left(e->>'city', 80), left(e->>'device', 10), left(e->>'visitor', 32));
  delete from ai_queries where at < now() - interval '90 days';
end $$;
revoke all on function public.log_ai_query(jsonb) from public;
grant execute on function public.log_ai_query(jsonb) to anon, authenticated;

create or replace function public.ai_query_stats(days int default 30)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
begin
  if not public.is_admin() then raise exception 'not authorised'; end if;
  return jsonb_build_object(
    'total', (select count(*) from ai_queries where at > now() - make_interval(days => days)),
    'failed', (select count(*) from ai_queries where at > now() - make_interval(days => days) and outcome <> 'answered'),
    'no_results', (select count(*) from ai_queries where at > now() - make_interval(days => days) and results = 0),
    'top', coalesce((select jsonb_agg(t) from (
        select lower(question) as question, count(*) as n from ai_queries
        where at > now() - make_interval(days => days)
        group by 1 order by 2 desc, 1 limit 15) t), '[]'::jsonb),
    'recent', coalesce((select jsonb_agg(r) from (
        select at, question, outcome, results, city, device from ai_queries
        order by at desc limit 50) r), '[]'::jsonb)
  );
end $$;
revoke all on function public.ai_query_stats(int) from public;
grant execute on function public.ai_query_stats(int) to authenticated;
