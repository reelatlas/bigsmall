import { describe, expect, it } from 'vitest';
import {
  EXAMPLES,
  exampleFor,
  feedbackBody,
  KINDS,
  sendFeedback,
  type Report,
} from '../src/features/feedback/report';
import { FEEDBACK_ENDPOINT, FEEDBACK_FORM_ID } from '../src/lib/site';

// The feedback form's post (docs/UX-SPEC.md §1, "About"; ADR 0024).

const report: Report = {
  kind: 'bug',
  email: ' someone@example.com ',
  message: 'On my iPad, picking kilobytes scrolls the table to the top.',
  page: 'https://bigsmall.work/about',
  honeypot: '',
};

describe('the fields Send posts', () => {
  it('carry the kind, the message, the page, the notification named from the kind, and the honeypot', () => {
    expect(feedbackBody(report)).toEqual({
      kind: 'bug',
      email: 'someone@example.com',
      message: report.message,
      page: report.page,
      _email: {
        subject: 'bigsmall feedback: bug',
        from: 'bigsmall feedback',
        template: { title: 'Bug', footer: false },
      },
      _honeypot: '',
    });
  });

  it('leave an empty email out, so the service does not take it for an address', () => {
    expect(feedbackBody({ ...report, email: '  ' })).not.toHaveProperty('email');
  });

  it('pass a filled honeypot on, for the service to drop', () => {
    expect(feedbackBody({ ...report, honeypot: 'http://spam' })._honeypot).toBe('http://spam');
  });

  it('have five examples for every kind, all different, each short enough for two lines on a phone', () => {
    for (const { value } of KINDS) {
      expect(EXAMPLES[value]).toHaveLength(5);
      for (const example of EXAMPLES[value]) {
        expect(example.length).toBeLessThanOrEqual(64);
        // Ends as a typed line does, without a period (Sean, 2026-10-18).
        expect(example.endsWith('.')).toBe(false);
      }
    }
    const all = Object.values(EXAMPLES).flat();
    expect(new Set(all).size).toBe(all.length);
  });

  it('draw an example of the kind at random, never the one showing while the kind has others', () => {
    const drawn = [0, 0.2, 0.4, 0.6, 0.8, 0.999].map((at) =>
      exampleFor('bug', undefined, () => at),
    );
    expect(new Set(drawn)).toEqual(new Set(EXAMPLES.bug));
    for (const at of [0, 0.5, 0.999]) {
      const next = exampleFor('idea', EXAMPLES.idea[2], () => at);
      expect(EXAMPLES.idea).toContain(next);
      expect(next).not.toBe(EXAMPLES.idea[2]);
    }
    // Switching kinds: the one showing is of another kind, so any of the new kind's may come.
    expect(EXAMPLES.inaccuracy).toContain(exampleFor('inaccuracy', EXAMPLES.bug[0]));
  });
});

describe('the post', () => {
  const answering = (status: number) => {
    const calls: { url: string; init: RequestInit }[] = [];
    const post = (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response(status === 200 ? '{}' : 'rejected', { status });
    }) as typeof fetch;
    return { calls, post };
  };

  it('goes to the form as JSON, asking for JSON back, and is sent on a 200', async () => {
    const { calls, post } = answering(200);
    expect(await sendFeedback(report, post)).toBe('sent');
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe(FEEDBACK_ENDPOINT);
    expect(FEEDBACK_ENDPOINT).toBe(`https://submit-form.com/${FEEDBACK_FORM_ID}`);
    expect(calls[0]!.init.method).toBe('POST');
    expect(calls[0]!.init.headers).toEqual({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
    expect(JSON.parse(calls[0]!.init.body as string)).toEqual(feedbackBody(report));
  });

  it('fails on a refusal, on a workspace out of submissions, and with no answer at all', async () => {
    expect(await sendFeedback(report, answering(403).post)).toBe('failed');
    expect(await sendFeedback(report, answering(402).post)).toBe('failed');
    const down = (async () => {
      throw new TypeError('Failed to fetch');
    }) as unknown as typeof fetch;
    expect(await sendFeedback(report, down)).toBe('failed');
  });
});
