// The brands' charts are data core is given (ADR 0029): every web test has them before it runs,
// from the file itself, as the site's build and the island's fetch give them.
import { setBrandCharts, type BrandChartsFile } from '@bigsmall/core';
import chartsFile from '@bigsmall/core/data/shoe-brands.json';

setBrandCharts(chartsFile as unknown as BrandChartsFile);
