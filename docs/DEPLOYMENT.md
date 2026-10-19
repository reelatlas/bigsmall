# Deployment

How the site is built and served, the one-time setup behind it, and how to release, roll back, or move domains. The decision is ADR 0008; this file is the runbook.

## How it works

- **Vercel builds from GitHub.** Every push to `main` builds a production deployment; every other branch gets a preview at its own `vercel.app` address. The output is static files only (`apps/web/dist`): no functions, no server.
- **The project is the web app.** Its root directory is `apps/web` with Vercel's Astro preset, as Vercel detected on import: it installs the whole pnpm workspace from the repository's lockfile, runs `astro build`, and serves `dist`. The build reaches `packages/core` because Vercel includes the files outside the root directory, its default for a monorepo. `apps/web/vercel.json` holds what the preset does not: the headers, and the rewrites that serve Umami from the site's own address ("Analytics").
- **Tool versions.** Node is the project's default, 24.x, the version CI uses (`.node-version`). pnpm is the exact `packageManager` version in the root `package.json`, through Corepack, which the project turns on with the variable `ENABLE_EXPERIMENTAL_COREPACK=1`; without it Vercel would pick pnpm 10 from the lockfile.
- **A push to `main` deploys.** Vercel does not wait on GitHub Actions (Sean, 2026-10-18). The checks run on the machine that made the change (`pnpm check`, and `pnpm e2e` when behavior changed), or in Actions when someone starts the workflow (docs/TESTING.md, "CI").
- **Headers** (`apps/web/vercel.json`): the hashed files under `/_astro/` are cached for a year, since a change gives them a new name; every response asks browsers not to guess content types, to send only the origin as referrer to other sites, never to show the site in a frame, and to keep the camera, microphone, and location off.
- **Search and previews.** Astro's `site` is `https://bigsmall.work` (`apps/web/astro.config.mjs`): canonical links, the sitemap (`/sitemap-index.xml`, without the `/dev` pages), `robots.txt`, and link previews are built from it. `404.html` answers unknown addresses with status 404. The `/dev` pages are deployed but ask not to be indexed, and nothing links to them.
- **Icons and the preview image** live in `apps/web/public/` and are drawn by `pnpm --filter @bigsmall/web brand` from the default theme (docs/DESIGN-SYSTEM.md, "Brand assets").

## One-time setup

Done once by the owner in the Vercel and Porkbun dashboards; Claude never signs in to either.

### The Vercel project

1. In Vercel (team `reelatlas`), **Add New → Project**, and import `reelatlas/bigsmall` from GitHub. When asked, let the Vercel GitHub app see that one repository.
2. Keep what Vercel detects: **Root Directory** `apps/web` and the **Astro** preset, with the build and output overrides off.
3. Under **Environment Variables**, add `ENABLE_EXPERIMENTAL_COREPACK` with the value `1` for production and preview.
4. **Deploy.** In the build log, check `pnpm 12` installs the dependencies and Node is 24. The site then answers at the project's `vercel.app` address.
5. In **Settings → Deployment Checks**, leave the list empty. The two GitHub jobs were added on 2026-10-07 and removed on 2026-10-18: while they are listed, a production deploy waits for a workflow that no longer starts on a push. Vercel's own Lint and TypeCheck checks stay off too.

### Domains

In the project's **Settings → Domains**:

1. Add `bigsmall.work`. When Vercel offers `www.bigsmall.work` too, keep `bigsmall.work` as the main one and have `www` redirect to it.
2. Add `bigsmall.diy` and `www.bigsmall.diy`, each set to **Redirect to** `bigsmall.work` with **308 Permanent Redirect**, so search engines see one site.
3. Vercel then lists the DNS records each name needs: an `A` record for the bare domain and a `CNAME` for `www`. Use the exact values it shows; the `CNAME` is unique to the project.

At Porkbun, for `bigsmall.work` and then `bigsmall.diy` (**Domain Management → DNS**):

1. Delete Porkbun's parking records first (an `ALIAS` or `A` on the bare domain and a `CNAME` on `*`, both pointing at `pixie.porkbun.com`). A leftover record for the same name makes Vercel report an invalid configuration.
2. Add the `A` record: host blank, answer the IP Vercel shows.
3. Add the `CNAME` record: host `www`, answer the value Vercel shows.
4. Wait until every name in Vercel's Domains list reads **Valid Configuration**; Vercel issues the HTTPS certificates itself, usually within minutes, at most a day while DNS spreads.

### Check the live site

- `https://bigsmall.work` shows the converter; `http://` and `www.` addresses land on it.
- `https://bigsmall.diy` lands on `https://bigsmall.work` with a 308.
- `https://bigsmall.work/no-such-page` shows "Page not found" with the way back.
- A link pasted into a chat shows the preview card; the tab shows the icon.
- `https://bigsmall.work/robots.txt` and `/sitemap-index.xml` load.

## Releasing

- A release is a push to `main`. Vercel promotes it when its own build finishes. To see a change before it is live, push a branch and open its preview address.
- Milestones are tagged: `v0.1.0` is the MVP shared with friends for feedback (docs/PLAN.md §13).

```bash
git tag -a v0.1.0 -m "bigsmall MVP"
```

```bash
git push origin v0.1.0
```

- **Rolling back.** In Vercel, **Deployments**, open an earlier production deployment and choose **Instant Rollback**; then fix forward on `main`.
- **Checking a build locally.** `pnpm build` then `pnpm preview` serves `apps/web/dist` as Vercel will, except the headers.

## Analytics

Umami Cloud counts visits (ADR 0019), in Sean's account on the free Hobby plan.

- **On since 2026-10-15.** Umami's website id for bigsmall.work is `UMAMI_WEBSITE_ID` in `apps/web/src/lib/site.ts`; it is not a secret, since it ships in the page. `layouts/Base.astro` adds the tracker on production deployments alone (`VERCEL_ENV=production`); emptied, counting stops.
- **First-party paths.** `apps/web/vercel.json` rewrites `/ux/s.js` to `https://cloud.umami.is/script.js` and `/ux/api/send` to `https://gateway.umami.is/api/send`; the tag's `data-host-url` is `https://bigsmall.work/ux`. `astro dev` and `astro preview` do not apply the rewrites, and the tag is not there to need them.
- **After turning it on.** Visit from two places (a phone on cellular, a computer on Wi-Fi): Umami should show two sessions with the right countries. If they merge or show one country, the gateway is reading Vercel's address rather than the visitor's, and the proxy needs a function that forwards it.
- **Our own visits.** Once in each browser we use, the phone's too: on bigsmall.work, the console line `localStorage.setItem('umami.disabled', 1)` sets the key the tracker reads before it counts (any value disables it; `localStorage.removeItem('umami.disabled')` turns counting back on). The setting holds until the site's data is cleared. Both of Sean's devices were set on 2026-10-18 through the owner's page, `/dev/owner`, one switch for a phone without a console, retired the same day once they were (its entry in `docs/research/labs/README.md`; it comes back from `d700951` if a new device needs it). Once every device is excluded, Umami's history can start clean: Umami Cloud, Settings, Websites, bigsmall.work, Data, Reset, which clears every event so far (2026-10-18).
- **Limits.** Hobby: 100,000 events a month (each event, and each property on it, counts), one site, six months of history; past the limit Umami stops recording until the month resets. The $20 plan before that, or for a second site.

## Feedback

The feedback form on the About page (docs/UX-SPEC.md §1; ADR 0024) posts its fields as JSON to Formspark, a form service, which mails each message to Sean and keeps a copy in its dashboard (dashboard.formspark.io, the "bigsmall" form, id `je13qw0h9`, `FEEDBACK_FORM_ID` in `apps/web/src/lib/site.ts`). The id is public by design, as a form's address is; what guards it is set on Formspark's side, at Sean's screen:

- **Notifications** to the inbox he reads; the visitor's email, when given, is the Reply-To. The page names the notification: the sender "bigsmall feedback", the heading the kind, no footer or logo (`_email` in `features/feedback/report.ts`, the service's documented options).
- **Automatic filter** on: every submission screened.
- **Allowed domains**: `bigsmall.work` (its subdomains included), so a post from elsewhere is refused (403). Set by Sean on 2026-10-18 and checked with a real message from the live site.
- **Honeypot**: the page sends a hidden `_honeypot` field; a filled one is dropped. No challenge (captcha): Send stays one button. Spam words and the autoresponder: not used.
- **Submissions**: 250 free in all, then a one-time bundle ($25 for 50,000, which never expire); when they run out the service answers 402 and the page says it could not send. The form's Analytics tab shows the count left.
- **After a deploy that touches the form:** send one real message from bigsmall.work and see it arrive; the browser tests never reach the service.
- **Replies** come from the inbox that gets the notification, Sean's Gmail for now (2026-10-17: a small experimental site, nothing to overcomplicate); the visitor gets no automatic mail, only the page's "Thank you for your feedback!" A domain address can take over later without a change to the site.
- **The record** is the form's Submissions archive, kept indefinitely on the free plan, exported as JSON or CSV from the form's Exports (a period, or all time). No database of our own (ADR 0001). For an analysis, Sean exports and the file lands in `feedback-exports/` at the repo's root, which git ignores, since the messages carry visitors' addresses; the analysis Sean reads keeps the senders' addresses, since who writes, and how, is part of the picture (his call, 2026-10-18), and lives beside the export in `feedback-exports/`; the copy committed to `docs/research/feedback-<n>.md` carries the substance without them: counts by kind, the categories and units named, the themes, where messages overlap each other and the plan (`docs/PLAN.md` §2), and what each becomes (a lead for the research skill, a fix, a roadmap note). Google Sheets and the REST API come only with the upgraded workspace (the submission bundle), which the volume does not call for.

The site stores nothing of a message; the service holds it. The privacy line in About's footer says so (docs/UX-SPEC.md §1, "Footer"; 2026-10-18).

## Changing the main domain

A config change and a redirect flip (ADR 0008): set `site` in `apps/web/astro.config.mjs` to the new domain, make it the main domain in Vercel's Domains list, and redirect the old one to it with a 308. Search rankings follow permanent redirects, but slowly, so settle the domain before investing in search.

## Costs and limits

The `reelatlas` team was on Vercel Pro at setup, which allows commercial use. On the free Hobby plan the site would run the same, but only for non-commercial use; if bigsmall earns money (ads, sponsorship) it needs Pro or Cloudflare Pages (ADR 0008). The domains renew yearly at Porkbun.
