# 0020 — Other converters as references; every number checked on our own

Date: 2026-10-15
Status: accepted; supersedes 0004; extended by 0022 (facts no standard defines)

## Context

ADR 0004 (2026-10-06) kept the two converter sites that inspired bigsmall at arm's length: nothing copied from them, not their text, taxonomy, unit descriptions, or page structure, and the sites used only to see coverage, find gaps in their experience, and spot-check results. Sean explained its intent on 2026-10-15: a caution for the start, so that bigsmall would grow its own concept, UX, and design rather than rip a site off, never a rule that names or units may not match. That has happened: one box and its table, the planes, the themes, and the sketchbook are bigsmall's own. The next work, more categories, leans on the references for which quantities and units people expect and what they call them, and converters overlap there word for word, because that is what the things are called. What Sean holds to is that every number is right: wherever a factor or formula was found, a reference site included, our own checks confirm it.

## Decision

1. **Other converters are references, used freely.** Their categories, units, names, grouping, and wording may be used, overlap word for word included (Sean, 2026-10-15).
2. **The concept, the UX, the design, and the code are ours.** No page of another site is reproduced, and the code is written here.
3. **Every factor and formula is checked on our own, wherever it was found.** Recomputed from the standard that defines it, a standards body's publication, a specification, or a law (NIST SP 811 and Handbook 44, the BIPM SI Brochure, IEC 80000-13, the 1959 yard and pound agreement; `docs/UNITS-CATALOG.md` §2), and pinned by a golden row for every unit. A site's figure can be a cross-check, never the proof. Each unit cites the standard it was checked against, and where sources disagree, the standard settles it.

## Alternatives considered

- **Keep ADR 0004 as written.** Its caution has done its work, and it costs a detour for every unit name and short definition that is simply what the thing is called.
- **Take a reference site's factors as they stand.** A site can round or err, and correct numbers are the product's foundation.

## Consequences

- Choosing categories and units can start from a reference site's lists and names (`docs/UNITS-CATALOG.md` §1).
- The accuracy audit (`docs/PLAN.md` §11) makes rule 3 true of every unit shipped so far; a category added later meets it before it ships (`docs/UNITS-CATALOG.md` §6).
- The golden rows stay the provenance record, now of the check rather than of where a factor was first seen.
