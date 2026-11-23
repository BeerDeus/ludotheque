import { STATUSES, STATUS_LABEL, type Status } from '../lib/types';
import { STATUS_STYLE, cx } from '../lib/ui';
import { STATUS_ICON } from '../lib/icons';
import Icon from './Icon';

export default function StatusControl({ value, onChange }: { value: Status; onChange: (s: Status) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-200/70 p-1 dark:bg-slate-800">
      {STATUSES.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => s !== value && onChange(s)}
          aria-pressed={s === value}
          className={cx(
            'flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-sm font-medium transition',
            s === value ? STATUS_STYLE[s].active + ' shadow' : 'text-slate-600 hover:bg-slate-300/40 dark:text-slate-300 dark:hover:bg-slate-700/50',
          )}
        >
          <Icon name={STATUS_ICON[s]} className="size-4" />
          {STATUS_LABEL[s]}
        </button>
      ))}
    </div>
  );
}
