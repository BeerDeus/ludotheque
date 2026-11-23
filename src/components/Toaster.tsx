import { useEffect, useState } from 'react';
import { onToast, type ToastMsg } from '../lib/toast';

export default function Toaster() {
  const [items, setItems] = useState<ToastMsg[]>([]);

  useEffect(
    () =>
      onToast((t) => {
        setItems((prev) => [...prev.slice(-2), t]);
        setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), 4000);
      }),
    [],
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 z-[60] flex flex-col items-center gap-2 px-4" style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}>
      {items.map((t) => (
        <div key={t.id} className="pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">
          <span className="min-w-0 flex-1">{t.text}</span>
          {t.action && (
            <button
              className="font-semibold text-accent-300 dark:text-accent-600"
              onClick={() => {
                t.action!.run();
                setItems((prev) => prev.filter((x) => x.id !== t.id));
              }}
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
