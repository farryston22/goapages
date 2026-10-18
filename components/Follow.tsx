import Icon from "@/components/Icon";
import { SOCIAL } from "@/lib/social";

// Homepage "Follow GoaPages" block: Instagram + YouTube call-to-action cards.
export default function Follow() {
  return (
    <section className="follow" aria-labelledby="follow-h">
      <div className="follow-head">
        <span className="follow-live"><i aria-hidden="true" />Posting every week</span>
        <h2 id="follow-h">Follow GoaPages</h2>
        <p>Events, vendor spotlights, behind-the-scenes and community news — first on our socials.</p>
      </div>
      <div className="follow-grid">
        <a className="fcard fcard-ig" href={SOCIAL.instagram.url} target="_blank" rel="noopener noreferrer">
          <span className="fcard-icon"><Icon name="instagram" size={28} /></span>
          <span className="fcard-body">
            <b>Instagram</b>
            <span>{SOCIAL.instagram.handle}</span>
            <small>Event flyers, reels and vendor shout-outs</small>
          </span>
          <span className="fcard-cta">Follow <Icon name="arrow" size={16} /></span>
        </a>
        <a className="fcard fcard-yt" href={SOCIAL.youtube.url} target="_blank" rel="noopener noreferrer">
          <span className="fcard-icon"><Icon name="youtube" size={28} /></span>
          <span className="fcard-body">
            <b>YouTube</b>
            <span>{SOCIAL.youtube.handle}</span>
            <small>Interviews, event highlights and videos</small>
          </span>
          <span className="fcard-cta">Subscribe <Icon name="arrow" size={16} /></span>
        </a>
      </div>
    </section>
  );
}

// Small icon links for the footer.
export function SocialIcons() {
  return (
    <span className="soc">
      <a href={SOCIAL.instagram.url} target="_blank" rel="noopener noreferrer" aria-label="GoaPages on Instagram"><Icon name="instagram" size={18} /></a>
      <a href={SOCIAL.youtube.url} target="_blank" rel="noopener noreferrer" aria-label="GoaPages on YouTube"><Icon name="youtube" size={18} /></a>
    </span>
  );
}

// Slim one-line strip for the top of the homepage.
export function FollowStrip() {
  return (
    <div className="fstrip" aria-label="Follow GoaPages">
      <span className="fstrip-t">Follow us</span>
      <a className="fstrip-b ig" href={SOCIAL.instagram.url} target="_blank" rel="noopener noreferrer">
        <span className="ic"><Icon name="instagram" size={16} /></span>Instagram
      </a>
      <a className="fstrip-b yt" href={SOCIAL.youtube.url} target="_blank" rel="noopener noreferrer">
        <span className="ic"><Icon name="youtube" size={16} /></span>YouTube
      </a>
    </div>
  );
}
