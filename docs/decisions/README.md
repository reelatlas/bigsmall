# Architecture Decision Records

One file per decision, numbered. An accepted ADR is not rewritten: a reversed or replaced decision gets a new ADR that supersedes it, and the old one changes only its status line and, where a reader needs it, a dated outcome note at the end pointing to what replaced it.

## Index

| #                                       | Title                                                                       | Status                                          |
| --------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------- |
| [0001](0001-no-database.md)             | No database for v1                                                          | accepted                                        |
| [0002](0002-stack.md)                   | Astro + React island + TypeScript + Tailwind v4                             | accepted; partly superseded by 0006, 0007, 0008 |
| [0003](0003-core-ui-boundary.md)        | Hard boundary between core engine and UI                                    | accepted                                        |
| [0004](0004-originality-and-sources.md) | Original code; factors verified against standards bodies                    | accepted                                        |
| [0005](0005-toolchain-policy.md)        | Latest tooling where compatible, a11y tooling never dropped                 | accepted                                        |
| [0006](0006-smart-input-combobox.md)    | Hand-built WAI-ARIA combobox; React Aria removed                            | accepted                                        |
| [0007](0007-preact-compat.md)           | The island runs on Preact through preact/compat                             | accepted                                        |
| [0008](0008-hosting-and-domains.md)     | Hosting on Vercel, with bigsmall.work as the main domain                    | accepted                                        |
| [0009](0009-two-layouts.md)             | One converter, two layouts: the table by default, two boxes behind a switch | accepted; the headline superseded by 0010       |
| [0010](0010-table-without-headline.md)  | The table shows every unit alike; the second box's unit is kept, not shown  | accepted                                        |

## Template

```markdown
# NNNN — Title

Date: YYYY-MM-DD
Status: proposed | accepted | superseded by NNNN

## Context

What situation forces a choice. Facts, constraints, numbers.

## Decision

What we chose, in one or two sentences.

## Alternatives considered

Each with the one reason it lost.

## Consequences

What becomes easier, what becomes harder, what we must now do.
```
