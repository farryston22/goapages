create policy "admin write log" on public.moderation_log for insert with check (public.is_admin());
create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
