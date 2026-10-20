# The blind check of the transcription

The checker's report, 2026-10-20, as the agent returned it (one agent, 6 tool calls, about 103,000 tokens, six minutes), saved by the orchestrator. The agent was given the three page images of GOST R 57425-2017 (ISO/TS 19407:2015) holding Tables 2 and 3 and nothing else: not `tables.py`, not the repository. Its CSVs and its script are in this folder; compared cell by cell with `tables.py` afterwards, every cell agreed (`docs/research/shoe-sizes-1.md`, §4).

---

Transcription done; every check passed.

**Files written** (this folder):

- `table2_mondo.csv`: 22 rows (Mondo 215 to 320), columns `mondo,eur,uk,us_men,us_women`
- `table2_eur.csv`: 32 rows (EUR 34 to 49.5), columns `eur,mondo,uk,us_men,us_women`
- `table2_uk.csv`: 27 rows (UK 2 to 15), columns `uk,mondo,eur,us_men,us_women`
- `table3.csv`: 38 rows (foot length 120 to 236 mm; 13 rows from page 6, 25 from page 7), columns `foot_mm,mondopoint,eur,uk,us,last_min,last_max`, blanks as empty fields
- `transcribe.py`: the script that holds the values as printed (decimal commas, `-` for a blank), converts them, writes the CSVs, and runs the checks (`python -I transcribe.py`)

No repository file was touched; nothing was searched for or read beyond the three images.

**Self-check results**

- Table 2, required checks: passed. In all 81 rows US men's = UK + 1 and US women's = UK + 2; the bold column steps evenly in each grading (Mondo by 5 over 22 rows, EUR by 0.5 over 32 rows, UK by 0.5 over 27 rows), so no row is missing or doubled.
- Table 3: 38 rows. Blank cells per column: foot_mm 0, mondopoint 14, eur 0, uk 8, us 9, last_min 0, last_max 0.
- Extra arithmetic checks added (all clean): in Table 3, last_max − last_min = 6 on every row; last_min = round(EUR × 6.667) on every row; EUR steps 0.5 per row; foot length strictly increasing; US = UK + 0.5 wherever both are present (the one exception being the printed children's-to-youth wrap, UK 13.5 / US 1 at foot 195); every Mondopoint within 2.5 mm of its row's foot length.
- Cross-grading check done by hand, outside the script: every Mondo, EUR, and UK value in the other two gradings equals the nearest size by the standard's own intervals (Mondo 5 mm; EUR foot length = (size − 2) × 6.67, which reproduces Table 1's printed 303.5 for 47.5 and 320.2 for 50; UK half-size 4.233 mm anchored on Table 1's 300.6 for 12.5). Three near-ties (EUR 38.5 → UK 5.5, EUR 45.5 → UK 11.5, UK 8 → Mondo 260) are as printed.

**Cells unsure of:** none where a digit was ambiguous; the rendering is clean and every digit read without doubt. For honesty about coverage: the Table 3 `foot_mm` column (38 values) and `mondopoint` column (24 values) have no exact arithmetic cross-check, only the monotonic and ±2.5 mm bounds above, so a misread there would be the hardest to catch; and the cross-grading check is the checker's derivation, not a rule the standard states.

**Things that look odd but are as printed** (not errors to fix):

- Mondo grading: 290 → UK 11, then 295 → UK 12 (UK 11.5 skipped); also 315 → 14, 320 → 15 (14.5 skipped). Both follow from nearest-size rounding on the 8.47 mm UK interval.
- EUR grading: pairs sharing one UK value (36/36.5 → 4; 38/38.5 → 5.5; 43/43.5 → 9.5; 45.5/46 → 11.5; 47.5/48 → 13) and sharing one Mondo (34/34.5 → 215, 35.5/36 → 225, and so on).
- UK grading: 7.5 and 8 both → Mondo 260; 11 and 11.5 both → 290; 14.5 and 15 both → 320.
- Table 3: foot 195 has UK 13.5 / US 1; foot 236 has UK 5 and a blank US; the rows at 135, 148, 164, 182, 198, 207, 224, 232 have EUR only (no UK, no US).
