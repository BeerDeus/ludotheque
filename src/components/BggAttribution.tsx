/** Attribution exigée par les conditions d'utilisation de l'API XML BoardGameGeek */
export default function BggAttribution() {
  return (
    <a
      href="https://boardgamegeek.com"
      target="_blank"
      rel="noreferrer noopener"
      className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:border-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
    >
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
        <path fill="#ff5100" d="M3 6.5 12 2l9 4.5v11L12 22l-9-4.5z" />
        <path fill="#fff" d="M8 8h5.2c1.6 0 2.6.8 2.6 2.1 0 .9-.5 1.5-1.2 1.8.9.2 1.6.9 1.6 2 0 1.4-1.1 2.3-2.8 2.3H8zm2 3.3h2.8c.6 0 1-.3 1-.8s-.4-.8-1-.8H10zm0 3.5h3c.7 0 1.1-.3 1.1-.9s-.4-.9-1.1-.9h-3z" />
      </svg>
      <span>
        Powered by <strong className="font-semibold">BGG</strong>
      </span>
    </a>
  );
}
