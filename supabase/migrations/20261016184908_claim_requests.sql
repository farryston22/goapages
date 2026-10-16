create table if not exists public.claim_requests (
  id bigserial primary key,
  listing_id uuid not null references public.listings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  note text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  unique (listing_id, user_id)
);
alter table public.claim_requests enable row level security;
create policy "request claim" on public.claim_requests for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy "see own claims" on public.claim_requests for select using (user_id = auth.uid() or public.is_admin());
create policy "admin claims" on public.claim_requests for all using (public.is_admin()) with check (public.is_admin());
