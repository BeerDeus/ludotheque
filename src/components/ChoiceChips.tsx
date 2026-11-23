import { cx } from '../lib/ui';
import Icon, { type IconName } from './Icon';

/** Sélecteur à pastilles ; re-toucher la valeur active l'efface */
export default function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
  labels,
  icons,
  autoValue,
}: {
  options: T[];
  value?: T;
  onChange: (v: T | undefined) => void;
  labels: Record<T, string>;
  icons?: Record<T, IconName>;
  /** valeur déduite automatiquement (affichée en pointillés) */
  autoValue?: T;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value === o;
        const auto = !value && autoValue === o;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(on ? undefined : o)}
            aria-pressed={on}
            className={cx(
              'chip px-2.5 py-1 text-[13px] transition',
              on
                ? 'bg-accent-600 text-white dark:bg-accent-500 dark:text-slate-950'
                : auto
                  ? 'border border-dashed border-accent-500/60 text-accent-700 dark:text-accent-300'
                  : 'bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
            )}
            title={auto ? 'Déduit de la complexité — touche pour confirmer' : undefined}
          >
            {icons && <Icon name={icons[o]} className="size-3.5" />}
            {labels[o]}
          </button>
        );
      })}
    </div>
  );
}
