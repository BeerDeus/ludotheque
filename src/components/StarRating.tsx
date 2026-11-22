import { cx } from '../lib/ui';

/** 5 étoiles ; re-taper la note courante l'efface. Sans onChange = lecture seule. */
export default function StarRating({
  value,
  onChange,
  size = 'md',
  className,
}: {
  value?: number;
  onChange?: (v: number | undefined) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const v = value ?? 0;
  const px = { sm: 'size-3.5', md: 'size-5', lg: 'size-7' }[size];
  const star = (i: number) => (
    <svg viewBox="0 0 24 24" className={cx(px, i <= v ? 'fill-amber-400 text-amber-400' : 'fill-none text-slate-300 dark:text-slate-600')} stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinejoin="round" d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" />
    </svg>
  );
  if (!onChange) {
    return (
      <span className={cx('inline-flex', className)} aria-label={v ? `${v} sur 5` : 'Non noté'}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i}>{star(i)}</span>
        ))}
      </span>
    );
  }
  return (
    <span className={cx('inline-flex', className)} role="radiogroup" aria-label="Ma note">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={v === i}
          aria-label={`${i} étoile${i > 1 ? 's' : ''}`}
          className="p-0.5 transition active:scale-90"
          onClick={() => onChange(v === i ? undefined : i)}
        >
          {star(i)}
        </button>
      ))}
    </span>
  );
}
