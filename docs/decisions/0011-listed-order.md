# 0011 — Units listed the visitor's way: their own system first, smallest to largest

Date: 2026-10-07
Status: accepted; amended by 0016, and by 0017, now 0018 (the order is grouped into sections by system, and since 2026-10-15 the visitor can reorder the systems; the visitor's own first is a fresh visit's order)

## Context

With nothing typed, a category's units appeared in the order they are written in the catalog, picked by hand as "most common first": in practice metric, then US, each mostly small to large, with exceptions (meters before millimeters; speeds in no order of size). The visitor's region was detected but only broke ties between typed matches, so a US visitor saw metric at the top of the list and of the table, which uses the same order.

Sean asked how units are ordered and what the best practice is, since people will later choose their own sort.

## Decision

A category's units are listed with the visitor's own system first (US customary for US visitors, imperial for UK visitors, metric for everyone else, from the browser's region), then the other main system, then units of neither (knots), each group smallest to largest. Units of one size keep the catalog's order, most common first.

Size orders only units with a plain factor. Where a unit has an offset (temperature) or is a reciprocal (fuel economy, later), "larger" means nothing, so the catalog's everyday order stands, with the visitor's own everyday unit first: °F, °C, K in the US; °C, °F, K elsewhere.

The rule lives in core (`orderUnits`, `src/order.ts`); the suggestion list, the table, and the empty box's examples all read it. Behavior: docs/UX-SPEC.md §3.

## Alternatives considered

- **Keep the hand-picked order.** It ignored the visitor's region, and its exceptions could not be guessed.
- **Strictly by size across systems** (mm, cm, in, ft, yd, m, km, mi). Best for comparing magnitudes in the table, but it mixes metric and US units; a candidate for the sort people will choose later.
- **Alphabetical.** Easy to scan for a name, but it separates related units (meters from millimeters) and puts nothing about the visitor first.

## Consequences

- A US visitor sees inches, feet, yards, and miles first; a metric visitor millimeters through kilometers. The order depends on the region and the category, never on the value, so rows stay where the eye left them.
- The catalog's order now only breaks ties and orders categories with no size, so new units are still written most common first.
- A sort the visitor chooses (docs/PLAN.md §2) will replace this default, not sit beside it.

## Outcome (2026-10-08)

Amended by ADR 0016: the rule orders the everyday units, and the specialist units every category gained come after them all, in a group of their own, smallest to largest.
