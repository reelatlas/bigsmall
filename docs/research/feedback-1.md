# Feedback 1 — how a visitor reaches us

Built 2026-10-17 as a prototype lab, `/dev/feedback-lab` (`apps/web/src/pages/dev/_feedback-lab/`), for the fiftieth pass's open question (docs/research/findings-0-first-pass.md). Sean asked for "a trial lab, light, to get an idea of the functions and how it might look", then set its shape the same day (the sixty-ninth pass) and asked how Send can deliver without a third party (the seventieth). Live where the lab is; retired by `CLAUDE.md`'s "Retire a lab" recipe once the section ships.

## The question

bigsmall has no way to hear from a visitor. The About page was to hold "how to send feedback" (the forty-ninth pass), and the site's first rule, every number checked, wants a way for someone to say a figure looks wrong: such a report is a lead for re-opening a figure (docs/RESEARCH.md §5). The site has no server and no database (ADR 0001), and its privacy line is to say that visits are counted anonymously and nothing else is kept.

## The shape Sean set (2026-10-17)

Under a heading "Feedback": one strip of three kinds, Inaccuracy, Bug, Idea; "Your email"; a Message whose empty state gives an example for the kind chosen, in place of fields per kind, each example from a different category (a stone in kilograms, kilobytes, feet and inches); Send alone. Nothing under the fields. Send delivers the message to his inbox itself: opening the visitor's email app (a `mailto:` form, the lab's first answer) is out, "annoying for ten years now". The lab shows the form as it would sit on About and, beside it, what Send would deliver: a subject from the kind, the visitor's address as Reply to, the message, and the page it came from. In the lab nothing is sent.

## How Send can deliver

A page in a browser cannot send email. Sending takes a connection to a mail server with a credential, and a credential in a static page is public: anyone could read it and send as us. So whatever sends must run where the credential is hidden, on a server. The visitor's own email app was the only way around that, and it is out. The choice is whose server.

**Ours: a function on Vercel sending through an account Sean controls.** An Astro endpoint (`src/pages/api/feedback.ts`, on demand, not prerendered) deployed by the Vercel adapter as a serverless function. It reads the fields, drops anything the honeypot field or a too-quick fill marks as a bot, and sends one email over SMTP from an account whose password lives in Vercel's environment settings, never in the repo or the page: a mailbox at the domain (Porkbun's email hosting, a few dollars a year, with SPF and DKIM set by Porkbun, so the mail from `hello@bigsmall.work` lands in his inbox rather than spam), or his Gmail with an app password (free; Google caps it at a few hundred a day and may challenge a login from a new place). One account can both send and receive; two, one sending and one receiving, works the same. Reply to is the visitor's address.

- For: nothing of the visitor's goes to anyone but us; no account to keep at a form service, no plan to outgrow; the message arrives as plain email in his inbox; the code is ours and small (about sixty lines, with a test).
- Against: the site gains its first server-side code, which ADR 0001's "no server" needs amending for, an adapter dependency, and a secret to manage in Vercel; spam is ours to handle (a honeypot and a fill-time check catch most bots; a function without storage cannot rate-limit, so a flood would reach the inbox until a captcha or Vercel's rate limiting is added); deliverability is ours to get right once (SPF and DKIM at the domain, or Gmail's rules); if the account's password changes, Send breaks until Vercel's setting does.

**Ours, with a sending service.** The same function, but sending through an email API (Resend, Postmark) with an API key instead of a mailbox's password. Easier sending and better deliverability reports, in exchange for one third party that sees each message in transit and a domain verification at Porkbun.

**A form service** (Formspree the best known; Web3Forms, Basin, Getform the same idea). The page posts the fields to the service, which mails them to his inbox with the visitor's address as Reply to, filters spam, and keeps a copy on its dashboard. No server of ours, no secret in the page (a form id is public by design), set up at his screen in minutes.

- For: nothing to run or secure; spam filtering and rate limits included; a dashboard with every message.
- Against: a third party holds every message and the visitors' addresses, which the privacy line must say; free tiers are capped (Formspree 50 a month, Web3Forms 250, Basin 100) and the paid tiers are where the "hidden bs" lives; a dependency that can change its terms; the site's story, no third party but Umami, grows a second.

**Recommendation, given no third party:** the function with a mailbox at the domain through Porkbun's email hosting, since Sean is at Porkbun anyway and a domain mailbox is also the visible address for people who prefer email. Gmail with an app password is the no-cost version of the same. Spam: the honeypot and the fill-time check first, measured by what arrives; a captcha (Cloudflare Turnstile, a script and a third party) only if a flood comes. The privacy line stays as planned: the message goes to us and nowhere else.

## For the real build

- The section at the foot of the About page, after the formulas, under "Feedback" (`SECTION_HEADING`), with a `#feedback` anchor; the footer stays "About" (Sean, 2026-10-15).
- The form as the lab has it: the strip, Your email (`type="email"`, optional, so anyone can write), Message (required, the kind's example as its empty state), Send; after Send a line says it was sent, and the message clears; a failure says what to try (the address to write to).
- The fields sent: the kind, the email, the message, the page's URL (`location.href`, so a report from the converter carries its conversion), the fill time, and a honeypot.
- The function: `@astrojs/vercel`, the endpoint with `prerender = false`, `nodemailer` over SMTP with the account from Vercel's environment, a unit test of the message it composes, and an ADR amending ADR 0001 for the one function.
- An inaccuracy is a lead for docs/RESEARCH.md §5: the message asks, by its example, for the value seen, the one expected, and where the visitor's figure comes from.
- The spec in docs/UX-SPEC.md §1, "About"; the smoke test's axe on the section in every theme; a browser test that Send posts the fields (the request intercepted) and shows the line after; docs/DEPLOYMENT.md on the function, its secret, and the mailbox.

## Decisions for Sean

1. The sender: a mailbox at the domain (Porkbun email hosting), or his Gmail with an app password; set up at his screen, the password into Vercel's settings there too.
2. The inbox that receives, if not the same account.
3. Spam: the honeypot and fill-time check alone to start (recommended), or a captcha from the first day.
4. The kinds' labels, "Inaccuracy", "Bug", "Idea", and the three examples.
