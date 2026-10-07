# Deployment

How the site is built and served, the one-time setup behind it, and how to release, roll back, or move domains. The decision is ADR 0008; this file is the runbook.

## How it works

- **Vercel builds from GitHub.** Every push to `main` builds a production deployment; every other branch gets a preview at its own `vercel.app` address. The output is static files only (`apps/web/dist`): no functions, no server.
- **The project is the web app.** Its root directory is `apps/web` with Vercel's Astro preset, as Vercel detected on import: it installs the whole pnpm workspace from the repository's lockfile, runs `astro build`, and serves `dist`. The build reaches `packages/core` because Vercel includes the files outside the root directory, its default for a monorepo. `apps/web/vercel.json` holds what the preset does not: the headers.
- **Tool versions.** Node is the project's default, 24.x, the version CI uses (`.node-version`). pnpm is the exact `packageManager` version in the root `package.json`, through Corepack, which the project turns on with the variable `ENABLE_EXPERIMENTAL_COREPACK=1`; without it Vercel would pick pnpm 10 from the lockfile.
- **CI stays the gate.** Vercel's Deployment Checks hold each production deployment until the two GitHub Actions jobs pass (docs/TESTING.md, "CI"), so a failing push never reaches `bigsmall.work`.
- **Headers** (`apps/web/vercel.json`): the hashed files under `/_astro/` are cached for a year, since a change gives them a new name; every response asks browsers not to guess content types, to send only the origin as referrer to other sites, never to show the site in a frame, and to keep the camera, microphone, and location off.
- **Search and previews.** Astro's `site` is `https://bigsmall.work` (`apps/web/astro.config.mjs`): canonical links, the sitemap (`/sitemap-index.xml`, without the `/dev` pages), `robots.txt`, and link previews are built from it. `404.html` answers unknown addresses with status 404. The `/dev` pages are deployed but ask not to be indexed, and nothing links to them.

## One-time setup

Done once by the owner in the Vercel and Porkbun dashboards; Claude never signs in to either.

### The Vercel project

1. In Vercel (team `reelatlas`), **Add New → Project**, and import `reelatlas/bigsmall` from GitHub. When asked, let the Vercel GitHub app see that one repository.
2. Keep what Vercel detects: **Root Directory** `apps/web` and the **Astro** preset, with the build and output overrides off.
3. Under **Environment Variables**, add `ENABLE_EXPERIMENTAL_COREPACK` with the value `1` for production and preview.
4. **Deploy.** In the build log, check `pnpm 12` installs the dependencies and Node is 24. The site then answers at the project's `vercel.app` address.
5. In **Settings → Deployment Checks**, add the two CI jobs ("Lint, format, typecheck, test, build" and "Browser and accessibility checks") and mark both required.

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
- `https://bigsmall.work/robots.txt` and `/sitemap-index.xml` load.

## Releasing

- A release is a push to `main` that passes CI; Deployment Checks then promote it. To see a change before it is live, push a branch and open its preview address.
- Milestones are tagged: `v0.1.0` is the MVP shared with friends for feedback (docs/PLAN.md §13).

```bash
git tag -a v0.1.0 -m "bigsmall MVP"
```

```bash
git push origin v0.1.0
```

- **Rolling back.** In Vercel, **Deployments**, open an earlier production deployment and choose **Instant Rollback**; then fix forward on `main`.
- **Checking a build locally.** `pnpm build` then `pnpm preview` serves `apps/web/dist` as Vercel will, except the headers.

## Changing the main domain

A config change and a redirect flip (ADR 0008): set `site` in `apps/web/astro.config.mjs` to the new domain, make it the main domain in Vercel's Domains list, and redirect the old one to it with a 308. Search rankings follow permanent redirects, but slowly, so settle the domain before investing in search.

## Costs and limits

The `reelatlas` team was on Vercel Pro at setup, which allows commercial use. On the free Hobby plan the site would run the same, but only for non-commercial use; if bigsmall earns money (ads, sponsorship) it needs Pro or Cloudflare Pages (ADR 0008). The domains renew yearly at Porkbun.
