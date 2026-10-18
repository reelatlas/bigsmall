import { useId, useRef, useState, type FormEvent } from 'react';
import { Button } from '../../components/Button';
import { SegmentedControl } from '../../components/SegmentedControl';
import { FIELD_LABEL, FIELD_STACK, NO_ANSWER, TEXT_AREA, TEXT_INPUT } from '../../lib/recipes';
import { EXAMPLE, KINDS, sendFeedback, type Kind, type Outcome } from './report';

/** What the lines after Send say: sent, or what to try. */
const SAID: Record<Outcome, string> = {
  sent: 'Sent. Thank you.',
  failed: 'Could not send. Try again in a moment.',
};

/**
 * The feedback form on the About page (docs/UX-SPEC.md §1, "About"; ADR 0024), in the shape Sean
 * set (2026-10-17): what it is about, one strip of three kinds; Your email, optional, so anyone
 * can write, the address becoming the Reply-To; a Message whose empty state gives an example for
 * the kind chosen; and Send alone. Send posts the fields to the form service, which mails them to
 * us; then a line says it was sent and the message clears, or says it could not and what to try.
 * Nothing under the fields otherwise. A hidden field no person sees, the honeypot, goes with the
 * post, and a bot that fills it is dropped by the service (docs/DEPLOYMENT.md, "Feedback"); it is
 * read from the field itself at the send, since a bot sets a value without the events a person's
 * typing fires (docs/LEARNINGS.md, 2026-10-17).
 */
export function Feedback() {
  const id = useId();
  const [kind, setKind] = useState<Kind>('inaccuracy');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [sending, setSending] = useState(false);
  const honeypot = useRef<HTMLInputElement>(null);

  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setOutcome(null);
    const result = await sendFeedback({
      kind,
      email,
      message,
      page: location.href,
      honeypot: honeypot.current?.value ?? '',
    });
    setSending(false);
    setOutcome(result);
    if (result === 'sent') setMessage('');
  };

  return (
    <form className="grid gap-4" onSubmit={(event) => void send(event)}>
      <fieldset>
        <legend className="sr-only">What it is about</legend>
        <SegmentedControl
          name={`${id}-kind`}
          options={KINDS}
          value={kind}
          onChange={(next) => {
            setKind(next);
            setOutcome(null);
          }}
        />
      </fieldset>
      <label className={FIELD_STACK}>
        <span className={FIELD_LABEL}>Your email</span>
        <input
          className={TEXT_INPUT}
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
        />
      </label>
      <label className={FIELD_STACK}>
        <span className={FIELD_LABEL}>Message</span>
        <textarea
          className={TEXT_AREA}
          name="message"
          rows={5}
          required
          value={message}
          placeholder={EXAMPLE[kind]}
          onChange={(event) => setMessage(event.currentTarget.value)}
        />
      </label>
      {/* The honeypot: out of the page and the accessibility tree, in the post for the service. */}
      <label hidden aria-hidden="true">
        Leave this field empty
        <input ref={honeypot} type="text" name="_honeypot" tabIndex={-1} autoComplete="off" />
      </label>
      <div>
        <Button variant="primary" type="submit" aria-disabled={sending || undefined}>
          Send
        </Button>
      </div>
      <p role="status" className={outcome === 'failed' ? NO_ANSWER : 'text-sm text-ink-muted'}>
        {outcome ? SAID[outcome] : ''}
      </p>
    </form>
  );
}
