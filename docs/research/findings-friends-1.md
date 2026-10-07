# Findings — friends on the live MVP

Friends who use bigsmall tried the live MVP (`v0.1.0`) and told Sean what they wanted; he relayed it on 2026-10-07. They gave Sean the idea for bigsmall in the first place and are its first user group, so their requests carry the weight of users', not of reviewers'. This was not a moderated test: below is what they asked for, in Sean's account, and what came of it.

## What they asked for

| Request                                                                                                     | Outcome                                                                                                |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Type a value and a unit, and see it in every unit of its category at once, instead of two boxes. Both agree | The table layout, as the default; two boxes stay on a switch (ADR 0009)                                |
| From the table, switch to any one of the values, so it becomes the one everything converts from             | Tapping a row moves its unit into the box with its value, and every row converts from it (UX-SPEC §14) |
| Favorite units and categories, in a bar for quick picks                                                     | Noted as an exploration, not scheduled (docs/PLAN.md §2)                                               |

## Sean's decisions (2026-10-07)

- Two layouts with a switch: the table, the default, and two boxes, with swap moved into the toolbar right of the calculator. The choice is remembered.
- In the table, a headline row for the conversion's second unit; tapping any row moves it into the box, and everything converts from it.
- Basic mode lists the basic units with "Show all N units".
- Every category at once waits.
- No A/B test: the switch, and the five-person test run on the table layout.

## What the five-person test should now learn

The test (docs/research/usability-test-1.md) no longer decides whether to build the table; it checks how the table works in use:

- whether people find that tapping a row moves it into the box, and expect it to;
- whether anyone looks for a second box, or finds the switch;
- whether the headline reads as the answer a shared link meant.
