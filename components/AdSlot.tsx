import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

type Ad = {
  id: number; placement: string; advertiser: string | null; title: string; body: string | null;
  link_url: string | null; image_url: string | null; video_url: string | null; video_square_url: string | null;
};

// Poster image for a video: same file name with .jpg (see public/ads/).
const poster = (v: string) => v.replace(/\.mp4$/i, ".jpg");

/** The GoaPages "Advertise here" banner, shown in any slot with no paying advertiser. */
function HouseAd() {
  const label = "This spot is available. Advertise on GoaPages: featured spots from £15, banners from £40.";
  return (
    <aside className="adslot house" aria-label="Advertise with GoaPages">
      <div className="adslot-k"><span>ADVERTISE WITH US</span><span>Banner slot available</span></div>
      <Link href="/advertise" className="adslot-media" aria-label={label}>
        <video className="wd" src="/ads/goapages-advertise-wide.mp4" poster="/ads/goapages-advertise-wide.jpg" autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
        <video className="sq" src="/ads/goapages-advertise-square.mp4" poster="/ads/goapages-advertise-square.jpg" autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
      </Link>
    </aside>
  );
}

/**
 * An ad slot. Shows a live ad from the `ads` table for this placement (a random one if several),
 * or the GoaPages "Advertise here" banner when there is none (unless house={false}).
 * Video ads: set video_url (wide, 4:1) and video_square_url (1:1, used on phones).
 */
export default async function AdSlot({ placement, house = true }: { placement: string; house?: boolean }) {
  const sb = await supabaseServer();
  const { data } = await sb.from("ads").select("*").eq("placement", placement);
  const ads = (data ?? []) as Ad[];
  const ad = ads.length ? ads[Math.floor(Math.random() * ads.length)] : null;
  if (!ad) return house ? <HouseAd /> : null;

  const k = `SPONSORED${ad.advertiser ? ` · ${ad.advertiser}` : ""}`;
  const href = ad.link_url ?? "/advertise";
  const label = [ad.advertiser, ad.title, ad.body].filter(Boolean).join(". ");

  if (ad.video_url) {
    const sq = ad.video_square_url ?? ad.video_url;
    return (
      <aside className="adslot" aria-label="Sponsored">
        <div className="adslot-k"><span>SPONSORED</span><span>{ad.advertiser}</span></div>
        <a href={href} className="adslot-media" rel="sponsored noopener" target="_blank" aria-label={label}>
          <video className="wd" src={ad.video_url} poster={poster(ad.video_url)} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
          <video className="sq" src={sq} poster={poster(sq)} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
        </a>
      </aside>
    );
  }

  return (
    <aside className="adstrip" aria-label="Sponsored">
      <div>
        <div className="k">{k}</div>
        <h3>{ad.title}</h3>
        {ad.body && <p>{ad.body}</p>}
      </div>
      {ad.link_url && <a className="btn btn-primary" href={ad.link_url} rel="sponsored noopener" target="_blank">Find out more</a>}
    </aside>
  );
}
