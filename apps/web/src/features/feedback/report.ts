import { FEEDBACK_ENDPOINT } from '../../lib/site';

/**
 * The feedback form's words and its post (docs/UX-SPEC.md §1, "About"; ADR 0024): what a message
 * is about, the example each kind shows as the Message's empty state, the fields Send posts to the
 * form service, and the post itself. Pure but for the post, which takes its `fetch`.
 */

/** What a message is about: the strip's three kinds, in order (Sean, 2026-10-17). */
export const KINDS = [
  { value: 'inaccuracy', label: 'Inaccuracy' },
  { value: 'bug', label: 'Bug' },
  { value: 'idea', label: 'Idea' },
] as const;
export type Kind = (typeof KINDS)[number]['value'];

/**
 * The Message's empty state: an example of the kind, each from a different category (Sean,
 * 2026-10-17), so a visitor knows what helps. An inaccuracy's says the value seen, the one
 * expected, and where the visitor's figure comes from: a lead for docs/RESEARCH.md §5.
 */
export const EXAMPLE: Record<Kind, string> = {
  inaccuracy: 'A stone shows 6.35 kg, and the chart at my gym says 6.4.',
  bug: 'On my iPad, picking kilobytes scrolls the table to the top.',
  idea: 'Let me type 5 ft 10 in and see it in centimeters.',
};

export interface Report {
  kind: Kind;
  /** The visitor's address, which the service makes the Reply-To; empty when none was given. */
  email: string;
  message: string;
  /** The page the message was sent from, with its conversion in the URL where there is one. */
  page: string;
  /** The hidden field no person sees; a bot that fills it is dropped by the service. */
  honeypot: string;
}

/** The kind's label, as the strip shows it. */
const labelOf = (kind: Kind) => KINDS.find((entry) => entry.value === kind)?.label ?? kind;

/**
 * The fields posted to the form service as JSON: ours; the notification's subject from the kind,
 * its sender name, its heading, and no footer (`_email`, the service's documented options, so the
 * inbox reads bigsmall, not the service; docs/DEPLOYMENT.md, "Feedback"); and the honeypot's
 * value (`_honeypot`), which the service checks. An empty email is left out, so the service does
 * not take it for an address.
 */
export function feedbackBody({ kind, email, message, page, honeypot }: Report) {
  const address = email.trim();
  return {
    kind,
    ...(address && { email: address }),
    message,
    page,
    _email: {
      subject: `bigsmall feedback: ${kind}`,
      from: 'bigsmall feedback',
      template: { title: labelOf(kind), footer: false },
    },
    _honeypot: honeypot,
  };
}

export type Outcome = 'sent' | 'failed';

/**
 * Posts a report and says whether the service took it: `sent` on a 200, `failed` on anything
 * else, a refusal (a post from elsewhere, a filled honeypot, the service's filter, 403), the
 * workspace out of submissions (402), or no answer at all (docs/DEPLOYMENT.md, "Feedback").
 */
export async function sendFeedback(report: Report, post: typeof fetch = fetch): Promise<Outcome> {
  try {
    const response = await post(FEEDBACK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(feedbackBody(report)),
    });
    return response.ok ? 'sent' : 'failed';
  } catch {
    return 'failed';
  }
}
