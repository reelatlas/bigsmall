# 0001 — No database for v1

Date: 2026-10-06
Status: accepted

## Context

bigsmall converts units. Conversion factors are constants. User preferences are small and personal. The site must be fast on any device and cheap to run. A database adds a network round trip, a hosting dependency, an attack surface, and a monthly bill, for data that never changes at runtime.

## Decision

Ship everything with the page. Unit data lives in TypeScript inside `packages/core` and is bundled. Preferences and recents live in `localStorage`. The current conversion lives in the URL. No database, no server-side code.

## Alternatives considered

- **Supabase (Postgres + auth).** Only useful for cross-device sync of favorites or server-side query logging. Neither is in v1. Can be added later without touching the core.
- **Serverless function for conversions.** Adds latency to every keystroke for no benefit; the math runs fine in the browser.

## Consequences

- Hosting is a static CDN (Cloudflare Pages). Zero server cost.
- Offline works for free once a service worker is added.
- Currency, if added, calls an external rate API from the browser with caching. Still no database.
- Accounts and sync, if ever wanted, are a separate ADR.

## Hosting outcome (2026-10-07)

The site is hosted on Vercel rather than Cloudflare Pages (ADR 0008). It is still a static CDN with no server and no database, so this decision stands as written.
