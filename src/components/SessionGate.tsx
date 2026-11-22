import { useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { SessionContext } from '../lib/context';
import type { Family } from '../lib/types';
import AuthScreen from './AuthScreen';
import Onboarding from './Onboarding';
import Spinner from './Spinner';

export function SessionGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [userDoc, setUserDoc] = useState<{ uid: string; familyId: string | null } | null>(null);
  const [fam, setFam] = useState<{ fid: string; family: Family | null } | null>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      doc(db, 'users', user.uid),
      (s) => setUserDoc({ uid: user.uid, familyId: (s.data()?.familyId as string | null) ?? null }),
      () => setUserDoc({ uid: user.uid, familyId: null }),
    );
  }, [user]);

  const familyId = user && userDoc?.uid === user.uid ? userDoc.familyId : undefined;

  useEffect(() => {
    if (!familyId) return;
    return onSnapshot(
      doc(db, 'families', familyId),
      (s) => setFam({ fid: familyId, family: s.exists() ? ({ id: s.id, ...s.data() } as Family) : null }),
      // permission refusée = plus membre
      () => setFam({ fid: familyId, family: null }),
    );
  }, [familyId]);

  if (user === undefined) return <Spinner full />;
  if (!user) return <AuthScreen />;
  if (familyId === undefined) return <Spinner full />;
  if (familyId === null) return <Onboarding user={user} />;
  if (fam?.fid !== familyId) return <Spinner full />;
  if (!fam.family) return <Onboarding user={user} />;

  return <SessionContext.Provider value={{ user, family: fam.family }}>{children}</SessionContext.Provider>;
}
