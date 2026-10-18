# 0024 — Feedback through a form service

Date: 2026-10-17
Status: accepted

## Context

bigsmall had no way to hear from a visitor, and its first rule, every number checked, wants one: a report that a figure looks wrong is a lead for re-opening it (docs/RESEARCH.md §5). The site has no server and no database (ADR 0001), and a page in a browser cannot send email: sending takes a credential, and a credential in a static page is public. The first prototype opened the visitor's own email app with the message filled in; Sean ruled that out (2026-10-17: a separate email window, "annoying for ten years now") and set the form's shape: a heading, a strip of three kinds, Your email, a Message with an example as its empty state, Send alone, nothing under the fields, and Send delivering the message itself. He asked first for a way without a third party, then, weighing the options (docs/research/feedback-1.md), for the most efficient and functional route, paid or not.

## Decision

Send posts the form's fields as JSON to a form service, Formspark, which mails each message to Sean's inbox with the visitor's address as Reply-To and keeps a copy in its dashboard. The site stays static: no server of ours, no secret in the page. The form's id is public by design, as a form's address is; what guards it is set on the service's side: an allowed-domains list that rejects posts not from bigsmall.work, a hidden honeypot field the page sends and the service checks, and the service's own filter on every submission. No challenge: Send stays one button. The page says when a message was sent, and when it could not be, and never stores one.

Formspark over the others: its free allowance is 250 submissions in total and then one payment buys fifty thousand that never expire; its allowed domains, honeypot, and filtering are free, so a public key is guarded without a captcha. Web3Forms stores nothing, which is the better privacy story, but guards a free key only with a visible captcha, its domain restriction being a paid feature; Formspree's next tier is a monthly plan for two hundred a month.

## Alternatives considered

- **The visitor's email app** (`mailto:`): no third party and nothing to run, but a separate window, and nothing arrives if the visitor has no email app set up. Ruled out by Sean.
- **A function of our own** on Vercel, sending through an account he controls (a mailbox at the domain, or his Gmail with an app password): no third party at all, but the first server-side code on a site that has none, a secret to keep, and spam ours to handle, which a stateless function cannot rate-limit. It stays the upgrade path if the service proves too little.
- **A sending service through that function** (Resend, Postmark): the same trade, with a third party in transit anyway.
- **Other form services**: Web3Forms and Formspree, above; Basin, Getform, and Netlify Forms (not on Vercel) the same idea at other prices.

## Consequences

- A second third party after Umami (ADR 0019); the privacy line, when it lands, says that feedback goes through it to our inbox, and that the site keeps nothing (docs/UX-SPEC.md §14).
- The service's settings live at Sean's screen and are written down in `docs/DEPLOYMENT.md`, "Feedback": the recipient, the filter, the allowed domains, the honeypot, and what happens when the 250 run out (the service answers 402, the page says it could not send).
- The browser tests answer the post themselves and never reach the service; one real message after each deploy that touches the form is the check that it still arrives.
- A report of an inaccuracy arrives as a lead with its source, which docs/RESEARCH.md §5 takes from there.
