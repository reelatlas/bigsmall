import { formatNumber, type ParsedInput } from '@bigsmall/core';
import type { ReactNode } from 'react';

export interface NumberTextProps {
  text: string;
  /** The parse of `text`, which says where the exponent markers are. */
  parsed: ParsedInput;
  /** The running value of arithmetic, from runningValue(); null when there is none. */
  running: string | null;
}

/**
 * A typed number the way the converter draws it, in a field and in the calculator's display:
 * each exponent marker set in a heavier weight, so "1.5E21" reads as a number with an exponent
 * rather than a run of characters, then the running value of arithmetic in the muted color
 * ("5 + 3 = 8"). The parser says where the markers are, so an "e" that is still part of a unit
 * query stays regular.
 */
export function NumberText({ text, parsed, running }: NumberTextProps) {
  const start = parsed.valueText ? text.indexOf(parsed.valueText) : -1;
  const marks = start < 0 ? [] : (parsed.exponentMarks ?? []).map((at) => start + at);
  const pieces: ReactNode[] = [];
  let from = 0;
  for (const at of marks) {
    pieces.push(
      text.slice(from, at),
      <span key={at} className="font-semibold" data-marker>
        {text[at]}
      </span>,
    );
    from = at + 1;
  }
  pieces.push(text.slice(from));
  return (
    <>
      {pieces}
      {running !== null && <span className="text-ink-muted">{` = ${running}`}</span>}
    </>
  );
}

/** The value of text holding arithmetic and nothing else, formatted as results are; null otherwise. */
export function runningValue(parsed: ParsedInput, locale: string | undefined): string | null {
  if (!parsed.expression || parsed.value === undefined || parsed.query) return null;
  return formatNumber(parsed.value, { locale });
}
