-- Obituaries become a listing type (shown on /obituaries, no reviews or ads).
alter type public.listing_kind add value if not exists 'obituary';
