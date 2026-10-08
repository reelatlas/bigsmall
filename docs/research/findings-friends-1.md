# Findings — friends on the live MVP

Friends who use bigsmall tried the live MVP (`v0.1.0`) and told Sean what they wanted; he relayed it on 2026-10-07. They gave Sean the idea for bigsmall in the first place and are its first user group, so their requests carry the weight of users', not of reviewers'. This was not a moderated test: below is what they asked for, in Sean's account, and what came of it.

## What they asked for

| Request                                                                                                     | Outcome                                                                                                |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Type a value and a unit, and see it in every unit of its category at once, instead of two boxes. Both agree | The table layout, as the default; two boxes stay on a switch (ADR 0009)                                |
| From the table, switch to any one of the values, so it becomes the one everything converts from             | Tapping a row moves its unit into the box with its value, and every row converts from it (UX-SPEC §14) |
| Favorite units and categories, in a bar for quick picks (Mike)                                              | Noted as an exploration, not scheduled (docs/PLAN.md §2)                                               |

Later the same day two friends added ideas from their own work. Neither is scheduled; both are explorations in docs/PLAN.md §2.

| Who                          | Idea                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mike, an electrical engineer | Construction dimensions are fractional inches, which are a pain to add and subtract, and less often to multiply and divide; the sites that do it are hard to use, so he keeps a spreadsheet. Enter decimal or fractional feet and inches, and get results in lowest terms or rounded to a chosen step (nearest 1/2, 1/4, 1/8, and so on). He linked a feet-and-inches calculator as an example of the job; nothing is taken from it (ADR 0004) |
| Dan, an audio engineer       | Beside a value in the table, quick multiples or ratios (½×, 2×, 4×, 8×), so the range around an answer shows at a glance; the user chooses whether to see them and the step (halves, doubling)                                                                                                                                                                                                                                                 |

Sean's own notes the same day build on these: filtering the table's units, writing fractions and parentheses (and telling a fraction from a division), keeping the math on screen rather than its value, and settings that are always saved, with templates later. All are explorations in docs/PLAN.md §2, to be evaluated together.

## Sean's decisions (2026-10-07)

- Two layouts with a switch: the table, the default, and two boxes, with swap moved into the toolbar right of the calculator. The choice is remembered.
- In the table, a headline row for the conversion's second unit (dropped the same day, ADR 0010); tapping any row moves it into the box, and everything converts from it.
- Basic mode lists the basic units with "Show all N units".
- Every category at once waits.
- No A/B test: the switch, and the five-person test run on the table layout.

Built on 2026-10-07: swap in the toolbar first, then the table, its headline, moving a row into the box, the switch beside the theme menu, and rows at 6 significant digits (docs/UX-SPEC.md §1, §10; ADR 0009, outcome notes). The test script is rewritten for the table.

Revised the same day after Sean tried it: the headline is gone, since the table already shows every unit and the second unit matters only with two boxes, where it is kept (ADR 0010); the category label sits over the box in both layouts; and the calculator takes a column of its own beside the table.

## What the five-person test should now learn

The test (docs/research/usability-test-1.md) no longer decides whether to build the table; it checks how the table works in use:

- whether people find that tapping a row moves it into the box, and expect it to;
- whether anyone looks for a second box, or finds the switch;
- whether anyone opening a link that names two units, in the table, misses which unit was meant.

On 2026-10-07, after using option A in the product, Sean retired two boxes and the switch: the table is the only layout (ADR 0013).
