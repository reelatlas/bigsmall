// Written by docs/research/shoe-sizes-1/write_tables.py from tables.py, the transcription of
// ISO/TS 19407:2015's tables (docs/research/shoe-sizes-1.md): edit the data there, never here.

/**
 * A row of ISO/TS 19407:2015's Table 3, the children's conversion: the foot length it stands for
 * in mm, Mondopoint where a 5 mm size falls in the row, the European half size the table is graded
 * by, the UK and US sizes where a half size falls in the row (null where none does; the UK scale
 * restarts at 1 after 13.5, and the US at 1 after its 13.5), and the typical last's length,
 * smallest and largest, in mm.
 */
export interface ChildrenRow {
  foot: number;
  mondopoint: number | null;
  eu: number;
  uk: number | null;
  us: number | null;
  last: readonly [number, number];
}

/** ISO/TS 19407:2015, Table 3, as printed (read through GOST R 57425-2017, pages 6 and 7). */
export const CHILDREN_TABLE: readonly ChildrenRow[] = [
  { foot: 120, mondopoint: 120, eu: 19.5, uk: 3.5, us: 4, last: [130, 136] },
  { foot: 123, mondopoint: 125, eu: 20, uk: 4, us: 4.5, last: [133, 139] },
  { foot: 127, mondopoint: null, eu: 20.5, uk: 4.5, us: 5, last: [137, 143] },
  { foot: 130, mondopoint: 130, eu: 21, uk: 5, us: 5.5, last: [140, 146] },
  { foot: 133, mondopoint: null, eu: 21.5, uk: 5.5, us: 6, last: [143, 149] },
  { foot: 135, mondopoint: 135, eu: 22, uk: null, us: null, last: [147, 153] },
  { foot: 138, mondopoint: 140, eu: 22.5, uk: 6, us: 6.5, last: [150, 156] },
  { foot: 142, mondopoint: null, eu: 23, uk: 6.5, us: 7, last: [153, 159] },
  { foot: 146, mondopoint: 145, eu: 23.5, uk: 7, us: 7.5, last: [157, 163] },
  { foot: 148, mondopoint: null, eu: 24, uk: null, us: null, last: [160, 166] },
  { foot: 150, mondopoint: 150, eu: 24.5, uk: 7.5, us: 8, last: [163, 169] },
  { foot: 154, mondopoint: 155, eu: 25, uk: 8, us: 8.5, last: [167, 173] },
  { foot: 157, mondopoint: null, eu: 25.5, uk: 8.5, us: 9, last: [170, 176] },
  { foot: 160, mondopoint: 160, eu: 26, uk: 9, us: 9.5, last: [173, 179] },
  { foot: 164, mondopoint: null, eu: 26.5, uk: null, us: null, last: [177, 183] },
  { foot: 166, mondopoint: 165, eu: 27, uk: 9.5, us: 10, last: [180, 186] },
  { foot: 169, mondopoint: 170, eu: 27.5, uk: 10, us: 10.5, last: [183, 189] },
  { foot: 173, mondopoint: null, eu: 28, uk: 10.5, us: 11, last: [187, 193] },
  { foot: 176, mondopoint: 175, eu: 28.5, uk: 11, us: 11.5, last: [190, 196] },
  { foot: 179, mondopoint: 180, eu: 29, uk: 11.5, us: 12, last: [193, 199] },
  { foot: 182, mondopoint: null, eu: 29.5, uk: null, us: null, last: [197, 203] },
  { foot: 185, mondopoint: 185, eu: 30, uk: 12, us: 12.5, last: [200, 206] },
  { foot: 188, mondopoint: null, eu: 30.5, uk: 12.5, us: 13, last: [203, 209] },
  { foot: 192, mondopoint: 190, eu: 31, uk: 13, us: 13.5, last: [207, 213] },
  { foot: 195, mondopoint: 195, eu: 31.5, uk: 13.5, us: 1, last: [210, 216] },
  { foot: 198, mondopoint: null, eu: 32, uk: null, us: null, last: [213, 219] },
  { foot: 200, mondopoint: 200, eu: 32.5, uk: 1, us: 1.5, last: [217, 223] },
  { foot: 204, mondopoint: 205, eu: 33, uk: 1.5, us: 2, last: [220, 226] },
  { foot: 207, mondopoint: null, eu: 33.5, uk: null, us: null, last: [223, 229] },
  { foot: 210, mondopoint: 210, eu: 34, uk: 2, us: 2.5, last: [227, 233] },
  { foot: 213, mondopoint: null, eu: 34.5, uk: 2.5, us: 3, last: [230, 236] },
  { foot: 217, mondopoint: 215, eu: 35, uk: 3, us: 3.5, last: [233, 239] },
  { foot: 220, mondopoint: 220, eu: 35.5, uk: 3.5, us: 4, last: [237, 243] },
  { foot: 224, mondopoint: null, eu: 36, uk: null, us: null, last: [240, 246] },
  { foot: 226, mondopoint: 225, eu: 36.5, uk: 4, us: 4.5, last: [243, 249] },
  { foot: 230, mondopoint: 230, eu: 37, uk: 4.5, us: 5, last: [247, 253] },
  { foot: 232, mondopoint: null, eu: 37.5, uk: null, us: null, last: [250, 256] },
  { foot: 236, mondopoint: 235, eu: 38, uk: 5, us: null, last: [253, 259] },
];
