# Organization lab: other ways to cut the table's groups (2026-10-09)

The table controls lab (`/dev/table-controls-lab`, docs/research/table-controls.md) tries ways to hide the groups the listed order already makes. This lab, `/dev/organization-lab`, separates the two jobs. The sections are chosen once, for both tables. Each table then has its own filter. The two tables sit side by side from a tablet’s width, one over the other on a phone. Nothing here is chosen or built in the converter.

It is built from the real engine and table view, with the table's columns and its names giving way, and it holds its own state: no undo, no URL, no arrow keys. It can switch the visitor's region (US, UK, metric). Presets and Check list open together, on Jobs. Length, volume, energy, and data show the differences most clearly; temperature, time, and speed show what a short category does.

The unit in the box always stays, in every idea. A heading that names the region drops "(US)" and "(UK)" from a symbol when the two would not then read alike.

## Sean's direction (2026-10-10)

After both labs, Claude's evaluation (by system over jobs; one menu in the toolbar over controls in each table; filters shape browsing, never search) and Sean's answers:

- **Sections by system, with fixed names**: Metric, US (customary), UK (imperial), Other, Specialist, the same five in every category, the visitor's own first. Only section headings take the parentheses; unit names and symbols stay as they are ("imperial gallon" is the standard name, and "gal (UK)" tells the two gallons apart when names drop on a phone).
- **Headings always show**, in every table with more than one section, a section of one included.
- **One filter for every category**: hiding Metric hides it everywhere.
- **Search finds every unit**, hidden or not; a hidden unit in the matches carries a "hidden" note, and the unit in the box always shows its row.

These are in the lab as **Fixed system names** (the default sections) and **E. Show menu** (the left table's default filter), beside Fold on the right.

## Sections

Chosen once, above the tables, so the two filters are the thing being compared.

|                        | What a section is                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fixed system names** | Metric, US (customary), UK (imperial), Other, and Specialist, the same five everywhere, each section headed even when it holds one unit. The shared inch, foot, and pound sit with US (customary), or with UK (imperial) for a UK visitor; every specialist unit is Specialist. A category with no regional system (time, data, angle) heads its everyday units Everyday. Units keep their own names and symbols. |
| **Jobs**               | A name for the job, written per category below. Your own everyday jobs lead, then other everyday jobs, then jobs that are specialist throughout. A specialist unit stays in its job, so it can sit above a later job. A category with no jobs listed gets no everyday heading, and its specialist units sit under More units.                                                                                     |
| **By system**          | The listed-order groups (ADR 0011, ADR 0016): your everyday units, the other main system's, those of neither, then specialist. A run of one unit keeps its rows and gets no name. A category with no regional system (time, data, angle) leaves its everyday units unnamed. The specialist run is called More units.                                                                                              |

## Filters

Each table picks one. They do not share what is hidden.

|                  | How you choose what stays                                                                                                                                                                                                                                                                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **E. Show menu** | A menu in the toolbar built like the category menu, reading what it shows ("Show All units"). Open: All units, Everyday, or Your units, then a checkbox per fixed system. One setting for every category, kept when the category changes; a line under the table counts what is hidden, with Show all. A category with no regions keeps its everyday units. |
| **Fold**         | The section name hides that group. A run with no name stays.                                                                                                                                                                                                                                                                                                |
| **Presets**      | Mine, Everyday, or All. Mine is the everyday units of your system. A category with no such units (data, time) treats Mine as every everyday unit.                                                                                                                                                                                                           |
| **Families**     | Metric, US, UK, and More, each on or off. More is every specialist unit. Inches and the other shared units are one switch, US and UK, where the category has no US-only or UK-only unit. Where it has both, those shared units stay while either switch is on. A category with no regions offers More alone.                                                |
| **Check list**   | Edit turns the copy buttons into checkboxes, and puts one on each section name. Done hides whatever is unchecked, and leaves a count that opens Edit again.                                                                                                                                                                                                 |
| **Show menu**    | One Show button opens a checkbox per section, and Show all. The table stays clear until the menu is open.                                                                                                                                                                                                                                                   |
| **Find**         | A field leaves only the units whose name or symbol matches.                                                                                                                                                                                                                                                                                                 |

## Jobs

Catalog order. The lab reorders these so the visitor's own everyday jobs lead.

| Category     | Jobs                                                                                                                                                                    |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Length       | US customary (in, ft, yd, mi); Metric (mm, cm, m, km); Very small (nm, µm, mil); Nautical (fathom, nautical mile); Survey (furlong); Astronomy (au, light-year, parsec) |
| Volume       | Cooking (tsp through gal); Metric (mL, L, m³); Cubic (in³, ft³, yd³); UK (fl oz, pt, gal); Trade (oil barrel)                                                           |
| Mass         | US customary (oz, lb); Metric (mg, g, kg); UK (stone); Precious and small (µg, carat, grain, troy oz); Tons (tonne, short ton, long ton)                                |
| Energy       | Electricity (Wh, kWh); Food (cal, kcal); Heat (BTU, therm); SI (J through GJ); Other (ft·lbf, eV)                                                                       |
| Data         | Decimal (B through PB); Binary (KiB through PiB); Bits (bit through Gbit)                                                                                               |
| Area         | Metric; US customary (in² through mi², with yd²); Land (acre, hectare)                                                                                                  |
| Pressure     | SI (Pa, hPa, kPa, MPa, bar); US customary (psi, inHg); Atmosphere (atm, mmHg)                                                                                           |
| Power        | SI (W through GW); Horsepower (hp, metric hp); Heat (BTU/h, ton of refrigeration)                                                                                       |
| Fuel economy | Per volume (mpg US, mpg UK, km/L); Per distance (L/100 km, gal/100 mi)                                                                                                  |

Time, temperature, speed, and angle have no jobs. Their specialist units, when they have any, sit under More units.

Survey is one unit, and so is UK stone, and so is the oil barrel. The job still has a name. By system leaves a run of one unnamed.

## What to notice

- **Volume.** By system keeps the spoons and the gallons in one US customary run, and the cubic measures with the oil barrel. Jobs splits cooking, cubic, UK, and trade.
- **Energy, US.** By system’s first run is BTU alone, so it gets no name, and the therm sits in More units. Jobs opens on Heat, with the therm beside BTU. Mine is BTU alone, and the kilocalorie stays only because it is the unit in the box.
- **Data.** By system has no everyday heading. Jobs names Decimal, Bits, and Binary. Bits come before the binary prefixes because the bit is everyday and the binary prefixes are all specialist.
- **Length.** Folding Metric, or turning off US and UK, is the case of someone working in inches. US and UK are one Families switch, because the inch is shared.
- **Time and temperature.** Families does not offer a Metric switch for minutes. By system, on temperature for a US visitor, names Celsius and kelvin Metric and leaves Fahrenheit unnamed, because it is a run of one.
- **A specialist unit in an everyday job.** The tonne pulls both other tons up with it. The petabyte stays in Decimal. Hiding specialist units is the More switch, or Everyday, or folding that job.
