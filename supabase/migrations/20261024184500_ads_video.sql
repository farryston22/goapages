-- Video banner ads (components/AdSlot.tsx).
-- video_url: wide 4:1 MP4 shown on desktop; video_square_url: 1:1 MP4 shown on phones.
-- Poster image = same path with .jpg. Placements in use: home_banner, home_mid, directory_banner, events_banner.
-- A slot with no live ad shows the GoaPages "Advertise here" banner instead.
alter table public.ads
  add column if not exists video_url text,
  add column if not exists video_square_url text;
