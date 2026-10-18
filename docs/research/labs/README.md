# Retired labs

A prototype lab answers a design question with a few working answers, built from the real engine and components, for Sean to try (docs/DESIGN-SYSTEM.md, "Tuning labs"). Once its answer ships, or a later round replaces it, it retires by `CLAUDE.md`'s "Retire a lab" recipe: no browsable copy is kept (Sean, 2026-10-14), so each lab leaves an entry here with what it explored, what was decided, what was left out and why, what it taught, its screenshots where they were taken, and the last commit where it lived, to bring it back from git (`git checkout <commit> -- <path>`).

Newest first.

## Tidy lab, `/dev/tidy-lab` (2026-10-18)

**Explored.** Three of the full tidy's calls, to see rather than read (the eighty-sixth and eighty-seventh passes in docs/research/findings-0-first-pass.md). How a side panel opens beside the box on a wide screen, three ways, each a stage the page column's width with a stand-in for the converter page, its own Units tool, and a measured line under it: the pair re-centering as then built (the column slides 168 px), the margin-first slide (the panel into the window's margin past the page column, the column sliding only by what the panel lacks), and a drawer fixed at the window's frame. The About page's vertical rhythm, every gap a band named by its class and measured, the converter page's beside it, and one section step for About's two section gaps on a control, 2, 3, or 4 times the frame. The formulas' exact and measured tags, today's pill against the shape token's corner, in every theme, with what extending the token guard means.

**Decided** (Sean, 2026-10-18). The section step at three times the frame (`--spacing-section`, 48 px on a compact screen and 72 from `sm`; docs/DESIGN-SYSTEM.md, "Sections step by the frame"). The tags on `rounded-sm`, the keycap's corner, and `rounded-full` added to the token guard. On how a panel opens, his question was whether the margin first, with no movement while the margin holds the panel, is the better pattern; it is the one a centered document with a side tool uses (a document's comments in its margin), so it was built as a trial the same day, one revert (docs/UX-SPEC.md §1, "Units and Display").

**Left out, and why.** The drawer: it covers the table's right end in a narrower window and scrolls apart from the page. The pair re-centering, as built from 2026-10-18's morning: a 168 px slide on every opening, in a window with room to spare. The 2 and 4 times steps: 2 made the tabs crowd the sketchbook; 4 kept the tabs' 96 px and widened the heading's gap to it.

**Learned** (docs/LEARNINGS.md, 2026-10-18): a phone emulation's window settles after the first layout, so a page's end is measured against the body once the page is ready; a lab's own test is what caught its "About today" stack drawing the heading's gap twice; a grid whose first track is a measured inset must measure from the column's full width, not from one a panel has already narrowed.

**Screenshots** (`tidy-lab/`): 1 the pair re-centering with Units open at 1280 px; 2 the margin first, the panel in the window's margin, the column 15 px left; 3 the drawer at the window's frame; 4 the panel stacked between the box and the rows on a phone; 5 the rhythm's three stacks at 1280 px, About today and one section step side by side; 6 the rhythm on a phone; 7 the tags in every theme, the pill against the keycap's corner.

**Last commit.** `1501698`, in `apps/web/src/pages/dev/_tidy-lab/`, `apps/web/src/pages/dev/tidy-lab.astro`, and `apps/web/e2e/tidy-lab.spec.ts`. Research: the eighty-fifth to eighty-eighth passes in `docs/research/findings-0-first-pass.md`.

## Feedback lab, `/dev/feedback-lab` (2026-10-17)

**Explored.** How a visitor reaches us from the About page: first two answers side by side, a form whose Send opened the visitor's email app with the message filled in, and the address alone with a copy; then, on Sean's shape, one form: a strip of three kinds (Inaccuracy, Bug, Idea), Your email, a Message whose empty state gives an example for the kind, Send alone, with what Send would deliver shown beside it.

**Decided.** The one form, built on the About page the same day (ADR 0024; docs/UX-SPEC.md §1, "About"): Send posts to Formspark, which mails the message; the examples from three categories; nothing under the fields.

**Left out, and why.** The email-app form: a separate email window, which Sean found "annoying for ten years now". The address alone: nothing structured arrives. A function of our own sending through an account he controls: the first server on a site that has none, spam ours to handle; the upgrade path if the service proves too little. Web3Forms and Formspree: their free tiers guard a public key with a captcha or not at all.

**Learned.** A honeypot is read from its field at the send, since a bot sets a value without the events a person's typing fires (docs/LEARNINGS.md, 2026-10-17).

**Screenshots** (`feedback-lab/`): 1 the first lab's two answers, wide; 2 Sean's shape on a phone, empty; 3 after Send, with what arrives.

**Last commit.** `a6dabdf`, in `apps/web/src/pages/dev/_feedback-lab/` and `apps/web/src/pages/dev/feedback-lab.astro`. Research: `docs/research/feedback-1.md`.

## Categories lab, `/dev/categories-lab` (2026-10-15 to 16)

**Explored.** Three categories bigsmall did not have yet, and the open category menu, mocked with the real box, table, and menus in frozen states, the values worked out by hand, wide or at a phone's width: pace (A, min/km and min/mi with their systems; B, a Pace section of their own under the speeds); a temperature change (A, as today, a reading; B, Temperature change, a category of its own; C, in B, an oven's 25 °F lower; D, Sean's idea, inside Temperature, the reading and then the same number as a change); cooking by ingredient (A, "2 cups flour" with the ingredient in a menu beside the category, weight first; B, the same by system; C, an ingredient's own unit, "1 stick butter"; D, Sean's idea, two pills in the box, the unit and the ingredient); and the open menu three ways (A, as long as its list; B, held to a height and scrolling; C, two columns).

**Decided.** Everything built on 2026-10-16 (the sixty-third pass): the menu in two columns, B its fallback in a short window (docs/UX-SPEC.md §1); Pace, B, inside Speed; a temperature change, D, "As a change" after the readings; Cooking, D, weight first, then volume (ADR 0021). The working detail is in `docs/research/categories-1.md`.

**Left out, and why.**

- Paces with their systems (A): a pace reads the other way, smaller being faster, so among the speeds it breaks their size order; a section of its own keeps both readable.
- A temperature change as a category of its own (B, C): one more place to look for what is a way of reading a temperature; inside Temperature, the reading and the change sit together.
- Cooking by system (B): weight and volume are what a recipe crosses between, so they head the table. An ingredient's own unit as the way in (C): the stick of butter, the large egg, and the packet of yeast joined D as units listed with their ingredient.
- The ingredient in a menu beside the category (A): D's second pill says the whole question in the box. A's menu comes back as the Ingredient menu, for choosing without typing, the pill still the readout (the sixty-fourth pass, a trial).
- The menu as long as its list (A): it ran past a phone's window.

**Learned** (docs/LEARNINGS.md, 2026-10-15 and 16): a list held to the window scrolls itself, never the page; one reciprocal unit takes a category's size order away; flex items wrap before they shrink.

**Screenshots** (`categories-lab/`): 1 the menu open three ways; 2 pace, A and B; 3 a temperature change, A to D; 4 cooking, A to D, the lab's last state.

**Last commit.** `7f86070`, in `apps/web/src/pages/dev/_categories-lab/` and `apps/web/src/pages/dev/categories-lab.astro`. Research: `docs/research/categories-1.md`.

## Settings lab, `/dev/organization-lab` (2026-10-10 to 15)

**Explored.** How to section the table and control what it shows, then how results look, in rounds: jobs (Cooking, Cubic, Trade), by system, six filters, options E to I, single units chosen in Settings (Together) or in the table (Separate), compact pills against segmented controls; then Sean's model, one Settings button in the action bar with the table's sections, a Hidden list, and Edit, plus Display (names, copy buttons, decimals, fractions, or both, rounding). Its last round (2026-10-15) mocked Settings' shape on the converter's own parts (A, one dropdown; B, Filter and Display, a dropdown each; C, a side panel like the calculator, between the box and the table or a sheet from the bottom on a phone) and four ways to show a unit moving between shown and hidden (none, a highlight, a glide, both), with sliders for their lengths.

**Decided.** The settings model: sections by system under fixed names, two layers (the system switches for every category, single units chosen in a table) with a reset each, the Hidden list and Edit, search leaving hidden units out, Display, a fresh visit's defaults (ADR 0017, built 2026-10-11). The specialist units' section reads Specialty, for now (2026-10-14). Settings as two side panels, Filter and Display, B's two buttons opening C's panel, one side panel open at a time with the calculator, between the box and the table on a phone; units glide to their place and flash the accent's soft tint as they move, a 400 ms glide and a 1200 ms highlight (Sean, 2026-10-15). The working detail is in `docs/research/organization-lab.md`.

**Left out, and why.**

- Jobs as filters: named differently in each category, and in the way of one filter for every category.
- Single units chosen in Settings (Together): Settings is for every category, the table for this one.
- Compact pills: Sean chose the segmented control.
- "Most common" 32nds and 64ths: the table writes one value a row, so a common set hides nothing and only rounds further than asked.
- A dot on Settings for "changed": it would sit there for good; the resets say what can be undone.
- One button per setting: six buttons crowd the toolbar and wrap on a phone, and more icons get hard to tell apart; two (Filter, Display) won.
- One dropdown (A): hard to read over the table it changes; a side panel shows results changing beside it.
- The bottom sheet on a phone: Sean chose between the box and the table for now, as the calculator opens.

**Learned** (docs/LEARNINGS.md, 2026-10-10 to 14): a subgrid's padding counts toward its parent's edge columns; a wrapper made a grid item needs `min-w-0` again; an animation that reveals rests revealed; a listbox holds options and groups, never a button; a popover's Escape on a toolbar control needs the capture phase; a cancelled animation has settled; decimal points line up in two columns, not with padding; a sticky bar with rounded corners shows what scrolls under it.

**Screenshots** (`settings-lab/`): the lab's own converter as last built, 1 a fresh visit, 2 Settings, 3 Both with names, 4 the Hidden list, 5 Edit, 6 search offering hidden units; the last round's mocks, 7 A, 8 and 9 B's Filter and Display, 10 C beside the table, 11 and 12 C on a phone between the box and the table and as a sheet, 13 a unit gliding from Hidden to its row.

**Last commit.** The lab's own converter (its copies of the sections, the rule, and the formats) is at `90f3df3`, in `apps/web/src/pages/dev/_organization-lab/`. The last round's mocks were built and shown locally on the converter's parts as they stood then and never committed; the screenshots are their record.

## Table controls lab, `/dev/table-controls-lab` (2026-10-08 to 10)

**Explored.** Four ways to filter the table's units (A, fold the sections; B, chips over the table; C, a filter panel; D, edit the list) and four ways to mark its sections (none, labels, labels with a line, a line only), in any pairing, on the real engine with a state of its own, at a phone's width or the converter's.

**Decided.** Superseded by the settings lab, where Sean's model took over: one Settings button for every category, and the table's own sections and Hidden list for this one. Its folding, chips, panel, and editing fed that model; D's Edit, and sections headed with a label and a line, live on.

**Left out, and why.** Folding sections (A, the recommendation then) and the chips (B) made the headings or the table's top the filter for one category at a time; Sean wanted one setting for every category.

**Learned.** Hiding the specialist section on a phone brings the names back in the volume table: its long values are what leave no room.

**Screenshots.** None; it retired before this index. Bring it back to see it.

**Last commit.** `59d823f`, in `apps/web/src/pages/dev/_table-controls-lab/`. Research: `docs/research/table-controls.md`.

## Selection lab, `/dev/selection-lab` (2026-10-07)

**Explored.** How to pick a unit once the table is the unit list (the suggestion list had covered the table it listed): A, a category menu over the box; B, every category as a tab; C, no category control.

**Decided.** A, refined over several rounds the same day and built as the converter's table (ADR 0012).

**Left out, and why.** B's tabs cost a row or two over the box at every width, and the start's tiles already show every category; C needed a back row to reach the other categories, an extra step for a common change (ADR 0012).

**Screenshots.** None; it retired before this index. Bring it back to see it.

**Last commit.** `f1321b0`, in `apps/web/src/pages/dev/_selection-lab/`. Research: `docs/research/table-selection.md`.
