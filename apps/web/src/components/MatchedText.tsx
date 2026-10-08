import { matchSpan } from '@bigsmall/core';

/**
 * `text` with the part `query` matches wrapped in a span set heavier, matched the way search
 * matched it (core's matchSpan, under the same folding), as every list of matches marks them
 * (docs/DESIGN-SYSTEM.md, "Lists"). A query that matched through an alias the text does not
 * show marks nothing.
 */
export function MatchedText({
  text,
  query,
  className,
}: {
  text: string;
  query: string | undefined;
  /** The matched part's look: `font-semibold` for a name, `text-ink` for a muted symbol. */
  className: string;
}) {
  const span = query ? matchSpan(text, query) : null;
  if (!span) return text;
  return (
    <>
      {text.slice(0, span.start)}
      <span className={className} data-match>
        {text.slice(span.start, span.end)}
      </span>
      {text.slice(span.end)}
    </>
  );
}
