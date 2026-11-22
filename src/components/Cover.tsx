import { useState } from 'react';
import { cx } from '../lib/ui';

const HUES = [210, 260, 330, 20, 140, 180, 45];

export default function Cover({ name, url, className }: { name: string; url?: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (url && !broken) {
    return <img src={url} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} className={cx('object-cover', className)} />;
  }
  const hue = HUES[Array.from(name).reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length];
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  return (
    <div className={cx('grid place-items-center font-bold text-white', className)} style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${hue + 40} 70% 40%))` }}>
      {initials}
    </div>
  );
}
