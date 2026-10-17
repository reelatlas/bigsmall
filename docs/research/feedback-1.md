# Feedback 1 — how a visitor reaches us

Built 2026-10-17 as a prototype lab, `/dev/feedback-lab` (`apps/web/src/pages/dev/_feedback-lab/`), for the fiftieth pass's open question (docs/research/findings-0-first-pass.md): Sean asked for "a trial lab, light, to get an idea of the functions and how it might look and the best way to display it". Live where the lab is; retired by `CLAUDE.md`'s "Retire a lab" recipe once the section ships.

## The question

bigsmall has no way to hear from a visitor. The About page was to hold "how to send feedback" (the forty-ninth pass), and the site's first rule, every number checked, wants a way for someone to say a figure looks wrong: such a report is a lead for re-opening a figure (docs/RESEARCH.md §5), worth nothing without its source. The site has no server and no database (ADR 0001), and its privacy line is to say that visits are counted anonymously and nothing else is kept.

## The answers in the lab

Each is built from the real components (`Button`, `SegmentedControl`, the lab controls' fields) with simple state of its own, side by side.

- **A. A form that opens the visitor's email app.** What it is about (a figure, an idea, a problem, one strip of segments); for a figure, the unit or ingredient and "your figure, and where it comes from"; a message, with a hint under it saying what helps for that kind; Send, which opens the visitor's own email app with the subject and body filled in (a `mailto:` address with `subject` and `body`), and Copy the address beside it. A line under the buttons says what Send does and that nothing is stored or sent from the page. The lab shows what arrives, the subject and the body, beside the form, so nothing need be sent to see it.
- **B. The address alone.** The address, a line saying what a report of a figure needs, Copy the address, and a link that opens the email app with the body's skeleton.
- **C. A form that posts to a service** (Formspree, Basin), described and not built: messages land in the inbox without an email app, at the cost of a third party holding them, spam to filter, and a line in the privacy note. The fallback if the email route proves to lose messages. A function of our own sending through an email service (Resend) is the same trade with more to run, and the first server in a site that has none.

The address in every answer is `hello@bigsmall.work`, forwarded to Sean's inbox by Porkbun's free email forwarding, set up at his screen (the dashboard-steps practice); it does not exist yet. Sean's own address appears nowhere.

## What a report of a figure needs

For docs/RESEARCH.md §5 a report is a lead: the unit or ingredient; the visitor's figure; where it comes from (a chart, a package, a book, a weighing of their own), so the source can be found and screened like any other. The form asks for exactly these, and the message hint says why.

## Recommendation

A, with B's copy of the address beside it. It needs no backend and no third party, keeps the privacy line as it is, and structures a report so it arrives usable; a visitor with no email app set up copies the address instead, which is B. C only if the friends' rounds show the email route losing messages.

For the real build, not the lab:

- Send as a link (an anchor with the `mailto:` address) rather than a button that navigates, so it works before the island loads; the design system's `Button` gains an `href` form (extend, never fork) or the link takes the primary button's recipe.
- A way in from the converter later: "Report this figure" from Cooking's line under the table, carrying the ingredient and the conversion's URL into the form.
- Where: at the foot of the About page, after the formulas, under a heading "Feedback" (`SECTION_HEADING`), the footer staying "About" (Sean, 2026-10-15: not "About · Feedback", which would overload it); a `#feedback` anchor for links.
- The spec in docs/UX-SPEC.md §1, "About"; the smoke test's axe on the section in every theme; a browser test that the form composes the subject and body as the lab shows them.

## Decisions for Sean

1. The address: `hello@bigsmall.work`, and its forwarding set up at his screen.
2. A with B's copy beside it (recommended), B alone, or A alone.
3. The three kinds and their labels: "A figure", "An idea", "A problem".
4. The place on About and the footer's wording.
