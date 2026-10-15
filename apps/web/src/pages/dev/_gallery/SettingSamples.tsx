import { useId } from 'react';
import { SegmentedControl, SegmentedToggles } from '../../../components/SegmentedControl';
import { SidePanel } from '../../../components/SidePanel';
import { Switch } from '../../../components/Switch';
import { TriCheckbox } from '../../../components/TriCheckbox';
import { cx, OPTION_ROW } from '../../../lib/recipes';

// Gallery-only: the settings' controls in frozen states, so every theme is checked against what
// ships. Nothing here changes; a press does nothing.

const noop = () => undefined;
const LEGEND = 'text-xs font-medium text-ink-muted';

export function SettingSamples({ theme }: { theme: string }) {
  const id = useId();
  return (
    <div className="grid gap-2" aria-label={`${theme} settings controls`} role="group">
      <fieldset className="grid">
        <legend className={LEGEND}>Segmented control, one of a few</legend>
        <SegmentedControl
          name={`${id}-names`}
          options={[
            { value: 'symbol', label: 'Symbol only' },
            { value: 'both', label: 'Symbol and name' },
          ]}
          value="symbol"
          onChange={noop}
        />
      </fieldset>
      <fieldset className="grid">
        <legend className={LEGEND}>Segmented toggles, several at once</legend>
        <SegmentedToggles
          options={[2, 3, 4, 8].map((size) => ({
            value: size,
            label: <span className="font-numeric">1/{size}</span>,
          }))}
          checked={(size) => size === 2 || size === 8}
          onToggle={noop}
        />
      </fieldset>
      <fieldset disabled className="grid">
        <legend className={LEGEND}>Disabled</legend>
        <SegmentedControl
          name={`${id}-rounding`}
          options={[
            { value: 'nearest', label: 'Nearest' },
            { value: 'up', label: 'Up' },
            { value: 'down', label: 'Down' },
          ]}
          value="nearest"
          onChange={noop}
        />
      </fieldset>
      <div className="grid sm:grid-cols-2">
        <Switch label="Switch, off" checked={false} onChange={noop} />
        <Switch label="Switch, on" checked onChange={noop} />
      </div>
      <fieldset className="grid">
        <legend className={LEGEND}>Checkbox over a group: all, some, none</legend>
        {(['all', 'some', 'none'] as const).map((state) => (
          <label key={state} className={cx(OPTION_ROW, 'gap-2')}>
            <TriCheckbox state={state} onChange={noop} />
            {state === 'all' ? 'All shown' : state === 'some' ? 'Some shown' : 'None shown'}
          </label>
        ))}
      </fieldset>
      <div className="max-w-72">
        <SidePanel title="Display" focusOnOpen={false} onClose={noop}>
          <fieldset className="grid">
            <legend className="sr-only">Unit names</legend>
            <SegmentedControl
              name={`${id}-side`}
              options={[
                { value: 'symbol', label: 'Symbol only' },
                { value: 'both', label: 'Symbol and name' },
              ]}
              value="symbol"
              onChange={noop}
            />
          </fieldset>
          <Switch label="Copy buttons" checked={false} onChange={noop} />
        </SidePanel>
      </div>
    </div>
  );
}
