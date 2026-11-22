export default function Spinner({ full }: { full?: boolean }) {
  const s = (
    <div className="size-8 animate-spin rounded-full border-4 border-slate-300 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" />
  );
  return full ? <div className="grid min-h-dvh place-items-center">{s}</div> : s;
}
