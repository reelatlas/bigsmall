# 0008 — Hosting on Vercel, with bigsmall.work as the main domain

Date: 2026-10-07
Status: accepted

## Context

ADR 0002 planned Cloudflare Pages for hosting. The site is fully static (Astro `output: 'static'`), so any static host serves it the same way. The owner has a Vercel account (`reelatlas`) and prefers it, and bought two domains at Porkbun: `bigsmall.work` and `bigsmall.diy`. The first public release is an MVP shared with friends for feedback.

## Decision

- Host on Vercel, connected to the GitHub repository: every push to `main` deploys, and other branches get preview deployments. GitHub Actions (`pnpm check` and the browser suite) stays the gate.
- `bigsmall.work` is the main domain. `bigsmall.diy` redirects to it permanently, so search engines see one site. Astro's `site` becomes `https://bigsmall.work`, which canonical URLs and the sitemap use.
- DNS stays at Porkbun, pointed at Vercel. The exact records are added during launch prep.
- Analytics is chosen later (docs/PLAN.md, "Explorations").

## Alternatives considered

- **Cloudflare Pages** (ADR 0002's plan). Free, including commercial use and unlimited bandwidth. It stays the fallback if Vercel's terms or costs stop fitting.
- **Netlify.** Equivalent for a static site; no reason to prefer it here.

## Consequences

- Vercel's free Hobby plan is for non-commercial use. If bigsmall earns money (ads, sponsorship), it moves to Vercel Pro or to Cloudflare Pages.
- Changing the main domain later is a config change (`site`) and a redirect flip. Search rankings carry over through permanent redirects, but slowly, so the main domain should be settled before investing in SEO.
- ADR 0002's hosting row is superseded by this decision; the rest of 0002 stands.
