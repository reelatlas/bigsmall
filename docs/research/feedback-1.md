# Feedback 1 — how a visitor reaches us

Built 2026-10-17 as a prototype lab, `/dev/feedback-lab` (`apps/web/src/pages/dev/_feedback-lab/`), for the fiftieth pass's open question (docs/research/findings-0-first-pass.md). Sean asked for "a trial lab, light, to get an idea of the functions and how it might look", then set its shape the same day (the sixty-ninth pass). Live where the lab is; retired by `CLAUDE.md`'s "Retire a lab" recipe once the section ships.

## The question

bigsmall has no way to hear from a visitor. The About page was to hold "how to send feedback" (the forty-ninth pass), and the site's first rule, every number checked, wants a way for someone to say a figure looks wrong: such a report is a lead for re-opening a figure (docs/RESEARCH.md §5). The site has no server and no database (ADR 0001), and its privacy line is to say that visits are counted anonymously and nothing else is kept.

## The shape Sean set (2026-10-17)

Under a heading "Feedback": one strip of three kinds, Inaccuracy, Bug, Idea; "Your email"; a Message whose empty state gives an example for the kind chosen, in place of fields per kind; Send alone. Nothing under the fields. Send delivers the message to his inbox itself: opening the visitor's email app (a `mailto:` form, the lab's first answer) is out, "annoying for ten years now". The lab shows the form as it would sit on About and, beside it, what Send would deliver: a subject from the kind, the visitor's address as Reply to, the message, and the page it came from. In the lab nothing is sent.

## How Send can deliver without the visitor's email app

A static site cannot send email itself; something must receive the fields and mail them.

- **A form service** (Formspree is the best known; Web3Forms, Basin, Getform the same idea). The page posts the fields as JSON to the service's address; the service mails them to the inbox Sean configures, with the visitor's address as Reply to, filters spam (a honeypot field on our side too), and keeps a copy on its dashboard. No server of ours, no secret in the page (a form id is public by design), set up at his screen in minutes (an account, a form, its id into the site's config). Free tiers: Formspree 50 a month, Web3Forms 250, Basin 100. The privacy line gains one sentence: feedback goes through the service to our inbox.
- **A function of our own** on Vercel, sending through an email service (Resend). Ours to run: the first server-side code on a site that has none (ADR 0001, an ADR to amend), an API key in Vercel's settings, a sending domain verified at Porkbun, and spam and rate limits to handle ourselves, which a stateless function cannot without storage or a captcha. The same trade with more to run.

**Recommendation:** a form service, Formspree first, and the function only if the service proves too little (volume, or a dislike of the third party holding messages). Either way Sean's own address appears nowhere on the site; the service or the function holds it. The planned `hello@bigsmall.work` is then optional: a visible address for people who prefer email, forwarded by Porkbun, which can wait.

## For the real build

- The section at the foot of the About page, after the formulas, under "Feedback" (`SECTION_HEADING`), with a `#feedback` anchor; the footer stays "About" (Sean, 2026-10-15).
- The form as the lab has it: the strip, Your email (`type="email"`, optional, so anyone can write), Message (required, the kind's example as its empty state), Send; after Send a line says it was sent, and the message clears; a failure says what to try (the address to write to).
- The fields sent: the kind, the email, the message, the page's URL (`location.href`, so a report from the converter carries its conversion), and a honeypot the service drops.
- An inaccuracy is a lead for docs/RESEARCH.md §5: the message asks, by its example, for the value seen, the one expected, and where the visitor's figure comes from.
- The spec in docs/UX-SPEC.md §1, "About"; the smoke test's axe on the section in every theme; a browser test that Send posts the fields (the request intercepted) and shows the line after; the privacy line's sentence (docs/DEPLOYMENT.md, "Analytics", where the line is planned).

## Decisions for Sean

1. How Send delivers: a form service (recommended, Formspree), or a function of ours.
2. The service's account and form, set up at his screen; the inbox it mails to.
3. The privacy line's sentence about it.
4. The kinds' labels, "Inaccuracy", "Bug", "Idea", and the examples in the Message's empty state.
