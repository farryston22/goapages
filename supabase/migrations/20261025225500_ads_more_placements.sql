-- Allow the newer ad slots used by components/AdSlot.tsx (home_mid, directory_banner, events_banner).
alter table public.ads drop constraint ads_placement_check;
alter table public.ads add constraint ads_placement_check check (placement = any (array['home_banner', 'home_mid', 'directory_banner', 'events_banner', 'home_card', 'category', 'marketplace_feed', 'homes_sidebar', 'ai_answer']));
