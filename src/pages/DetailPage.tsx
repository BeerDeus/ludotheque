import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import BggAttribution from '../components/BggAttribution';
import Cover from '../components/Cover';
import { EditableField, EditableMarkdown } from '../components/Editable';
import Expansions from '../components/Expansions';
import GameForm from '../components/GameForm';
import Header from '../components/Header';
import Icon from '../components/Icon';
import Spinner from '../components/Spinner';
import StarRating from '../components/StarRating';
import StatusControl from '../components/StatusControl';
import { useGames, useSession } from '../lib/context';
import { formatDate, formatPlayers, formatPrice, isEnriched, parseTags } from '../lib/format';
import { toast } from '../lib/toast';
import { deleteGame, setStatus, updateGame } from '../lib/games';
import { ENRICHED_SECTIONS, PRIORITY_LABEL, STATUS_LABEL, type Game, type Priority } from '../lib/types';
import { cx } from '../lib/ui';

const toNum = (s: string) => (s === '' ? undefined : Number(s.replace(',', '.')));

export default function DetailPage() {
  const { id } = useParams();
  const { games, loading } = useGames();
  const { family } = useSession();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const game = games.find((g) => g.id === id);

  const back = (
    <button className="btn-ghost p-2" onClick={() => (history.length > 1 ? navigate(-1) : navigate('/'))} aria-label="Retour">
      <Icon name="back" />
    </button>
  );

  if (loading) return <Spinner full />;
  if (!game)
    return (
      <>
        <Header left={back} title="Introuvable" />
        <p className="p-6 text-center text-slate-500">
          Ce jeu n’existe pas ou a été supprimé. <Link to="/" className="text-indigo-600">Retour</Link>
        </p>
      </>
    );

  const owned = game.status === 'owned';
  const save = (patch: Partial<Game>) => void updateGame(family.id, game.id, patch).catch((e: Error) => toast(`Erreur : ${e.message}`));

  const remove = () => {
    if (!confirm(`Supprimer « ${game.name} » ?`)) return;
    void deleteGame(family.id, game.id);
    navigate('/', { replace: true });
  };

  return (
    <>
      <Header
        left={back}
        title={game.name}
        right={
          <button className="btn-ghost p-2" onClick={() => setEditing(true)} aria-label="Modifier">
            <Icon name="edit" />
          </button>
        }
      />
      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-3 pt-4 pb-16">
        <section className="flex gap-4">
          <Cover name={game.name} url={game.coverUrl || game.thumbUrl} className="size-32 shrink-0 rounded-2xl text-3xl shadow-md" />
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
            <h2 className="text-xl leading-tight font-bold">{game.name}</h2>
            <StarRating value={game.myRating} onChange={(v) => save({ myRating: v })} size="lg" className="-ml-0.5" />
            <div className="flex flex-wrap gap-1 text-xs">
              {game.yearPublished ? <span className="chip bg-slate-500/10">{game.yearPublished}</span> : null}
              {game.bggRating ? (
                <span className="chip bg-slate-500/10" title="Note moyenne BGG">
                  BGG ★ {game.bggRating.toFixed(1)}
                </span>
              ) : null}
              {game.bggId ? (
                <a className="chip bg-orange-500/15 text-orange-700 dark:text-orange-300" href={`https://boardgamegeek.com/boardgame/${game.bggId}`} target="_blank" rel="noreferrer">
                  Fiche BGG ↗
                </a>
              ) : null}
              {!isEnriched(game) && <span className="chip bg-sky-500/15 text-sky-700 dark:text-sky-300">non enrichi</span>}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-4 gap-2 text-center">
          {[
            { icon: 'users' as const, value: formatPlayers(game).replace(' j.', ''), label: 'joueurs' },
            { icon: 'clock' as const, value: game.durationMin ? String(game.durationMin) : '', label: 'minutes' },
            { icon: 'sparkle' as const, value: game.ageMin ? `${game.ageMin}+` : '', label: 'âge' },
            { icon: 'brain' as const, value: game.complexity ? `${game.complexity}/5` : '', label: 'complexité' },
          ].map((s) => (
            <div key={s.label} className="card flex flex-col items-center gap-0.5 px-1 py-2.5">
              <Icon name={s.icon} className="size-4 text-slate-400" />
              <span className="text-base font-semibold">{s.value || '—'}</span>
              <span className="text-[10px] tracking-wide text-slate-500 uppercase">{s.label}</span>
            </div>
          ))}
        </section>

        <StatusControl
          value={game.status}
          onChange={(s) => {
            const prev = game.status;
            void setStatus(family.id, game.id, s);
            toast(`Statut : ${STATUS_LABEL[s]}`, { label: 'Annuler', run: () => void setStatus(family.id, game.id, prev) });
          }}
        />

        {game.url && (
          <a href={game.url} target="_blank" rel="noreferrer noopener" className="btn-primary py-3">
            <Icon name="cart" className="size-4" /> {game.shop ? `Voir chez ${game.shop}` : 'Lien d’achat'}
          </a>
        )}

        <details className="card group overflow-hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-semibold">
            <span>Infos & prix</span>
            <Icon name="back" className="size-4 -rotate-90 transition group-open:rotate-90" />
          </summary>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-200 p-4 sm:grid-cols-3 dark:border-slate-800">
            <EditableField label="Joueurs min" kind="number" value={game.playersMin ? String(game.playersMin) : ''} placeholder="auto" onSave={(v) => save({ playersMin: Number(v) || 0 })} />
            <EditableField label="Joueurs max" kind="number" value={game.playersMax ? String(game.playersMax) : ''} placeholder="auto" onSave={(v) => save({ playersMax: Number(v) || 0 })} />
            <EditableField label="Durée (min)" kind="number" value={game.durationMin ? String(game.durationMin) : ''} placeholder="auto" onSave={(v) => save({ durationMin: Number(v) || 0 })} />
            <EditableField label="Âge min" kind="number" value={game.ageMin ? String(game.ageMin) : ''} placeholder="auto" display={`${game.ageMin} ans`} onSave={(v) => save({ ageMin: toNum(v) })} />
            {owned ? (
              <EditableField label="Prix payé" kind="decimal" value={game.priceBought != null ? String(game.priceBought) : ''} display={formatPrice(game.priceBought)} onSave={(v) => save({ priceBought: toNum(v) })} />
            ) : (
              <EditableField label="Prix cible" kind="decimal" value={game.priceTarget != null ? String(game.priceTarget) : ''} display={formatPrice(game.priceTarget)} onSave={(v) => save({ priceTarget: toNum(v) })} />
            )}
            <EditableField label="Boutique" value={game.shop ?? ''} onSave={(v) => save({ shop: v })} />
            <EditableField label="ID BGG" kind="number" value={game.bggId ? String(game.bggId) : ''} placeholder="auto" onSave={(v) => save({ bggId: toNum(v) })} />
            {!owned && (
              <div className="col-span-2">
                <span className="label">Priorité</span>
                <div className="flex gap-1">
                  {([1, 2, 3] as Priority[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => save({ priority: p })}
                      className={cx('chip px-2.5 py-1', game.priority === p ? 'bg-indigo-600 text-white' : 'bg-slate-500/10')}
                    >
                      {PRIORITY_LABEL[p]}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="col-span-2 sm:col-span-3">
              <EditableField label="Lien d’achat" kind="url" value={game.url ?? ''} display={<span className="text-indigo-600 dark:text-indigo-400">{game.url}</span>} onSave={(v) => save({ url: v })} />
            </div>
            <div className="col-span-2 sm:col-span-3">
              <EditableField label="Tags" value={game.tags.join(', ')} display={game.tags.map((t) => `#${t}`).join(' ')} placeholder="Ajouter des tags…" onSave={(v) => save({ tags: parseTags(v) })} />
            </div>
          </div>
        </details>


        {(owned || game.missingParts?.trim()) && (
        <EditableMarkdown
          label="Matériel manquant / abîmé"
          value={game.missingParts}
          onSave={(v) => save({ missingParts: v.trim() })}
          defaultOpen={Boolean(game.missingParts?.trim())}
          empty="Rien à signaler : le jeu est complet."
        />
        )}

        <Expansions game={game} onChange={(expansions) => save({ expansions })} />

        <EditableMarkdown label="Notes" value={game.notes} onSave={(v) => save({ notes: v })} defaultOpen={Boolean(game.notes)} empty="Aucune note." />

        {game.autofillNote && (
          <p className="rounded-2xl bg-slate-500/10 p-3 text-xs text-slate-600 dark:text-slate-300">BGG : {game.autofillNote}</p>
        )}

        {!isEnriched(game) && (
          <p className="rounded-2xl bg-sky-500/10 p-3 text-sm text-sky-800 dark:text-sky-300">
            <Icon name="sparkle" className="mr-1 inline size-4" />
            Pas encore enrichi. Dans Claude Code : « enrichis les jeux ».
          </p>
        )}

        {ENRICHED_SECTIONS.map((s, i) => (
          <EditableMarkdown key={s.key} label={s.label} value={game[s.key]} defaultOpen={i === 0 && Boolean(game[s.key])} onSave={(v) => save({ [s.key]: v })} />
        ))}

        {game.sources && game.sources.length > 0 && (
          <section className="card p-4 text-sm">
            <span className="label">Sources</span>
            <ul className="flex flex-col gap-1">
              {game.sources.map((u) => (
                <li key={u} className="truncate">
                  <a href={u} target="_blank" rel="noreferrer noopener" className="text-indigo-600 dark:text-indigo-400">
                    {u.replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="flex flex-col items-center gap-3 pt-2 text-xs text-slate-400">
          <p>
            {game.createdAt && <>Ajouté le {formatDate(game.createdAt)}</>}
            {game.enrichedAt && (
              <>
                {' · '}Enrichi le {formatDate(game.enrichedAt)} {game.enrichedBy && `par ${game.enrichedBy}`}
              </>
            )}
          </p>
          <button className="btn-danger" onClick={remove}>
            <Icon name="trash" className="size-4" /> Supprimer
          </button>
          <BggAttribution />
        </footer>
      </main>

      {editing && <GameForm game={game} onClose={() => setEditing(false)} />}
    </>
  );
}
