import { useState, type FormEvent } from 'react';
import { Button } from '../../../components/Button';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { CARD, cx, LINK, SECTION_HEADING } from '../../../lib/recipes';
import { COPIED_MS } from '../../../lib/timing';
import { FIELD, INPUT, Panel } from '../_lab/controls';

/**
 * The feedback section prototyped (docs/research/feedback-1.md; the fiftieth pass's open question,
 * Sean, 2026-10-17: a light trial lab, to see the functions and how it might look): two ways a
 * visitor could reach us from the About page, each built from the real components with simple
 * state of its own, side by side. A: a short form whose Send opens the visitor's own email app with
 * the message filled in (a mailto: address with a subject and a body: no backend, no third party,
 * nothing stored or sent from the page), what it composes shown beside it so nothing need be sent
 * to see it. B: the address alone, with a copy. A report of a figure asks for the unit or
 * ingredient, the visitor's figure, and where it comes from: a lead with its source
 * (docs/RESEARCH.md §5). The address is the one planned, forwarded to Sean by Porkbun once he sets
 * it up; it does not exist yet.
 */

/** The address planned for feedback, at the site's own domain. */
const FEEDBACK_ADDRESS = 'hello@bigsmall.work';

const KINDS = [
  { value: 'figure', label: 'A figure' },
  { value: 'idea', label: 'An idea' },
  { value: 'problem', label: 'A problem' },
] as const;
type Kind = (typeof KINDS)[number]['value'];

const SUBJECT: Record<Kind, string> = {
  figure: 'a figure',
  idea: 'an idea',
  problem: 'a problem',
};

/** The hint under each kind's message: what helps us act on it. */
const HINT: Record<Kind, string> = {
  figure:
    'Which value, and what you expected. The figure and its source above are what let us check it.',
  idea: 'What you were trying to do, and what would have helped.',
  problem: 'What you did, what happened, and the device or browser if you know it.',
};

interface Report {
  kind: Kind;
  /** For a figure: the unit or ingredient it concerns. */
  what: string;
  /** For a figure: the visitor's figure and where it comes from. */
  theirs: string;
  message: string;
}

/** What the email says: its subject and body, as the visitor's email app will show them. */
function compose({ kind, what, theirs, message }: Report): { subject: string; body: string } {
  const subject = `bigsmall: ${SUBJECT[kind]}${kind === 'figure' && what ? `, ${what}` : ''}`;
  const lines =
    kind === 'figure'
      ? [
          `Unit or ingredient: ${what}`,
          `My figure, and where it comes from: ${theirs}`,
          '',
          message,
        ]
      : [message];
  return { subject, body: [...lines, '', 'From bigsmall.work/about'].join('\n') };
}

/** The mailto: address that opens the visitor's email app with the message filled in. */
const mailto = (report: Report) => {
  const { subject, body } = compose(report);
  return `mailto:${FEEDBACK_ADDRESS}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

const LABEL = 'text-sm font-medium';
const SMALL = 'text-xs text-ink-muted';

/** Copies the address, and says so for a moment, as the table's copy buttons do. */
function useCopiedAddress() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(FEEDBACK_ADDRESS).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), COPIED_MS);
    });
  };
  return { copied, copy };
}

/** The section's heading and its line, as they would sit on the About page. */
function SectionHead({ children }: { children: string }) {
  return (
    <>
      <h2 className={SECTION_HEADING}>Feedback</h2>
      <p className="text-center text-sm text-ink-muted">{children}</p>
    </>
  );
}

/** A: the form that opens the visitor's email app, with what it composes beside it. */
function FormAnswer() {
  const [kind, setKind] = useState<Kind>('figure');
  const [what, setWhat] = useState('');
  const [theirs, setTheirs] = useState('');
  const [message, setMessage] = useState('');
  const { copied, copy } = useCopiedAddress();
  const report: Report = { kind, what, theirs, message };
  const email = compose(report);
  const send = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    window.location.assign(mailto(report));
  };
  return (
    <div className="grid gap-6">
      <SectionHead>
        A figure that looks wrong, an idea, or something that broke: tell us.
      </SectionHead>
      <form className="grid gap-4" onSubmit={send}>
        <fieldset className="grid gap-2">
          <legend className={cx(LABEL, 'mb-2')}>What is it about?</legend>
          <SegmentedControl name="feedback-kind" options={KINDS} value={kind} onChange={setKind} />
        </fieldset>
        {kind === 'figure' && (
          <>
            <label className={FIELD}>
              <span className={LABEL}>Unit or ingredient</span>
              <input
                className={INPUT}
                value={what}
                onChange={(event) => setWhat(event.currentTarget.value)}
                placeholder="whole wheat flour"
              />
            </label>
            <label className={FIELD}>
              <span className={LABEL}>Your figure, and where it comes from</span>
              <input
                className={INPUT}
                value={theirs}
                onChange={(event) => setTheirs(event.currentTarget.value)}
                placeholder="113 g a cup, King Arthur's chart"
              />
            </label>
          </>
        )}
        <label className={FIELD}>
          <span className={LABEL}>Message</span>
          <textarea
            className={cx(INPUT, 'min-h-28 py-2')}
            rows={4}
            required
            value={message}
            onChange={(event) => setMessage(event.currentTarget.value)}
          />
          <span className={SMALL}>{HINT[kind]}</span>
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" type="submit">
            Send by email
          </Button>
          <Button variant="secondary" onClick={copy}>
            {copied ? 'Copied' : 'Copy the address'}
          </Button>
        </div>
        <p className={SMALL}>
          Send opens your email app with the message filled in, addressed to {FEEDBACK_ADDRESS}.
          Nothing is stored or sent from this page.
        </p>
        <p role="status" className="sr-only">
          {copied ? 'Address copied' : ''}
        </p>
      </form>
      <div className={cx(CARD, 'grid gap-2 p-4 text-sm')}>
        <p className={LABEL}>What arrives (the lab's preview)</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          <dt className="text-ink-muted">To</dt>
          <dd>{FEEDBACK_ADDRESS}</dd>
          <dt className="text-ink-muted">Subject</dt>
          <dd>{email.subject}</dd>
          <dt className="text-ink-muted">Body</dt>
          <dd className="whitespace-pre-wrap">{email.body}</dd>
        </dl>
      </div>
    </div>
  );
}

/** B: the address alone, with a copy and a link that opens the email app. */
function AddressAnswer() {
  const { copied, copy } = useCopiedAddress();
  const blank = compose({ kind: 'figure', what: '', theirs: '', message: '' });
  return (
    <div className="grid gap-6">
      <SectionHead>
        A figure that looks wrong, an idea, or something that broke: write to us.
      </SectionHead>
      <div className="grid gap-3 text-sm">
        <p>
          <span className="font-medium">{FEEDBACK_ADDRESS}</span>
        </p>
        <p className="text-ink-muted">
          For a figure, say the unit or ingredient, your figure, and where it comes from, so we can
          check it against the sources.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="secondary" onClick={copy}>
            {copied ? 'Copied' : 'Copy the address'}
          </Button>
          <a
            className={LINK}
            href={`mailto:${FEEDBACK_ADDRESS}?subject=${encodeURIComponent('bigsmall')}&body=${encodeURIComponent(blank.body.trim())}`}
          >
            Open your email app
          </a>
        </div>
        <p role="status" className="sr-only">
          {copied ? 'Address copied' : ''}
        </p>
      </div>
    </div>
  );
}

export function FeedbackLab() {
  return (
    <div className="mt-8 grid gap-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="A. A form that opens your email app">
          <FormAnswer />
        </Panel>
        <Panel title="B. The address alone">
          <AddressAnswer />
        </Panel>
      </div>
      <div className={cx(CARD, 'grid gap-2 p-5 text-sm')}>
        <p className="font-medium">C. A form that posts to a service, not built</p>
        <p className="text-ink-muted">
          A form service (Formspree, Basin) would land messages in the inbox without an email app,
          at the cost of a third party holding them, spam to filter, and a line in the privacy note.
          It is the fallback if the email route loses messages. A function of our own sending
          through an email service would be the same trade with more to run.
        </p>
      </div>
    </div>
  );
}
