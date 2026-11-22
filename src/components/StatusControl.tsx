import { STATUSES, STATUS_LABEL, type Status } from '../lib/types';
import { STATUS_STYLE, cx } from '../lib/ui';

export default function StatusControl({ value, onChange }: { value: Status; onChange: (s: Status) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-200/70 p-1 dark:bg-slate-800">
      {STATUSES.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => s !== value && onChange(s)}
          className={cx(
            'rounded-xl px-2 py-2 text-sm font-medium transition',
            s === value ? STATUS_STYLE[s].active + ' shadow' : 'text-slate-600 dark:text-slate-300',
          )}
        >
          {STATUS_LABEL[s]}
        </button>
      ))}
    </div>
  );
}
