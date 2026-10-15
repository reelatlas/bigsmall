# 0015 — On a touch screen, the keyboard comes up only from the box

Date: 2026-10-08
Status: accepted. Amended 2026-10-15: with a unit in the box, outside Temperature and Angle, the box asks for the number pad

## Context

The converter was built keyboard first: after a click on a tile, a row, a match, a category, the chip's ×, or clear all, the caret went back into the box so the keys could go on (ADR 0012, ADR 0014). On a phone or a tablet, moving focus into a text field brings the on-screen keyboard up, so every one of those taps pushed a keyboard over half the screen, hiding the table just picked from. Sean found it on his phone (2026-10-08): a touch screen is used by tapping, and the keyboard is needed only to type a number or a unit. A second cause made it worse: choosing a category with a tap closed the menu on pointerup, and the browser's click after the tap landed on the box the closed menu uncovered, focusing it.

## Decision

- **A tap never moves focus into the box.** Only a tap in the box itself, on its text or on the chip's name inside it, brings the keyboard up, as any text field does.
- **A tap in the table puts the keyboard away.** Taking a tile, a row, or a match with a tap blurs the box if it had focus, so the table stays in view; the box shows what was taken.
- **Done finishes.** With the caret brought into the box by a tap, the keyboard's Enter (labelled Done, `enterKeyHint`) does what Enter does there, then blurs the box.
- **Focus goes somewhere sensible.** A category chosen with a tap leaves focus on the menu's button, as the theme menu does; the chip's × and clear all leave it where it was; the calculator already moves focus to its keys, which are buttons.
- **Decided per press, not per device.** `src/lib/modality.ts` records whether the latest press was a finger or a pen (`pointerdown`'s `pointerType`) or a mouse or a key. A click or a key keeps the desktop's flow, so a tablet with a trackpad and a keyboard works like a desktop, and a laptop's touch screen like a phone.
- **A tap that closes what it lands on ends there.** The category menu's choices call `preventDefault()` on `touchend`, so no mouse events or click follow the tap onto what the menu uncovered.

Behavior: docs/UX-SPEC.md §8, "On a touch screen".

## Alternatives considered

- **Decide by the device** (`pointer: coarse` or `hover: none`). One check, but wrong for a tablet with a trackpad, a laptop with a touch screen, and anyone mixing the two, and it cannot tell a tap from a click on the same machine.
- **A number pad while a unit is in the box** (`inputmode="decimal"`), a common phone pattern. iPhone's number pad has no minus sign and no operators, so negative temperatures and sums could not be typed; the full keyboard stays.
- **Keep the caret in the box after every pick**, the desktop's behavior everywhere. It keeps the keys going for a hardware keyboard, but on a phone it covers the table with a keyboard nobody asked for.

## Consequences

- A phone user picks a category, a unit, and other units with taps alone, and brings the keyboard up only to type; Done puts it away.
- After a tap pick, a screen reader stays where it was rather than jumping to the box; the live region still announces the result.
- A tablet user with a hardware keyboard who tapped into the box loses the caret after Enter, but typing from anywhere lands in the box again (§8), so the next keys still work.
- Browser tests for touch use `tap()` on the phone project (`e2e/touch.spec.ts`); `click()` there is a mouse click and keeps the desktop's flow, which the other specs check.

## Amended 2026-10-15: the number pad

Sean asked for the number keys by default (2026-10-15). With a unit in the chip the box takes a number alone, so it carries `inputmode="decimal"` then, and a phone shows its decimal pad: digits and the decimal mark, no letters, no minus, no operators. With no unit it keeps `inputmode="text"`, since letters type a unit (`2 cups`), and so it does in Temperature and Angle, whose values go below zero as often as not. The chip's × brings the letters back; the calculator does the math. The field stays `type="text"`: a number field would drop what the parser reads (grouping, exponents, a unit after the number). The keyboard reads the mode when the field gains focus, so a change shows at the next tap.
