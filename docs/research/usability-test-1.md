# Usability test 1 — the smart input

Milestone 2 exit gate (docs/PLAN.md §13). Five people, about 20 minutes each, one at a time. The goal is to learn whether the two-box idea is understood without explanation and where the smart input surprises people. Nothing here measures speed.

## Who

Five participants, recruited from people who are not working on the project:

- at least two who think in US units and two who think in metric;
- at least two who do the session on their own phone;
- at least one who uses a screen reader, a screen magnifier, or keyboard-only navigation, if at all possible.

## Setup

Until a public preview exists, run it from your machine on the same Wi-Fi:

```bash
pnpm dev --host
```

The terminal prints a `Network:` address such as `http://192.168.1.20:4321`. Open it on the participant's phone or laptop. Use the Daylight theme. Do not demo anything first.

Record with the participant's consent: screen capture plus audio, or just notes if they prefer. Ask them to think aloud.

## Script

Opening (read aloud): "This is an early version of a unit converter. I'm testing the design, not you. Please say what you're thinking as you go. There are no wrong answers, and I can't help until the end."

Then the tasks, one at a time. Do not explain the interface between tasks. If they are stuck for a full minute, note it and move on.

| #   | Task (read aloud)                                                                       | What we are watching                                                                          |
| --- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 1   | "You have a recipe that calls for 250 ml of milk. How many cups is that?"               | Do they type the number and unit together? Do they expect a dropdown? Does the lock surprise? |
| 2   | "It's 72 degrees Fahrenheit outside. What is that in Celsius?"                          | Typing "f" or "72 f" vs the name; do they notice the chip; does the result read as a result?  |
| 3   | "Now go the other way: what is 30 Celsius in Fahrenheit?" (same pair already on screen) | Do they find the swap control, or retype, or edit the other box directly?                     |
| 4   | "Convert 5 ounces to grams."                                                            | The ambiguity moment: two kinds of ounce appear. Do they pick correctly without reading?      |
| 5   | "Send this conversion to a friend." (any conversion on screen)                          | Do they look for a share button, copy the URL, or copy the number?                            |
| 6   | "How far is 10 kilometers in miles? Then clear everything and start over."              | Discovery of the chip's remove control, Backspace behavior, and whether "clear" is findable.  |

Closing questions (after the last task): "What did you expect to happen that didn't?" · "If you could change one thing, what?" · "Would you use this instead of what you use now? Why?"

## Observation sheet

One row per participant and task. Copy into `docs/research/findings-1.md`.

| Participant | Task | Completed (yes / with help / no) | Time (rough) | Surprises, quotes, errors |
| ----------- | ---- | -------------------------------- | ------------ | ------------------------- |

Also log every no-match query and every mistyped unit you see; they go straight into aliases (docs/UNITS-CATALOG.md §5).

## What decides the next step

- **Proceed to milestone 3 as planned** if four of five complete tasks 1, 2, and 4 without help.
- **Rework the lock behavior first** (docs/UX-SPEC.md §5) if two or more people are confused when a unit locks "by itself", or if they fight it when typing a longer unit.
- **Rework the ambiguity rows** if people pick the wrong ounce in task 4 more than once.
- **Add visible labels or a visible "from/to" cue** if people cannot tell which box is driving in task 3.

Write the findings and the decision in `docs/research/findings-1.md`, then update docs/UX-SPEC.md before changing behavior (CLAUDE.md rule 8).
