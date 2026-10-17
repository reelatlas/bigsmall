import { useState, type FormEvent } from 'react';
import { Button } from '../../../components/Button';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { cx, SECTION_HEADING } from '../../../lib/recipes';
import { FIELD, INPUT, Panel } from '../_lab/controls';

/**
 * The feedback section prototyped (docs/research/feedback-1.md; the fiftieth pass's open question)
 * in the shape Sean set (2026-10-17): under a heading "Feedback", one strip of kinds, "Your
 * email", a Message whose empty state gives an example for the kind chosen, and Send alone, which
 * sends the message to his inbox itself, never by opening the visitor's email app; no fields per
 * kind and nothing under the fields. Built from the real components with simple state of its own;
 * beside it, the lab's own card shows what Send would deliver. In the lab nothing is sent: how
 * Send delivers (a form service, or a function of our own) is his decision, in feedback-1.md.
 */

const KINDS = [
  { value: 'inaccuracy', label: 'Inaccuracy' },
  { value: 'bug', label: 'Bug' },
  { value: 'idea', label: 'Idea' },
] as const;
type Kind = (typeof KINDS)[number]['value'];

/** The Message's empty state: an example of the kind, so a visitor knows what helps. */
const EXAMPLE: Record<Kind, string> = {
  inaccuracy: 'A stone shows 6.35 kg, and the chart at my gym says 6.4.',
  bug: 'On my iPad, picking kilobytes scrolls the table to the top.',
  idea: 'Let me type 5 ft 10 in and see it in centimeters.',
};

interface Report {
  kind: Kind;
  email: string;
  message: string;
}

/** What Send delivers to the inbox: the fields as a form service or a function would send them. */
function delivery({ kind, email, message }: Report) {
  return {
    subject: `bigsmall feedback: ${kind}`,
    replyTo: email || 'not given',
    body: `${message}\n\nFrom bigsmall.work/about`,
  };
}

const LABEL = 'text-sm font-medium';
const MUTED = 'text-sm text-ink-muted';

export function FeedbackLab() {
  const [kind, setKind] = useState<Kind>('inaccuracy');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState<ReturnType<typeof delivery> | null>(null);
  const send = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // The lab delivers nowhere: it shows what the real Send would deliver, and clears the message.
    setSent(delivery({ kind, email, message }));
    setMessage('');
  };
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <Panel title="On the About page">
        <section className="mx-auto w-full max-w-md" aria-labelledby="feedback-heading">
          <h2 id="feedback-heading" className={cx(SECTION_HEADING, 'mb-6')}>
            Feedback
          </h2>
          <form className="grid gap-4" onSubmit={send}>
            <fieldset>
              <legend className="sr-only">What it is about</legend>
              <SegmentedControl
                name="feedback-kind"
                options={KINDS}
                value={kind}
                onChange={setKind}
              />
            </fieldset>
            <label className={FIELD}>
              <span className={LABEL}>Your email</span>
              <input
                className={INPUT}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
              />
            </label>
            <label className={FIELD}>
              <span className={LABEL}>Message</span>
              <textarea
                className={cx(INPUT, 'min-h-32 py-2')}
                rows={5}
                required
                value={message}
                placeholder={EXAMPLE[kind]}
                onChange={(event) => setMessage(event.currentTarget.value)}
              />
            </label>
            <div>
              <Button variant="primary" type="submit">
                Send
              </Button>
            </div>
            <p role="status" className={MUTED}>
              {sent ? 'Sent. Thank you.' : ''}
            </p>
          </form>
        </section>
      </Panel>
      <Panel title="What Send delivers (the lab’s preview)">
        {sent ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-ink-muted">Subject</dt>
            <dd>{sent.subject}</dd>
            <dt className="text-ink-muted">Reply to</dt>
            <dd>{sent.replyTo}</dd>
            <dt className="text-ink-muted">Body</dt>
            <dd className="whitespace-pre-wrap">{sent.body}</dd>
          </dl>
        ) : (
          <p className={MUTED}>
            Press Send to see what would arrive in the inbox. In the lab nothing is sent.
          </p>
        )}
        <p className={MUTED}>
          How Send delivers is open (docs/research/feedback-1.md): a form service posts the fields
          and emails them, the visitor’s address as Reply to, with its own spam filtering; or a
          function of ours sends them through an email service. Neither opens the visitor’s email
          app.
        </p>
      </Panel>
    </div>
  );
}
