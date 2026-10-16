# 0004 — Original code; factors verified against standards bodies

Date: 2026-10-06
Status: superseded by 0020 (2026-10-15)

## Context

Two existing converter sites inspired this project. Both carry Copyscape "do not copy" notices. Conversion factors themselves are uncopyrightable facts defined by standards bodies, but site text, code, page structure, unit descriptions, and the particular selection and arrangement of content are the sites' own work. We also want our numbers to be right, which means checking them against the authority, not against another website.

## Decision

1. **Nothing is copied from any existing converter site.** Not text, code, markup, styles, unit descriptions, info blurbs, taxonomy, or page structure.
2. **Factors are sourced from standards publications** (NIST SP 811, NIST Handbook 44, BIPM SI Brochure, IEC 80000-13) and each unit record cites its source.
3. **Existing sites are used for three things only:** (a) coverage research, meaning which quantity types and units people expect; (b) UX gap analysis; (c) a small spot-check of our results against theirs as an extra sanity check, where any disagreement is settled by the standards source.
4. **Our taxonomy, naming, aliases, grouping, search behavior, copy, and UI are designed from scratch** and documented in our own words in `docs/UNITS-CATALOG.md` and `docs/UX-SPEC.md`.

## Alternatives considered

- **Use site data as the seed and clean it later.** Rejected: provenance would be unclear forever.
- **Pull an open-source unit library (e.g. an npm package) for the data.** Possible for cross-checking, but licensing and accuracy vary; our own sourced data is small enough to author directly and gives us the alias and tier fields we need.

## Consequences

- Authoring the catalog takes real effort (hundreds of units, each with a citation). Spread across milestones 1 and 3.
- The golden test fixture doubles as the provenance record.
- We can publish the core package under a permissive license later with a clean history.

## Outcome

- **2026-10-15.** Superseded by [0020](0020-references-and-our-own-checks.md). Sean explained this was a caution for the start, so that bigsmall would grow its own concept, UX, and design; other converters are now references used freely, and every factor is still checked against its standard on our own.
