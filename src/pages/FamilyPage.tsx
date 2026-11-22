import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { collection, onSnapshot } from 'firebase/firestore';
import Header from '../components/Header';
import Icon from '../components/Icon';
import { EditableField } from '../components/Editable';
import { useSession } from '../lib/context';
import { db } from '../lib/firebase';
import { inviteLink, leaveFamily, removeMember, renameFamily, rotateInvite } from '../lib/families';
import type { Member } from '../lib/types';

export default function FamilyPage() {
  const { user, family } = useSession();
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [copied, setCopied] = useState(false);
  const isOwner = family.ownerUid === user.uid;

  useEffect(
    () =>
      onSnapshot(collection(db, 'families', family.id, 'members'), (s) =>
        setMembers(s.docs.map((d) => ({ uid: d.id, ...d.data() }) as Member)),
      ),
    [family.id],
  );

  const link = inviteLink(family.inviteCode);
  const share = async () => {
    const text = `Rejoins notre ludothèque « ${family.name} » : ${link} (code ${family.inviteCode})`;
    try {
      if (navigator.share) await navigator.share({ title: 'Ludothèque', text, url: link });
      else {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* partage annulé */
    }
  };

  const back = (
    <button className="btn-ghost p-2" onClick={() => navigate('/')} aria-label="Retour">
      <Icon name="back" />
    </button>
  );

  return (
    <>
      <Header left={back} title="Famille" />
      <main className="mx-auto flex max-w-xl flex-col gap-4 px-3 pt-4 pb-16">
        <section className="card p-4">
          {isOwner ? (
            <EditableField label="Nom de la famille" value={family.name} onSave={(v) => v && void renameFamily(family.id, v)} />
          ) : (
            <>
              <span className="label">Famille</span>
              <p className="font-semibold">{family.name}</p>
            </>
          )}
          <p className="mt-2 text-xs text-slate-400">ID : <code>{family.id}</code></p>
        </section>

        <section className="card flex flex-col gap-3 p-4">
          <span className="label">Code d’invitation</span>
          <p className="text-center font-mono text-2xl tracking-[0.3em]">{family.inviteCode}</p>
          <button className="btn-primary" onClick={share}>
            <Icon name="link" className="size-4" /> {copied ? 'Lien copié !' : 'Partager le lien d’invitation'}
          </button>
          {isOwner && (
            <button
              className="btn-ghost text-xs"
              onClick={() => confirm('Générer un nouveau code ? L’ancien ne fonctionnera plus.') && void rotateInvite(user, family)}
            >
              Régénérer le code
            </button>
          )}
        </section>

        <section className="card p-4">
          <span className="label">Membres ({members.length})</span>
          <ul className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
            {members.map((m) => (
              <li key={m.uid} className="flex items-center gap-2 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {m.displayName || m.email || m.uid} {m.uid === user.uid && <span className="text-slate-400">(moi)</span>}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {m.role === 'owner' ? 'Propriétaire' : 'Membre'} · {m.email}
                  </p>
                </div>
                {isOwner && m.uid !== user.uid && (
                  <button className="btn-danger px-2 py-1 text-xs" onClick={() => confirm(`Retirer ${m.displayName || m.email} ?`) && void removeMember(family.id, m.uid)}>
                    Retirer
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>

        {!isOwner && (
          <button className="btn-danger" onClick={() => confirm('Quitter cette famille ?') && void leaveFamily(user, family.id)}>
            Quitter la famille
          </button>
        )}
      </main>
    </>
  );
}
