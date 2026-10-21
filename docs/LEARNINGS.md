# Learnings

Append-only log of gotchas, workarounds, and best practices discovered while building bigsmall. Newest at the bottom. Each entry has a date, what happened, and the rule we take from it. When a rule becomes permanent, promote it into `CLAUDE.md`, an ADR, or the doc where the rule lives, and link back here.

Format:

```
## YYYY-MM-DD — short title
**What happened.** One or two sentences.
**Rule.** The thing to do (or not do) next time.
```

---

## Index by topic

Entries are cited by their titles, which stay as written; this index finds them. A note under an entry says what became of it: **Promoted** (the rule now lives in the doc named), **See also** (a related entry), **Superseded** or **Retired** (no longer how things are, kept for the history), **Since then** or **Came back** (what changed after), **Correction** (what it got wrong, found later).

- **Environment, tooling, CI, hosting:** Fresh Windows machine has git but nothing else; Bash tool commands over ~8 KB fail on this machine; pnpm 12 blocks dependency install scripts until approved; TypeScript 7 drops the JavaScript compiler API; ESLint 10 and the JSX accessibility plugin; Claude desktop preview launcher on Windows; Backslash escapes in files written through tool calls; A lint rule can guard class strings without a plugin; An action's major tag can lag its newest release; CI runs on a named Ubuntu image; String.replace reads `$` patterns in the replacement text; Vite wraps every dynamic import in a preload helper; A build fails when a shell sits inside its output folder; pnpm's release-age policy holds back a package published today; Astro template comments ship in the page; astro check's deprecation hints come from preact/compat's types; Vercel picks pnpm from the lockfile, and only up to 10; A page kept out of search names no canonical address; Vercel hides plain GitHub checks behind "Show All Checks"; Umami behind a proxy: point it at the proxy, and keep the URL's query out; An agent shares the session's scratchpad: brief it into a folder of its own; A gate run in the background reports its last command's exit code; A chain's `;` between stages runs the next stage after a failed gate: one `&&` list, format included; A push deploys on its own: Actions starts only by hand, and Vercel must not wait for it; Prettier pads a Markdown table's rows: an edit script anchors on a cell's text, not the row; Bing's import from Search Console takes a Domain property as its bare and `www` addresses, both verified; Safari deletes a site's storage after seven days without a visit: a flag kept on a phone needs a page that shows it; Git Bash rewrites an argument that starts with a slash into a Windows path: a test pattern names its page without the slash; A subagent's report comes back as text, never as a file it writes: brief it so, and save it yourself; A chart read by eye was half a size off and a scan's text layer could not be trusted: a figure in an image is read from the image, by measurement; Windows renders a PDF's pages where poppler is missing: WinRT's PdfDocument from PowerShell, and a scan's text layer keeps its digits but loses its blanks; A worker's saved copy is a copy only when its parser found the chart in it; A checker over cells costs by the page, not the row; A row named by one value is ambiguous where a chart's sizes restart: name it by two; A brand's cells come in a dozen notations: one parser reads them all, a number before a label; Charts are compared in the range people buy in: a chart's ends distort a delta; A page's own words decide what its length column is, and a size guide can hide in a product page's panel; Screenshots sent while a turn runs do not land as files.
- **Testing:** Astro's dev toolbar covers the page's foot under the test runner: switch it off there; Playwright scrolls a control into view before it clicks: a test of a page that must not move brings the control into view first; A browser test found a real handoff bug; A dev server reused by Playwright can serve stale modules; The dev server can serve a file caught between two writes; Playwright cannot check a visually hidden radio; A scrolling code block fails axe only where the font is wide; The browser pane's "type" inserts text; key handlers need key presses; A layout test tuned to one machine's font failed on CI's; A new island's classes can miss the dev server's CSS; A test that reads a duration's text fails against the build; getByRole's name matches part of a name; A browser test that counts registry data reads the count from core; Waiting on animations: a cancelled one has settled; Safari scrolls to the top as a list is swapped; The build writes 400ms as .4s; A color read right after a change catches the transition's first frame; The gallery's axe run outgrows the default timeout on CI; An animation read after a step can already be over; A test that passes on the build can fail on CI's dev server; A click on an island as it comes into view can land before it hydrates: wait for Astro's `ssr` mark to go; getByLabel finds a hidden field: a role query says whether the tree holds it; Playwright's `--project` takes its name with an equals sign when files follow; A phone emulation's window settles after the first layout: measure a page's end against the body, once the page is ready; A stuck heading's rect is not its place in the flow: scroll to the top before measuring where to scroll it; A measurement's DOM write is undone only by a render of the same prop: no element renders an exception to what the fit decided; A fit that only hides in order never gives back: decide each column with the ones before it hidden; WebKit lays a nested subgrid out wrong once a positioned child joins it: lay a flash over a row as a grid item.
- **Preact, Astro, hydration:** A honeypot is read from its field, not from state: a bot sets a value without events; Interactions that must work before hydration; React Aria cost 12 KB for two buttons; Typing before hydration is lost on a server-rendered island; Astro renders React components to static HTML when no client directive is given; Astro passes children to a React component as markup; preact/compat's useSyncExternalStore has no server snapshot; Preact runs effects after paint; Preact drops a camelCase attribute set to false; Preact never warns about hydration mismatches; Measure a framework switch on a branch before deciding it; A saved layout must not flash on a server-rendered island; The compiler lint and refs passed into a custom hook; An inline script can keep an attribute on an island's element; A memoized callback that reads only a ref's current loses its memoization; Text typed into a server-rendered field survives hydration, until the next render; A child's effect runs before its parent's; The compiler's lint stops a setState in an effect.
- **Focus, keys, ARIA:** A row that scrolls sideways clips the focus rings at its edges; jsx-a11y and virtual-focus listboxes; Text fields match :focus-visible on a mouse click; Chrome makes a scrolling list a Tab stop; jsx-a11y cannot see attributes passed through a spread; Hover follows a pointer that stays still while the list changes; Chromium reports the Mac platform as "macOS", lowercase m; Content shown on hover has three duties; A focus-within edge lingers on a ghost trigger; `outline-none` hides Tailwind v4 focus rings; Radios fire change on every arrow key; Astro's dev toolbar is a Tab stop in development; A `div` with `aria-label` needs a role; A keyboard widget must take focus when it opens; Scroll a list to its highlight only when the keyboard moved it; Tab leaving the page for the browser is correct; Move focus to another field after the commit renders; Moving focus into a long menu scrolls the page; A menu that closes on blur shuts before a pick lands; A radio group with nothing checked focuses the first without checking it; A cursor kept across a change it did not make lands on a stale row; Arrow keys through radios that apply would each be an undo step; A page-wide key must yield to what the key already did; A focus rule written against a wrapper breaks when the wrapper gains parts; The label lint cannot see a control passed through a prop; A panel that closes on blur closes when its focused control disables or leaves; A listbox holds options and groups, never a button; A popover's Escape on a toolbar control needs the capture phase; A shared edge puts an inset focus ring off centre; Moving an element drops the focus inside it; A shell that clips at rest cuts off its control's focus ring; A combobox can control two listboxes, with a button between them; A list in the page is the box's listbox: opening it never scrolls the page, replacing it brings the box back; A table swapped in the page clamps the scroll to the top where the browser does not anchor: keep the box in place across the swap; A click's focus is given, never assumed: WebKit's first run in the suite found Done unfocused after Edit; Chrome scrolls to a focused control's static place inside a sticky bar.
- **Touch:** A tab that hides its panel before showing the next lets WebKit clamp the scroll: keep the row in place; A tap target past its drawing is a mouse target too: give the margin to coarse pointers alone; A tap's click lands on what it uncovered; A phone's number pad: `inputmode`, read at focus; A phone zooms into a field whose text is under 16 px: text fields are 16 px, never a viewport lock.
- **Layout and fitting:** A track kept for an occasional panel reads as an uneven page: center the column, and let the pair re-center when the panel opens; A minimum height on a padded element counts the padding: a row's height goes on the row; A width rule that held by a shrink: bound a popup by its container, not by its trigger's luck; A popover keeps its DOM but takes the browser's styles: reset them, and place it inline; A tool folded away cannot be measured: keep the widths you read; Two children reporting into one parent value clobber each other; Rounded shells need overflow-hidden; Styling part of a field's value needs a text layer; Fit text by measuring, not by counting characters; "Cramped" was uneven insets, found by measuring; A header outside a scrolling list drifts by the scrollbar's width; Every header or toolbar addition gets a phone-width check; Taking a layer out of flow collapses its box; Fit moving text instead of clipping it; Group digits with a no-break space when text may wrap; Text set during measurement shows for a frame; Closed details are not laid out; buttons center their text; Size a control to the widest of its labels with a stacked grid; CSS cannot tell that a row wrapped: switch at a measured container size; A count that stood in for room broke in a wider box; A column spanning two rows stretches the first; A control that reads a stand-in for its value is right only some of the time; Line a column's parts up with the rows beside it: subgrid, and a row for the long side; A word and a number in another font share a baseline, not a centre; A subgrid's padding counts toward its parent's edge columns; A wrapper made a grid item needs `min-w-0` again; Decimal points line up in two columns, not with padding; A sticky bar with rounded corners shows what scrolls under it; A label beside a name squeezes it below its longest word; Auto side margins shrink a flex item to its content; A list held to the window scrolls itself, never the page; One reciprocal unit takes a category's size order away; Flex items wrap before they shrink: wrap a group, shrink inside it; A stuck header closed where it sticks throws the page past its section; WebKit draws a door hinged on the right half open through its own perspective(); A picker for a value in the box belongs in the box's popup, not the toolbar; Stacked sticky headers leave a hairline between them: tuck the lower one a pixel under; A grid track from a division lands on fractional pixels: round the track and the inset; A sentinel a pixel over a sticky edge still touches the window: put it 2 px over; Scrolling a part out from under a stuck one: measure, since nearest with a scroll margin lands short; A centered column steps aside for a classic scrollbar: keep its gutter; A reserved gutter takes the scrollbar's width from every window: size test windows by the content, and start the page column on a whole pixel; A static header lines up with an island's column through one page grid, handed down by subgrids; A page grid learns a panel is open through :has(), no script telling it; A panel beside a stuck head opened where the head was, and the browser's focus scroll decided the rest; A word sat high in its pill: the line box counts the font's ascent, the cap trim does not; A probe at one scroll offset is not a measurement: the suite found the offset; The head let go for 16 px targets; the targets grew, and the exception went; What passes under a stuck layer shows at its edges, and what leaves the flow pulls it down; A gap that was a tap target's room went with the target: a group declares its own; A rule reversed on one surface leaves its exception on the surfaces nobody looked at: grep the condition; A grid cell's first space is stripped: a no-break space keeps a fraction a space off its whole number.
- **Tokens, Tailwind, color:** A step several recipes share is one token: a theme spacing key over a variable set per screen class; Native popups cannot join the design language; An inset ring is painted under the children; a border is not; A hover token equal to its surface hides every hover; Unlayered theme tokens beat a layered reduced-motion override; A control's edge and a divider need different colors; Merging recipes can undo a fix; Dim text with the muted ink, never with opacity; A see-through color is a mix, worked out once in the bridge; Twice a box's width is a fraction: `w-2/1`; Tailwind v4 leaves a button on the browser's arrow: the hand is one base rule, never a class here and there; Disabled read three ways: a state's look is the system's, not a component's choice; A hover by opacity let a label's contrast fall under the pair its theme passes: a derived color toward the ink holds it; A theme's corner token on a 16 px box made a circle: a mark's corner scales to its own side.
- **Motion:** A background tab pauses requestAnimationFrame; An animation that reveals rests revealed; A view transition takes no clicks; A glide on a decelerating curve reads as a jump; A reach past a tile is a whole layer transformed: the slivers were pieces moved out; A change of overflow re-rasterizes a picture's edges, a change of z-index does not; A glide's leavers go first and its arrivals last; Fast frames stay under the flash threshold by area; A filter is drawn before the clip-path; What paints past a phone's edge lets iOS pan the page sideways: bleed and clip the block; A tile's change bled, seamed, and snapped: clip it always, put its pieces on device pixels, hide what stands edge-on.
- **Engine, input, values:** Reference sites use Copyscape; Floating-point realities in the engine tests; Aliases outrank prefixes, by design; Undo chunks need a clock, and the reducer should own it; A number too large to hold is still a number; Text the user typed is re-read with the separators it was typed with; Arithmetic and unit names share characters; One undo history for everything the user does in the converter; A half-typed number parses as a unit query; A symbol made only of a mark folds to nothing; Snap a scaled value before rounding it up or down; A copied number pastes as a number: a plain hyphen, and buttons unseen but there; Intl writes numbers a parser of ASCII cannot read back; An alias in a new category can take a symbol from an old one; A figure weighed from many sources needs its rule written before its figures; A grammar with two readings of one mark reads neither: a mark opens only the pair it starts, and a reading that leans on a context spelling needs every part named; A unit's kind is not its meaning: the change section keyed on affine and would have offered a shoe size warmer or cooler; An apostrophe folds away only inside a word: a lone mark is the foot's key.
- **Settings and state:** Export settings from their own keys; Remember what was changed, not every setting; A saved choice from a list drops what the list gains later; One idea, one name, in code, docs, and on screen; A rule enforced in one builder drifts as builders are added: set hidden units apart in one function every list runs.

---

## 2026-10-06 — Fresh Windows machine has git but nothing else

**What happened.** First environment check found git 2.55 but no Node, npm, pnpm, or GitHub CLI, and no git identity configured.
**Rule.** Record the tooling check in the plan's setup checklist. After `winget` installs, restart the terminal and the desktop app's shell so PATH updates take effect.

## 2026-10-06 — Reference sites use Copyscape

**What happened.** Both inspiration sites carry Copyscape "do not copy" badges.
**Rule.** Treat them as coverage research only. Verify factors against NIST and BIPM, not against the sites. Never copy text, code, markup, or unit descriptions. Recorded as ADR 0004.
**Superseded** (2026-10-15): the sites are references used freely, and every factor is still checked against the standards on our own (ADR 0020).

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
**Since then.** The theme control is native radios in a fluid shell, not a select ("Native popups cannot join the design language"), and the island runs on Preact (ADR 0007); the rule stands.
**Promoted** to docs/ARCHITECTURE.md, "Islands and the inline script".

## 2026-10-06 — Claude desktop preview launcher on Windows

**What happened.** `.claude/launch.json` with backslash paths failed ("C:rogram Files"); the launcher re-escapes backslashes. pnpm's global shim is a native `pnpm.exe`, and the app's shell does not have Node on PATH.
**Rule.** In `.claude/launch.json` (gitignored, machine-specific) use forward slashes and run pnpm through Node explicitly: `C:/Program Files/nodejs/node.exe` with `C:/Users/<you>/AppData/Roaming/npm/node_modules/pnpm/bin/pnpm.mjs dev --host 127.0.0.1 --port 4321`. Screenshots time out while the app window is hidden; verify with page text instead.

## 2026-10-06 — Backslash escapes in files written through tool calls

**What happened.** A regex written through the Write tool with `\u00A0` landed as a raw non-breaking space, which ESLint rejected as irregular whitespace. A controlled test showed the Write and Edit tools decode `\uXXXX` into the character but leave every other backslash sequence (`\\`, `\d`, `\t`) exactly as written, so a literal `\uXXXX` cannot be produced through them at all. The Bash tool decodes JSON-style escapes instead: `\\` arrives as a single backslash, so `\\u00A0` in a command lands as the six-character `\u00A0`.
**Rule.** Keep source files free of `\u` escapes. Name each special character once with `String.fromCharCode(0x00a0)` and build regexes from constants, using `[0-9]` rather than `\d`. In Bash commands, double every backslash that must survive. When ESLint reports irregular whitespace, a raw character got in; replace it with a constant.
**Promoted** to docs/ARCHITECTURE.md, "Conventions".

## 2026-10-06 — Floating-point realities in the engine tests

**What happened.** Round-tripping 0.000001 °C through kelvin came back with a relative error of 2.5e-9 because adding and subtracting 273.15 loses the tiny value's low bits. Separately, asking Intl for 21 significant digits of 1/3 returned 16: a double has no more to give.
**Rule.** Judge tiny values on absolute error: the round-trip test uses `max(|expected|, 1)` as its scale. Treat 10 significant digits as the display ceiling and never promise more precision than a double holds. Golden rows that quote a published 7-digit figure carry `tolerance: PUBLISHED_7_DIGITS` so the strict default stays strict everywhere else.
**Promoted** to docs/TESTING.md, "Golden tests".

## 2026-10-06 — Aliases outrank prefixes, by design

**What happened.** "kilo" ranked kilogram above kilometer. It is a registered alias (people say "5 kilos"), so it is an exact match (class 2) while kilometer only matches by prefix (class 3).
**Rule.** Add an alias only when people really type it to mean that unit, because an alias wins over every prefix match in other categories. Keep the ambiguous ones (`oz` on fluid ounce) deliberate: they stop auto-lock and surface the choice, which docs/UX-SPEC.md §5 wants.
**Superseded in part (2026-10-06).** Nothing auto-locks any more: only Enter or a pick commits. An ambiguous alias now lists both units with their categories so the choice is visible before Enter. The alias rule stands.
**Promoted** to docs/UNITS-CATALOG.md, "§5 Aliases and disambiguation".

## 2026-10-06 — React Aria cost 12 KB for two buttons

**What happened.** The first milestone 2 build measured 91.4 KB gzipped against the 90 KB budget. React Aria's press, hover, and focus machinery was bundled for a Button and a chip's remove control. Native `<button>` elements with Tailwind `hover:` and `active:` variants brought the page to 79.1 KB.
**Rule.** Measure before adopting a component library and again after each milestone (`pnpm bundle`). Native elements first; a library only for a measured need, recorded in an ADR (0006).

## 2026-10-06 — Typing before hydration is lost on a server-rendered island

**What happened.** Browser tests typed into the converter before React attached; the controlled inputs reset to empty when hydration finished. The island now marks itself with `data-hydrated` through a `useSyncExternalStore` hook, and tests wait for it.
**Rule.** Any island that takes typed input needs a ready mark for tests, and an inline listener that captures early keystrokes for users (built 2026-10-08, docs/UX-SPEC.md §13). `useSyncExternalStore` with a server snapshot of `false` is the effect-free way to know you are on the client.
**Since then.** On Preact, compat's `useSyncExternalStore` ignores the server snapshot, so `useIsHydrated` is a store that turns true when first subscribed (ADR 0007, and "preact/compat's useSyncExternalStore has no server snapshot" below).

## 2026-10-06 — A browser test found a real handoff bug

**What happened.** Typing a bare unit letter into the second box made it the source, which blanked the number in the first box. Unit tests had not covered "type a unit into the derived box". The browser test for switching categories did.
**Rule.** Only a number transfers the source between boxes (docs/UX-SPEC.md §14). Keep at least one browser test per user flow in the spec; the reducer tests cover rules, the browser tests cover sequences people actually perform.
**Since then.** Two boxes and the source rule retired with ADR 0013; the testing rule stands.
**Promoted** to docs/TESTING.md, "End to end".

## 2026-10-06 — jsx-a11y and virtual-focus listboxes

**What happened.** `jsx-a11y/click-events-have-key-events` flagged the option rows, which have click handlers but no key handlers because the combobox input handles keys through `aria-activedescendant`.
**Rule.** That is the correct pattern; disable the rule on that element only, with the reason in the comment, and let the axe suite verify the result.
**Promoted** to docs/DESIGN-SYSTEM.md, "Component rules".

## 2026-10-06 — A dev server reused by Playwright can serve stale modules

**What happened.** After rewriting several components in quick succession, every converter browser test timed out on the island's ready mark while lint, types, and unit tests passed. The console showed Vite serving a transform captured mid-write ("does not provide an export named 'UnitChip'") and React keeping the old hook state when the reducer's shape changed under hot reload.
**Rule.** When browser tests fail wholesale right after a batch of rewrites, read the browser console before touching code. Restart the dev server (or touch the rewritten files) and rerun; Playwright reuses whatever is on port 4321 locally. A reducer whose state shape changes needs a full reload, not a hot one.
**Promoted** to docs/TESTING.md, "End to end".
**See also** "The dev server can serve a file caught between two writes" and "A new island's classes can miss the dev server's CSS".

## 2026-10-06 — Native popups cannot join the design language

**What happened.** The theme control was a styled `<select>`, but its open list is drawn by the OS: square corners, system colors, nothing a token can reach. It read as a foreign object next to the converter's fluid lists.
**Rule.** When an opening control must match the design, keep the native semantics but move them inside a fluid shell: `ThemePicker` is a `fieldset` of radios in the same placeholder-plus-absolute-shell pattern as the smart input, driven by the pre-paint script so it works before any bundle. Reserve raw native popups for cases where the OS picker is the better experience, such as dates on phones.
**Promoted** to docs/DESIGN-SYSTEM.md, "Fluid shells".

## 2026-10-06 — Two children reporting into one parent value clobber each other

**What happened.** Both smart inputs told the converter which category they were browsing through one `onBrowse(category)` callback. When one box's scope changed while it was closed, its effect reported `null` after the other box had reported its category, and the global label blanked. A browser test caught it; the reducer tests could not.
**Rule.** When several children report state to a parent, key the report by child (`onBrowse(boxId, value)`) and derive the combined value in the parent. Never let a child's "nothing" overwrite a sibling's "something".
**Superseded in part (2026-10-06).** `onBrowse` is gone, and so, later, the Back row and two boxes (ADR 0013). The general rule stands.

## 2026-10-06 — Rounded shells need overflow-hidden

**What happened.** The last row's hover highlight in the theme menu and in the suggestion lists drew square corners outside the shell's rounded border.
**Rule.** A shell with `rounded-*` that contains full-width rows gets `overflow-hidden`. It clips descendants only; the shell's own focus outline still shows.
**Promoted** to docs/DESIGN-SYSTEM.md, "Fluid shells".

## 2026-10-06 — Text fields match :focus-visible on a mouse click

**What happened.** The smart input showed an accent border plus an outer focus ring, which read as a double border. The usual fix, showing the ring only for keyboard focus with `:focus-visible`, does not work for fields: browsers treat any focus on an element that takes typing as keyboard focus.
**Rule.** A field's focus indicator is one accent edge of two pixels (border plus inset ring), no outer outline, and the accent must pass 3:1 against the surface (it is in the theme contract). Keep `focus-visible` rings for buttons and chips, where the heuristic works.
**Superseded in part (2026-10-06).** The two-pixel edge is now a real `border-2`, not a border plus an inset ring (next entry). The rest stands.
**Promoted** to docs/DESIGN-SYSTEM.md, "Focus".

## 2026-10-06 — An inset ring is painted under the children; a border is not

**What happened.** The shell's two-pixel edge was a one-pixel border plus a one-pixel inset ring (an inset box-shadow). Row highlights and the scrollbar painted over the ring's pixel, so the edge looked thinner wherever a row was highlighted, and the scrollbar's arrows clipped into it.
**Rule.** An edge that nothing inside may cover is a real border (`border-2`), colored for state. Inset shadows and rings are decoration under the content, never a boundary. Give rows their own corners inside a gutter so a highlight reads as "inside" rather than "flush".
**Promoted** to docs/DESIGN-SYSTEM.md, "Edges and borders".

## 2026-10-06 — Styling part of a field's value needs a text layer

**What happened.** A bold exponent marker inside `1.5E21` cannot be done in an `<input>`: its value is one run of text. The field now has transparent text (`text-transparent`, with `caret-ink` so the caret stays visible) and an `aria-hidden` layer draws the same text over it with the marker in `font-semibold`. Selection uses `selection:bg-accent-soft` so the highlight shows through under the layer's glyphs. Measured in the browser, the layer and the field agree to the pixel on font, line box, and text width.
**Rule.** Keep the real `<input>` for everything behavioral (caret, selection, IME, mobile keyboards, the accessibility tree) and use the layer for typography only. The layer must match the field's font, size, padding, and line box exactly, follow its horizontal scroll (`onScroll` mirrors `scrollLeft`), and stay `pointer-events-none`. A bold glyph is a touch wider than the regular one, so after the marker the caret can sit a pixel off; acceptable for one character, not for whole words.
**Promoted** to docs/DESIGN-SYSTEM.md, "Fields".

## 2026-10-06 — Fit text by measuring, not by counting characters

**What happened.** The number's size stepped down by character count (nine, then six for the chip), which is right on one width and wrong on every other. `useFitStep` now tries each size on the text layer inside a layout effect (`scrollWidth <= clientWidth`), commits the first that fits, and re-measures on resize through a `ResizeObserver`. Writing the class directly and then rendering the identical string through React keeps the DOM and the tree in agreement with no flash.
**Rule.** Measure the real element when a decision depends on layout. Do it in `useLayoutEffect` so the user never sees the wrong size, and make the measured write and the rendered value the same string so React never fights the measurement.
**Promoted** to docs/DESIGN-SYSTEM.md, "Type that steps to fit".

## 2026-10-06 — Undo chunks need a clock, and the reducer should own it

**What happened.** "Escape clears one burst of typing at a time" and "undo steps through the same bursts" needed one definition of a burst. Giving the `input` action a timestamp (`performance.now()`) lets the pure reducer decide: same box, under 700 ms since the previous keystroke, and not a space, means the same chunk. Tests pass explicit times, so nothing fakes timers.
**Rule.** When behavior depends on timing, put the time in the action and the rule in the reducer; the component only reports when things happened. Per-box checkpoints (the text a chunk started from) make Escape a forward, undoable action instead of a selective undo, which keeps the history linear.
**Promoted** to docs/ARCHITECTURE.md, "State and URLs".

## 2026-10-06 — A hover token equal to its surface hides every hover

**What happened.** Daylight set `--surface-raised` to the same white as `--surface`, so every hover in the default theme was invisible, and the "highlight inside the edge" fix could not even be seen there. It is now a faint warm gray.
**Rule.** Every theme gives `--surface-raised` a value visibly different from `--surface`. A contract test for a minimum difference is a candidate; today the gallery catches it.
**Promoted** to docs/DESIGN-SYSTEM.md, "Semantic tokens".

## 2026-10-06 — "Cramped" was uneven insets, found by measuring

**What happened.** Sean felt the field was cramped and slightly misaligned but could not say why. Measuring the boxes in the browser showed the 44 px chip and copy button sat 4 px from the top and bottom of a 52 px row but 12 px from the right edge, and the swap button had a 1 px edge beside 2 px fields. A 64 px field gives the chip and button the same 8 px on three sides, and corners that nest (`rounded-nested`, the field's radius minus border and inset) stop the inner curves looking swollen.
**Rule.** When something "looks off", measure before restyling: read `getBoundingClientRect` for every edge and compare the insets. Keep an inner element's inset equal on the sides it shares with its container, give nested corners the outer radius minus the inset, and give every bordered control the same edge weight.

## 2026-10-06 — A header outside a scrolling list drifts by the scrollbar's width

**What happened.** The category name on the list's Back row sat 10 px right of the symbol column below it, because the list's scrollbar narrowed the rows but not the header above the scroll container. Moving the Back row inside the list, as its first option pinned with `sticky top-0`, made both share one content box, and it also made the arrow keys able to reach it: `aria-activedescendant` must point inside the listbox the combobox controls, so a Back button outside the list could never be the active row.
**Rule.** Anything that must align with scrolling rows lives inside the same scroll container. Use `scroll-padding-top` on the list so a row scrolled into view is not hidden under the pinned one.
**Since then.** The list and its Back row are gone (ADR 0012); the rule stands for any pinned row.

## 2026-10-06 — Chrome makes a scrolling list a Tab stop

**What happened.** Tab from the first box landed on the open suggestion list instead of the second box. Recent Chrome makes any scroll container without focusable children keyboard-focusable, and the listbox qualifies, since its options are virtually focused. Focus stayed inside the shell, so the list did not even close.
**Rule.** A listbox driven by `aria-activedescendant` gets `tabIndex={-1}`: the combobox's arrow keys scroll it, and Tab should leave the widget.
**Promoted** to docs/DESIGN-SYSTEM.md, "Focus".

## 2026-10-06 — The dev server can serve a file caught between two writes

**What happened.** A component was rewritten with a block that used a new constant, and the constant was added by a second command a moment later. Vite transformed the file between the two writes and kept serving that version: "backRow is not defined" crashed the island in the browser pane and in the next Playwright run, although the file on disk was correct and every static check passed.
**Rule.** Make each file change in one write. If a page or the browser suite fails in a way the source cannot explain, read the browser console, then restart the dev server before touching code (see the earlier entry on stale modules).

## 2026-10-06 — jsx-a11y cannot see attributes passed through a spread

**What happened.** Building each list row from a shared props object (`{...common}`) made ESLint report the row's `click-events-have-key-events` exception as unused: the linter no longer saw `role` or `onClick`, so it was checking nothing.
**Rule.** Write ARIA roles, handlers, and `aria-*` attributes out on the element so jsx-a11y can check them. Vary values, not the attribute list.
**Promoted** to docs/DESIGN-SYSTEM.md, "Component rules".

## 2026-10-06 — A number too large to hold is still a number

**What happened.** `1e400` parsed to "no number", so typing it did not make the box the source and the other box fell back to its "0" placeholder, which read as a result of zero. Separately, a nonzero result can underflow to exactly 0 (`1e-320 mm` in kilometers).
**Rule.** The parser distinguishes "not a number" from "a number a double cannot hold" (`outOfRange: 'large' | 'small'`), the source rule keys on the number's text, and the view treats a zero from a nonzero input as "too small". A value that cannot be shown says so in place of the value; it never shows 0.
**Promoted** to docs/UX-SPEC.md, "§2 Parsing".

## 2026-10-06 — Hover follows a pointer that stays still while the list changes

**What happened.** A browser test clicked a category row, then pressed arrow keys, and the highlight was not where the keys should have put it. The pointer stayed over the list, the new rows rendered under it, and hovering moved the highlight. It failed on desktop and passed on mobile, where taps leave no pointer.
**Rule.** In tests that check keyboard highlight, reach the state with the keyboard, or move the pointer off the list first. Hover moving the highlight is correct behavior, not a bug.
**Superseded in part (2026-10-06).** Rows now take the highlight on `mousemove`, not `mouseenter`, the way mature combobox libraries do it: a row rendered under a still pointer no longer steals the highlight. It had to change so that a click on Back can land on the category it came from. Real pointer movement still highlights.
**Promoted** to docs/TESTING.md, "End to end".

## 2026-10-06 — Chromium reports the Mac platform as "macOS", lowercase m

**What happened.** The shortcuts map swaps Ctrl for ⌘ on Apple devices by testing the platform name against `/Mac|iPhone|iPad|iPod/`. A browser test that simulates a Mac failed: Chromium's `navigator.userAgentData.platform` is "macOS", which a case-sensitive `Mac` never matches, so every Chrome and Edge user on a Mac would have seen Ctrl. Safari, which has no `userAgentData`, reports "MacIntel" through `navigator.platform`.
**Rule.** Match platform names case-insensitively, and keep the pattern in one module (`src/lib/platform.ts`) that the inline script receives through `define:vars` with its flags. Keep a browser test that fakes the other platform with `page.addInitScript`, since the machine running the tests only ever exercises its own.
**Promoted** to docs/ARCHITECTURE.md, "src/lib".

## 2026-10-06 — Content shown on hover has three duties

**What happened.** Sean wanted the shortcuts map to appear on hover. WCAG 1.4.13 asks that content shown on hover or focus can be dismissed without moving the pointer, can be hovered itself without disappearing, and stays until the user leaves or dismisses it. A tooltip-style "show while hovered" fails the first two, and hover alone leaves keyboard and touch users out.
**Rule.** Hover opens a peek after a short pause and closes it shortly after the pointer leaves the whole shell (trigger and panel are one element, so moving onto the panel keeps it). A click pins it, Escape always closes it, and touch never peeks because a tap is a click. Delegate with `pointerover` and `pointerout` and compare `relatedTarget`, because `pointerenter` does not bubble and the inline script runs before the elements exist.
**Retired** 2026-10-15: the shortcuts map opens on a click only (Sean), so nothing on the page shows content on hover now. The rule stands for any hover content added later.

## 2026-10-06 — A focus-within edge lingers on a ghost trigger

**What happened.** The shortcuts shell showed its accent edge whenever anything inside had focus. After a click closed the panel, focus stayed on the icon, so a green square remained around it with nothing open, and closing by hover faded the edge out after the panel had vanished.
**Rule.** A trigger that is borderless at rest uses the button's own `focus-visible` ring, which a mouse click does not trigger, and its open edge comes and goes with `[data-open]` without a transition, so the edge and the panel always change together. Keep `focus-within` edges for controls that are bordered at rest, such as fields and the theme menu.
**Came back (2026-10-06).** The hygiene pass merged the shells into one recipe (then `src/lib/shell.ts`, now `recipes.ts`) and put the fields' edge transition in the shared part, so the shortcuts map faded its green edge again. The transition now lives in the box's own resting style only (`FIELD_SHELL`), and a browser test fails if the ghost edge can animate. See "Merging recipes can undo a fix" below.
**Promoted** to docs/DESIGN-SYSTEM.md, "Fluid shells".

## 2026-10-06 — Astro renders React components to static HTML when no client directive is given

**What happened.** The shortcuts map is an Astro component without a bundle, but its keyboard icon lives with the other icons in `icons.tsx`, a React file. Used in an Astro file without `client:*`, a React component renders once at build time to plain markup and ships no JavaScript.
**Rule.** Keep one icon set in React and use it from Astro files directly. Add a `client:` directive only when the component needs to run in the browser.
**Promoted** to docs/DESIGN-SYSTEM.md, "Inventory".

## 2026-10-06 — `outline-none` hides Tailwind v4 focus rings

**What happened.** Swap, clear all, undo, redo, copy, and the shortcuts icon showed no focus ring. Their classes paired `outline-none` with `focus-visible:outline-2`; in Tailwind v4 `outline-none` sets `--tw-outline-style: none`, and the focus variant's outline reads that variable, so the ring never drew. A keyboard walk test found it.
**Rule.** One focus policy: the base layer gives every `:focus-visible` element the ring, and components add no outline classes. Only a field whose shell shows focus with its edge removes the input's own outline. The browser test "every Tab stop shows a visible focus indicator" guards it.
**Promoted** to docs/DESIGN-SYSTEM.md, "Focus".

## 2026-10-06 — Unlayered theme tokens beat a layered reduced-motion override

**What happened.** The reduced-motion rule zeroed the motion tokens inside `@layer base`, but the theme files set their tokens outside any layer, and unlayered styles beat every layer whatever the specificity. Theme transitions kept their durations.
**Rule.** A rule that overrides theme tokens is unlayered and comes after the theme imports. A browser test reads `--motion-fast` under reduced motion in every theme.
**Promoted** to docs/DESIGN-SYSTEM.md, "Motion".

## 2026-10-06 — Astro passes children to a React component as markup

**What happened.** `<Keycap>Mod</Keycap>` in an Astro file never became the Ctrl or ⌘ label. Astro hands a React component its children as rendered HTML in a slot, not as the string "Mod", so the component's comparison failed.
**Rule.** Anything a React component branches on is a prop (`<Keycap label="Mod" />`). Children are for content rendered as is.
**Promoted** to docs/DESIGN-SYSTEM.md, "Component rules".

## 2026-10-06 — Radios fire change on every arrow key

**What happened.** The theme menu closed after one arrow key. Arrows move the checked radio, which fires `change`, and the handler treated every change as a pick.
**Rule.** In a menu of radios, `change` applies the option (a live preview). Closing waits for Enter, or for a change that came from a pointer, which leaves the radio without `:focus-visible`.
**Promoted** to docs/THEMING.md, "Mechanism".

## 2026-10-06 — Astro's dev toolbar is a Tab stop in development

**What happened.** The keyboard walk test failed on the dev server: after the page's own stops, Tab entered `astro-dev-toolbar`, whose buttons are not ours. The walk also read a shell's edge mid-transition.
**Rule.** Focus walks skip anything inside `astro-dev-toolbar`, which the built site does not have, and wait for transitions to finish (`settled` in `e2e/support.ts`) before reading an indicator.
**Promoted** to docs/TESTING.md, "End to end".

## 2026-10-06 — A `div` with `aria-label` needs a role

**What happened.** axe flagged the gallery's row of icon buttons: `aria-label` on a plain `div` is not allowed, because a generic element cannot carry a name.
**Rule.** A labelled container gets a role that takes a name (`role="group"`), or a visible heading instead of the label.
**Promoted** to docs/DESIGN-SYSTEM.md, "Component rules".

## 2026-10-06 — Text the user typed is re-read with the separators it was typed with

**What happened.** In German, "1.000" (one thousand) went into the link as `v=1`: the URL writer parsed the text with the default separators, where "1.000" is one.
**Rule.** Every call that parses typed text passes the user's separators. Web functions that do it take them as a required argument (`stateToParams(state, separators)`), so a caller cannot fall back to the defaults by forgetting. A browser test loads the page in `de-DE`.
**Promoted** to docs/ARCHITECTURE.md, "Conventions".

## 2026-10-06 — A lint rule can guard class strings without a plugin

**What happened.** The token guard had to read class lists in React and Astro files. ESLint's built-in `no-restricted-syntax` matches string literals and template parts by regex (`Literal[value=/…/]`), and the Astro parser presents `class` and `class:list` strings as the same nodes, so one rule covers both without a Tailwind plugin or a new dependency.
**Rule.** Write guard patterns without "/" (a selector's regex ends at the first slash). Before trusting a new pattern, lint a scratch file of deliberate violations and of allowed look-alikes, then delete it.
**Promoted** to docs/DESIGN-SYSTEM.md, "Token guard".

## 2026-10-06 — A control's edge and a divider need different colors

**What happened.** One `--line` token served both the fields' borders and the dividers. Tuned for dividers, it sat near 1.5:1 against the page, so a field's edge failed WCAG 1.4.11 (3:1 for what identifies a control) in every theme. Darkening `--line` would have made every divider heavy too.
**Rule.** Keep two tokens: `--edge` for what identifies a control, at 3:1 or more against the page and the surface (in the theme test), and `--line` for grouping, free to stay quiet. Derive a theme's edge from its line, moved toward its ink, so it keeps the theme's tint.
**Promoted** to docs/DESIGN-SYSTEM.md, "Edges and borders".

## 2026-10-06 — An action's major tag can lag its newest release

**What happened.** CI warned that checkout, setup-node, and pnpm/action-setup v4 target Node 20. That is each action's own runtime (`runs.using` in its `action.yml`), separate from the Node 24 our code runs on. The current majors (checkout 7, setup-node 7, upload-artifact 7, pnpm/action-setup 6) run on Node 24 with our inputs unchanged. But pnpm/action-setup's `v6` tag still points at 6.0.10, and pnpm 12 support only arrived in 6.1.0 (pnpm/action-setup#289, open).
**Rule.** Before bumping an action, resolve its major tag to a release (`gh api repos/<owner>/<repo>/git/refs/tags/v6`) and read the notes up to the newest. When the tag lags, pin the exact release with the reason in the workflow (6.1.0 is an immutable release, so that tag cannot move), and go back to the major tag at a milestone review once it catches up. Weigh `pnpm/setup` then too: the successor for pnpm 11 and later, it also installs Node, so it would replace two steps.

## 2026-10-06 — CI runs on a named Ubuntu image

**What happened.** `ubuntu-latest` moves from Ubuntu 24.04 to 26.04 between October 19 and November 19, 2026 (actions/runner-images#14748), so during the rollout one commit could run on either image. Playwright supports 26.04 from 1.61, including the system packages `--with-deps` installs; the lockfile has 1.63.
**Rule.** Both jobs name their image (`ubuntu-26.04`), so the OS changes in a commit we can test and revert. Before moving to a new image, check that the locked Playwright lists it as supported (its release notes, or `hostPlatform.ts` in its source), and include the workflow's action tags and image in the milestone pin review (ADR 0005).
**Promoted** to docs/TESTING.md, "CI".

## 2026-10-06 — Playwright cannot check a visually hidden radio

**What happened.** A test called `check()` on a radio styled `sr-only` inside a segmented control, and it timed out: Playwright waits for the element to be visible and stable before it clicks, and a one-pixel clipped input never is.
**Rule.** Reach a visually hidden input the way a person does, by clicking its visible label (`locator('label').filter({ hasText })`). Assert its state with `toBeChecked()`, which needs no visibility.
**Since then.** The calculator's segmented control went with two boxes; a segmented control came back for Settings (`SegmentedControl`), its radios hidden the same way, as the theme menu's are; `pickTheme` and `setSettings` in `e2e/support.ts` click their labels.
**Promoted** to docs/TESTING.md, "End to end".

## 2026-10-06 — Every header or toolbar addition gets a phone-width check

**What happened.** The copy-link button and the wider spacing beside it pushed the header past 343 px of a 375 px phone, so the header wrapped onto two lines; the calculator button squeezed the hint beside the toolbar to five lines. Desktop screenshots showed neither.
**Rule.** After adding anything to a row that shares space, measure it at 360 px wide, the narrowest common phone, before calling it done. Prefer giving way at small sizes (a word that becomes screen-reader-only, a row that stacks) over shrinking targets.
**Promoted** to docs/DESIGN-SYSTEM.md, "Component rules".

## 2026-10-06 — Arithmetic and unit names share characters

**What happened.** Reading arithmetic in the boxes risked turning `5 km/h` into 5 km divided by h, and `5 -ft` into a subtraction. Symbols like `/` and `-` belong to both grammars.
**Rule.** An operator joins the arithmetic only when another number, a sign, or `(` follows it, or when it ends the text (the user is still typing); anything else ends the arithmetic and starts the unit query. Every new operator gets a test beside a unit that uses the same character.
**Promoted** to docs/TESTING.md, "Parser".

## 2026-10-06 — Merging recipes can undo a fix

**What happened.** Three shells were merged into one class recipe to stop them drifting apart. The shared part took the fields' `transition-[border-color,box-shadow]`, which the shortcuts map had dropped on purpose to fix a lingering green edge, and the bug came back unnoticed until Sean saw it.
**Rule.** A shared recipe holds only what every variant does the same way; anything a variant does differently, motion included, stays in the variant. When merging, compare each instance's computed style before and after, and turn the fix being preserved into a test (here, "the ghost edge cannot animate").
**Promoted** to docs/DESIGN-SYSTEM.md, "Recipes".

## 2026-10-06 — A keyboard widget must take focus when it opens

**What happened.** The first calculator opened under its toolbar icon and left focus on the icon. Typed digits went nowhere, and Enter pressed the icon again, which closed the calculator: it looked as if Enter closed it.
**Rule.** A panel that owns keys moves focus into itself when it opens, onto the control Enter should press, and returns it to its trigger when it closes. Keys it handles respond only while focus is inside (WCAG 2.1.4), and a click on any of its keys brings focus back if it had left.
**Promoted** to docs/DESIGN-SYSTEM.md, "Component rules".

## 2026-10-06 — String.replace reads `$` patterns in the replacement text

**What happened.** An edit script used `text.replace(old, newText)` where `newText` held the regex `'[eE][+−-]$'`. JavaScript reads `$'` in a replacement string as "the rest of the original text", so the second half of the file was pasted in again.
**Rule.** In scripts that edit files, pass a function as the replacement (`text.replace(old, () => newText)`) or use `split(old).join(newText)`, which take the text literally. The repository's edit helper already does.

## 2026-10-06 — One undo history for everything the user does in the converter

**What happened.** The calculator first kept its own entry in component state. Undo after sending its number then had two candidates, the send in the converter's history and the last key in the calculator's, and either choice surprised in some order of events.
**Rule.** Anything the user edits in the converter lives in the reducer's state and in its one history, chunked by the same typing rules; panels are views of that state. Undo then means the last thing done, wherever it was done.
**Since then.** Settings (ADR 0018) stay out of the history; the rule holds for the conversion and the calculator.
**Promoted** to docs/ARCHITECTURE.md, "State and URLs".

## 2026-10-06 — Vite wraps every dynamic import in a preload helper

**What happened.** The header animation was loaded on first hover with `import()`. Vite wrapped it in its preload helper, about 0.8 KB gzipped, even with nothing to preload, and Astro's build ignores `build.modulePreload: false`. The lazy route cost more than it saved. The budget script also missed the lazy chunk at first, because Vite writes dynamic imports in backticks and the script only followed `"` and `'`.
**Rule.** For a few kilobytes, load with the page and run nothing until needed; reach for `import()` only when what it defers is far larger than the helper. The budget script follows imports in any quotes; when a build adds a chunk, check it appears in `pnpm bundle`.
**Promoted** to docs/ARCHITECTURE.md, "Build and runtime".

## 2026-10-06 — A build fails when a shell sits inside its output folder

**What happened.** `pnpm build` twice produced no `dist/index.html` after a command had left the shell's working directory inside `apps/web/dist/_astro`. Windows will not delete a folder that is a process's working directory, so the build could not clear its output.
**Rule.** Inspect build output with paths from the repository root (`ls apps/web/dist/_astro`), not by changing into it.

## 2026-10-06 — Taking a layer out of flow collapses its box

**What happened.** The wordmark's live line became `absolute` when it started to play, so the box that held it lost its height and the header jumped. A browser test that clicked the heading timed out waiting for it to stop moving.
**Rule.** Before floating a layer, fix its box at the size it had, width and height both, and release the size when the layer returns to flow.
**Promoted** to docs/DESIGN-SYSTEM.md, "Motion".

## 2026-10-06 — preact/compat's useSyncExternalStore has no server snapshot

**What happened.** On Preact, `useIsHydrated` read the browser value on the server and while hydrating, because compat's `useSyncExternalStore` ignores the third argument. The server HTML already carried the ready mark, and `useSlot` touched `document` during the server render.
**Rule.** For "has this island hydrated", use a store per component that turns true when first subscribed (subscription happens after the first commit, never on the server). Anything browser-only in render waits for `useIsHydrated()`. (ADR 0007)
**Promoted** to docs/decisions/0007-preact-compat.md, "Consequences".

## 2026-10-06 — Preact runs effects after paint

**What happened.** On Preact the calculator lost keys: typing `12*3` showed `1×3`, and keys typed right after the click that opened it went to the toggle. React flushes effects at once after a click or key press; Preact runs them a frame later, so for a frame the key listener held the previous entry and focus had not moved in.
**Rule.** Work that must be done before the next key (moving focus in, binding a listener that closes over the latest state) runs in `useLayoutEffect`. Plain effects are for work that can wait a frame.
**Promoted** to docs/decisions/0007-preact-compat.md, "Consequences".

## 2026-10-06 — Preact drops a camelCase attribute set to false

**What happened.** `spellCheck={false}` rendered nothing under Preact, on the server and in the browser, so the field could underline unit names. Preact sets a prop as a DOM property when the element has one by that name, and otherwise as an attribute, which `false` removes; `spellCheck` is not a property, `spellcheck` is.
**Rule.** Write boolean attributes by their DOM property name (`spellcheck`, `autofocus`) when the value can be `false`. compat also types `event.target` as a plain `EventTarget`: an element's own events read `event.currentTarget`.
**Promoted** to docs/decisions/0007-preact-compat.md, "Consequences".

## 2026-10-06 — Preact never warns about hydration mismatches

**What happened.** React logs a mismatch between the server HTML and the first client render; Preact only attaches handlers to the server's DOM and stays silent, so a mismatch would persist unseen.
**Rule.** Keep the first client render identical to the server's: no browser-only values (storage, `matchMedia`, `navigator`) in render until `useIsHydrated()` is true, or read them in an effect.
**Promoted** to docs/decisions/0007-preact-compat.md, "Consequences".

## 2026-10-06 — pnpm's release-age policy holds back a package published today

**What happened.** `@astrojs/preact` 6.0.6 came out the day of the switch; installing it made pnpm add a release-age exception to `pnpm-workspace.yaml`.
**Rule.** Take the newest release old enough to pass the policy (6.0.5 here) rather than adding an exception, unless the newer one fixes something we need.

## 2026-10-06 — Measure a framework switch on a branch before deciding it

**What happened.** The case for Preact had been an estimate ("about 30 KB back"). A spike in a separate worktree measured 55.3 KB back, a faster time to interactive, and the four compat differences above, with the full suite green, before the owner chose.
**Rule.** For a change of foundation, run the spike on its own branch and worktree (its own dev server port), and bring the owner measured numbers and the list of source changes it took.

## 2026-10-06 — Fit moving text instead of clipping it

**What happened.** The wordmark's held box clipped with `overflow-hidden` so a flip could not run into the art, and it cut off descenders ("g") and tall symbols. `overflow: hidden` clips both axes, and `overflow-x: hidden` alone turns the other axis to `auto`.
**Rule.** Make every frame fit by construction and clip nothing: each phrase takes the largest type step that fits, and a flipping letter may be no wider than its own letter times the room the phrase leaves (glyph widths from canvas `measureText` in the line's font). If a single axis must clip, `overflow-x: clip` leaves the other visible; `hidden` cannot.
**Promoted** to docs/DESIGN-SYSTEM.md, "Motion".

## 2026-10-06 — Group digits with a no-break space when text may wrap

**What happened.** Two-line phrases could have broken "299 792 458" between its groups.
**Rule.** Group digits with U+202F (narrow no-break space) wherever text may break; the wordmark's lists write `_` for it. A unit test rejects a plain space between two digits.
**Promoted** to docs/DESIGN-SYSTEM.md, "Copy".

## 2026-10-06 — Text set during measurement shows for a frame

**What happened.** Fitting a phrase leaves its final text in the line, and the first flip came a frame later, so the finished phrase flashed before its own change began.
**Rule.** After measuring with the real text, write the first animation frame in the same task, before the browser paints.

## 2026-10-06 — Closed details are not laid out; buttons center their text

**What happened.** Measuring phrases inside a closed `<details>` returned zero widths, so everything "fit"; and the lab's cells, being buttons, centered two-line phrases that the header sets flush left.
**Rule.** Measure only what is rendered: show or hide a measured group with state, not `<details>`. Give a measured line its own `text-left`, so the container it sits in cannot change it.

## 2026-10-06 — A background tab pauses requestAnimationFrame

**What happened.** Checking the wordmark in a background browser tab, frames did not advance between script calls; a screenshot ran a frame or two, so captures showed a change just starting.
**Rule.** Verify script-driven motion with state rather than timing: the lab's hold and show, and assertions on what lands. Time-based checks belong in the foreground or in Playwright.
**Promoted** to docs/TESTING.md, "End to end".

## 2026-10-06 — A scrolling code block fails axe only where the font is wide

**What happened.** The lab's settings code scrolled sideways on a phone in CI, where Linux's monospace is wider, and axe flagged it as a scrollable region without keyboard access; on Windows it fit and passed. At 320 px the lab also ran 14 px wide: a `<select>` is as wide as its longest option, and a grid's automatic column cannot shrink below an input's built-in width.
**Rule.** Let code on a page wrap (`whitespace-pre-wrap wrap-break-word`) rather than scroll. Give form controls in a narrow column `w-full min-w-0`, and a grid of them a shrinkable column (`grid-cols-1`, which is `minmax(0, 1fr)`). Check a new page at 320 px with a script that lists anything past the right edge.
**Promoted** to docs/DESIGN-SYSTEM.md, "Component rules".

## 2026-10-06 — Export settings from their own keys

**What happened.** The lab's "Copy settings" listed each setting by hand, and the two-line setting added later was missing from the code the owner copied; nothing was lost only because it had not been changed.
**Rule.** Generate an export from the object it exports (its keys, in order), and test that every key appears in the output.
**Promoted** to docs/DESIGN-SYSTEM.md, "Tuning labs".

## 2026-10-06 — The browser pane's "type" inserts text; key handlers need key presses

**What happened.** Checking the calculator in the browser pane, the computer tool's `type` action left the display unchanged: it inserts text, which a focused button ignores, so no keydown reached the calculator's listener. `key` sent real presses but "shift+6" arrived as "6", not "^". Five keydown events dispatched in one script also all read the entry from before the first, since Preact renders between tasks, not between events of one task.
**Rule.** Drive key handlers in the pane with `key` actions (or on-screen buttons for shifted symbols), and in scripts one task per key. Playwright's `keyboard.type` sends real key events and is the reference.

## 2026-10-06 — Size a control to the widest of its labels with a stacked grid

**What happened.** The theme menu kept a fixed width below `sm` after its "Theme" label went to screen readers only, which left a wide gap after "Sakura". Sizing it to the current name would have made it change width while the arrow keys preview themes.
**Rule.** Give the control an unseen sizer in flow (`invisible grid h-0`) holding every possible label in the same grid cell (`col-start-1 row-start-1`): it is as wide as the widest label in the current font and never jumps between them. Mirror the control's padding and border in the sizer.
**Promoted** to docs/DESIGN-SYSTEM.md, "Responsive layout".

## 2026-10-06 — CSS cannot tell that a row wrapped: switch at a measured container size

**What happened.** The owner wanted the header's menus reordered and flush left only when they wrap under the name. Flex wrapping is invisible to CSS, and the point where it happens depends on the theme's fonts (Hardhat's wide name wraps first).
**Rule.** Measure the widest case, then switch layouts at the smallest stock container size above it (`@container` on the header, `@max-sm:` on the menus: 384 px of header, where Hardhat needs 353 once the phone gap is 8 px) rather than a one-off breakpoint. Pin both sides of the switch with browser tests at widths around it, in every theme.
**Promoted** to docs/DESIGN-SYSTEM.md, "Responsive layout".

## 2026-10-07 — Astro template comments ship in the page

**What happened.** The pre-launch tidy-up found every component's notes, written as HTML comments in its template, in each built page: 3.6 KB of the converter page's HTML, a sixth of it gzipped. The inline script in `Base.astro` is not minified either, so its line comments ship too (1.8 KB).
**Rule.** A component's notes go in its frontmatter as a block comment, which the build strips, or in `{/* */}` inside the template; `test/astro-templates.test.ts` fails on an HTML comment in any template. Minifying the inline script belongs with the performance budgets of milestone 5.
**Promoted** to docs/ARCHITECTURE.md, "Conventions".

## 2026-10-07 — astro check's deprecation hints come from preact/compat's types

**What happened.** `astro check` prints hints that `ButtonHTMLAttributes`, `TargetedEvent`, and similar are deprecated. preact/compat maps React's type names onto Preact's JSX-namespace aliases, which Preact marks deprecated in favor of its own names. Its `className` is also typed to accept a signal, which a helper typed for strings (`cx`) rejects.
**Rule.** The hints are expected while islands are written against the React API (ADR 0007); leave them. A component that hands `className` to a string-only helper types it as React does, `Omit<…, 'className'>` plus `className?: string`, as `Button` does.
**Promoted** to docs/ARCHITECTURE.md, "Conventions".

## 2026-10-07 — Scroll a list to its highlight only when the keyboard moved it

**What happened.** Sean noticed that moving the mouse over an open list scrolled it. A hovered row became the highlight, and the effect that scrolls the highlight into view, written for the arrow keys, then scrolled any partly hidden row in, sliding new rows under a still cursor.
**Rule.** Record why the highlight moved and reveal it accordingly: the keyboard scrolls the row in, a list opening on a row centers it, and the pointer leaves the scroll alone. A browser test points at the partly hidden rows at the list's edges and checks the list stays put.
**Promoted** to docs/UX-SPEC.md (the suggestion list then; the table's cursor, §5 and §8, now).

## 2026-10-07 — Vercel picks pnpm from the lockfile, and only up to 10

**What happened.** Setting up hosting, Vercel's documentation showed it maps a `lockfileVersion: 9.0` lockfile to pnpm 9 or 10 and offers no newer pnpm on its own, while this repository pins pnpm 12.9.1, whose settings (`allowBuilds`) pnpm 10 does not read.
**Rule.** Turn on Corepack in the Vercel project (`ENABLE_EXPERIMENTAL_COREPACK=1`) so the root `packageManager` field decides, and keep what the Astro preset does not cover in `apps/web/vercel.json` rather than the dashboard. After bumping pnpm, check the version in the next build log (docs/DEPLOYMENT.md).

## 2026-10-07 — A page kept out of search names no canonical address

**What happened.** The first launch build gave the not-found page a canonical link to `/404/`, though it answers every unknown address, and gave the `/dev` pages both `noindex` and a canonical link, which tell search engines opposite things.
**Rule.** One prop decides both: `Base`'s `noindex` writes the robots tag in place of the canonical link. A browser test checks the converter page names its canonical address and the dev pages name none.

## 2026-10-07 — Tab leaving the page for the browser is correct

**What happened.** Sean noticed that Tab and Shift+Tab, past the first or last control, move focus into Chrome's own controls (the tabs, the address bar, Ask Gemini) and asked whether focus should stay in the app.
**Rule.** Never hold focus inside a page: that is a keyboard trap (WCAG 2.1.2), and keyboard users need the Tab cycle to reach the address bar and other tabs. Only a modal dialog holds focus, and only while it is open. Within the page, order the DOM so Tab reaches what matters first, as the boxes do (docs/UX-SPEC.md §8).

## 2026-10-07 — Move focus to another field after the commit renders

**What happened.** Enter that commits a unit now moves the caret to the other box. Focusing it inside the key handler would run its focus handler with the props from before the commit: a box that just got its category would highlight the row the unscoped list had there, the Back row, instead of the best match.
**Rule.** When an action moves focus to a component its own state change affects, record the request in state and move focus in a layout effect once the commit has rendered, still before the next key (the converter's `entered`). A browser test checks the other box opens with its best match highlighted.

## 2026-10-07 — Vercel hides plain GitHub checks behind "Show All Checks"

**What happened.** Adding the CI jobs as Deployment Checks, Vercel's GitHub import said "No configured checks found". It lists only checks that report through its `repository-dispatch` status action unless **Show All Checks** is on; with it on, both jobs were there. That action is only needed for workflows Vercel triggers, not for CI on pushes.
**Rule.** Import ordinary GitHub Actions jobs with Show All Checks on, and leave the workflow alone. Keep one gate: Vercel's native Lint and TypeCheck checks duplicate CI and are removed.
**Promoted** to docs/DEPLOYMENT.md, "The Vercel project", step 5.

## 2026-10-07 — A saved layout must not flash on a server-rendered island

**What happened.** The table layout became the default, with two boxes a remembered choice. The island is server-rendered before anyone's choice is known, and it learns the choice only after hydrating, so a two-box visitor would have seen the table's one box first, then the second box appear.
**Rule.** Treat a layout like the theme: the inline script applies the saved choice to `<html data-layout>` before paint, the server's markup carries both layouts' empty state, and custom variants (`layout-table:hidden`, `layout-boxes:hidden`) show the right one until the island takes over. A browser test blocks the island's code and checks both. Keep the island's first render identical to the server's (both states), and render one layout only once hydrated.
**Promoted** to docs/DESIGN-SYSTEM.md, "Patterns".
**Retired** with two boxes and the layout switch the same day (ADR 0013): no layout is saved now. The rule stands for any saved choice that changes an island's markup.

## 2026-10-07 — A count that stood in for room broke in a wider box

**What happened.** On 2026-10-06 the number's size moved from a character count to measurement, but the chip still gave up its name past six characters, a count tuned for two boxes side by side. The table layout's box is wider, and its chip dropped "milliliters" with room to spare.
**Rule.** Everything in a row that competes for room is decided by measuring that row, in one pass and a fixed order: `useFieldFit` tries the row with the chip's name, and only when the text does not fit at its largest size hides the name and steps the text down. To be measured, a part that may give way is hidden (`hidden`), not left out of the DOM.
**Promoted** to docs/DESIGN-SYSTEM.md, "Fields", "Type that steps to fit", and "Decide by the box, not the layout".

## 2026-10-07 — The compiler lint and refs passed into a custom hook

**What happened.** `useFieldFit` takes refs as arguments. Setting `hidden` on `name.current` inside the hook failed `react-hooks/immutability` (a hook argument cannot be modified), and reading only `name.current` inside a `useCallback` that listed `[name]` failed `react-hooks/preserve-manual-memoization`: the compiler inferred the dependency as `name.current`, not `name`.
**Rule.** In a custom hook, do the DOM work in a module-level function and pass it the ref object itself (`fitField(name, texts)`), reading `.current` there. The hook body then neither changes an argument nor depends on a `.current`.
**See also** "A memoized callback that reads only a ref's current loses its memoization".

## 2026-10-07 — A column spanning two rows stretches the first

**What happened.** The table layout's calculator spans the rows of the box and the table. With both rows `auto`, a calculator taller than the two together would spread its extra height over both, opening a gap between the box and the table.
**Rule.** Make the rows `auto 1fr` (`grid-rows-[auto_1fr]`): an item crossing a flexible row sends its extra height to that row alone, so the first stays as tall as the box. A browser test checks that the gap under the box is the same with the calculator open.
**Promoted** to docs/DESIGN-SYSTEM.md, "Responsive layout".

## 2026-10-07 — A half-typed number parses as a unit query

**What happened.** The table layout opens its list once a unit is being typed. Keying that off the parser's `query` would have flashed the list open on the way to a number: `parse` reads `-` and `.` as queries before a digit follows, `1e` and `1e-` as the number 1 with the query `e` or `e-` before the exponent's digits, and `2(3` as 2 with the query `(3`.
**Rule.** Behavior that should follow "a unit is being typed" checks the query for a character numbers and sums are not written with (a letter or a symbol), and treats a lone `e`, `E`, `e-`, or `e+` right after a number as an exponent on its way (`typingUnit`, now in the converter's `state.ts`). A browser test types each of these and checks the list stays closed.

## 2026-10-07 — A layout test tuned to one machine's font failed on CI's

**What happened.** A browser test typed a 13-digit number into one of two boxes and expected it to keep its largest size once the chip gave up its name. It passed on Windows and failed on CI: the numbers use the system's font (`--type-numeric` is a system stack in most themes), and Linux's digits are wider, so 13 of them no longer fit. The production gate held the deploy back, as it should.
**Rule.** A test of how text fits never hard-codes a count tuned on one machine. Check the rule across a sweep instead (the chip test types 1 to 20 digits and checks that the name never stays while the number shrinks, and that it gives way sooner in a narrower box), or pick lengths far from any edge, with room for fonts a fifth wider or narrower.
**Promoted** to CLAUDE.md, "Working habits" (measure, never count), and docs/TESTING.md.

## 2026-10-07 — A new island's classes can miss the dev server's CSS

**What happened.** The selection lab, a new `/dev` page, rendered in the dev server with some of its Tailwind classes missing: `opacity-0` and `appearance-none` had no rules, so a native menu meant to be unseen showed through, arrow and all. Two causes stacked. The island was `client:only`, and in dev Astro inlines the CSS of the server's module graph, where a client-only island never appears. And the dev server had been running since before the file existed, so Tailwind had not scanned it. A production build scans every source and was never affected.
**Rule.** Render islands with `client:load`, as the other labs do, so their classes reach the page's CSS. When a new file's classes are still missing in a long-running dev server, saving `src/styles/global.css`, with no change, makes Tailwind rescan; restarting the server does too.
**Came back (2026-10-08).** New layout classes in an existing island (`grid-rows-subgrid`, `md:*:row-span-3`) were missing from the long-running dev server's page CSS, and the open calculator's keys spilled past its card in the owner's tab while a fresh headless load looked right. Re-saving `src/styles/global.css` unchanged made Tailwind rescan. **Promoted** to CLAUDE.md, "Commands".

## 2026-10-07 — A menu that closes on blur shuts before a pick lands

**What happened.** The selection lab's category menu closes when focus leaves it, and applies a pointer's pick on release. Picking did nothing: pressing an option's label moved focus off the focused radio (a label takes no focus), the menu closed on that blur, and the release landed on a menu already gone.
**Rule.** In a menu that closes when focus leaves, keep focus put when a choice is pressed (`preventDefault` on `mousedown` inside the panel), as the smart input's list does for its rows. Apply the pick on release, not on click, where radios are involved: the arrow keys check radios with a click of their own.
**See also** "A panel that closes on blur closes when its focused control disables or leaves".

## 2026-10-07 — A test that reads a duration's text fails against the build

**What happened.** Run against a production build for the first time (the dev server was taken), the reduced-motion test failed in every theme: it expected `--motion-fast` to read `0ms`, and the build's minifier writes it as `0s`. Reduced motion worked; only the text differed. CI runs the suite against the dev server, so the test had never met minified CSS.
**Rule.** A test of a CSS value checks what it means (a zero duration, `/^0m?s$/`), not how one tool happens to write it. The suite should pass against a built site too, since that is what ships.
**See also** "The build writes 400ms as .4s".

## 2026-10-07 — getByRole's name matches part of a name

**What happened.** The table layout's tests found its box with `getByRole('combobox', { name: 'Value' })`. Before hydration the page carries both layouts, and in the two-box layout the locator matched "First value" and "Second value" too: Playwright matches an accessible name as a case-insensitive substring unless told otherwise.
**Rule.** When one name is contained in another on the same page ("Value" in "First value"), pass `exact: true`, or scope the locator to a container.
**Came back (2026-10-08).** Four selectors for the calculator icon, "Calculator", also matched its own close button, "Close calculator", and worked only because the calculator was closed whenever they ran. The third tidy pass made them exact. **Promoted** to docs/TESTING.md, "End to end".

## 2026-10-07 — A radio group with nothing checked focuses the first without checking it

**What happened.** The category menu, opened before any category was chosen, moved focus onto its first radio, as the theme menu does; but with nothing checked, Enter read the checked radio, found none, and closed without choosing Length, the choice visibly in focus. In a radio group with nothing checked, focus lands on a radio without checking it, and the first arrow press checks the next one.
**Rule.** A menu of radios that chooses on Enter takes the radio Enter was pressed on (`event.target`), not `:checked`, which is the same radio once anything is checked and the right one before.

## 2026-10-07 — A cursor kept across a change it did not make lands on a stale row

**What happened.** The table layout keeps where its cursor is in component state, as an index. Undo, clear all, or a send from the calculator changes what the table shows from outside the component, and the index would then point at a different row of a different list, tinted for no reason.
**Rule.** Tie a cursor to the view it was set in (here a key for the start, the matches, or one category's units) and treat it as resting whenever the view has changed. Code that moves the view on purpose and wants the cursor somewhere (choosing a category puts it on the first unit) sets the cursor with the view it is about to show.
**Since then.** The same day, choosing a category came to highlight no unit (Sean), so nothing sets a cursor for a view about to show; the cursor rests after every change of view.

## 2026-10-07 — Arrow keys through radios that apply would each be an undo step

**What happened.** The selection lab's category menu applied a category on every radio change, copying the theme menu, whose arrows preview themes. In the converter, choosing a category takes the unit out of the box and is an undoable step, so arrowing past three categories would have lost the unit and left three steps to undo.
**Rule.** Previewing on change suits choices that cost nothing to try (themes). A choice that changes the user's work moves without applying, and applies on Enter or a click; Escape then closes without changing anything.

## 2026-10-07 — A page-wide key must yield to what the key already did

**What happened.** Escape with nothing focused was made to clear the converter's box. The header's shortcuts map can be open with nothing focused (a resting mouse opens it), and its Escape closes it from a document listener in the inline script, which ran first but left the event alone, so one Escape would also have cleared the box behind the map.
**Rule.** A listener that acts on a key from anywhere checks `event.defaultPrevented` first, and every handler that consumes the key, the inline script's included, calls `preventDefault()`, so one press does one thing. Document listeners run in the order they were added: the inline script's before any island's.
**See also** "A popover's Escape on a toolbar control needs the capture phase".

## 2026-10-07 — A control that reads a stand-in for its value is right only some of the time

**What happened.** The category menu took its value from the table's view, and the matches' view carried no category, so while a unit was typed the menu fell back on the box's unit. With a unit in the box that named the same category; with a category chosen and no unit, the menu read "Choose a category" while the table still ranked that category's matches first. The second tidy pass found it by trying both states.
**Rule.** Every view a control reads carries the state the control names (the units and the matches both carry the category the converter is in; the start, by definition, has none), so no consumer rebuilds it from a stand-in that agrees only some of the time. A control's test covers each state that reaches it: here, with and without a unit in the box.

## 2026-10-08 — An inline script can keep an attribute on an island's element

**What happened.** The page's toolbars keep their roving tabindex from the inline script in `Base.astro`, on buttons the converter island renders too. Preact's hydration diffs only event handlers against the server's markup, and later renders touch only the props they name, so the tabindex the script sets survives both.
**Rule.** An inline script may own an attribute on an island's element only while the island never passes that attribute as a prop; a prop's value would come back on the next render. An element the island draws after hydration (Copy URL, in the header's slot) starts without it, so the script settles every toolbar again whenever it acts (on Tab, and on focus).

## 2026-10-08 — A focus rule written against a wrapper breaks when the wrapper gains parts

**What happened.** The table's cursor rested again when focus left `TableLayout`'s root, which then held only the menu, the box, and the table. When the toolbar moved into the same root, clicking the calculator icon no longer left it, and the cursor stayed lit while focus was on the toolbar. A browser test caught it.
**Rule.** Write a focus rule against the parts it is about (the box and its table: `fieldRef`, `placeRef`), not against whichever wrapper holds them today.

## 2026-10-08 — Line a column's parts up with the rows beside it: subgrid, and a row for the long side

**What happened.** Sean asked for the calculator's top to sit level with the toolbar and its display level with the box. Matching them with padding would have tuned the card to the toolbar's height, and broken as soon as the toolbar wrapped. Made a subgrid of the converter's rows, the card's parts sit in those rows by construction. Two things had to hold: the card's padding and border land on its first and last parts as margin, so its title row had to fit the toolbar's row (1 px of top padding there); and a margin on the display would have made the box's row taller, so the gaps went on the title row and the keys instead. A table spanning the same third row would also have stretched the card to the table's length, so the table spans that row and a last `1fr` row, which takes the rest.
**Rule.** To line parts of one column up with another column's rows, make it a subgrid of those rows rather than matching numbers. Keep margins off the parts whose rows must not grow, fit the edge parts' padding inside the edge rows, and give a long neighbor a `1fr` row of its own after the shared ones, so the subgrid hugs its content.

**Since then.** The calculator's subgrid retired on 2026-10-15, when side panels opened level with the box (docs/DESIGN-SYSTEM.md, "Side panels"); the rule stands for any column that must line up with another's rows.

## 2026-10-08 — A tap's click lands on what it uncovered

**What happened.** The category menu chose on `pointerup` and closed. On a touch screen the browser sends its mouse events and click after `touchend`, at the tap's place, so they landed on the box the closed menu had covered, focused it, and brought the keyboard up. A trace of the events in a phone-emulating browser showed it. A mouse click was not affected: its click goes to what the press and the release share.
**Rule.** A control that closes or moves on `pointerdown` or `pointerup` ends a tap with `preventDefault()` on `touchend`, in a handler on the element itself, which stays in the page while hidden (a listener the closing render removes is gone before `touchend` arrives); or it acts on `click`.

## 2026-10-08 — A memoized callback that reads only a ref's current loses its memoization

**What happened.** A new fitting hook's `useCallback` read `grid.current` and listed `[grid, columns]`. The React Compiler's lint (`react-hooks/preserve-manual-memoization`) failed `pnpm check`: it inferred `grid.current` as the dependency, which is not `grid`. The other fitting hooks hand the ref itself to their measuring function and were never flagged.
**Rule.** In a memoized callback, pass the ref to the function that reads it (`fitColumns(grid, columns)`) rather than reading `.current` in the callback, so what the compiler infers matches the dependencies listed.

## 2026-10-08 — Text typed into a server-rendered field survives hydration, until the next render

**What happened.** Keys typed into the converter's box before its island loaded went into the server's plain field and were then lost. Preact's hydration leaves the field's value alone, but the island's state starts empty, so the first render after it (the URL's restore, or any key) set the field back to that empty text.
**Rule.** An island whose field may hold text before it loads reads the field in a layout effect at hydration and adopts it into its state, before anything renders again. Keys typed with nothing focused can be kept the same way: an inline script moves focus into the field on the first one, so the field receives the key.

## 2026-10-08 — A symbol made only of a mark folds to nothing

**What happened.** The angle's degree has the symbol `°`. Search folded every degree sign away, so `°F` would match `F`, which left the degree's symbol an empty key: the registry test refused it, and `45°` could not find the degree.
**Rule.** A fold that drops a mark drops it only where it belongs to something else: the degree sign before a letter (`°F`, `° C`), kept alone. Where a mark should also be findable (a typed `°` starting `°C`), index a second form of the key that keeps it (`compactKeyWithDegree`) rather than bending the fold. Highlighting folds one character at a time, so a rule that looks at a neighbor is handled there by pulling the mark into a match that starts after it (`degreeBeforeLetter`), or the marked letters drift. Before adding a symbol that is all punctuation (`′`, `″`) or a letter with a mark, check what `compactKey` makes of it: `Å` folds to `a`, which would make the ångström the exact match for a lone `a`, so it waits.

## 2026-10-08 — A browser test that counts registry data reads the count from core

**What happened.** Adding categories and units broke browser tests that had the counts written in: eight tiles, nine volume rows, five speed rows, the start's two rows of tiles, and walks that pressed ↓ a set number of times to reach the last row. Each was right when written and wrong the moment the catalog grew.
**Rule.** A test that counts what the registry holds imports it from `@bigsmall/core` (`categories.length`, `unitsIn('volume').length`) and derives the rest from it (rows of tiles, steps to the last row). It still names the units it checks by id, so a reordering fails loudly where it should.

## 2026-10-10 — Dim text with the muted ink, never with opacity

**What happened.** The settings lab dimmed hidden units' rows with `opacity-60`. Axe failed them on color contrast in every theme: fading the ink and the muted ink over the surface drops both below 4.5:1.
**Rule.** A row or label that reads as set aside takes `text-ink-muted`, which every theme already holds to body-text contrast (docs/DESIGN-SYSTEM.md, colors), never an opacity on readable text. Opacity is for a control that is disabled and says so, where WCAG asks no contrast.
**Promoted** to docs/DESIGN-SYSTEM.md, "Semantic tokens".

## 2026-10-10 — A word and a number in another font share a baseline, not a centre

**What happened.** The settings lab's Hidden button laid its chevron, the word, and the count out with `items-center`. The count is set in the numeric font, whose line box is not the body font's, so centring the two boxes left the digit sitting visibly higher than the word.
**Rule.** Text beside text aligns on the baseline: wrap the word and its count in one `flex items-baseline` (or keep them in one inline run), and centre only the icon against that group. The real matches list's category headers already do it this way.
**Since then** (2026-10-19): the pair is a recipe, `LABEL_WITH_COUNT`, after Units' reset and the category menu's choices, built later, had centred theirs (Sean: the count "appears to be superscript" in some themes); a test reads the pair with the count shrunk to 8 px, since at one size and zoom two fonts' metrics can agree by chance, as Hardhat's did at 100 %.

## 2026-10-10 — Snap a scaled value before rounding it up or down

**What happened.** Rounding 0.29 down to two places gave 0.28: 0.29 × 100 is 28.999999999999996 in binary, and `Math.floor` took it at its word. Converted values carry the same noise (a result that should be 2.5 can arrive as 2.4999999999999996), so an eighth could round down a step too.
**Rule.** Before `Math.ceil` or `Math.floor` on a scaled value, snap it to 12 significant digits (`Number(x.toPrecision(12))`), which keeps every digit a converter shows and drops the float noise. Rounding to the nearest is unaffected, but goes through the same snap so the three agree.
**Correction** (2026-10-18). Twelve digits were too few: a value from 1e10 at two places has more once scaled, and the snap threw its real digits away (1 light-year in km wrote 9,460,730,472,580.00 for .80; 1 parsec in km 30,856,775,814,900.00 for ,913.67), found answering Sean's question on rounding past 1e15. The scaled value is now rounded as it is, and only a difference within four of the double's steps (`ulpOf`) from the nearest 15-digit decimal is taken as that decimal: the noise cases (0.29, 1.005, 2.675, a converted 65,181,600) are still caught, and the digits stay.

## 2026-10-10 — The label lint cannot see a control passed through a prop

**What happened.** A row's checkbox, handed to the cells component as a prop so it could lead the value's cell, failed `jsx-a11y/label-has-associated-control`: the rule reads the label's children as written, and the input was not among them.
**Rule.** When the control sits inside a label but is rendered by a child component, tie them with `htmlFor` and the control's `id` (from `useId`, plus a row key), which the rule and every browser accept.

## 2026-10-10 — A panel that closes on blur closes when its focused control disables or leaves

**What happened.** The settings lab's panel closed when focus left it (`onBlur`, no related target inside). A reset turned itself off once it had nothing left to do, and Reset settings from Fractions removed the fraction steps; either way the focused control lost focus to the page, the blur came with no related target, and the panel closed in the middle of the very action whose result it should have shown.
**Rule.** A popover closes on Escape, a press outside it (`pointerdown` on the document), and focus moving to something outside it (`focusin` on the document), attached in a layout effect so they are there before the next press; never on a bare blur. A control that turns itself off while focused takes `aria-disabled` (the Button's documented way to stay a stop) and does nothing when pressed, rather than `disabled`, which drops focus.

## 2026-10-10 — A subgrid's padding counts toward its parent's edge columns

**What happened.** The settings lab sized its table's columns with a sizer row (every value, shown or hidden, in one invisible subgrid row) so a preset would never move them. The values still moved 8 px when a long one showed: each row is a subgrid with `px-2`, and a subgrid's padding is added to the parent's first and last tracks, so a shown row asked for 8 px more than the unpadded sizer had measured.
**Rule.** A sizer row in a subgrid table takes the same side padding (and border) as the rows it stands for, so it measures what they would.

## 2026-10-10 — A wrapper made a grid item needs `min-w-0` again

**What happened.** Wrapping the lab's converter in a `max-w-xl` div made the wrapper the page grid's item instead of the converter, whose root carried `min-w-0`. The wrapper took its content's natural width, about 515 px, and the page scrolled sideways on a phone.
**Rule.** Whatever is a grid or flex item directly takes `min-w-0` when its content can be wider than the track (a table with columns that give way); moving that item into a wrapper moves the `min-w-0` with it.

## 2026-10-10 — An animation that reveals rests revealed

**What happened.** A check meant to draw itself in would have started hidden (a stroke offset its full length) and animated to drawn. This site's reduced-motion rule stops every animation outright (`animation: none !important`), so under it the check would have stayed hidden, the confirmation lost.
**Rule.** Animate from the hidden state to the resting one (`@keyframes … { from { … } }`, the rule's own style the finished look), never the other way, so stopping the animation leaves what it was revealing. `check-draw` in `global.css` does so.

## 2026-10-11 — A listbox holds options and groups, never a button

**What happened.** The matches offered hidden units with a line and a Show them button inside the listbox, between the groups. A listbox may hold only options and groups of options; a focusable control inside one breaks the combobox pattern and axe's required-children rule.
**Rule.** A control that acts on a list sits outside it, in the card beside the listbox (the matches' line under it); what it adds to the list goes in as options (the revealed hidden units, a group named Hidden), so the field's cursor reaches them as it reaches the rest.

## 2026-10-11 — A popover's Escape on a toolbar control needs the capture phase

**What happened.** Escape on the Settings icon was meant to close its panel and keep focus there. The page's toolbar controller (layouts/Base.astro), registered first, answered Escape on any tool by moving focus to the box, and the panel then closed only because focus had left it.
**Rule.** A popover opened from a toolbar control listens for Escape in the capture phase on the document and marks it handled (`preventDefault`); the toolbar controller skips handled keys, so the open popover closes first, as an open header menu does, and the next Escape goes back to the box.

## 2026-10-11 — Waiting on animations: a cancelled one has settled

**What happened.** The browser tests' `settled` helper waited on every animation's `finished` promise before running axe. A transition cancelled on the way (a list redrawn under it) rejects that promise with an AbortError, which failed a test with nothing wrong on the page.
**Rule.** Wait on `animation.finished.catch(() => undefined)`: a cancelled animation is as settled as a finished one.

## 2026-10-14 — Decimal points line up in two columns, not with padding

**What happened.** The plan for lining the table's values up on the decimal point was invisible trailing zeros after each value, as many as it lacked of the most decimals in the column. That works only while everything after the point is a digit: tabular digits share one width, but a value in exponent form ("1.23457E23", which a row writes past 1e15 or with No limit) has a letter and a sign after its point, and no count of zeros matches their width.
**Rule.** Split each decimal at its decimal mark (at the exponent marker without one) into two subgrid columns, the whole part right-aligned and the rest left-aligned; the grid lines them up whatever the characters. Draw the parts `aria-hidden` with the whole value in an `sr-only` copy, so screen readers never hear "473, point 18". A sizer row measuring the columns places its overlapping cells with `row-start-1`, or auto-placement stacks them in extra rows.

## 2026-10-14 — A sticky bar with rounded corners shows what scrolls under it

**What happened.** Edit's foot was made sticky at the screen's bottom edge, first stretched over the card's bottom padding with rounded corners to sit inside the card's own. Stuck, those corners let the rows scrolling under it show through (the box's row in its accent fill, clearly).
**Rule.** A bar that sticks over scrolling content is square and opaque edge to edge across what it covers: keep it inside the card's padding, as wide as the rows, rather than reaching for the card's rounded edge.

## 2026-10-15 — A view transition takes no clicks

**What happened.** The settings lab's glide, a unit checked in Hidden travelling to its row, ran as a same-document view transition (`document.startViewTransition`). In the converter, a second unit checked straight after the first never showed: while a view transition runs, Chrome hit-tests every press to the document element, and `::view-transition { pointer-events: none }`, the usual advice, did not change it. A browser test clicking during the 400 ms also made Playwright scroll the page as it retried.
**Rule.** For motion inside a page someone keeps working in, move the real elements (measure, render the change at once, animate each from where it was with the Web Animations API, the FLIP technique; `features/converter/glide.ts`), so it stays interactive throughout. Keep view transitions for changes that replace the view, where a moment without input costs nothing.

## 2026-10-15 — Safari scrolls to the top as a list is swapped

**What happened.** Entering Edit replaces the table's rows with Edit's list, a little taller. Chrome kept the page where it was; WebKit (Safari, on the live site too) scrolled to the very top, with no script scrolling or focusing anything. WebKit has no scroll anchoring, and swapping the list left it at 0.
**Rule.** Around a change that swaps a long part of the page, measure where it sat on the screen before (`getBoundingClientRect().top`) and scroll by the difference after, in a layout effect, as Edit and Done do in `ConversionTable`. Test page jumps in WebKit, not only Chromium (`npx playwright install webkit`).
**Promoted** to docs/TESTING.md, "End to end".
**Since then** (2026-10-18). The page opts out of scroll anchoring everywhere (ADR 0025), so Chrome behaves as Safari does here and `keeping` holds the part in place in both.

## 2026-10-15 — A glide on a decelerating curve reads as a jump

**What happened.** Units moving between shown and hidden glided over 400 ms, yet Sean saw them snap in, on a phone and on a desktop. Freezing every animation 120 ms in showed why: the theme's easing, `cubic-bezier(0.2, 0, 0, 1)`, had done about 70 % of the travel, and the flash on it faded as fast. A list of `document.getAnimations()` said all was well; only frames showed it.
**Rule.** Travel uses an even curve (`--motion-glide`); a decelerating one suits things appearing in place. Check motion by pausing animations at a few moments (`animation.pause(); animation.currentTime = t`) and looking, not by counting them. Measure positions on the page (adding the scroll offsets), or a page that scrolls as content changes slides everything by the scroll.
**Correction (the same day).** The curve was a real flaw but not why Sean saw no glide: on the live site every animation lasted under a millisecond (next entry). Frozen frames were taken on the dev server, and pausing an animation hides how long it runs.

## 2026-10-15 — The build writes 400ms as .4s

**What happened.** The glide and the flash read their lengths from the theme (`--motion-slow`, `--highlight-fade`) with `parseFloat`, which drops the unit. The themes say `400ms`, so on the dev server it worked; the build's CSS minifier rewrites times in their shortest form, `.4s` and `1.2s`, so on the live site the glide ran for 0.4 ms and the flash for 1.2 ms: each started and was gone the next frame. Sean saw it on a phone and a desktop, two rounds running; frozen frames on the dev server looked right. A probe that sampled every frame after a real click, on the built site, found it at once (the animations' count fell to 0 a frame after they began).
**Rule.** Read a CSS time with its unit (`lib/css-time.ts`), never `parseFloat` alone. Check motion against the built site (`pnpm build`, then `astro preview`), in real time, sampling each frame; and assert an animation's `getTiming().duration`, not only that one exists.
**Promoted** to CLAUDE.md, "Working habits" (verify on the built site), and the tidy skill's step 6.

## 2026-10-15 — A glide's leavers go first and its arrivals last

**What happened.** With the glide finally running on the live site, Sean saw sections ghost: a section switched off faded out where it was over the whole 400 ms while the next section slid up through it, and one switched on faded in under the section still sliding out of its place. Frames at 170 ms showed both sets of text overlapping.
**Rule.** Pace the three kinds of part within the one length: what leaves is gone in the first 30 %, what moves glides throughout, what arrives fades in over the second half (keyframe offsets on even fades, `glide.ts`). Check a change that removes or adds a whole group, not only a single row, by its frames.

## 2026-10-15 — A shared edge puts an inset focus ring off centre

**What happened.** The segmented control drew one line between segments by giving each a right edge and only the first a left one. Its focus ring is an outline inset by the edge's width, so on the first segment it lay over the edge on all four sides, but on every later one it sat inside on the left, beside the neighbour's edge: Sean saw that side twice as thick, moving along with the arrows.
**Since then.** Overlapping two drawn edges to fix it made seams thicker on a screen scaled to 125 % or 150 % (Windows' usual): the two copies of a seam rounded to different device pixels. Seen only at a fractional scale (`deviceScaleFactor: 1.25` in Playwright), enlarged without smoothing.
**Rule.** Draw each seam once: every joined piece has its whole edge and overlaps the one before by its width, its own left edge transparent over its neighbour's line, its fill kept inside its edge (`bg-clip-padding`). Make the focus highlight the piece's own edge in the focus color, lifted over its neighbours (`relative z-10`), not an outline over it, so rest and focus are the same width by construction. Check a middle and a last piece, at 1, 1.25, and 1.5.

## 2026-10-15 — Moving an element drops the focus inside it

**What happened.** Reordering Units' systems re-renders the rows in their new order, and Preact moves a row's element to its new place. A browser drops focus from anything inside an element it moves, so after Alt and an arrow, or Move up and Move down from the handle's menu, focus fell to the page and the keys could not find their way back (Sean, on his keyboard). The browser tests had passed: which rows the diff moves depends on the direction, so a move one way kept focus and the other lost it.
**Rule.** Around a change that reorders keyed elements, note `document.activeElement` before it, and in a layout effect after it, focus that element again if it is still in the page and lost focus (`SystemRows`). Test moves in both directions, more than once.
**See also** "Move focus to another field after the commit renders". **Promoted** to docs/ARCHITECTURE.md, "Conventions".

## 2026-10-15 — Remember what was changed, not every setting

**What happened.** Settings were remembered whole: any change wrote every display setting, the defaults included. When Sean made Symbol and name the fresh default, a browser that had saved anything kept Symbol only, a choice nobody made, and his own browser would have shown the old default as if the change had not landed.
**Rule.** Store only what differs from the defaults (`storedOf` in `settings.ts`), so a default changed later reaches everyone who never chose otherwise. Version the stored shape; reading an older version that stored everything, a setting whose default has since changed cannot tell a choice from the old default, so it takes the new one.
**Promoted** to docs/ARCHITECTURE.md, "State and URLs".

## 2026-10-15 — A phone's number pad: `inputmode`, read at focus

**What happened.** Sean asked for the number keys when tapping into the box. `inputmode="decimal"` on a text field brings an iPhone's decimal pad: digits and the locale's decimal mark only, no minus, no letters, no operators, and no return key (Safari's bar above the keyboard keeps Done). The keyboard reads the mode when the field gains focus; changing it while the keyboard is up shows nothing until the next tap.
**Rule.** Ask for the pad only where the field takes nothing but an unsigned number (the box with a unit, outside Temperature and Angle), and keep `type="text"`: a number field drops what a parser reads. A button inside a field that must not take focus (the box's ×) prevents its mousedown; its click still fires, and the caret and a phone's keyboard stay where they were.

## 2026-10-15 — A copied number pastes as a number: a plain hyphen, and buttons unseen but there

**What happened.** Copy now takes what a row shows rather than its full value (Sean). Some locales write negatives with U+2212, the typographic minus, which reads well but pastes into a spreadsheet or a calculator as text. And with one copy button shown at a time, the others had to stay for screen readers without catching a tap meant for their row.
**Rule.** Copied text swaps U+2212 for a hyphen (`copiedText` in `ConversionTable`); "≈" stays off it. A control that shows only on the active row stays in the accessibility tree with `opacity-0 pointer-events-none` rather than `invisible` or `hidden`, so screen readers reach it and a pointer passes through to the row. A test that clicks at a row's end with a mouse hovers it first, which shows that row's button: test pass-through with a tap.
**Promoted** to docs/DESIGN-SYSTEM.md, "Lists" (the copy button on the active row).

## 2026-10-15 — A shell that clips at rest cuts off its control's focus ring

**What happened.** With the keyboard on the shortcuts icon, Sean saw no state at all, while Copy URL beside it showed its ring. The ring is drawn 2 px outside the button, and the map's shell kept `overflow-hidden` at rest (it came from the shared `SHELL` recipe, for the box's corners), so the ring was clipped away. A test that read `outline-style` passed: the ring was there, only hidden.
**Rule.** Clip a shell only while it needs it (the shortcuts map only while open), and keep clipping out of shared recipes. Check a focus ring by looking, or by checking that nothing around it clips (`overflow` on its ancestors), not only by its computed style.

## 2026-10-15 — A color read right after a change catches the transition's first frame

**What happened.** A test pressed Enter to open the shortcuts map and read the icon's background straight after, to check its switched-on fill: it read transparent. The button eases `background-color` over the theme's fast length, so the first read caught the start.
**Rule.** After a change to something with a transition, poll for the settled value (`expect.poll`), or read the class or attribute that sets it.
**Since then** (2026-10-19): axe is a color read too. The owner's switch, disabled until its island reads the browser's storage, eases from half opacity to full as it enables, and the smoke test's axe caught it mid-fade once in 341 runs; the test now waits for every load-time island (`islandsReady`) and for the page's animations (`settled`) before axe, on every page. Twice in four runs on 2026-10-20 it caught it again: the switch enables in an effect after hydration, so `islandsReady` had resolved and `settled` had found nothing running before the fade began; the test now waits for the line that effect writes, then settles. An island's effect runs after its hydration mark drops: wait on what the effect produces, never on the mark alone.

## 2026-10-15 — The gallery's axe run outgrows the default timeout on CI

**What happened.** Three gallery samples added in a tidy (each drawn in all six themes) pushed axe's run over `/dev/gallery` past Playwright's 30 seconds on CI's dev server, though it passed in 26 on a local build.
**Rule.** The gallery is meant to hold every component in every theme, so its axe check is marked `test.slow()` rather than trimmed; a sample added there is checked on CI, not only locally, since the dev server is slower than a build.

## 2026-10-15 — A see-through color is a mix, worked out once in the bridge

**What happened.** The unit chip lightened on hover with `bg-surface/40` laid over its `bg-accent-soft`: a one-off alpha the token guard did not catch (the full tidy). Laid over an opaque fill, a see-through color composites in sRGB, so the result is exactly `color-mix(in srgb, var(--accent-soft) 60%, var(--surface))`. And a guard pattern cannot hold "/", since a selector's regex ends at the first one.
**Rule.** A color that is one token toward another is a derived color in the bridge (`DERIVED_COLORS` in `themes.ts`), which follows every theme's palette and whose contrast the theme test checks; the guard now rejects a color token with an opacity modifier, its slash written `\x2F`.
**Promoted** to docs/DESIGN-SYSTEM.md, "Semantic tokens" and "Token guard".

## 2026-10-15 — An animation read after a step can already be over

**What happened.** The glide tests clicked, waited for the row, then read `document.getAnimations()` for the glide's length. A slow CI machine can finish a 400 ms glide before that read, and the test then fails, or, counting what moved, passes for the wrong reason (the full tidy).
**Rule.** Record animations as they start (`recordAnimations` and `startedAnimations` in `e2e/support.ts`, which wrap `Element.animate`), and assert on the record; poll the record where an animation starts after a frame.
**Promoted** to docs/TESTING.md, the shared helpers.

## 2026-10-15 — A combobox can control two listboxes, with a button between them

**What happened.** Sean asked for the hidden matches to list under the line that offers them, not back among the matches above it. The line's Show them is a button, and a button inside a listbox fails axe: a listbox owns only options and groups.
**Rule.** Two listboxes, the field's `aria-controls` naming both (an ID list) and its `aria-activedescendant` pointing into either; the button sits between them, outside both. The arrows follow the page: the matches, the button with real focus, then the hidden ones with focus back in the field. One grid around both lists keeps their columns in line across the button's row.

## 2026-10-15 — A label beside a name squeezes it below its longest word

**What happened.** With the ellipsis gone, a hidden match still cut "miles per imperial gallon" at 320 px: in a flex row that does not wrap, a `min-w-0` name shrinks below its longest word to make room for a label that will not wrap ("Fuel economy · UK (imperial)").
**Rule.** Let the row wrap (`flex-wrap`), so the label drops under the name where the two share no line; keep symbols and a button's words on one line (`whitespace-nowrap`) and let the prose around them wrap. A test checks that nothing is cut (`scrollWidth` against `clientWidth`) and that the long name took a second line.

## 2026-10-15 — Umami behind a proxy: point it at the proxy, and keep the URL's query out

**What happened.** Wiring Umami Cloud through bigsmall.work, the tracker's source showed three traps. A Cloud script served from your own domain still posts to `gateway.umami.is` unless `data-host-url` names the proxy (Umami's own Vercel guide predates the gateway and misses it). The tracker wraps `history.replaceState` and counts any URL change as a new page view, and this page rewrites its URL after each edit. And its performance option sends on every such change, each counting toward the plan's events.
**Rule.** Rewrite both the script and `/api/send`, and set `data-host-url` to the absolute proxy address; set `data-exclude-search` and `data-exclude-hash` on a page whose URL holds its state; leave `data-performance` off; call the tracker as `window.umami?.track(…)`, never stubbing `window.umami` first (the tracker installs itself only when it is absent).
**Promoted** to docs/decisions/0019-analytics.md and docs/DEPLOYMENT.md, "Analytics".

## 2026-10-15 — A test that passes on the build can fail on CI's dev server

**What happened.** A new header test located `header`. On the preview build one element matched; CI runs the suite on the dev server, where Astro's dev toolbar draws headers of its own, so the locator found six and the test failed, twice, holding two deploys back. The second time went unseen at first: the watch ran in the background as `gh run watch …; gh run view …`, whose exit status is the last command's, so its notification read as a pass.
**Rule.** Scope a locator to the page's own markup (`main > header`). Run a new browser test on a dev server too, not only on the build (a scratch config pointing at the running dev server, never starting or stopping it). Say CI passed only from the run's conclusion, read from its output or `gh run view <id> --json conclusion`.
**Promoted** to `.claude/skills/ship/SKILL.md`, step 3.

## 2026-10-15 — A child's effect runs before its parent's

**What happened.** The sketchbook's play starts in its component's effect, which runs before the effects of the lab around it, so at that moment the lab had not yet loaded its saved settings: the play would have read the defaults for whether to shuffle as the page opens.
**Rule.** A setting a timer acts on later is read when the timer fires, not when it is set; settings a parent loads after its first render reach a child's already-running work through a ref the child reads each time.

## 2026-10-15 — The compiler's lint stops a setState in an effect

**What happened.** `react-hooks/set-state-in-effect` failed the sketchbook lab for loading its saved settings in an effect, the same lines the wordmark lab has and passes with; why that component goes unreported was not pinned down.
**Rule.** Read a browser-only value (local storage, a media query) during render once `useIsHydrated()` is true, memoized on it, and keep edits in state of their own that takes over from it: the first render still matches the server's, and no effect sets state.

## 2026-10-15 — Fast frames stay under the flash threshold by area

**What happened.** The sketchbook's header-style changes step at the name's pace, about thirty frames a second, and a shuffle runs every tile at once: whole tiles flipping through other sketches that fast would strobe across the grid, past WCAG 2.3.1's threshold (more than three flashes a second over more than a quarter of a 10° field, about 341 × 256 px).
**Rule.** A change swaps a picture's whole area once; what changes from frame to frame stays a small share of it (a quarter of a tile: bands, a few blocks, one row), and anything that repeats a whole change waits a third of a second between starts. Put the limits in the code (`FLICKER_SHARE`, `SKETCH_MIN_GAP_MS`) and test the frame planner against them, so no setting in a lab can cross them.
**Since then.** The full tidy (2026-10-15) found that each frame keeps to a quarter, but from one frame to the next up to half changes, one frame's bands leaving as the next's arrive; at the shipped size the grid stays under WCAG 2.3.1's flash area, and Sean kept the look. State a limit on change between frames as the code keeps it, frame by frame and between frames.

## 2026-10-15 — A filter is drawn before the clip-path

**What happened.** Glitch's colored edges are drop-shadows on clipped slices, and a clip is applied after the filter, so a shadow reaching past the slice's box was cut off; its bands are also holes in the picture, which one clip-path cannot list as separate shapes.
**Rule.** Let a clip reach past the element's sides when a filter should show there (`inset(20% -10% 70% -10%)`, a polygon from -10% to 110%). Cut holes, or join separate shapes, in one `polygon(evenodd, …)`: each extra loop joined to the outline along a line it travels back on, which the even-odd rule leaves out.

## 2026-10-15 — A saved choice from a list drops what the list gains later

**What happened.** The sketchbook lab saved its rotation as the sketches in it. Round 3 added 27 sketches to the catalog, and Sean's saved rotation, from before, left every one of them out, so his Copy settings shipped without them unless caught.
**Rule.** Save a choice from a growing list as what was left out, so whatever joins the list later joins the choice; write it out the same way in anything copied back as code.

## 2026-10-15 — Intl writes numbers a parser of ASCII cannot read back

**What happened.** The accuracy audit wrote a number with `Intl.NumberFormat` in 36 locales and parsed it back, as the box does when a row's value goes into it. Eleven failed: the Swiss locales group with an apostrophe (1'234'567.891 read as 1); Arabic, Persian, Bengali, Marathi, Nepali, and Burmese write their own digits; the right-to-left locales put a direction mark (U+200E, U+200F, U+061C) before the minus; and Arabic writes an exponent in letters (أس), Swedish and Persian as ×10^.
**Rule.** Test a parser of formatted numbers by round trip, across locales and scripts, with negatives and exponents, never by a hand-picked list. Read a normalized copy and map each of its characters back to where it was typed, so what the user typed keeps its own characters.

## 2026-10-15 — Auto side margins shrink a flex item to its content

**What happened.** Setting the footer at the window's bottom made the body a column, which puts each page's column, centered with `mx-auto`, in a flex parent. There an item with an auto margin across the column is not stretched (CSS Flexbox, "align-self: stretch" applies only when neither cross margin is auto), so it shrinks to its content: the About page's narrow sketchbook would have pulled its header to the middle, and the footer's link with it.
**Rule.** Give a centered column `w-full` beside its `max-w-*` and `mx-auto` (`PAGE_COLUMN`, `DevPage`'s main): nothing changes in normal flow, and it stays full width in a flex or grid parent. Measure every page and theme before and after changing a parent's display, and compare the boxes, not only the screenshots.

## 2026-10-15 — An alias in a new category can take a symbol from an old one

**What happened.** Torque's newton meter needed the alias `Nm`, which people type for it. Search folds case, and among exact matches an everyday unit led whatever key matched, so typing `nm` would have meant newton meters, not nanometers (a specialist unit, its symbol typed exactly); `kn` would have stopped naming the knot once the kilonewton's `kN` arrived.
**Rule.** Before adding a unit, search its symbol and aliases in every other category, case folded (the ambiguity watchlist, docs/UNITS-CATALOG.md §5). Symbols differ by case, so a key written as typed, its case included, leads one found only by folding case; then the everyday unit. Test both spellings of each pair, and that the old decisions hold (`c` is still Celsius).
**Since then** (2026-10-16). The tier came first too, so with the nanometer a specialist unit, hidden on a fresh visit, `500 nm` and Enter still took newton meters; Sean: nanometers are what people mean, and an everyday metric unit. Among exact matches the current category now comes first, then the spelling as typed, then the tier; and a unit's tier is checked against what people convert, not its size.

## 2026-10-16 — Moving focus into a long menu scrolls the page

**What happened.** Opening the category menu moves focus onto the chosen category, and `focus()` scrolls an element into view: with Force and Torque the list grew past the window, and a click with Torque chosen jumped the page 145 px on a desktop and 293 px on a phone (Sean: "clicking does not autoscroll the user").
**Rule.** Move focus into a menu or panel with `focus({ preventScroll: true })`; when it opened from the keyboard (a click with `detail` 0), bring the focused choice into view with `scrollIntoView({ block: 'nearest' })`, as little as it takes. A browser test with the choice below the window's edge holds both.

## 2026-10-16 — A list held to the window scrolls itself, never the page

**What happened.** The category menu, open in two columns, fits every category on a phone, but a short window (a phone on its side, a small laptop window) still cut it off. Holding the list to a fixed height would scroll it on windows with room to spare; the room changes with where the menu sits and how tall the window is.
**Rule.** Measure the room as the list opens and when the window resizes: from the list's top to the window's bottom, less a gap, never under a few rows (past that the page scrolls to the rest), as `max-height`. Give it `overscroll-contain`, so reaching its end does not hand the scroll to the page. Show the chosen choice by the list's own `scrollTop`, since `scrollIntoView` moves every scrolling ancestor, the page too; keep `scrollIntoView({ block: 'nearest' })` for opening from the keyboard. A browser test sizes the window from the open list's measured top and row, never from a number of pixels.

## 2026-10-16 — Twice a box's width is a fraction: `w-2/1`

**What happened.** The category menu, open, is two closed menus wide: 200% of its placeholder's width. The token guard rejects a percentage in an arbitrary value (`w-[200%]`), rightly, since most are one-off sizes.
**Rule.** Tailwind v4 takes any fraction as a width, above one too: `w-2/1` is `width: 200%`, a size relative to the box it sits in, which the guard allows. Check the built CSS for the class when using one for the first time.

## 2026-10-16 — One idea, one name, in code, docs, and on screen

**What happened.** A unit's tier was `basic` or `advanced` in the code, its section `specialist`, "everyday" or "specialist" in the docs, and Standard or Specialty on screen: three vocabularies for one idea, each change a translation (Sean: "absolutely no confusion on how we store it"). The section's key is stored in visitors' saved settings, so renaming it needed care.
**Rule.** Name a concept in code by the word the screen shows, and say it the same way in the docs. Keep keys apart from labels (a label map such as `SECTION_LABEL`), so a later change of word is a label's. When a stored key is renamed, bump the stored version and read the old key as the new one, with a test that loads each older version: nobody's choices are lost. Keep dated records (the findings log, these entries, ADRs) as written.

## 2026-10-16 — One reciprocal unit takes a category's size order away

**What happened.** `orderUnits` lists a category smallest to largest only when every unit has a plain factor; otherwise it keeps the catalog's order (temperature, fuel economy). Speed's two paces, reciprocal units, would have dropped all of Speed to the catalog's order, foot per second no longer before the mile per hour.
**Rule.** A kind of unit that reads the other way is listed apart, after the rest (`pace: true`), so it never changes how the others are ordered. When adding a unit of a new kind to an existing category, check the category's listed order before and after (a search test pins Speed's, paces included).

## 2026-10-16 — Flex items wrap before they shrink: wrap a group, shrink inside it

**What happened.** Cooking's box holds two pills beside the number. Without wrapping, the pills took a phone's whole row and the number vanished; with each pill wrapping on its own, a long ingredient took a third line, because a flex row decides its lines from each item's full width before anything shrinks.
**Rule.** Keep the number's room with a minimum width and let the row wrap; put the pills in one group that wraps as a whole, and let the one that may be cut short (the ingredient's name, `min-w-0` and `truncate`) shrink inside the group, so the box is two lines at most. Fit what may give way by measurement (`useFieldFit`, which now also hides the unit chip's name when the ingredient's would be cut), each time from the same starting state, so the answer never flips.
**Later the same day.** The browser's own wrap judged by the number's minimum width and both pills' full names, so on a desktop the box wrapped even with "123", where one line fit once the unit's name gave way (Sean). The wrap is now the fit's last step, measured: one line, the name, the sizes, and only then `data-wrap`, which the row's classes follow; the row is never `flex-wrap` on its own. A refit on resize reads the width alone, since the fit itself changes the row's height.

## 2026-10-16 — A stuck header closed where it sticks throws the page past its section

**What happened.** Every formula's category names stick under the bar while their units scroll past: `position: sticky` on each `<summary>`, which its `<details>` bounds, so the next name pushes the last one up with no script. Closing a category from its stuck name took its units out from above the window's top while the page kept its scroll position, so the window jumped on into categories far below.
**Rule.** Around a change that collapses what sits above the window's top, measure where the header is on the screen before and scroll by the difference after, in the same task: prevent the summary's click and set `open` yourself, since `toggle` fires as a task of its own and a frame can paint in between. Do the same for opening or closing everything, anchored on the section being read. A sticky header's `top` is the bar over it, measured, so a bar that wraps in a narrow window still clears it.

## 2026-10-16 — WebKit draws a door hinged on the right half open through its own perspective()

**What happened.** Sean saw the sketchbook's middle tile snap to the right as a change ended, mostly on his iPhone. Frozen a hair before its end and screenshotted against the settled tile, every moving effect matched in Chromium and WebKit but Doors in WebKit: each half turned through `perspective(…) rotateY(±90deg)` on its outer edge (`transform-origin` 0% or 100%), and WebKit folded the left half away but drew the right one as a slab a quarter of the tile wide to the very end, so it vanished at once as the tile settled. Writing the hinge in pixels or with a translate changed nothing; the parent's `perspective` property drew both halves right in WebKit, but in Chromium, seen from the tile's middle, doors at 90° stand as slivers past its edges.
**Rule.** Give a 3D turn on an off-centre hinge its depth from the parent's `perspective`, clip it to the parent, and fade what must end hidden rather than trusting an engine to draw it edge-on at exactly 90°. Check motion by its last frame against its settled one in WebKit as well as Chromium: freeze the animations (`getAnimations()`, `pause()`, `currentTime` just short of the end), screenshot, finish, screenshot, and diff.
**Since then** (2026-10-17). The slab is any layer standing at exactly 90° through its own `perspective()`, on a centred hinge too: Flip's and Tumble's arriving layer and Flap's landing half waited edge-on for the whole first half of every change, drawn as a slab of the next sketch in WebKit (see "A tile's change bled, seamed, and snapped"). Check a change's first frame against the picture at rest as well as its last.

## 2026-10-16 — A picker for a value in the box belongs in the box's popup, not the toolbar

**What happened.** To choose Cooking's ingredient without typing, an Ingredient menu was built beside the category menu, the same component taught to list choices under headings. Measured, the toolbar's leading group grew by the menu's width: on a desktop the toolbar went from one line to two on entering Cooking, moving the box down, and on a phone the group overran the window, the ingredient's name breaking over three lines and Display cut off at the edge.
**Rule.** The box is the combobox whose popup is the table's place, where every list to choose from shows (units, matches, the start's categories). A value that lives in the box, as a pill, is chosen there too: pressing the pill lists its choices in the popup, the current one marked and the cursor on it, so the toolbar stays the same in every category. Before adding a control to the toolbar, measure the row at a phone's width and the desktop's column with the widest label it can show.

## 2026-10-16 — Stacked sticky headers leave a hairline between them: tuck the lower one a pixel under

**What happened.** Every formula's category names stick under the bar with Hide all, edge to edge at the bar's height. Sean saw a thin line of the scrolling text between the two. Each sticky layer is drawn on its own and rounded to the screen's pixels apart, so at a display scale that is not whole their edges can round a pixel apart; `offsetHeight`, a whole number, could misplace the lower one too. Stepping the scroll by thirds of a pixel at scales 1, 1.25, 1.5, and 3 showed text in the seam in WebKit at 1.5, and none once the names sat a pixel under the bar.
**Rule.** Stick a lower header a pixel under the one above it, at that one's measured height (`getBoundingClientRect().height - 1`), the upper on top (`z-10`) so its rule covers the overlap. Check a seam by its pixels at fractional scales, in WebKit too, after the island has hydrated: a click before then is lost, and the check measures the wrong page.
**Promoted** to docs/DESIGN-SYSTEM.md, "Stuck layers".

## 2026-10-16 — A figure weighed from many sources needs its rule written before its figures

**What happened.** Cooking's figures were first reconciled by judgment from two blind reviews. Written down as a rule (which weighings count, their median, what to do with fewer than three) and applied to the checked sources, eleven moved, all-purpose flour 125 → 127 g and baking powder 192 → 177 g among them; and the citation check found sources' notes misreporting them (America's Test Kitchen's cups dipped, not spooned; USDA's 1969 shortening spooned, not packed; Milk Street's flour table an average of charts).
**Rule.** Write how figures count and combine before deciding any: a screen (the method, the food, a weighing, read on its page, each source once), a median of what passes, a stated rule for thin data. Read the source, not the notes about it. Make a test recompute every figure from its sources, so a new source says what the figure becomes (docs/research/cooking-2.md, `cupFigure`).

## 2026-10-16 — A list in the page is the box's listbox: opening it never scrolls the page, replacing it brings the box back

**What happened.** Pressing the ingredient's pill put the cursor on the ingredient in the box, and the effect that keeps the arrows' row in view scrolled the page 50 to 75 px to that row, carrying the box up and away. Taking an ingredient from deep in the list then left the box off-screen: on a phone the page shrank under the scroll, and on a desktop `focus()` on the already focused field scrolls nothing. Both measured with a Playwright probe before and after.
**Rule.** A list shown in the page stands in for a listbox and keeps a listbox's manners: opening it moves nothing (hold the follow-the-cursor scroll for that one render); replacing it with the table brings the box back into view, in a layout effect after the render, with programmatic focus taking `preventScroll` so that is the only scroll. A pick in the table itself leaves the page where it is: its rows stay put. Measure scroll behavior with a probe that reads `scrollY` and the box's top before and after each gesture, on a desktop and a phone.

## 2026-10-16 — A grid track from a division lands on fractional pixels: round the track and the inset

**What happened.** On a 390 px phone the sketchbook's three tiles in a 358 px row measured 108.656, 108.672, and 108.672 px wide at x = 16, 140.656, and 265.328: the browser splits the third of a pixel in layout units, so every edge but the first sits between device pixels, on a 3× screen too, and a composited layer that settles there lands a hair from where the tile rests. Sean's iPhone showed the tiles snapping as a change ended.
**Rule.** Where a track or a tile comes from a division, round it to the pixel in the stylesheet (`round(down, …, 1px)` behind `@supports`, the plain grid as the fallback) and start the row at a whole-pixel inset rather than centering on a half; test that every edge is whole at several widths. The measures come from the component as custom properties, so the lab's tuning still drives them.

## 2026-10-16 — What paints past a phone's edge lets iOS pan the page sideways: bleed and clip the block

**What happened.** Glitch shifts a tile's slices sideways by up to a quarter of the tile, and WebKit at an iPhone's size measured the right tile's layers 43 px past the 390 px viewport during Flip. A desktop browser ignores overflow that transforms paint; iOS Safari lets the page scroll to it and snaps back when it ends, which reads as the tiles jumping right, then left.
**Rule.** A block whose motion may paint past the column bleeds to the page's edge and clips there (`PAGE_BLEED`: the column's gutter taken back as padding, `overflow-x: clip`, never `hidden`, which makes a scroll container and swallows sticky), so focus rings inside the gutter stay whole and nothing extends the page. Keep clipping off `html` and `body`, where it would hide real overflow from the width tests. Probe it in WebKit at the phone's size, sampling every element's right edge against the viewport while the effects play.
**Since then** (2026-10-17). Each tile now clips its own change as well, so nothing reaches the block's clip; it stays as the page's guard (see "A tile's change bled, seamed, and snapped").

## 2026-10-16 — A gate run in the background reports its last command's exit code

**What happened.** A `pnpm check` chain ran in the background with `; echo …` after it, so the run's notification carried the echo's exit code, 0, while the gate had failed on a doc's formatting; the commit chained after it landed on a red gate, and CI caught what the gate had not (`129056f` mended it). The day before, a background `gh run watch …; gh run view …` had read as a pass the same way.
**Rule.** The commit runs in the same foreground command as the gate, `pnpm check && git commit …`, never after a `;` and never judged from a background run's notification, which is the last command's exit code and nothing more; and a chain of browser-test steps gates each on the one before with an explicit exit check (`&&`, or `|| exit 1`), so a failed step stops what follows.
**Promoted** to CLAUDE.md, "Working habits" (commit on the gate's exit status), and `.claude/skills/ship/SKILL.md`, step 1.

## 2026-10-17 — A table swapped in the page clamps the scroll to the top where the browser does not anchor: keep the box in place across the swap

**What happened.** On Sean's iPhone, tapping the ingredient's pill still jumped the page after the cursor-follow scroll was held. Measured in WebKit with raw taps and mouse clicks from 60 px down: the page went to 0; Chromium stayed. Eleven probes ruled out focus (the jump happens with `focus()` disabled), `aria-activedescendant`, `aria-expanded`, `aria-controls`, the click's dispatch (a synthetic click reproduces it), and the list's markup (a static copy swapped in moves nothing). The scroll lands during the render's own DOM mutations: the virtual DOM removes the table's section, and WebKit lays the page out before the list is inserted, so for an instant the page is shorter than the scroll position and the scroll clamps to 0; the list then arrives, but the position is gone. Chromium clamps the same way (removing the table and forcing a layout before inserting the list sends it to 0 too) and its scroll anchoring restores the position afterwards; WebKit's, and iOS Safari's, does not.
**Rule.** A change that swaps what is under the box keeps the box where it was: note the box's top before the change and, in a layout effect after the render, scroll by how far it moved (About's `keeping()` for its categories, the converter's anchoring wrapped around `dispatch` and the pill's open), so no browser's clamp or anchoring decides it. Test it with anchoring off (`html { overflow-anchor: none }`), which makes Chromium behave like WebKit. When a scroll moves on its own, log `scrollY` at each DOM removal and insertion (hooking `removeChild` and `insertBefore`) before theorizing about focus; reading `scrollY` in the hook forces the very layout under test, which is the tell.
**Promoted** to docs/DESIGN-SYSTEM.md, "Stuck layers" (`useKept`, a stand-in for CSS scroll anchoring).
**Since then** (2026-10-18). Every engine is the one that does not anchor: the page opts out of scroll anchoring (ADR 0025), and `keeping` and `useKept` are the one way a part stays put, no longer a stand-in to retire.

## 2026-10-17 — A tile's change bled, seamed, and snapped: clip it always, put its pieces on device pixels, hide what stands edge-on

**What happened.** After the whole-pixel fix Sean still saw artifacts in the sketchbook, on his iPhone and a desktop: inside a tile, into the next one, and as a change ended. Measured frame by frame on the built site in headless Chromium and WebKit at 1×, 2×, and 3×, at 390, 375, and 1280 px (the lab forced to one effect; the stepped effects stepped on Playwright's clock, `page.clock.install()` then `pauseAt` and `runFor`; the rest paused at a time with `getAnimations()`), four things were wrong. Nothing clipped the tile: Glitch's bands crossed the whole gap into the next tile in every frame (up to a quarter of the tile sideways: 841 to 8,782 device pixels outside the tiles, 57 to 2,129 painted over a neighbor), Blur's halo reached 16 CSS px past every side, Squash's bounce 12 % above, and the perspective of Flip, Tumble, and Flap 6 % past. Where two clipped pieces met on a fractional device pixel, both edges were antialiased and a seam of what lay under showed between them: a Glitch frame built by hand at rest, which should equal the tile, differed in 3 to 28 rows (970 to 6,950 px) at every one of 13 sub-pixel positions, the canvas showing through the band's top and bottom; Scan's beam and its drawn part the same, Flap's halves at the middle where it fell between pixels (a 103 px tile at 1× or 3×). Glitch's last frame still had bands shifted a pixel or two and the 1 px colored fringe, so the settle snapped (422 to 14,119 px changed, by up to 241). And in WebKit only, Flip and Tumble began with a slab of the next sketch a quarter of the tile wide standing in the middle for the whole first half of the change, Flap with one across the midline: the arriving layer waited at exactly 90° through its own `perspective()`, which WebKit draws as a slab, as it drew Doors' right half (1,282 to 17,406 px differed from the picture at rest at the first frame; 0 in Chromium).
**Rule.** A tile clips to its own corners at all times (`overflow-clip`, never `hidden`, which would make a scroll container; the focus ring, an outline, stays outside), so nothing a change paints leaves it and nothing toggles as a change starts or ends. Where pieces meet, put the shared edge on the device's pixel grid from the tile's measured box (`grainOf` in frames.ts: `inset(32.667px …)`, not `30.3%`), where nothing is antialiased, and let the piece on top reach one device pixel past it (`OVER`), which still covers the seam when the grid moves under the tile (a page scrolled to a fraction of a pixel); where there is a layer under everything (Flap's front), give the reach to it instead, since a reach on a layer above shows as a line of its own, and never to a piece that turns, where it would stay at the hinge. A stepped change's first frame and its last are the pictures at rest (the envelope 0 at both ends, nothing cut), so the settle paints nothing new. A layer waiting edge-on is hidden until its turn, a step in opacity at the midpoint, which changes nothing where edge-on is drawn as nothing. Measured again: 0 px outside any tile in every frame of every effect, in both engines at every scale; no row of a hand-built frame changed at any of the 13 positions, in 18 contexts; Glitch's first and last frames equal to the resting pictures; Flip, Tumble, and Flap starting from the picture at rest in WebKit. What remains is the engines' own: a composited layer's edges rasterize a few levels differently from the resting picture at a change's start and end (up to about 700 edge pixels, 20 to 100 levels, both engines; Flap's and Scan's the most), and Chromium re-rasterizes the neighbors' corners while a tile is composited (up to 69 levels at 3×). A clipped layer also draws a shape's antialiased edge a hair differently (single pixels, up to 40 levels), so a seam is tested by rows a quarter changed, never by pixels; and a hand-built probe needs a shape's edge inside the band, or it proves nothing.

## 2026-10-17 — A sentinel a pixel over a sticky edge still touches the window: put it 2 px over

**What happened.** The rule under the stuck box never showed: its IntersectionObserver watched a 1 px sentinel at `top: -1px` inside the box's cell, which, with the cell stuck at the window's top, spans -1 to 0 and touches the window's edge, and an edge-adjacent target counts as intersecting (the spec says so), so the observer never reported it gone.
**Rule.** A sentinel that must leave the window when its part sticks sits 2 px over the part's edge (`-top-0.5`), fully outside at the moment it sticks. Measure `data-stuck` in a probe before trusting a stuck style.
**Promoted** to docs/DESIGN-SYSTEM.md, "Stuck layers".

## 2026-10-17 — Scrolling a part out from under a stuck one: measure, since nearest with a scroll margin lands short

**What happened.** After a pick from deep in Cooking's list, the table replacing it was meant to come out from under the stuck box: `scrollIntoView({ block: 'nearest' })` on the rows cell with `scroll-margin-top` set to the box's height landed its top 35 px behind the box on a desktop (the browser's own arithmetic, not ours).
**Rule.** When a part must sit just under a stuck one, read both rects and scroll by the difference (`scrollBy(0, top - stuckHeight)` when it is behind), in the layout effect after the render; never a scroll margin and a hope. The same effect keeps the box in view where it is not stuck.

## 2026-10-17 — An agent shares the session's scratchpad: brief it into a folder of its own

**What happened.** The sketchbook's builder agent, told to write "a Playwright config of your own in your scratch folder", wrote it over the session's own `playwright.preview.config.ts` (the same scratchpad directory, the same obvious name): the next browser run here pointed at the worktree and a POSIX shim, and failed to start a server.
**Rule.** A subagent's scratch files go in a folder named for it inside the session's scratchpad, said in the brief, and the session's own files carry names an agent would not pick (`playwright.main.config.ts`). Where a test runner reports a server that would not start, check which config it read before anything else.

## 2026-10-17 — A reach past a tile is a whole layer transformed: the slivers were pieces moved out

**What happened.** The slivers Sean's iPhone kept in the gaps after Glitch were clip-path pieces translated out of their tile, which iOS never repainted once they left; the fix clipped every tile at all times, which also cut off the turns' near edge and Squash's bounce, the dimension he liked. Before the clip he had reported slivers after Glitch, never after a flip.
**Rule.** Declare per effect what may reach past its box (`REACHING_EFFECTS`) rather than clipping all or nothing: a whole layer under a transform, what every card flip on the web does, may reach; sliced pieces moved by hand stay clipped. Measure the reach against the gap, never over a neighbor, frame by frame, and let the owner's device judge the compositor, the trial one revert away.
**Since then** (the same day). Sean wanted Glitch's reach back most of all, so the second step lets Glitch and Blur out too: the slivers were bands left outside as a change ended, and the envelope now brings them inside before it ends. If his phone keeps a sliver, Glitch alone goes back in: the rule above stands for the pieces, and the trial tests whether the ending was the whole of it.
**And then** (the same night). His phone kept a sliver after Glitch all the same, so Glitch is clipped for good and the effects are settled: whole layers out, sliced pieces in. The ending was not the whole of it; iOS leaves the pixels a clip-path piece painted outside its tile, whenever it leaves them.

## 2026-10-17 — A change of overflow re-rasterizes a picture's edges, a change of z-index does not

**What happened.** Letting a change reach past its tile by lifting the tile's clip while it ran, and putting the clip back as it settled, left the settled picture differing from the last frame by 140 to 470 edge pixels, up to 108 levels, in Chromium and WebKit alike: the settle, which must paint nothing new, shimmered. Measured by variant, the lift of the tile over its neighbors (`z-index`) cost nothing at the settle; the change of `overflow` was the whole of it.
**Rule.** Never change a composited part's `overflow` at the moment it should look at rest. Change it where compositing redraws anyway, at a change's start, and leave it until the next change needs the other value (the sketchbook's `data-unclipped`, set as a reaching change starts and cleared only as a clipped one does); a stacking change (`data-reach`, `z-index`) may come and go with the change itself.

## 2026-10-17 — A popover keeps its DOM but takes the browser's styles: reset them, and place it inline

**What happened.** The category menu's shell, raised to the top layer as a popover so a scrolling toolbar row could not clip it, came with the browser's own popover styles: `margin: auto`, a border, padding, system colors, and `position: fixed; inset: 0`. Its own `absolute` class beat the browser's `fixed`, and its `width: 200%` then meant the viewport's, not the menu's.
**Rule.** A shell promoted to a popover keeps `m-0 border-0 p-0` and its text color among its classes, and takes its position, offsets, and width inline from its root's rect, placed again on any scroll and on resize. The `popover` attribute goes on only while open, since a closed popover is `display: none` and the shell holds the trigger. The DOM does not move, so `data-open` styles and containment checks keep working.
**Promoted** to docs/DESIGN-SYSTEM.md, "Fluid shells" (`POPOVER_RESET`).

## 2026-10-17 — A tool folded away cannot be measured: keep the widths you read

**What happened.** Fitting the toolbar's tools to its row needs every tool's width, but a tool folded into More is not rendered, and a hidden one measures 0.
**Rule.** Read widths from the rendered row and keep them by id: the first render shows everything, so each is read once; a control not yet rendered takes a like one's width (More, a square, takes the first tool's). Fit from the kept widths, and let a wider window bring the tools back.
**Promoted** to docs/DESIGN-SYSTEM.md, "Icon buttons and the toolbar" (the widths kept).

## 2026-10-17 — A row that scrolls sideways clips the focus rings at its edges

**What happened.** The toolbar's row as a scroll container (a touch screen) clipped the ring around a control at its top, bottom, or ends, since a scroll container clips both axes whatever its overflow-y says.
**Rule.** A control inside a scroll container takes its ring inside its edge (`focus-ring-inset`), the pattern a filled row already uses; padding on the scroller would also do, at the cost of the row's rhythm.
**Promoted** to docs/DESIGN-SYSTEM.md, "Icon buttons and the toolbar" (the scrolling row's rings).

## 2026-10-17 — A width rule that held by a shrink: bound a popup by its container, not by its trigger's luck

**What happened.** The open category menu, twice its closed width, stayed inside the toolbar at 320 px on CI's fonts only because the closed menu had shrunk as a flex item of a wrapping row. Once the row stopped wrapping (ADR 0023) and its groups stopped shrinking, two of the full menu reached past the toolbar and the page's edge, and the test that checked the bound failed on CI alone, where the fonts are wider.
**Rule.** A popup's width is bounded by its container in the code that places it (here `min(2 × menu, toolbar's right edge − left)`), never by what the layout happens to do to its trigger; and a test of a bound at the narrowest width runs in CI's fonts before it counts, since a local pass with narrower fonts proves nothing about it.
**Promoted** to docs/DESIGN-SYSTEM.md, "Fluid shells" (the popup bound by the toolbar's edge).

## 2026-10-17 — A honeypot is read from its field, not from state: a bot sets a value without events

**What happened.** The feedback form's hidden honeypot field was about to be a controlled input, its value in component state. A bot that fills a form sets each input's value from the DOM and submits, firing none of the input events a person's typing fires, so the state would have stayed empty and the honeypot caught nothing.
**Rule.** Read a honeypot's value from the field itself at the moment of sending (a ref), never from state; keep it out of the page and the accessibility tree (`hidden`, `aria-hidden`, `tabindex="-1"`, `autocomplete="off"`), and let the service, not the page, decide what a filled one means.
**Promoted** to docs/ARCHITECTURE.md, "Feedback".

## 2026-10-17 — A click on an island as it comes into view can land before it hydrates: wait for Astro's `ssr` mark to go

**What happened.** The feedback form's test scrolled the About page to the form and clicked a kind at once. The island hydrates on `client:visible`, so the click sometimes landed first: the radio moved and the example did not, and the test waited on a render that never came; a retry passed, which is how a race looks.
**Rule.** Before the first interaction with an island that hydrates on its own schedule, wait for Astro's own signal: the `astro-island` element drops its `ssr` attribute once hydrated (`expect(island).not.toHaveAttribute('ssr')`). The converter's `data-hydrated` mark (`ready(page)`) is the same wait for the island that has one. A change the island makes to the page is not the signal, since a click lost before hydration never makes it.

## 2026-10-17 — getByLabel finds a hidden field: a role query says whether the tree holds it

**What happened.** The check that the honeypot is in neither the page nor the accessibility tree asked `getByLabel('Leave this field empty')` to count 0 and found 1: a label query matches by the DOM's association, hidden or not, so it was no test of the tree.
**Rule.** Absence from the page is `toBeHidden()`; absence from the accessibility tree is a role query with the name (`getByRole('textbox', { name })`) counting 0, since role queries leave hidden elements out by default.

## 2026-10-17 — A static header lines up with an island's column through one page grid, handed down by subgrids

**What happened.** The header, static Astro outside the converter island, was to end where the box ends, and to narrow with the box where a tablet opens a side panel beside it. Its width could not come from the island's state, and a copy of the box's `max-w-xl` on it would have overhung the box the moment the box narrowed.
**Rule.** Put the page itself on the grid: `main` declares the two tracks once (`CONVERTER_GRID`), the header takes the first, and every block between the page and the island's cells, the island's section, the layout's root, its grid, spans both tracks and hands them on with `grid-cols-subgrid` (`IN_CONVERTER_GRID`); the rows stay each grid's own. A track capped at a container size names the token in a utility (`grid-cols-box-and-side`, `var(--container-xl)` in global.css), since a class cannot carry `var()` past the token guard and a literal `36rem` would be a second copy of `max-w-xl`.
**Promoted** to docs/DESIGN-SYSTEM.md, "A column beside the rows".
**Since then** (2026-10-18). The grid has three tracks, the margin first (`grid-cols-margin-box-and-side`), the column second (`COLUMN_CELL`), a side panel's third, and the footer lays its line on the same tracks (`CONVERTER_FOOT`); the header still takes the column's track through the page grid.

## 2026-10-17 — A phone zooms into a field whose text is under 16 px: text fields are 16 px, never a viewport lock

**What happened.** Tapping into the feedback form's email or message on Sean's iPhone zoomed the page in and hid what was being typed. iOS Safari zooms into any focused field whose text is smaller than 16 px, and the fields had inherited the stack's 14.
**Rule.** A text field's text is at least 16 px (`text-base` in `TEXT_INPUT`); the label may stay smaller. Never stop the zoom from the viewport tag (`maximum-scale=1`, `user-scalable=no`): that takes pinch zoom from everyone, against the 400 % zoom rule. A browser test reads each field's computed size.
**Promoted** to docs/DESIGN-SYSTEM.md, "Fields" (the text fields).

## 2026-10-18 — A tap target past its drawing is a mouse target too: give the margin to coarse pointers alone

**What happened.** The segmented control draws 32 px and took a 44 px tap through its label, so with a mouse the pointer cursor and the click reached 6 px above and below the strip, which read as the control answering from outside itself (Sean, on the feedback form's kinds).
**Rule.** A target larger than its drawing is for fingers: put the extra size under `pointer-coarse:` (`pointer-coarse:min-h-11`) and let a fine pointer's target be the drawing, as long as the drawing clears the 24 px minimum. The 44 px rule is a touch rule; a mouse needs no slack it can see.
**Promoted** to docs/DESIGN-SYSTEM.md, component rule 4 and the `SegmentedControl` row.

## 2026-10-18 — A centered column steps aside for a classic scrollbar: keep its gutter

**What happened.** Opening the calculator or a settings panel on Sean's Windows browser moved the whole column a few pixels left. The panel made the page taller than the window, the classic scrollbar appeared and took its 15 to 17 px from the layout width, and a column centered with auto margins re-centered in what was left.
**Rule.** Reserve the scrollbar's room always, `scrollbar-gutter: stable` on `html`, the standard for this since 2022 (`overflow-y: scroll` was the old way, a bar drawn with nothing to scroll). The page then keeps its place as content grows; on a page shorter than the window the strip stays empty, on classic-scrollbar systems alone. Headless Chromium draws no classic scrollbar, so a test cannot see the shift: it reads the rule and holds the column's edge across a panel opening, and a probe showed the gutter reserving 15 px.
**Promoted** to docs/DESIGN-SYSTEM.md, "Lists" (the scrollbar's room).

## 2026-10-18 — A reserved gutter takes the scrollbar's width from every window: size test windows by the content, and start the page column on a whole pixel

**What happened.** `scrollbar-gutter: stable` went live and CI's browser job failed seven tests, and this headless Chromium sixteen: every check that sized the window by a number (a 544 px window for a 512 px column, 375 for a phone's toolbar, 610 for the header's `xl` size) now had 15 px less content, since the gutter is kept whether or not a bar shows; a check that no page scrolls sideways read `scrollWidth − clientWidth` as −15; and at 1280 px the sketchbook's tiles sat on a half pixel, the centered column's remainder (1265 − 1024) being odd.
**Rule.** A test that wants a width wants the content's width, a phone's: size the window with `windowOf(page, width, height)` after the page has loaded, which adds the room the page keeps (`documentElement.clientWidth − body.clientWidth`, 15 where scrollbars are classic, 0 where they overlay); read sideways overflow as `max(0, scrollWidth − clientWidth)`; and keep a true-window check where the real case matters (the 320 px rule, the tiles' whole pixels). A centered column starts on a whole pixel by rounding its start margin down (`mx-page`: `round(down, …, 1px)` on `margin-inline-start`, the end margin taking the rest), since auto margins split an odd remainder into halves. Widths these docs give as windows are the content's: on a classic-scrollbar system add the bar's 15 px.
**Promoted** to docs/DESIGN-SYSTEM.md, "Lists" (the scrollbar's room, `mx-page`), and docs/TESTING.md, "End to end" (`windowOf`).

## 2026-10-18 — A tab that hides its panel before showing the next lets WebKit clamp the scroll: keep the row in place

**What happened.** On Sean's iPhone, tapping Every formula sent the About page to its top. Chromium, as a phone or a desktop, kept the scroll; WebKit as an iPhone reproduced it: scrolled to the foot, the tap left the page at 0. The switch hides the Feedback panel and shows the formulas' in one render, but WebKit lays out and clamps the scroll between the two, when the page is briefly as short as the tabs, and the clamp stays once the longer panel is in. The hash update was not it (the same with `replaceState` stubbed).
**Rule.** A swap that passes through a shorter page keeps an anchor where it sat: `keeping(anchor, change)` (lib/keeping.ts, from the formulas' list) reads the anchor's top, runs the change, and scrolls by the difference; a change React renders goes in through `flushSync` so it has happened when the anchor is read again. Chromium's scroll anchoring hides the fault, so a check in Chromium is no proof: try WebKit.
**Promoted** to docs/DESIGN-SYSTEM.md, "Tabs" and "Stuck layers" (`keeping`), and the tidy checklist's Tests section (WebKit for a scroll or focus fault).

## 2026-10-18 — A minimum height on a padded element counts the padding: a row's height goes on the row

**What happened.** A first cut at the page's foot gave the footer `min-h-12` for a 48 px row, on the element that also carries the page's bottom padding. Tailwind's preflight sizes every box as border-box, so the minimum height counted the padding inside it: with 48 px of padding the row had no minimum at all, and with 32 px a minimum of 16. The smoke test on the phone project measured the row at 44, the About link's own box, and failed; a measurement by hand had passed only because the link's box was the row.
**Rule.** A minimum height for a row goes on the row's own element, never on a container that also holds padding; and a rule a doc claims is measured in the test with the padding taken out, so the test fails before the doc is wrong. Here the rule was simpler than the cut: the page's padding is one step at every width, and the link's 44 px target is the row.
**Promoted** to docs/DESIGN-SYSTEM.md, "The page's two ends mirror".

## 2026-10-18 — A step several recipes share is one token: a theme spacing key over a variable set per screen class

**What happened.** The page's frame, 16 px on a phone and 24 from `sm`, was first written as `px-4 sm:px-6`, `py-4 sm:py-6`, `pb-4 sm:pb-6`, and `-mx-4 px-4 sm:-mx-6 sm:px-6` in four recipes: the same step four times, which Sean called out (one-offs, where a token should be). Tailwind v4 takes a named spacing key in `@theme inline` (`--spacing-frame: var(--page-frame)`), and the variable it points at can change at a breakpoint in the base layer (`--page-frame`, with `@variant sm` inside the `html` rule), so `px-frame`, `py-frame`, `pb-frame`, and `-mx-frame` all follow one step set once; the token guard passes a named key as it passes the scale, and the built CSS carries the variable at both values.
**Rule.** A spacing that several recipes share, with or without a step, is one spacing key in the bridge over one variable in the base layer, documented in the bridge's table; the recipes read the key. A per-theme token stays in the themes' files and the contract; a per-screen one lives in the base layer, since no theme changes it.
**Promoted** to docs/DESIGN-SYSTEM.md, "Sections step by the frame".

## 2026-10-18 — Playwright scrolls a control into view before it clicks: a test of a page that must not move brings the control into view first

**What happened.** The test that holds the table's card in place as Edit starts failed by 3 px on a phone, 181 on CI's desktop, and 430 once it measured from higher up, after the page's frame shrank. Neither the anchoring nor the focus had moved anything: a probe that logged the scroll around the click showed Playwright scrolling Edit into view before pressing it, since the earlier click had left Edit just under the window. The test had passed for days only because its geometry always ended at the page's foot, with Edit in view.
**Rule.** A test that measures the page's place around a click brings the control into view itself first (`scrollIntoViewIfNeeded`), as a person who presses it has it, and measures after; a jump on a click is checked against the scroll before the click before the product is blamed. A failure by a few pixels after a layout change is a sign of this, not of the rule under test.

## 2026-10-18 — Playwright's `--project` takes its name with an equals sign when files follow

**What happened.** `playwright test --project desktop-chromium e2e/about.spec.ts`, meant to run one spec on one project, ran the whole suite: the spec files after the flag were swallowed and nothing narrowed the run, which showed only in how long it took.
**Rule.** Join the project to its flag whenever spec files follow it, `--project=desktop-chromium e2e/about.spec.ts`; a run that takes far longer than the one spec warrants is the sign the filter was lost.
**Promoted** to `.claude/skills/ship/SKILL.md`, step 1.

## 2026-10-18 — Astro's dev toolbar covers the page's foot under the test runner: switch it off there

**What happened.** The test that holds the table's card in place as Edit starts passed against the built preview and failed on CI by 181 px, and against a dev server by the same. `elementFromPoint` at Edit's center gave `astro-dev-toolbar`: the dev toolbar's bar sits over the foot of a page scrolled to its end, Playwright found Edit covered, scrolled the page to get round it (two scroll events before the click), and the card moved before it was measured. The preview has no toolbar, which is why the suite passed locally.
**Rule.** The browser suite runs with the dev toolbar off: `playwright.config.ts` sets `BIGSMALL_E2E` for the server it starts (CI's too) and `astro.config.mjs` reads it, so the page under test is the page, with nothing of the tooling laid over it; a server started by hand keeps the toolbar, and the focus walk still skips it there. A test that passes on the build and fails on CI's dev server is first checked for what the dev server adds to the page (docs/LEARNINGS.md, "A test that passes on the build can fail on CI's dev server").
**Promoted** to docs/TESTING.md, "End to end" (the focus walk, `BIGSMALL_E2E`).

## 2026-10-18 — A track kept for an occasional panel reads as an uneven page: center the column, and let the pair re-center when the panel opens

**What happened.** The two-track grid of 2026-10-17 kept the box still as a side panel opened by always reserving the panel's track, so the converter's column sat at the page's left with empty room beside it most of the time, while About's column was centered: the header sat at x 144 on one page and 344 on the other at 1280 px, and a page resized showed uneven gaps around a column waiting for a panel. Sean, 2026-10-18: the header must sit in one place on every page, the padding must read the same, and a layout should scale across pages the standard way; a panel may move or narrow the column.
**Rule.** One content column, centered, on every page, the header on it; a panel that seldom shows takes no room until it opens, and then the column and the panel re-center as a pair (the column slides half the panel's width) rather than the page carrying the panel's room always. What must not change as a panel opens is the box's measured width, not its place. A layout decision is checked on every page it touches, at the header's position, before it ships.
**Since then.** The pair re-centering gave way the same day to the margin first, Sean's question whether no movement is the better pattern (docs/DESIGN-SYSTEM.md, "A column beside the rows"): the panel takes the window's margin before the column moves, and the column slides only by what the panel lacks; a trial, one revert.

## 2026-10-18 — A phone emulation's window settles after the first layout: measure a page's end against the body, once the page is ready

**What happened.** The foot's test held the About link and the privacy line the same distance from the page's end on both pages, read as the document's `scrollHeight` less the text's bottom, and passed on the build at a desktop's width while CI's phone project failed it by 102 px on the converter page. Measured on the Pixel 7 emulation: right after navigation `innerHeight` and `scrollHeight` read 919 while the body, `min-h-dvh`, was 839; a moment later all three read 839. The emulated window's height settles after the first layout, so a page shorter than the window reads taller than it is for an instant, longer on CI's dev server than on the build; About, taller than the window, never showed it.
**Rule.** A page's end is the body's end (`document.body.getBoundingClientRect().bottom`), the column the footer closes, never the document's `scrollHeight`, which is the window's where the page is shorter; and every measurement on the converter page waits for `ready(page)` first, as docs/TESTING.md says, since a reading taken at once lands in whatever has not settled yet.

## 2026-10-18 — A click's focus is given, never assumed: WebKit's first run in the suite found Done unfocused after Edit

**What happened.** The first WebKit run of the settings spec, on the phone project added for the specs that scroll and focus, failed where both Chromium projects passed: after a click on Edit, the button that now reads Done was not focused. Safari does not focus a clicked button, which the side panels already allow for by giving focus on the press, so in Safari Escape after a mouse press on Edit would not have ended it, and nothing in Chromium showed it.
**Rule.** A control the keys should reach after a press takes focus on the press itself: a `mousedown` listener on the card focusing the pressed `button` or `input`, skipping one that prevents its press's default to keep focus elsewhere, as SidePanel and now the table's card do. A behavior that depends on a click's focus is checked in a second engine, which is what the WebKit project is for.
**Correction** (the same day). Giving focus on the press was not enough: Safari drops it again as the press's default runs, so the listener calls `event.preventDefault()` before `focus()`, in the table's card and in the side panels, whose listener had given focus without it. The WebKit project's run found the first fix short, as it found the fault.
**Promoted** to docs/DESIGN-SYSTEM.md, "Side panels" (the press's default prevented before focus is given).

## 2026-10-18 — A chain's `;` between stages runs the next stage after a failed gate: one `&&` list, format included

**What happened.** A background chain of three gated stages began each stage with `pnpm format > log;` before its `pnpm check && …`. The `;` ends the `&&` list, so when the WebKit stage's browser run failed and its `exit 1` stopped that list, the next stage's `pnpm check` ran anyway, `git add -A` swept up the WebKit stage's edits, and they were committed under the outcomes' message (`9925246`) and pushed, the outcomes themselves never written. The ship skill's rule covered the commit after the check; a `;` anywhere in a chain breaks it the same way.
**Rule.** A chain joins every command with `&&`, `pnpm format` included (`pnpm format && pnpm check && …`), with `|| exit 1` after a subshell that must gate what follows; a `;` appears only where what follows must run whatever happened (an `echo` of an exit code, nothing that commits or pushes). A chain of several commits is several chains, or one `&&` list end to end.
**Promoted** to `.claude/skills/ship/SKILL.md`, step 1 (every stage joined with `&&`, `pnpm format` included).

## 2026-10-18 — Tailwind v4 leaves a button on the browser's arrow: the hand is one base rule, never a class here and there

**What happened.** Sean saw the arrow over the tabs, the menu triggers, the toolbar's tools, Reset order, Show hidden, and the copy buttons, and the hand over the rows, the menus' choices, and the segmented controls. Tailwind v3's preflight gave buttons the hand; v4's leaves them on the browser's default, so every `button` showed the arrow while the class lists that carried `cursor-pointer` showed the hand.
**Rule.** The cursor is one base rule in `global.css` (docs/DESIGN-SYSTEM.md, "Cursors"): the hand on every control that answers a click, the arrow on a disabled one, and a recipe carries `cursor-pointer` only for a row or label that is not a button. A smoke test reads every control's computed cursor, so a new control cannot miss it.

## 2026-10-18 — A page grid learns a panel is open through :has(), no script telling it

**What happened.** The margin-first slide needs the page grid to know whether a side panel is open: its margin track is `max(min())` of the centered inset and the room the panel leaves. The panel is a cell the island renders only while a panel is open, and the grid sits on `main`, outside the island, so the first thought was an attribute the island sets on `main` from an effect.
**Rule.** The grid reads the cell itself: `main:has([data-side-cell])` sets the track's variable inside the utility (`grid-cols-margin-box-and-side`), so the page's one declaration holds both states and nothing in script touches the page. A layout that depends on whether some part is present asks `:has()` before it asks an effect.
**Since then.** The variable moved to the page's root the same day (`html:has([data-side-cell])`, the base layer), so the footer, outside `main`, lays its line on the same tracks and follows the column (`CONVERTER_FOOT`): a variable one grid sets for itself serves one grid; set where every reader inherits it, it serves them all.

## 2026-10-18 — A panel beside a stuck head opened where the head was, and the browser's focus scroll decided the rest

**What happened.** With a long table scrolled and the head stuck at the window's top, the calculator opened at the box's row, 189 px above the window on a desktop and behind the stuck head on a phone, its keys peeking out under the head's strip; Units opened the same way and then the page jumped to the top, because the browser scrolled to the first control the panel focused, which the calculator's "=" key, in view, never asked for. The measurement that lets the head go for a panel below it read the panel's top against the box's bottom, which a stuck box, drawn at the window's top, got wrong.
**Rule.** A panel's place is the layout's to decide, never the focus scroll's: focus moves with `preventScroll`; from md the panel sticks with the stuck head at the box's measured top and scrolls inside below the window's height; below md the head is brought to the window's top with the panel under it. A measurement of where a panel sits reads the axis a sticky element does not move, sideways here. And the card itself is what scrolls, never a wrapper around it: a wrapper with the overflow clipped the card's corners and ring at its edges (its title cut in half once scrolled), while a card scrolling its own content keeps its border whole, the ring and shadow being its own box's.
**Promoted** to docs/DESIGN-SYSTEM.md, "Side panels".

## 2026-10-18 — A word sat high in its pill: the line box counts the font's ascent, the cap trim does not

**What happened.** The formulas' exact and measured tags, a 12 px word in a 16 px pill with no vertical padding, read as if padded more above than below (Sean, 2026-10-18). Measured: the line box is the font's ascent and descent, 13 and 3 px, while a lowercase word's ink reaches 8 or 9 px over the baseline, so the word sat 5 px under the pill's top and 3 over its bottom. Nudging it with a margin or a padding would be a number tuned to one font.
**Rule.** The standard, CSS Inline Layout 3's `text-box-trim: trim-both` with `text-box-edge: cap alphabetic`, draws the box from the cap height to the baseline, and symmetric padding then centers the ink by construction: a house utility (`text-trim-cap`) under `@supports`, its padding inside the condition so a browser without the trim keeps the box it had. It applies to a block container (a flex item is one; a plain inline span is not). Chromium and WebKit both trim today; the pill goes from 16 to 16.4 px and the word sits centered in both.
**Correction, the same evening.** Sean's eye on the cap trim: "it does not look like anything changed; the padding still looks like more on top." Measured, the cap trim had moved a lowercase word's body one pixel, the cap standing 3 px over the x-height. An x-height trim was tried (`6432698`), its padding derived so the pill stayed 16 px (`calc((var(--spacing) * 4 - 1ex) / 2)`): the body sat 5 px over and 5 under, and to his eye the word now sat too high, with too much under it, since the eye weighs the ink's extent, the tallest letter to the baseline, not the x-height band alone; and the derived padding was "a weird dimension, a hack technique". Reverted the same evening: the cap trim with the spacing scale's 4 px, the standard idiom (`text-box-trim: trim-both; text-box-edge: cap alphabetic`), reads closest and is kept. The rule stands at its first sentence: the standard mechanism with standard tokens; a label need not be optically perfect, and a dimension computed from a font metric is not a token.
**Promoted** to docs/DESIGN-SYSTEM.md, "Small labels" and the `text-trim-cap` utility.

## 2026-10-18 — A probe at one scroll offset is not a measurement: the suite found the offset

**What happened.** To let the stuck head stay stuck with a panel open below md, in Edit, and with Hidden open (Sean's ask: one rule, the panel scrolling under the bar as a sticky bar's content does), the head was forced stuck on an iPhone 13 over Units, the calculator, Edit, and the Hidden list, and axe reported nothing at each of the four scroll offsets tried; the rows measured as 44 px labels. The rule was built, and the suite's settings test, which scrolls to a place of its own, failed on axe's target-size: a Hidden-list checkbox, 16 px, half under the stuck toolbar's category button, "insufficient space to its closest neighbors, 6 px". The 2026-10-17 exception had been that finding, not a fear. The probes passed because none of their offsets put a 16 px box half under a stuck control; the label around the box does not count for axe, which sizes the input itself.
**Rule.** A sticky bar over controls smaller than 24 px fails WCAG 2.5.8's size test at some scroll offset, since spacing cannot be guaranteed under a bar; probing a few offsets proves nothing, and a passing probe is not a passing suite. Either the bar lets go over such controls (today's rule) or the controls grow to the minimum target: for a 16 px look, the design system's own pattern, the input visually hidden inside a 44 px label and the box drawn beside it, as the segmented control's radios already are. Measure a sticky rule with the suite, at every offset a test chooses, before calling an exception false.
**Since then** (the same night). The controls grew: every checkbox is drawn inside its 44 px row (`Checkbox`, `0c51726`), and the head lets go nowhere ("The head let go for 16 px targets; the targets grew, and the exception went").

## 2026-10-18 — A push deploys on its own: Actions starts only by hand, and Vercel must not wait for it

**What happened.** Every push to `main` started two Actions jobs, and Vercel held the production deploy until both passed. The lint-and-build job took about a minute; the browser job about eleven, including on docs-only pushes. The `reelatlas` account's 2,000 included minutes, shared by every repo, were at 90% with this repo the only one running Actions (Sean, 2026-10-18).
**Rule.** A push deploys when Vercel's own build finishes. `pnpm check` before a push, and `pnpm e2e` when behavior changed. The workflow (`.github/workflows/ci.yml`) starts only from Actions → Run workflow or `gh workflow run CI`. The Deployment Checks list in the Vercel project stays empty: a listed check that the workflow no longer runs leaves the deploy waiting.
**Promoted** to CLAUDE.md, rule 7, docs/DEPLOYMENT.md, "How it works", and docs/TESTING.md, "CI".

## 2026-10-18 — The head let go for 16 px targets; the targets grew, and the exception went

**What happened.** From 2026-10-17 the stuck head let go while Edit was on, Hidden was open, or a panel sat between the box and the table below md: their 16 px native checkboxes passed under the stuck box within a target's safe space of the field, and axe's target-size fired. Sean asked for the bar to stay, as a sticky bar does everywhere, with the panels and lists formatted to live under it. Probes with the head forced stuck passed at four scroll offsets, the rule was built, and the suite's settings test, scrolling to a place of its own, failed on that same finding: the probes had never put a box half under a stuck control ("A probe at one scroll offset is not a measurement"). The cause was the control, not the bar: a 16 px box is under WCAG 2.5.8's 24 px and passed by spacing alone, which no sticky bar can guarantee.
**Rule.** A control that may pass under a sticky bar meets the target minimum on its own. The design system's pattern, the segmented control's: the native input visually hidden inside a 44 px label and the look drawn beside it (`Checkbox`), which keeps keys, labels, and screen readers as they were and makes the row the target. With that, the sticky rule is one rule again, and the exception for small boxes is gone rather than remembered.
**Promoted** to docs/DESIGN-SYSTEM.md, "A list of choices" (`Checkbox`), "Stuck layers", and "Side panels".

## 2026-10-18 — Chrome scrolls to a focused control's static place inside a sticky bar

**What happened.** With the head stuck and the calculator or Units open on a phone, Escape or the button's second press closed the panel and Chrome scrolled the page to the top; WebKit stayed put. The close returns focus to the panel's toolbar button, and Chrome's scroll-into-view on focus used the button's static place in the page, above the fold, not where the stuck toolbar shows it. Sean read it as the head no longer sticking after a panel closed.
**Rule.** A focus return inside a sticky bar is given with `preventScroll`, and the page scrolls only when the control's measured box is out of the window (`focusStill` in Converter.tsx), as a panel's own focus on opening already did. Measure the control's place before scrolling to it; a browser's own focus scroll trusts the static layout.
**Promoted** to docs/UX-SPEC.md §1 (closing a panel leaves the block stuck where it was) and docs/DESIGN-SYSTEM.md, "Focus" (focus moves without a scroll of its own under a stuck head).

## 2026-10-18 — What passes under a stuck layer shows at its edges, and what leaves the flow pulls it down

**What happened.** With the head stuck over an open panel on a narrow window, three things, all on the live build: the panel's accent ring ran up the head's edges as the card scrolled under it, since the head's canvas was exactly the column's width and the ring sits a pixel outside the card; switching from the calculator to Units placed the new panel where the old one had scrolled to, half under the head; and closing a panel pulled the page to the top in Chrome, whose scroll anchoring kept the table's row in place as the panel's height left the flow, so the head slid down out of its stuck place and read as no longer sticking.
**Rule.** A stuck layer's canvas is wider than what passes under it, a step past the column on both sides. A placement rule for a panel runs on the panel's identity, not only on whether one is open. And a removal above the window's content is measured after the browser has anchored: if the head was stuck and is no longer at the top, scroll by its offset, so the head keeps its place and the rows move instead.
**Promoted** to docs/DESIGN-SYSTEM.md, "Stuck layers" (the canvas a step past the column), and docs/UX-SPEC.md §1 (a switch places the new panel; a close keeps the head stuck).
**Since then** (the same night). The nudge went: the page opts out of the browsers' scroll anchoring (`overflow-anchor: none` on `html`, ADR 0025), so a panel's height leaving the flow moves the rows and never the page, in Chrome as in Safari.

## 2026-10-18 — Prettier pads a Markdown table's rows: an edit script anchors on a cell's text, not the row

**What happened.** Three edit scripts in one night matched a findings-log row, a bridge row, and a row's start with the spaces Prettier had padded them to; a later row widened the column, every row's padding changed, and each anchor missed mid-chain, with the gate already running.
**Rule.** Anchor on a cell's text without its padding or trailing pipe (`startswith("| \`name\`")`, never `"| \`name\` |"`), insert new rows by line index, anchor on the file as it is now rather than on a discarded attempt's text, and carry the edits a failed anchor left in a follow-up script. Run `pnpm format`after a scripted edit, never read its output as the anchor.
**Promoted** to`.claude/skills/tidy/SKILL.md`, step 5.

## 2026-10-18 — Disabled read three ways: a state's look is the system's, not a component's choice

**What happened.** The tidy's reviewer found a button fading whole at 50 %, a segmented strip taking the muted ink, and the drawn checkbox fading its box alone, each built on its own day with its own answer to "can do nothing now"; and a soft-accent fill under the pointer was opacity on the button and a themed tone on the chip.
**Rule.** A state is defined once, in the design system's "States", with its utility and its variants named; a component takes its look from there and adds none of its own. Disabled fades as a whole (opacity, which WCAG allows an inert control), with two named variants: a fixed switch fades its box alone, and a segment inert alone in a joined strip takes the muted ink; a soft-accent fill under the pointer takes `accent-soft-hover` wherever it is.
**Promoted** to docs/DESIGN-SYSTEM.md, "States".

## 2026-10-18 — A hover by opacity let a label's contrast fall under the pair its theme passes: a derived color toward the ink holds it

**What happened.** The primary button hovered at 90 % opacity, the accent let through to the canvas. Measured in every theme while making it a color (`accent-hover`), the label on that lighter fill fell to 4.19:1 in Sakura and 4.55 in Daylight, under or at the 4.5 the theme test holds `on-accent` on `accent` to; nothing had tested the hovered state.
**Rule.** A state's color is derived, never an opacity on a control with text, and its contrast pair joins `CONTRAST_PAIRS`. A hover tone mixes the fill toward the ink, the page's own text color, which is deeper on a light theme and brighter on a dark one and always away from the label's color, so the label's contrast can only rise (Sakura 4.87 to 5.41). Measure the candidates in every theme before choosing the mix; the themes' tokens are on disk.
**Promoted** to docs/DESIGN-SYSTEM.md, "States" and the bridge's derived colors.

## 2026-10-18 — A theme's corner token on a 16 px box made a circle: a mark's corner scales to its own side

**What happened.** The drawn checkbox's box took `rounded-sm`, the theme's small corner, sized for keycaps and tags: 8 px in Sakura and 6 in Daylight, which on a 16 px box is a circle or near one, and a circle says radio (Sean, 2026-10-18: "checkbox should never be circular").
**Rule.** A mark whose shape carries meaning does not take a corner sized for larger things: its corner is the theme's, capped where its shape would stop reading (`--radius-mark`: the small corner at most a quarter of the box's side, so only the themes past the limit change), and a test reads the corner against the side in every theme, since the roundest theme is where a shape rule breaks first.
**Promoted** to docs/DESIGN-SYSTEM.md, "Corners".

## 2026-10-19 — Bing's import from Search Console takes a Domain property as its bare and `www` addresses, both verified

**What happened.** Search Console holds bigsmall.work as a Domain property, verified by a `TXT` record at Porkbun. Bing Webmaster Tools' import listed two sites, `https://bigsmall.work` and `https://www.bigsmall.work`, their addresses clipped in the dialog so they read as another site's; both imported verified, with no DNS record of their own, and without the sitemap, which Search Console had not fetched yet.
**Rule.** Import first, since it carries Google's verification, and submit the sitemap by hand afterwards; read a clipped address through its copy icon before deciding whose it is. The manual add with a CNAME at Porkbun is the fallback, not the route.
**Promoted** to docs/DEPLOYMENT.md, "Search".

## 2026-10-19 — Safari deletes a site's storage after seven days without a visit: a flag kept on a phone needs a page that shows it

**What happened.** Umami's exclusion is a key in the browser's storage (`umami.disabled`), set once per browser on 2026-10-18 through the owner's page, which was retired the same day. Sean then asked for an easy way to be sure a testing browser is not counted, thinking of his changing IP. The IP never enters it, but Safari's tracking prevention deletes all of a site's script-written storage after seven days of Safari use without the user interacting with the site, so an iPhone loses the key in a quiet week and counts again, with nothing saying so.
**Rule.** A flag kept in a phone's storage is not set once: give it a page on the site's own origin that reads the state each time it loads and switches it, bookmarked on the device, and glance at it before a testing session. A retired tool whose need recurs comes back as a standing one, with its reason and its retirement in the roster.
**Promoted** to docs/DEPLOYMENT.md, "Our own visits", and the roster (docs/DESIGN-SYSTEM.md, "Tuning labs").

## 2026-10-19 — A gap that was a tap target's room went with the target: a group declares its own

**What happened.** The segmented control's 44 px label became a touch screen's alone on 2026-10-18, a mouse's target the 32 px drawing (Sean's call). The fraction sizes' two strips, stacked in one grid, had been 12 px apart only because each label was 44 px around its drawing; on a mouse they touched, and no test measured the gap. Sean saw it the next day: "that padding on the round to in display got removed between the fractions".
**Rule.** A gap between parts is declared where the parts are grouped, never left to a target's room, which is a pointer's affair: the group's `gap-y-3` on a fine pointer and none on a coarse one, where the taps' room is the 12 px, and a test measures the gap in both Chromium projects, a mouse's and a touch screen's.
**Promoted** to docs/DESIGN-SYSTEM.md, "Settings".

## 2026-10-19 — Git Bash rewrites an argument that starts with a slash into a Windows path: a test pattern names its page without the slash

**What happened.** `pnpm e2e:preview -g "/dev/owner" e2e/smoke.spec.ts` ran no tests: Git Bash's path conversion had handed Playwright `-g 'C:/Program Files/Git/dev/owner'`, and "No tests found" exited 1, which the chain read as a failed suite.
**Rule.** A pattern or any argument that begins with `/` is rewritten by MSYS before the program sees it: write the pattern without the leading slash (`-g "dev/owner renders"`), or set `MSYS_NO_PATHCONV=1` for that command; and read "No tests found" as a wrong pattern, never as a pass or a product fault.

## 2026-10-19 — A subagent's report comes back as text, never as a file it writes: brief it so, and save it yourself

**What happened.** The demand map's five workers were briefed to write `findings.md` in their folders. Each gathered well and wrote its data files through its own scripts, then ended with the report unwritten and no reply: the harness's Write tool refuses a subagent's report file ("Subagents should return findings as text"). A second sitting per worker, briefed to deliver the report as the text of its reply, cost about 100,000 tokens each.
**Rule.** A brief asks for the report as the reply's text and for data files through the agent's scripts; the orchestrator saves the report into the folder. Never brief an agent to write a report file.
**Promoted** to `.claude/skills/orchestrate/SKILL.md`, §4 and §5.

## 2026-10-19 — A chart read by eye was half a size off and a scan's text layer could not be trusted: a figure in an image is read from the image, by measurement

**What happened.** The demand map's shoe-sizes worker read the Brannock chart's image by eye and put UK adult 4 under US men's 5 at nine inches; the wave 2 checker measured the ticks in pixels (69 an inch) and found UK 4.5 there, half a size off, which is also what most retail charts say. The same checker found the GOST PDF of ISO/TS 19407 a scan whose text layer misread cells, rendered its eleven pages to images, and read the formulas and Table 2 from those; its recomputation then agreed with the worker's count only with the standard's printed steps (321 of 324), not with the exact barleycorn and Paris point (317), which the worker had reported as equal.
**Rule.** A figure in a scan or a chart is read from the image, by measurement (a tick's pixel against a known scale, a table cell against the rendered page), and the record says it was; a count that depends on which constants were used says which. A checker's brief asks for the recomputation with the agent's own script from the re-downloaded source.
**Promoted** to `.claude/skills/orchestrate/SKILL.md`, §2 and §6.

## 2026-10-19 — A grammar with two readings of one mark reads neither: a mark opens only the pair it starts, and a reading that leans on a context spelling needs every part named

**What happened.** The compound reader (ADR 0026) resolved `5'11"` to nothing: the prime read as feet in one pair and as an arcminute in the angle's, both readings held, and a tie is no reading. Then `2 d 3 h` read as an angle, since `d` starts the angle pair as a context spelling and the rule that leaves a last unreadable word to the query turned `3 h` into 3 arcminutes. Each fix was a rule about what may start or finish a reading, not a special case: a mark opens only the pair whose first part it writes (a lone prime is feet; after a degree it is minutes), and a reading begun on a context spelling (`d`, `m`, `s`) must name every part, so it never borrows the omitted-unit or leave-to-query leniencies.
**Rule.** When a grammar admits more than one reading, decide ties by what may _start_ a reading, not by which pair comes first in the catalog; and give the lenient rules (an omitted unit, a trailing word left to the query) only to readings whose first part is named outright. Write the ambiguous forms into the test list before the reader (the must-read and must-not lists did this for `5 m 30`, `5 s 30`, `2 d 3 h`).

## 2026-10-19 — A stuck heading's rect is not its place in the flow: scroll to the top before measuring where to scroll it

**What happened.** The browser test that scrolls a section's heading to just under the stuck head took the heading's `getBoundingClientRect().top + scrollY` as its place in the document. Once the Mixed units section made Length's table long enough for the page to be scrolled past that heading, the heading was already sticky-shifted when measured, the target landed past its group, and the heading pinned to its group's end, 10 px off; the test had passed before only because the page could not scroll that far. A probe of the geometry (the heading's rect, its group's bottom, the scroll) found it in one run where reasoning about it had not.
**Rule.** A sticky element's rect is where the browser holds it, not where it sits in the flow. A test that computes a scroll target from an element that may be stuck scrolls to the top first, where nothing is stuck, then measures. And when a layout test fails by a few pixels after an unrelated change, probe the geometry before reasoning about it: a page that got longer can let a test scroll where it never could.

## 2026-10-19 — A measurement's DOM write is undone only by a render of the same prop

**What happened.** `useFieldFit` measures a field by writing `hidden` straight onto the chip's name while it tries each step, and the chip renders the name with the `hidden` the fit decided, so the DOM and the render agree. A pair's chip was given its name alone, rendered with `hidden` never set; where the number took the name's room (a pair taken from the table on Sean's iPhone), the fit's write stayed: Preact saw a prop that had not changed and left the attribute as it was, and the chip went blank, with no symbol to fall back on. A phone-sized Chromium showed the name, its shorter number fitting beside it, so the live check had passed.
**Rule.** An element a measurement hides is rendered with the measurement's own result, prop for prop, with no exception by element: a render writes what changed in its props, never what the DOM holds. An exception belongs upstream, in what the measurement is given (the field's `parts`), not in the render of what it measured. And a chip always has its symbol, so nothing it gives way to leaves it blank.

## 2026-10-20 — A fit that only hides in order never gives back: decide each column with the ones before it hidden

**What happened.** The table's columns that give way were hidden in order until the rest fit: the pairs' names, then the pairs' symbols, then every name. With a side panel open the names went, and the pairs' symbols stayed hidden although the row then had room to spare: the loop had hidden them for a reason that no longer held, and nothing looked back (Sean, 2026-10-20: pair rows with no label at all).
**Rule.** Columns that give way are decided from the last to give way to the first, each shown if the grid fits with it and every column before it hidden, those after it as decided. That is the most shown by priority, and a column hidden for room comes back once a later one's going makes that room; the cost is one measurement per column.

## 2026-10-20 — WebKit lays a nested subgrid out wrong once a positioned child joins it: lay a flash over a row as a grid item

**What happened.** The copied check was an absolutely positioned child of the table's row, a subgrid holding a subgrid (the cell with the value, the symbol, and the name). On Sean's iPhone the second tap's flash sent the row's value to the left and its symbol and name to the right, and they stayed there after the flash had gone and the cursor had moved, until some later layout; Chromium laid it out right. A step-by-step probe on Playwright's WebKit found it: one tap fine, the flash's insertion wrong, nothing after it mending it.
**Rule.** Nothing is absolutely positioned inside a subgrid. What lays over a row is a grid item of the row's own grid placed on the same area (`col-start-1 col-end-8 row-start-1`, `justify-self-end`, `self-stretch`), the cell named to that area too (`col-start-1 row-start-1`), since an auto-placed item skips a row an explicit one fills, painting over the cell by document order, with `pointer-events-none` so a tap goes through it. And a phone bug is probed on WebKit step by step, the geometry read after each, since the step that breaks is rarely the one that shows it.

## 2026-10-20 — A rule reversed on one surface leaves its exception on the surfaces nobody looked at: grep the condition

**What happened.** The ninety-eighth pass drew a pair with no symbol, so four surfaces took a `pair` exception: the row, the chip, the matches, and the lines in Edit and Hidden. The hundredth and hundred-and-first passes brought the symbol back where Sean saw it missing, the chip, the matches, the row, each as its own fix; the lines in Edit and Hidden kept theirs, and with Display at Symbol only a pair's line there was a checkbox and nothing visible, its name being for screen readers alone. The tidy after the hundred-and-fifth pass found it by reading the file, not from a report.
**Rule.** When a rule is reversed, search for the condition its exceptions were written on (`row.pair`, `!unit.pair`) on every surface and in every file, and take each exception out or justify it in its comment: a fix made where the fault showed is not the reversal. The tidy skill says so beside its rule for a rename.

## 2026-10-20 — Windows renders a PDF's pages where poppler is missing: WinRT's PdfDocument from PowerShell, and a scan's text layer keeps its digits but loses its blanks

**What happened.** ISO/TS 19407's tables had to be read from a scanned PDF, its Russian adoption. The file reader renders a PDF only through poppler's `pdftoppm`, which this machine lacks (Git Bash's mingw64 has `pdftotext`, not it). PowerShell can load `Windows.Data.Pdf.PdfDocument` (WinRT) and render each page to a PNG at a chosen width (the session's `render-pdf.ps1`: the async calls through `AsTask`), which the reader then shows. The text layer, read with `pdftotext -raw`, kept every digit and lost the Cyrillic, and a blank cell left no trace: a row of Table 3 with an empty Mondopoint or UK column came out as a shorter run of numbers, which column was missing unsaid.
**Rule.** Render a scanned standard's pages to images and read its tables from them; the text layer is a second reading of the digits, never of a table's shape. A table with blanks is transcribed cell by cell from the image and checked by a blind second transcription, compared cell by cell (docs/research/shoe-sizes-1.md, §4).

## 2026-10-20 — A unit's kind is not its meaning: the change section keyed on affine and would have offered a shoe size warmer or cooler

**What happened.** Temperature's "As a change" section showed for any category with an affine unit, since only Temperature had one. A shoe scale is affine too, a size being an offset on the foot's length, and the first shoe-size table grew a section reading "As a change: 11 US M warmer or cooler".
**Rule.** A feature of one category keys on the category, or on a flag that names the meaning, never on the kind of arithmetic that happens to coincide: the kinds (linear, affine, reciprocal, functional) say how a unit converts, not what it is. The change section is Temperature's by name now (state.ts).

## 2026-10-20 — An apostrophe folds away only inside a word: a lone mark is the foot's key

**What happened.** "US men’s" and the spellings people type ("mens", "men's", "children's") needed one key. Dropping every apostrophe in `compactKey` would also have dropped the foot's own alias `'` (and `’`), which "5'" matches to offer feet, and the registry test rejects a key that folds to nothing.
**Rule.** A folding rule that spans characters needs a condition that says where it applies (between two letters) and a twin in the highlighter, which folds each character alone (`apostropheInWord` in normalize.ts, used by `matchSpan`); a key of one character stays a key.

## 2026-10-20 — A one-letter alias cannot lose to the symbol it folds to for everyone: the family tiebreak decides, so `w` stays the watt's

**What happened.** `m` could join US men's keys (for `11m to eu`) because the meter's symbol `m` is an exact symbol match (class 1) and the alias an exact alias match (class 2), so the meter leads at the start whoever types. `w` could not: the watt's symbol is `W`, so a typed `w` matches it only with case folded, as it would the alias, and the tie then goes to the key written as typed (a lowercase alias wins outright) or, with an uppercase `W` alias, to the tier and then the visitor's own unit family, which puts a US scale ahead of an SI unit for a US visitor. No spelling keeps the watt first for everyone at the start, so `w` is not an alias (docs/UNITS-CATALOG.md §0).
**Rule.** Before adding a one-letter alias, check the symbol it folds to and its case: only a lowercase symbol can keep its place against a lowercase alias. Resolved the same day: a key that must not compete at the start is a `shorthand` key, matched only where the category is named (the hundred-and-ninth pass; docs/UX-SPEC.md §4).

## 2026-10-20 — A key of a prefix unit is a prefix key: `m` as US men's alias made `m 11` a number

**What happened.** The parser reads a scale written before its number from every key of a unit marked `prefix` (`readPrefixed`), so an alias added for matching (`m`) also made `m 11` read as 11 and `m`, a query before; the test that pinned the old reading changed with it.
**Rule.** An alias on a prefix unit is a grammar change too: check what it reads before a number, and pin it. The same day `m` became a shorthand key, which is no prefix key, and `m 11` a query again.

## 2026-10-20 — A grid cell's first space is stripped: a no-break space keeps a fraction a space off its whole number

**What happened.** Splitting a fraction into two cells as a decimal is split (`10` and ` 1/2`), the space before the fraction vanished: a block's leading white space collapses away, so the fraction sat against the column's edge, and padding on the cell would have had to be mirrored in the sizer row that keeps the columns steady.
**Rule.** A space that must survive at a cell's start is a no-break space in the text (core's `NBSP`), never padding: the sizer measures the same text and stays honest. The stacked fraction under a decimal lost its `pl-1` for the same character.

## 2026-10-20 — A rule enforced in one builder drifts as builders are added: set hidden units apart in one function every list runs

**What happened.** Hidden units left the matches in `selectMatches` alone; the builders added later for a compound's pair, a clock's units, and the pair a mark opens each listed their unit shown or not, one with a comment calling it the compound's own. Sean found a hidden unit offered as hidden from one typing and as a match from another.
**Rule.** A rule over a kind of result is a function every builder of that result runs (`apart`), not a branch in the first builder written; a new builder is checked against the rule, not the comment. The same for a limit: a cut taken before the rule (core's 20) kept units past it off the hidden line, so the rule runs over every result and the cut comes after it.

## 2026-10-20 — A worker's saved copy is a copy only when its parser found the chart in it

**What happened.** The brands' charts worker saved Dr. Martens' pages as `downloads/drm_us_sizeguide.html` after reading them through the harness's fetcher; wave 2's checker, falling back to the "saved copy" when the fetcher could not say which column a blank fell in, found Cloudflare's "Help us verify real visitors" page, not the chart. The record had called it a copy for a day.
**Rule.** A saved file is a copy of a page only when the worker's parser found the chart in it; `sources.md` says what each file holds, and a file holding a refusal is named a refusal. A page read only through the fetcher has no copy, and its rows say so.

## 2026-10-20 — A checker over cells costs by the page, not the row

**What happened.** Wave 2's three checkers were budgeted at 80 calls each for 105, 68, and 114 rows; they used 31, 34, and 45, since a page fetched once served every row on it, and a screenshot read once every cell in it.
**Rule.** Budget a checker over cells by its pages and screenshots (about two calls a page, one a screenshot), never by its rows; put more rows on the same pages rather than fewer rows on more pages.

## 2026-10-20 — A row named by one value is ambiguous where a chart's sizes restart: name it by two

**What happened.** `wave2-select.py` named Clarks' kids row by "UK 5" and picked the first match, an infant's 126 mm, where the claim meant the child's UK 5 at 236 mm later in the same chart (kids' sizes run 2 to 13½ and restart at 1). The checker read the chart whole and found the row meant.
**Rule.** A chart whose sizes restart (every kids' chart) has two rows with one size: a selection names a row by two values (the size and its length, or the size and its EU), and the `check` note says both.

## 2026-10-20 — A brand's cells come in a dozen notations: one parser reads them all, a number before a label

**What happened.** The brands' charts, 14,079 cells from twenty brands, print a comma decimal (Salomon's 21,5), a mixed or superscript fraction (Nike's 8 9/16, Under Armour's 11¹⁄₁₆), a vulgar fraction (Clarks' 49½), a half marked H (Asics SG's 9H), a zero-padded size (Clarks AU's 010), a unit on the number (Crocs' 290mm), a range (Birkenstock's 4 - 4 1/2, Crocs' 43-44), a pair in one cell (Crocs' M10 | W12, Salomon's 9.5 M / 10.5 W), and kids' labels (10.5C, 1Y, K5, 10.5-L). A reader that stripped letters first turned Salomon's "4M / 5 W" into one number and Brooks' repeated header into a row.
**Rule.** One parser for every cell, in this order: a blank, a pair, a strict number (fractions, comma decimals, a trailing unit), a range kept with its ends and its text, and only then a label's number; a cell equal to its heading is a repeated header, not a row. The brand's text is kept beside every number so the product can print the cell as the brand does.

## 2026-10-20 — Charts are compared in the range people buy in: a chart's ends distort a delta

**What happened.** Nike's chart runs US 3.5 to 22; over every row its EU delta against ISO read −1.4 to +1.4, which says nothing, where over US men's 6 to 13 it is +0.8 to +1.4, the figure a visitor meets; the first table of `brands.py` had summarized every row.
**Rule.** A delta between two charts is summarized over the rows most people use (shoe sizes: US men's 6 to 13, women's 5 to 11, UK 4 to 12, EU 36 to 47), the range said beside the figure; the ends stay in the data, never in the headline.

## 2026-10-20 — A page's own words decide what its length column is, and a size guide can hide in a product page's panel

**What happened.** Puma's home site keeps its size guide in a panel on product pages, where no size-guide page exists for a fetcher to find, and heads its lengths Product Measurements beside heel height, weight, and width; the Australian chart's unexplained "Length cm" equals them size for size. Asics' and Converse's home pages carry measuring steps that make their columns the foot's; Under Armour's sentence "That measurement (in centimeters) is then translated into our standard sizes" names its CM column, which a checker reading for the column's name had missed.
**Rule.** A length column is the foot's only by the page's own words (steps, a sentence, a column head), read whole; a brand's home site is read in a browser when a fetch is refused, product pages included; and a page's heading over a number (Product Measurements) outranks a guess about what the number must be.

## 2026-10-20 — Screenshots sent while a turn runs do not land as files

**What happened.** Sean's first message's screenshots were saved in the session's images folder and copied into the sources; the screenshots in his later messages the same turn were shown in the conversation and never written to disk, so Converse's, Crocs', Skechers', Reebok's, Under Armour's, and On's could not be filed.
**Rule.** When screenshots arrive mid-turn, say so at once, keep the pasted text as the source of record, name the screenshots as shown and not saved, and ask for a re-send at a turn's start if the files matter: re-sent that way, all 36 landed and were filed the same evening. A filing script numbers new files after the folder's existing ones, never from 01: the On folder held six from the manual capture, and the FAQ shot overwrote the first until git gave it back (`54be5b7`, mended in the next commit).

## 2026-10-20 — A shape's logic is judged in a prototype on the record, not in scenes or prose

**What happened.** The mock of the brand as the second value drew nine fixed scenes, one decision each, and the reply explaining the rethought shape ran long; Sean found the mock confusing and the text unparseable ("I just need to see it in action and then test it around"), and asked whether to prototype or build in production. An interactive prototype on the checked record (`docs/research/shoe-sizes-2/mocks/brand-proto.py`), a box to type into with example inputs and every row a tap, was built and published the same evening, and checked headless first: Playwright from `apps/web/node_modules/@playwright/test` by its absolute path (a script in the scratchpad does not resolve it through `NODE_PATH` under pnpm), typing each case, reading the rows, the note, and the page's errors, and measuring for horizontal overflow at a phone's width.
**Rule.** For a question of logic (what the box reads, what a row shows, how a tap reacts), the artifact is a prototype on the real data with the product's grammar, not a set of scenes, and the reply is a few lines and the link; the decisions are recorded as proposed and settled after he has played. A static mock still serves a question of look.

## 2026-10-20 — A row that borrows another row's shape borrows its flags: every brand's row read as the box's own

**What happened.** The brands' rows (ADR 0028) were built from `emptyRow(scaleUnit, from)`, which marks a row `inBox` when its unit is the box's; every brand's row on the box's scale was then "in the box", and a tap on New Balance's row only rested the cursor, as a tap on the box's own row does. The unit tests passed, since they asserted `inBox` on the box's own row alone; the browser test found it before the push.
**Rule.** A row built by spreading another row's builder sets every flag the builder decides from its arguments (`inBox`, `approx`, `stepped`), and a test of a new row kind asserts which rows are the box's own, by listing them, not only that one is.

## 2026-10-20 — A unit's name is a key, so a common word in it is typed into every category

**What happened.** The foot's cm unit was named Foot length (ADR 0028), and `len`, typed for Length, found it inside the name, a second match after the category; the catalog's rule had kept `foot length` out of the aliases for that reason, and the name goes through the same index.
**Rule.** A new unit's name is checked against the catalog's typed queries (`search.test.ts`'s sweeps, the web's match tests) before it ships; a match it adds after the category is acceptable and pinned, one it adds first is a rename.

## 2026-10-20 — Core's tests read a record as a JSON module, not through node's fs

**What happened.** The test holding core's brand charts to the research record reached for `node:fs`; core's tsconfig keeps `types: []` so nothing of node or the DOM reaches core (ADR 0003), and the test would not typecheck. `resolveJsonModule` is on in the base config, so `import record from '../../../docs/research/shoe-sizes-2/brands.json'` reads it under Vitest and TypeScript alike, cast to the shape the test needs.
**Rule.** A core test that reads a file in the repo imports it as a module; a path relative to the test file, no `fs`, no `process`.

## 2026-10-20 — The bundle budget counts code loaded on demand, so data belongs outside the bundle

**What happened.** The brands' charts (ADR 0028), 7.1 KB gzipped of data in core, took the converter page from 87.8 to 98.7 KB against a 90 KB budget, and lazy loading would not have helped: `scripts/bundle-size.mjs` follows dynamic imports on purpose, so code loaded on demand counts. The budget was raised to 100 KB with Sean's yes, since the code alone had reached 91.6 KB.
**Rule.** A dataset that grows (brand charts, apparel's) ships as a fetched JSON file, not as code in core's bundle, so the budget measures code and stays flat as the data doubles; the move is queued before the second batch of brands. A budget is a guard against unnoticed growth: when it trips, bring the numbers and the choice to Sean, never raise it quietly.
