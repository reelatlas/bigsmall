# Learnings

Append-only log of gotchas, workarounds, and best practices discovered while building bigsmall. Newest at the bottom. Each entry has a date, what happened, and the rule we take from it. When a rule becomes permanent, promote it into `CLAUDE.md` or an ADR and link back here.

Format:

```
## YYYY-MM-DD — short title
**What happened.** One or two sentences.
**Rule.** The thing to do (or not do) next time.
```

---

## 2026-10-06 — Fresh Windows machine has git but nothing else

**What happened.** First environment check found git 2.55 but no Node, npm, pnpm, or GitHub CLI, and no git identity configured.
**Rule.** Record the tooling check in the plan's setup checklist. After `winget` installs, restart the terminal and the desktop app's shell so PATH updates take effect.

## 2026-10-06 — Reference sites use Copyscape

**What happened.** Both inspiration sites carry Copyscape "do not copy" badges.
**Rule.** Treat them as coverage research only. Verify factors against NIST and BIPM, not against the sites. Never copy text, code, markup, or unit descriptions. Recorded as ADR 0004.

## 2026-10-06 — Bash tool commands over ~8 KB fail on this machine

**What happened.** Multi-file heredoc writes of 8 KB or more failed with "unexpected EOF while looking for matching quote", pointing at arbitrary lines. Controlled tests showed the same failure for any command of about 8.7 KB, with or without heredocs or quotes, while a 7.3 KB heredoc and small commands containing apostrophes worked. The cause is the command transport on Windows, not the content.
**Rule.** Write files larger than a few KB with the Write tool. Keep Bash tool commands well under 7 KB and write one file per command.

## 2026-10-06 — pnpm 12 blocks dependency install scripts until approved

**What happened.** `pnpm add` failed with ERR_PNPM_IGNORED_BUILDS for esbuild. The older `onlyBuiltDependencies` key in pnpm-workspace.yaml was ignored; `allowBuilds: { esbuild: true }` worked.
**Rule.** Approve build scripts per package under `allowBuilds` in pnpm-workspace.yaml with a comment saying why. Never approve everything.

## 2026-10-06 — TypeScript 7 drops the JavaScript compiler API

**What happened.** `typescript@7.0.2` (npm `latest`) ships only the native `tsc` plus `unstable/*` APIs; `lib/typescript.js` is gone. typescript-eslint (wants <6.1) and @astrojs/check (wants ^5 || ^6) cannot load it.
**Rule.** Stay on TypeScript 6.x, the bridge release with identical semantics and a config already clean for 7, until typescript-eslint and @astrojs/check support 7. Then bump one line. Check `pnpm view <tool> peerDependencies.typescript` before upgrading. See ADR 0005.

## 2026-10-06 — ESLint 10 and the JSX accessibility plugin

**What happened.** eslint-plugin-astro 3.x requires ESLint 10; eslint-plugin-jsx-a11y 6.10.2 declares ESLint ≤ 9. A grep of the plugin found none of the context APIs ESLint 10 removed, and it runs cleanly.
**Rule.** Keep ESLint 10. The peer override lives in pnpm-workspace.yaml with its reason. Re-check when jsx-a11y publishes a new major, or move to eslint-plugin-jsx-a11y-x if the Astro plugin adopts it.

## 2026-10-06 — Interactions that must work before hydration

**What happened.** Playwright selected a theme before the React island hydrated. The native select changed, nothing happened, and React then reset it. A user on a slow phone would see the same.
**Rule.** Anything that must work instantly (theme, preferences) is plain HTML handled by the inline pre-paint script, not a React island. Tests that drive an island wait for something it renders before interacting (docs/TESTING.md).

## 2026-10-06 — Claude desktop preview launcher on Windows

**What happened.** `.claude/launch.json` with backslash paths failed ("C:rogram Files"); the launcher re-escapes backslashes. pnpm's global shim is a native `pnpm.exe`, and the app's shell does not have Node on PATH.
**Rule.** In `.claude/launch.json` (gitignored, machine-specific) use forward slashes and run pnpm through Node explicitly: `C:/Program Files/nodejs/node.exe` with `C:/Users/<you>/AppData/Roaming/npm/node_modules/pnpm/bin/pnpm.mjs dev --host 127.0.0.1 --port 4321`. Screenshots time out while the app window is hidden; verify with page text instead.

## 2026-10-06 — Backslash escapes in files written through tool calls

**What happened.** A regex written through the Write tool with `\u00A0` landed as a raw non-breaking space, which ESLint rejected as irregular whitespace. A controlled test showed the Write and Edit tools decode `\uXXXX` into the character but leave every other backslash sequence (`\\`, `\d`, `\t`) exactly as written, so a literal `\uXXXX` cannot be produced through them at all. The Bash tool decodes JSON-style escapes instead: `\\` arrives as a single backslash, so `\\u00A0` in a command lands as the six-character `\u00A0`.
**Rule.** Keep source files free of `\u` escapes. Name each special character once with `String.fromCharCode(0x00a0)` and build regexes from constants, using `[0-9]` rather than `\d`. In Bash commands, double every backslash that must survive. When ESLint reports irregular whitespace, a raw character got in; replace it with a constant.

## 2026-10-06 — Floating-point realities in the engine tests

**What happened.** Round-tripping 0.000001 °C through kelvin came back with a relative error of 2.5e-9 because adding and subtracting 273.15 loses the tiny value's low bits. Separately, asking Intl for 21 significant digits of 1/3 returned 16: a double has no more to give.
**Rule.** Judge tiny values on absolute error: the round-trip test uses `max(|expected|, 1)` as its scale. Treat 10 significant digits as the display ceiling and never promise more precision than a double holds. Golden rows that quote a published 7-digit figure carry `tolerance: PUBLISHED_7_DIGITS` so the strict default stays strict everywhere else.

## 2026-10-06 — Aliases outrank prefixes, by design

**What happened.** "kilo" ranked kilogram above kilometer. It is a registered alias (people say "5 kilos"), so it is an exact match (class 2) while kilometer only matches by prefix (class 3).
**Rule.** Add an alias only when people really type it to mean that unit, because an alias wins over every prefix match in other categories. Keep the ambiguous ones (`oz` on fluid ounce) deliberate: they stop auto-lock and surface the choice, which docs/UX-SPEC.md §5 wants.
**Superseded in part (2026-10-06).** Nothing auto-locks any more: only Enter or a pick commits. An ambiguous alias now lists both units with their categories so the choice is visible before Enter. The alias rule stands.

## 2026-10-06 — React Aria cost 12 KB for two buttons

**What happened.** The first milestone 2 build measured 91.4 KB gzipped against the 90 KB budget. React Aria's press, hover, and focus machinery was bundled for a Button and a chip's remove control. Native `<button>` elements with Tailwind `hover:` and `active:` variants brought the page to 79.1 KB.
**Rule.** Measure before adopting a component library and again after each milestone (`pnpm bundle`). Native elements first; a library only for a measured need, recorded in an ADR (0006).

## 2026-10-06 — Typing before hydration is lost on a server-rendered island

**What happened.** Browser tests typed into the converter before React attached; the controlled inputs reset to empty when hydration finished. The island now marks itself with `data-hydrated` through a `useSyncExternalStore` hook, and tests wait for it.
**Rule.** Any island that takes typed input needs a ready mark for tests, and an inline listener that captures early keystrokes for users is on the milestone 3 list (docs/UX-SPEC.md §14). `useSyncExternalStore` with a server snapshot of `false` is the effect-free way to know you are on the client.

## 2026-10-06 — A browser test found a real handoff bug

**What happened.** Typing a bare unit letter into the second box made it the source, which blanked the number in the first box. Unit tests had not covered "type a unit into the derived box". The browser test for switching categories did.
**Rule.** Only a number transfers the source between boxes (docs/UX-SPEC.md §14). Keep at least one browser test per user flow in the spec; the reducer tests cover rules, the browser tests cover sequences people actually perform.

## 2026-10-06 — jsx-a11y and virtual-focus listboxes

**What happened.** `jsx-a11y/click-events-have-key-events` flagged the option rows, which have click handlers but no key handlers because the combobox input handles keys through `aria-activedescendant`.
**Rule.** That is the correct pattern; disable the rule on that element only, with the reason in the comment, and let the axe suite verify the result.

## 2026-10-06 — A dev server reused by Playwright can serve stale modules

**What happened.** After rewriting several components in quick succession, every converter browser test timed out on the island's ready mark while lint, types, and unit tests passed. The console showed Vite serving a transform captured mid-write ("does not provide an export named 'UnitChip'") and React keeping the old hook state when the reducer's shape changed under hot reload.
**Rule.** When browser tests fail wholesale right after a batch of rewrites, read the browser console before touching code. Restart the dev server (or touch the rewritten files) and rerun; Playwright reuses whatever is on port 4321 locally. A reducer whose state shape changes needs a full reload, not a hot one.

## 2026-10-06 — Native popups cannot join the design language

**What happened.** The theme control was a styled `<select>`, but its open list is drawn by the OS: square corners, system colors, nothing a token can reach. It read as a foreign object next to the converter's fluid lists.
**Rule.** When an opening control must match the design, keep the native semantics but move them inside a fluid shell: `ThemePicker` is a `fieldset` of radios in the same placeholder-plus-absolute-shell pattern as the smart input, driven by the pre-paint script so it works before any bundle. Reserve raw native popups for cases where the OS picker is the better experience, such as dates on phones.

## 2026-10-06 — Two children reporting into one parent value clobber each other

**What happened.** Both smart inputs told the converter which category they were browsing through one `onBrowse(category)` callback. When one box's scope changed while it was closed, its effect reported `null` after the other box had reported its category, and the global label blanked. A browser test caught it; the reducer tests could not.
**Rule.** When several children report state to a parent, key the report by child (`onBrowse(boxId, value)`) and derive the combined value in the parent. Never let a child's "nothing" overwrite a sibling's "something".
**Superseded in part (2026-10-06).** `onBrowse` is gone: the category label now comes from the reducer's view (`anchor`), and an open list names its own category on its Back row. The general rule stands.

## 2026-10-06 — Rounded shells need overflow-hidden

**What happened.** The last row's hover highlight in the theme menu and in the suggestion lists drew square corners outside the shell's rounded border.
**Rule.** A shell with `rounded-*` that contains full-width rows gets `overflow-hidden`. It clips descendants only; the shell's own focus outline still shows.

## 2026-10-06 — Text fields match :focus-visible on a mouse click

**What happened.** The smart input showed an accent border plus an outer focus ring, which read as a double border. The usual fix, showing the ring only for keyboard focus with `:focus-visible`, does not work for fields: browsers treat any focus on an element that takes typing as keyboard focus.
**Rule.** A field's focus indicator is one accent edge of two pixels (border plus inset ring), no outer outline, and the accent must pass 3:1 against the surface (it is in the theme contract). Keep `focus-visible` rings for buttons and chips, where the heuristic works.
**Superseded in part (2026-10-06).** The two-pixel edge is now a real `border-2`, not a border plus an inset ring (next entry). The rest stands.

## 2026-10-06 — An inset ring is painted under the children; a border is not

**What happened.** The shell's two-pixel edge was a one-pixel border plus a one-pixel inset ring (an inset box-shadow). Row highlights and the scrollbar painted over the ring's pixel, so the edge looked thinner wherever a row was highlighted, and the scrollbar's arrows clipped into it.
**Rule.** An edge that nothing inside may cover is a real border (`border-2`), colored for state. Inset shadows and rings are decoration under the content, never a boundary. Give rows their own corners inside a gutter so a highlight reads as "inside" rather than "flush".

## 2026-10-06 — Styling part of a field's value needs a text layer

**What happened.** A bold exponent marker inside `1.5E21` cannot be done in an `<input>`: its value is one run of text. The field now has transparent text (`text-transparent`, with `caret-ink` so the caret stays visible) and an `aria-hidden` layer draws the same text over it with the marker in `font-semibold`. Selection uses `selection:bg-accent-soft` so the highlight shows through under the layer's glyphs. Measured in the browser, the layer and the field agree to the pixel on font, line box, and text width.
**Rule.** Keep the real `<input>` for everything behavioral (caret, selection, IME, mobile keyboards, the accessibility tree) and use the layer for typography only. The layer must match the field's font, size, padding, and line box exactly, follow its horizontal scroll (`onScroll` mirrors `scrollLeft`), and stay `pointer-events-none`. A bold glyph is a touch wider than the regular one, so after the marker the caret can sit a pixel off; acceptable for one character, not for whole words.

## 2026-10-06 — Fit text by measuring, not by counting characters

**What happened.** The number's size stepped down by character count (nine, then six for the chip), which is right on one width and wrong on every other. `useFitStep` now tries each size on the text layer inside a layout effect (`scrollWidth <= clientWidth`), commits the first that fits, and re-measures on resize through a `ResizeObserver`. Writing the class directly and then rendering the identical string through React keeps the DOM and the tree in agreement with no flash.
**Rule.** Measure the real element when a decision depends on layout. Do it in `useLayoutEffect` so the user never sees the wrong size, and make the measured write and the rendered value the same string so React never fights the measurement.

## 2026-10-06 — Undo chunks need a clock, and the reducer should own it

**What happened.** "Escape clears one burst of typing at a time" and "undo steps through the same bursts" needed one definition of a burst. Giving the `input` action a timestamp (`performance.now()`) lets the pure reducer decide: same box, under 700 ms since the previous keystroke, and not a space, means the same chunk. Tests pass explicit times, so nothing fakes timers.
**Rule.** When behavior depends on timing, put the time in the action and the rule in the reducer; the component only reports when things happened. Per-box checkpoints (the text a chunk started from) make Escape a forward, undoable action instead of a selective undo, which keeps the history linear.

## 2026-10-06 — A hover token equal to its surface hides every hover

**What happened.** Daylight set `--surface-raised` to the same white as `--surface`, so every hover in the default theme was invisible, and the "highlight inside the edge" fix could not even be seen there. It is now a faint warm gray.
**Rule.** Every theme gives `--surface-raised` a value visibly different from `--surface`. A contract test for a minimum difference is a candidate; today the gallery catches it.

## 2026-10-06 — "Cramped" was uneven insets, found by measuring

**What happened.** Sean felt the field was cramped and slightly misaligned but could not say why. Measuring the boxes in the browser showed the 44 px chip and copy button sat 4 px from the top and bottom of a 52 px row but 12 px from the right edge, and the swap button had a 1 px edge beside 2 px fields. A 64 px field gives the chip and button the same 8 px on three sides, and corners that nest (`rounded-nested`, the field's radius minus border and inset) stop the inner curves looking swollen.
**Rule.** When something "looks off", measure before restyling: read `getBoundingClientRect` for every edge and compare the insets. Keep an inner element's inset equal on the sides it shares with its container, give nested corners the outer radius minus the inset, and give every bordered control the same edge weight.

## 2026-10-06 — A header outside a scrolling list drifts by the scrollbar's width

**What happened.** The category name on the list's Back row sat 10 px right of the symbol column below it, because the list's scrollbar narrowed the rows but not the header above the scroll container. Moving the Back row inside the list, as its first option pinned with `sticky top-0`, made both share one content box, and it also made the arrow keys able to reach it: `aria-activedescendant` must point inside the listbox the combobox controls, so a Back button outside the list could never be the active row.
**Rule.** Anything that must align with scrolling rows lives inside the same scroll container. Use `scroll-padding-top` on the list so a row scrolled into view is not hidden under the pinned one.

## 2026-10-06 — Chrome makes a scrolling list a Tab stop

**What happened.** Tab from the first box landed on the open suggestion list instead of the second box. Recent Chrome makes any scroll container without focusable children keyboard-focusable, and the listbox qualifies, since its options are virtually focused. Focus stayed inside the shell, so the list did not even close.
**Rule.** A listbox driven by `aria-activedescendant` gets `tabIndex={-1}`: the combobox's arrow keys scroll it, and Tab should leave the widget.

## 2026-10-06 — The dev server can serve a file caught between two writes

**What happened.** A component was rewritten with a block that used a new constant, and the constant was added by a second command a moment later. Vite transformed the file between the two writes and kept serving that version: "backRow is not defined" crashed the island in the browser pane and in the next Playwright run, although the file on disk was correct and every static check passed.
**Rule.** Make each file change in one write. If a page or the browser suite fails in a way the source cannot explain, read the browser console, then restart the dev server before touching code (see the earlier entry on stale modules).

## 2026-10-06 — jsx-a11y cannot see attributes passed through a spread

**What happened.** Building each list row from a shared props object (`{...common}`) made ESLint report the row's `click-events-have-key-events` exception as unused: the linter no longer saw `role` or `onClick`, so it was checking nothing.
**Rule.** Write ARIA roles, handlers, and `aria-*` attributes out on the element so jsx-a11y can check them. Vary values, not the attribute list.

## 2026-10-06 — A number too large to hold is still a number

**What happened.** `1e400` parsed to "no number", so typing it did not make the box the source and the other box fell back to its "0" placeholder, which read as a result of zero. Separately, a nonzero result can underflow to exactly 0 (`1e-320 mm` in kilometers).
**Rule.** The parser distinguishes "not a number" from "a number a double cannot hold" (`outOfRange: 'large' | 'small'`), the source rule keys on the number's text, and the view treats a zero from a nonzero input as "too small". A value that cannot be shown says so in place of the value; it never shows 0.

## 2026-10-06 — Hover follows a pointer that stays still while the list changes

**What happened.** A browser test clicked a category row, then pressed arrow keys, and the highlight was not where the keys should have put it. The pointer stayed over the list, the new rows rendered under it, and hovering moved the highlight. It failed on desktop and passed on mobile, where taps leave no pointer.
**Rule.** In tests that check keyboard highlight, reach the state with the keyboard, or move the pointer off the list first. Hover moving the highlight is correct behavior, not a bug.
**Superseded in part (2026-10-06).** Rows now take the highlight on `mousemove`, not `mouseenter`, the way mature combobox libraries do it: a row rendered under a still pointer no longer steals the highlight. It had to change so that a click on Back can land on the category it came from. Real pointer movement still highlights.

## 2026-10-06 — Chromium reports the Mac platform as "macOS", lowercase m

**What happened.** The shortcuts map swaps Ctrl for ⌘ on Apple devices by testing the platform name against `/Mac|iPhone|iPad|iPod/`. A browser test that simulates a Mac failed: Chromium's `navigator.userAgentData.platform` is "macOS", which a case-sensitive `Mac` never matches, so every Chrome and Edge user on a Mac would have seen Ctrl. Safari, which has no `userAgentData`, reports "MacIntel" through `navigator.platform`.
**Rule.** Match platform names case-insensitively, and keep the pattern in one module (`src/lib/platform.ts`) that the inline script receives through `define:vars` with its flags. Keep a browser test that fakes the other platform with `page.addInitScript`, since the machine running the tests only ever exercises its own.

## 2026-10-06 — Content shown on hover has three duties

**What happened.** Sean wanted the shortcuts map to appear on hover. WCAG 1.4.13 asks that content shown on hover or focus can be dismissed without moving the pointer, can be hovered itself without disappearing, and stays until the user leaves or dismisses it. A tooltip-style "show while hovered" fails the first two, and hover alone leaves keyboard and touch users out.
**Rule.** Hover opens a peek after a short pause and closes it shortly after the pointer leaves the whole shell (trigger and panel are one element, so moving onto the panel keeps it). A click pins it, Escape always closes it, and touch never peeks because a tap is a click. Delegate with `pointerover` and `pointerout` and compare `relatedTarget`, because `pointerenter` does not bubble and the inline script runs before the elements exist.

## 2026-10-06 — A focus-within edge lingers on a ghost trigger

**What happened.** The shortcuts shell showed its accent edge whenever anything inside had focus. After a click closed the panel, focus stayed on the icon, so a green square remained around it with nothing open, and closing by hover faded the edge out after the panel had vanished.
**Rule.** A trigger that is borderless at rest uses the button's own `focus-visible` ring, which a mouse click does not trigger, and its open edge comes and goes with `[data-open]` without a transition, so the edge and the panel always change together. Keep `focus-within` edges for controls that are bordered at rest, such as fields and the theme menu.

## 2026-10-06 — Astro renders React components to static HTML when no client directive is given

**What happened.** The shortcuts map is an Astro component without a bundle, but its keyboard icon lives with the other icons in `icons.tsx`, a React file. Used in an Astro file without `client:*`, a React component renders once at build time to plain markup and ships no JavaScript.
**Rule.** Keep one icon set in React and use it from Astro files directly. Add a `client:` directive only when the component needs to run in the browser.

## 2026-10-06 — `outline-none` hides Tailwind v4 focus rings

**What happened.** Swap, clear all, undo, redo, copy, and the shortcuts icon showed no focus ring. Their classes paired `outline-none` with `focus-visible:outline-2`; in Tailwind v4 `outline-none` sets `--tw-outline-style: none`, and the focus variant's outline reads that variable, so the ring never drew. A keyboard walk test found it.
**Rule.** One focus policy: the base layer gives every `:focus-visible` element the ring, and components add no outline classes. Only a field whose shell shows focus with its edge removes the input's own outline. The browser test "every Tab stop shows a visible focus indicator" guards it.

## 2026-10-06 — Unlayered theme tokens beat a layered reduced-motion override

**What happened.** The reduced-motion rule zeroed the motion tokens inside `@layer base`, but the theme files set their tokens outside any layer, and unlayered styles beat every layer whatever the specificity. Theme transitions kept their durations.
**Rule.** A rule that overrides theme tokens is unlayered and comes after the theme imports. A browser test reads `--motion-fast` under reduced motion in every theme.

## 2026-10-06 — Astro passes children to a React component as markup

**What happened.** `<Keycap>Mod</Keycap>` in an Astro file never became the Ctrl or ⌘ label. Astro hands a React component its children as rendered HTML in a slot, not as the string "Mod", so the component's comparison failed.
**Rule.** Anything a React component branches on is a prop (`<Keycap label="Mod" />`). Children are for content rendered as is.

## 2026-10-06 — Radios fire change on every arrow key

**What happened.** The theme menu closed after one arrow key. Arrows move the checked radio, which fires `change`, and the handler treated every change as a pick.
**Rule.** In a menu of radios, `change` applies the option (a live preview). Closing waits for Enter, or for a change that came from a pointer, which leaves the radio without `:focus-visible`.

## 2026-10-06 — Astro's dev toolbar is a Tab stop in development

**What happened.** The keyboard walk test failed on the dev server: after the page's own stops, Tab entered `astro-dev-toolbar`, whose buttons are not ours. The walk also read a shell's edge mid-transition.
**Rule.** Focus walks skip anything inside `astro-dev-toolbar`, which the built site does not have, and wait for transitions to finish (`settled` in `e2e/support.ts`) before reading an indicator.

## 2026-10-06 — A `div` with `aria-label` needs a role

**What happened.** axe flagged the gallery's row of icon buttons: `aria-label` on a plain `div` is not allowed, because a generic element cannot carry a name.
**Rule.** A labelled container gets a role that takes a name (`role="group"`), or a visible heading instead of the label.

## 2026-10-06 — Text the user typed is re-read with the separators it was typed with

**What happened.** In German, "1.000" (one thousand) went into the link as `v=1`: the URL writer parsed the text with the default separators, where "1.000" is one.
**Rule.** Every call that parses typed text passes the user's separators. Web functions that do it take them as a required argument (`stateToParams(state, separators)`), so a caller cannot fall back to the defaults by forgetting. A browser test loads the page in `de-DE`.
