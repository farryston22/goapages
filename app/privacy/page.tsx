import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy" };
export default function Page() {
  return (
    <div className="card pad" style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>Privacy</h1>
      <p>We collect only what we need to run GoaPages: your email address when you sign in, and the details you choose to put in listings and reviews.</p>
      <p>Business contact details you publish are shown publicly so customers can reach you. We never sell your data. We use only essential cookies to keep you signed in.</p>
      <p>We count visits to understand how GoaPages is used and to show businesses and advertisers how their listings and ads are doing: which pages are viewed, the website that sent you, your approximate town and country, whether you use a phone or computer, and taps on contact buttons. This uses no cookies and we don’t keep your IP address; visitors are counted with a code that changes every day, so you can’t be identified or followed over time.</p>
      <p>Questions you type into GoaPages AI are sent to our AI provider (Anthropic) to answer them, and we keep a copy for 90 days, with the same approximate town and device details, so we can improve the answers and add the businesses people are looking for. Please don’t include personal details such as phone numbers in your questions.</p>
      <p>To see, change or delete your data, email <a href="mailto:contact@fnunes.co.uk">contact@fnunes.co.uk</a>.</p>
    </div>
  );
}
