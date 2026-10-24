import { getCloudflareContext } from "@opennextjs/cloudflare";
import { clean } from "@/lib/util";

/**
 * Notification emails (listing / review / claim approved or rejected, new review for an owner), sent with Resend.
 * Needs the Cloudflare secret RESEND_API_KEY (Workers → goapages → Settings → Variables and Secrets).
 * Without it nothing is sent and moderation still works. Sender can be overridden with EMAIL_FROM.
 */
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://goapages.com";
const ASSETS = "https://goapages.farryston.workers.dev/email";

async function env(name: string): Promise<string | undefined> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const v = (env as unknown as Record<string, string | undefined>)[name];
    if (v) return v;
  } catch { /* local dev */ }
  return process.env[name];
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function layout(o: { heading: string; paras: string[]; button?: { href: string; label: string } }) {
  const p = (t: string) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4E566B">${t}</p>`;
  const btn = o.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 4px"><tr><td style="background:#242C41;border-radius:10px"><a href="${o.button.href}" style="display:inline-block;padding:14px 26px;font-size:15px;font-weight:bold;color:#FFFFFF;text-decoration:none">${o.button.label}</a></td></tr></table>`
    : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GoaPages</title></head>
<body style="margin:0;padding:0;background:#F2F4F8;font-family:Arial,Helvetica,sans-serif;color:#242C41">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2F4F8;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border-radius:16px">
<tr><td style="padding:0;line-height:0;font-size:0"><img src="${ASSETS}/header.png" alt="GoaPages" width="520" style="display:block;width:100%;max-width:520px;height:auto;border:0;border-radius:16px 16px 0 0"></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#242C41">${o.heading}</h1>
${o.paras.map(p).join("\n")}
${btn}
</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid #EBEEF4;font-size:12px;line-height:1.6;color:#596178">
GoaPages &mdash; the UK Goan community directory<br>
<a href="${SITE}" style="color:#242C41">goapages.com</a> &middot; <a href="mailto:contact@fnunes.co.uk" style="color:#242C41">contact@fnunes.co.uk</a>
</td></tr></table></td></tr></table></body></html>`;
}

async function send(to: string, subject: string, html: string, text: string): Promise<boolean> {
  const key = await env("RESEND_API_KEY");
  if (!key) { console.error("email not sent: RESEND_API_KEY is not set"); return false; }
  if (!to) return false;
  const from = (await env("EMAIL_FROM")) || "GoaPages <contact@fnunes.co.uk>";
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], reply_to: "contact@fnunes.co.uk", subject, html, text }),
    });
    if (!r.ok) { console.error("email send failed", r.status, await r.text()); return false; }
    return true;
  } catch (e) {
    console.error("email send error", e);
    return false;
  }
}

/** For the admin page: is email set up? Returns null when everything looks fine, otherwise a plain-English problem. */
export async function emailProblem(): Promise<string | null> {
  const key = await env("RESEND_API_KEY");
  if (!key) return "Emails are switched off: the Cloudflare secret RESEND_API_KEY isn’t set on the goapages Worker, so members aren’t told when you approve or reject things.";
  const from = (await env("EMAIL_FROM")) || "GoaPages <contact@fnunes.co.uk>";
  const domain = (from.match(/@([^>\s]+)/)?.[1] ?? "").toLowerCase();
  try {
    const r = await fetch("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${key}` } });
    if (r.status === 401 || r.status === 403) {
      const body = await r.text();
      // A "sending access" key can't list domains; that's fine, we just can't check.
      if (/restricted/i.test(body)) return null;
      return "Resend rejected the RESEND_API_KEY (it may have been deleted or mistyped). Create a new key in Resend and update the Cloudflare secret.";
    }
    if (!r.ok) return null;
    const j = (await r.json()) as { data?: { name: string; status: string }[] };
    const d = (j.data ?? []).find((x) => x.name.toLowerCase() === domain);
    if (!d) return `The sending domain ${domain} isn’t added in Resend, so every email is refused. Add and verify ${domain} in Resend → Domains.`;
    if (d.status !== "verified") return `The sending domain ${domain} is “${d.status}” in Resend, not verified, so emails are refused. Finish the DNS records in Resend → Domains.`;
    return null;
  } catch {
    return null;
  }
}

type L = { title: string; slug: string };

export async function emailListingApproved(to: string, l: L) {
  const t = clean(l.title), url = `${SITE}/listing/${l.slug}`;
  await send(to, `Your listing is live: ${t}`, layout({
    heading: "Your listing is live! 🎉",
    paras: [
      `Good news &mdash; <b>${esc(t)}</b> has been approved and is now live on GoaPages for the UK Goan community to see.`,
      `Share the link with friends and customers, and sign in any time to update your details.`,
    ],
    button: { href: url, label: "View your listing" },
  }), `Good news - "${t}" has been approved and is now live on GoaPages.\n\nView it: ${url}`);
}

export async function emailListingRejected(to: string, l: L, reason: string | null) {
  const t = clean(l.title);
  await send(to, `About your GoaPages listing: ${t}`, layout({
    heading: "Your listing wasn’t approved",
    paras: [
      `Thanks for posting <b>${esc(t)}</b> on GoaPages. Unfortunately we couldn’t approve it this time.`,
      ...(reason ? [`<b>Reason:</b> ${esc(reason)}`] : []),
      `You can sign in to edit it and send it again, or just reply to this email if you have any questions.`,
    ],
    button: { href: `${SITE}/my`, label: "Go to my listings" },
  }), `Thanks for posting "${t}" on GoaPages. Unfortunately we couldn't approve it this time.${reason ? `\n\nReason: ${reason}` : ""}\n\nSign in to edit it and send it again: ${SITE}/my\nQuestions? Just reply to this email.`);
}

export async function emailClaimApproved(to: string, l: L) {
  const t = clean(l.title), url = `${SITE}/listing/${l.slug}`;
  await send(to, `You now manage ${t} on GoaPages`, layout({
    heading: "Your claim was approved ✅",
    paras: [
      `<b>${esc(t)}</b> is now yours to manage on GoaPages.`,
      `Sign in to update your contact details, opening hours, photos and description.`,
    ],
    button: { href: `${SITE}/my`, label: "Manage your listing" },
  }), `Your claim was approved - "${t}" is now yours to manage on GoaPages.\n\nManage it: ${SITE}/my\nView it: ${url}`);
}

export async function emailClaimRejected(to: string, l: L, reason: string | null) {
  const t = clean(l.title);
  await send(to, `About your claim for ${t}`, layout({
    heading: "We couldn’t approve your claim",
    paras: [
      `Thanks for asking to manage <b>${esc(t)}</b> on GoaPages. We weren’t able to confirm you as the owner this time.`,
      ...(reason ? [`<b>Reason:</b> ${esc(reason)}`] : []),
      `If this is your business, just reply to this email with something that shows it (for example, the business email address or a link to its social page) and we’ll take another look.`,
    ],
  }), `Thanks for asking to manage "${t}" on GoaPages. We weren't able to confirm you as the owner this time.${reason ? `\n\nReason: ${reason}` : ""}\n\nIf this is your business, reply to this email with proof and we'll take another look.`);
}

export async function emailReviewApproved(to: string, l: L) {
  const t = clean(l.title), url = `${SITE}/listing/${l.slug}#reviews`;
  await send(to, `Your review of ${t} is live`, layout({
    heading: "Thanks — your review is live ⭐",
    paras: [
      `Your review of <b>${esc(t)}</b> has been approved and is now showing on GoaPages.`,
      `Reviews like yours help the UK Goan community find great local businesses. Thank you!`,
    ],
    button: { href: url, label: "See your review" },
  }), `Your review of "${t}" has been approved and is now live on GoaPages.\n\nSee it: ${url}`);
}

export async function emailReviewRejected(to: string, l: L, reason: string | null) {
  const t = clean(l.title);
  await send(to, `About your review of ${t}`, layout({
    heading: "Your review wasn’t approved",
    paras: [
      `Thanks for reviewing <b>${esc(t)}</b> on GoaPages. Unfortunately we couldn’t publish it this time.`,
      ...(reason ? [`<b>Reason:</b> ${esc(reason)}`] : []),
      `You’re welcome to write a new one, or just reply to this email if you have any questions.`,
    ],
    button: { href: `${SITE}/listing/${l.slug}#reviews`, label: "Go to the listing" },
  }), `Thanks for reviewing "${t}" on GoaPages. Unfortunately we couldn't publish it this time.${reason ? `\n\nReason: ${reason}` : ""}\n\nQuestions? Just reply to this email.`);
}

export async function emailNewReviewForOwner(to: string, l: L, rating: number | null) {
  const t = clean(l.title), url = `${SITE}/listing/${l.slug}#reviews`;
  const stars = rating ? `${"★".repeat(Math.round(rating))}${"☆".repeat(5 - Math.round(rating))} ` : "";
  await send(to, `New review for ${t}`, layout({
    heading: "You’ve got a new review",
    paras: [
      `Someone just left a ${stars}review for <b>${esc(t)}</b> on GoaPages.`,
      `Have a look, and share your listing to collect more.`,
    ],
    button: { href: url, label: "Read the review" },
  }), `Someone left a new ${stars}review for "${t}" on GoaPages.\n\nRead it: ${url}`);
}
