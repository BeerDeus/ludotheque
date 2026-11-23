import { useEffect, type ReactNode } from 'react';
import Icon from './Icon';

/** Image plein écran ; tap n'importe où (ou Échap) pour fermer */
export default function Lightbox({ src, alt, loading, onClose, actions }: { src?: string; alt: string; loading?: boolean; onClose: () => void; actions?: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black/90 backdrop-blur-sm" onClick={onClose} role="dialog" aria-label={alt}>
      <div className="flex items-center justify-between gap-2 p-3 text-white" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <p className="min-w-0 flex-1 text-sm leading-snug font-medium">{alt}</p>
        <button className="rounded-full bg-white/10 p-2" aria-label="Fermer">
          <Icon name="close" />
        </button>
      </div>
      <div className="relative grid min-h-0 flex-1 place-items-center p-4">
        {src ? <img src={src} alt={alt} referrerPolicy="no-referrer" className={`max-h-full w-full max-w-xl rounded-xl object-contain shadow-2xl ${loading ? 'blur-sm' : ''}`} /> : null}
        {loading && <div className="absolute size-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />}
      </div>
      {actions && (
        <div className="flex justify-center gap-2 p-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }} onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>
  );
}
