import Icon from './Icon';

/** Attribution exigée par les conditions d'utilisation de l'API XML BoardGameGeek */
export default function BggAttribution() {
  return (
    <a
      href="https://boardgamegeek.com"
      target="_blank"
      rel="noreferrer noopener"
      className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:border-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
    >
      <Icon name="dice" className="size-4 text-accent-600 dark:text-accent-400" />
      <span>
        Powered by <strong className="font-semibold">BGG</strong>
      </span>
    </a>
  );
}
