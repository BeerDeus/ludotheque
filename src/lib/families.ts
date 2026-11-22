import type { User } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import type { Family } from './types';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans 0/O/1/I

export function randomCode(len = 10) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

export const normalizeCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

const profile = (u: User) => ({
  email: u.email ?? '',
  displayName: u.displayName ?? u.email ?? '',
});

export async function createFamily(user: User, name: string) {
  const famRef = doc(collection(db, 'families'));
  const code = randomCode();
  const b = writeBatch(db);
  b.set(famRef, { name: name.trim(), ownerUid: user.uid, inviteCode: code, createdAt: serverTimestamp() });
  b.set(doc(famRef, 'members', user.uid), { role: 'owner', code, ...profile(user), joinedAt: serverTimestamp() });
  b.set(doc(db, 'invites', code), { familyId: famRef.id, createdBy: user.uid, createdAt: serverTimestamp() });
  b.set(doc(db, 'users', user.uid), { familyId: famRef.id, ...profile(user) });
  await b.commit();
  return famRef.id;
}

export async function joinFamily(user: User, rawCode: string) {
  const code = normalizeCode(rawCode);
  if (code.length < 8) throw new Error('Code invalide.');
  const inv = await getDoc(doc(db, 'invites', code));
  if (!inv.exists()) throw new Error('Code inconnu ou expiré.');
  const familyId = inv.data().familyId as string;
  const b = writeBatch(db);
  b.set(doc(db, 'families', familyId, 'members', user.uid), {
    role: 'member',
    code,
    ...profile(user),
    joinedAt: serverTimestamp(),
  });
  b.set(doc(db, 'users', user.uid), { familyId, ...profile(user) });
  await b.commit();
  return familyId;
}

/** Owner : invalide l'ancien code et en génère un nouveau */
export async function rotateInvite(user: User, family: Family) {
  const code = randomCode();
  const b = writeBatch(db);
  if (family.inviteCode) b.delete(doc(db, 'invites', family.inviteCode));
  b.set(doc(db, 'invites', code), { familyId: family.id, createdBy: user.uid, createdAt: serverTimestamp() });
  b.update(doc(db, 'families', family.id), { inviteCode: code });
  await b.commit();
  return code;
}

export async function renameFamily(familyId: string, name: string) {
  const b = writeBatch(db);
  b.update(doc(db, 'families', familyId), { name: name.trim() });
  await b.commit();
}

export async function leaveFamily(user: User, familyId: string) {
  await deleteDoc(doc(db, 'families', familyId, 'members', user.uid));
  const b = writeBatch(db);
  b.set(doc(db, 'users', user.uid), { familyId: null, ...profile(user) });
  await b.commit();
}

export const removeMember = (familyId: string, uid: string) =>
  deleteDoc(doc(db, 'families', familyId, 'members', uid));

export const inviteLink = (code: string) => `${location.origin}/rejoindre/${code}`;
