# Architecture Decision Records

One file per decision, numbered. An accepted ADR is not rewritten: a reversed or replaced decision gets a new ADR that supersedes it, and the old one changes only its status line and, where a reader needs it, a dated outcome note at the end pointing to what replaced it. A decision changed in part keeps its ADR: its status line says so, and the change goes in a dated list of amendments at the end.

## Index

| #                                             | Title                                                                                    | Status                                          |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------- |
| [0001](0001-no-database.md)                   | No database for v1                                                                       | accepted                                        |
| [0002](0002-stack.md)                         | Astro + React island + TypeScript + Tailwind v4                                          | accepted; partly superseded by 0006, 0007, 0008 |
| [0003](0003-core-ui-boundary.md)              | Hard boundary between core engine and UI                                                 | accepted                                        |
| [0004](0004-originality-and-sources.md)       | Original code; factors verified against standards bodies                                 | superseded by 0020                              |
| [0005](0005-toolchain-policy.md)              | Latest tooling where compatible, a11y tooling never dropped                              | accepted                                        |
| [0006](0006-smart-input-combobox.md)          | Hand-built WAI-ARIA combobox; React Aria removed                                         | accepted                                        |
| [0007](0007-preact-compat.md)                 | The island runs on Preact through preact/compat                                          | accepted                                        |
| [0008](0008-hosting-and-domains.md)           | Hosting on Vercel, with bigsmall.work as the main domain                                 | accepted; domain settled 2026-10-15             |
| [0009](0009-two-layouts.md)                   | One converter, two layouts: the table by default, two boxes behind a switch              | superseded by 0013                              |
| [0010](0010-table-without-headline.md)        | The table shows every unit alike; the second box's unit is kept, not shown               | superseded by 0013                              |
| [0011](0011-listed-order.md)                  | Units listed the visitor's way: their own system first, smallest to largest              | accepted; amended by 0016, 0018                 |
| [0012](0012-table-as-unit-list.md)            | The table is the unit list: a category menu, and a cursor in the field                   | accepted; partly supersedes 0009                |
| [0013](0013-one-layout.md)                    | One layout: the table; two boxes and the layout switch retire                            | accepted; supersedes 0009, 0010                 |
| [0014](0014-planes.md)                        | The arrow keys move between the page's planes: two toolbars and the box                  | accepted; amended 2026-10-15 (three times)      |
| [0015](0015-touch-keyboard.md)                | On a touch screen, the keyboard comes up only from the box                               | accepted; amended 2026-10-15                    |
| [0016](0016-every-unit-listed.md)             | Every unit in the table: specialist units listed with the everyday ones, no modes        | accepted; amended by 0018                       |
| [0017](0017-settings.md)                      | Settings: what shows and how it looks, sections by system, two layers                    | superseded by 0018                              |
| [0018](0018-settings-as-they-stand.md)        | Settings as they stand: Units and Display, the visitor's own set and order, remembered   | accepted; supersedes 0017                       |
| [0019](0019-analytics.md)                     | Analytics: Umami Cloud, cookieless, through the site's own address                       | accepted                                        |
| [0020](0020-references-and-our-own-checks.md) | Other converters as references; every number checked on our own                          | accepted; supersedes 0004                       |
| [0021](0021-cooking-by-ingredient.md)         | Cooking: an ingredient joins volume and weight                                           | accepted; amended 2026-10-16                    |
| [0022](0022-facts-by-kind.md)                 | Facts by kind: defined by a standard, measured by a written rule, conventional by a body | accepted; extends 0020                          |
| [0023](0023-toolbar-one-row.md)               | The toolbar is one row: a touch screen scrolls it, a pointer gets More                   | accepted                                        |

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
