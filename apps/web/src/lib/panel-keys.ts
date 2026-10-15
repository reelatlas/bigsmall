/**
 * The keys of a panel of controls (docs/UX-SPEC.md §8; Sean, 2026-10-15): a settings side panel,
 * and the table's own controls (its foot, Hidden, and Edit). While focus is inside, ↑ and ↓ move
 * between its rows, a strip of choices (`data-strip`) one row, never past the first or the last;
 * Home and End go to the first and the last; ← and → move within a strip, a strip of radios
 * choosing as it goes; Enter works a checkbox or a radio as Space does; Escape is the caller's,
 * when it has one. Controls out of the Tab order (a row's copy button) and disabled ones are no
 * rows.
 */

/** The controls the arrows move between, by row. */
export function rowsIn(container: HTMLElement): HTMLElement[][] {
  const rows: HTMLElement[][] = [];
  let strip: Element | null = null;
  for (const control of container.querySelectorAll<HTMLElement>('button, input')) {
    if (control.matches(':disabled') || control.tabIndex < 0) continue;
    const own = control.closest('[data-strip]');
    if (own && own === strip) rows.at(-1)?.push(control);
    else rows.push([control]);
    strip = own;
  }
  return rows;
}

/** Where focus lands on a row: a strip of radios' chosen one, else its first control. */
export function stopOf(row: readonly HTMLElement[] | undefined): HTMLElement | undefined {
  return row?.find((control) => control instanceof HTMLInputElement && control.checked) ?? row?.[0];
}

/** A keydown listener for `container`; `onEscape`, when given, takes Escape. */
export function panelKeys(container: HTMLElement, onEscape?: () => void) {
  return (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target as HTMLElement;
    if (event.key === 'Escape') {
      if (!onEscape) return;
      event.preventDefault();
      onEscape();
      return;
    }
    const input = target instanceof HTMLInputElement ? target : null;
    if (event.key === 'Enter' && (input?.type === 'checkbox' || input?.type === 'radio')) {
      event.preventDefault();
      input.click();
      return;
    }
    const rows = rowsIn(container);
    const at = rows.findIndex((row) => row.includes(target));
    const row = rows[at];
    if (!row) return;
    let next: HTMLElement | undefined;
    switch (event.key) {
      case 'ArrowUp':
        next = stopOf(rows[at - 1]);
        break;
      case 'ArrowDown':
        next = stopOf(rows[at + 1]);
        break;
      case 'Home':
        next = stopOf(rows[0]);
        break;
      case 'End':
        next = stopOf(rows.at(-1));
        break;
      case 'ArrowLeft':
      case 'ArrowRight':
        // A radio strip's own ← and → move and choose; a strip of toggles moves without changing.
        if (input?.type === 'radio' || row.length < 2) return;
        next = row[row.indexOf(target) + (event.key === 'ArrowRight' ? 1 : -1)];
        break;
      default:
        return;
    }
    event.preventDefault();
    next?.focus();
  };
}
