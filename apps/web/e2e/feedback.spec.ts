import { expect, test, type Page } from '@playwright/test';
import { FEEDBACK_ENDPOINT } from '../src/lib/site';
import { expectNoA11yViolations } from './support';

// The feedback form on the About page (docs/UX-SPEC.md §1, "About"; ADR 0024): the fields Send
// posts to the form service, answered here by the test and never sent, and the lines after.

const section = (page: Page) => page.locator('#feedback');
const message = (page: Page) => page.getByLabel('Message');
const send = (page: Page) => page.getByRole('button', { name: 'Send', exact: true });

/** Opens About at the form, hydrated: the strip answers before anything is typed into it. */
async function openForm(page: Page) {
  await page.goto('/about');
  await section(page).scrollIntoViewIfNeeded();
  // The island hydrates as it comes into view, and Astro drops its `ssr` mark once it has; a click
  // before that moves the radio and nothing else. A visually hidden radio is reached through its
  // visible label, as a person reaches it.
  await expect(section(page).locator('astro-island')).not.toHaveAttribute('ssr');
  await section(page).getByText('Bug', { exact: true }).click();
  await expect(message(page)).toHaveAttribute('placeholder', /iPad/);
}

/** Answers the form's post with `status`, keeping what was posted. */
async function answering(page: Page, status: number) {
  const posts: Record<string, unknown>[] = [];
  await page.route(FEEDBACK_ENDPOINT, async (route) => {
    posts.push(route.request().postDataJSON() as Record<string, unknown>);
    await route.fulfill({
      status,
      contentType: status === 200 ? 'application/json' : 'text/plain',
      body: status === 200 ? '{}' : 'rejected',
    });
  });
  return posts;
}

test('Send posts the kind, the email, the message, and the page as JSON, then says so and clears the message', async ({
  page,
}) => {
  await openForm(page);
  const posts = await answering(page, 200);
  await page.getByLabel('Your email').fill('someone@example.com');
  await message(page).fill('On my iPad, picking kilobytes scrolls the table to the top.');
  await send(page).click();
  await expect(section(page).getByRole('status')).toHaveText('Sent. Thank you.');
  await expect(message(page)).toHaveValue('');
  await expect(page.getByLabel('Your email')).toHaveValue('someone@example.com');
  expect(posts).toHaveLength(1);
  const posted = posts[0]!;
  expect(posted['kind']).toBe('bug');
  expect(posted['email']).toBe('someone@example.com');
  expect(posted['message']).toBe('On my iPad, picking kilobytes scrolls the table to the top.');
  expect(posted['page']).toMatch(/\/about/);
  expect(posted['_email']).toEqual({ subject: 'bigsmall feedback: bug' });
  // The honeypot, empty from a person; its field is in neither the page nor the accessibility
  // tree, which a role query asks (a label query finds a hidden field too).
  expect(posted['_honeypot']).toBe('');
  await expect(page.locator('input[name="_honeypot"]')).toBeHidden();
  await expect(page.getByRole('textbox', { name: 'Leave this field empty' })).toHaveCount(0);
});

test('a refusal from the service says what to try and keeps the message; the strip changes the example', async ({
  page,
}) => {
  await openForm(page);
  await answering(page, 403);
  // Each kind's example, from a different category; the message is required.
  await section(page).getByText('Inaccuracy', { exact: true }).click();
  await expect(message(page)).toHaveAttribute('placeholder', /stone/);
  await section(page).getByText('Idea', { exact: true }).click();
  await expect(message(page)).toHaveAttribute('placeholder', /5 ft 10 in/);
  await message(page).fill('Let me type 5 ft 10 in and see it in centimeters.');
  await message(page).press('Enter');
  await send(page).focus();
  await page.keyboard.press('Enter');
  await expect(section(page).getByRole('status')).toHaveText(
    'Could not send. Try again in a moment.',
  );
  await expect(message(page)).toHaveValue(/5 ft 10 in/);
  await expectNoA11yViolations(page);
});
