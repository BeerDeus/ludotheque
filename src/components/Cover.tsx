import { useState } from 'react';
import { cx } from '../lib/ui';

// tons chauds/terreux accordés au thème (cuivre, or, bordeaux, mousse, ardoise, prune)
const TONES: [string, string][] = [
  ['#c15f3c', '#6b3524'],
  ['#c9962e', '#6e4c12'],
  ['#8a2f3b', '#3d1219'],
  ['#5f7a45', '#28361c'],
  ['#5a6470', '#23272c'],
  ['#6d4a6b', '#2c1d2b'],
];

export default function Cover({ name, url, className }: { name: string; url?: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (url && !broken) {
    return <img src={url} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} className={cx('object-cover', className)} />;
  }
  const [c1, c2] = TONES[Array.from(name).reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  return (
    <div className={cx('font-display grid place-items-center font-bold text-[#f7e6b4] ring-1 ring-inset ring-black/10', className)} style={{ background: `radial-gradient(circle at 30% 25%, ${c1}, ${c2})` }}>
      {initials}
    </div>
  );
}
