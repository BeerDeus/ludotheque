import { Link } from 'react-router';
import Header from '../components/Header';
import { useSession } from '../lib/context';

export default function AlreadyInFamily() {
  const { family } = useSession();
  return (
    <>
      <Header />
      <main className="mx-auto max-w-md p-6 text-center">
        <p className="mb-4">
          Tu fais déjà partie de la famille <strong>{family.name}</strong>. Pour en rejoindre une autre, quitte d’abord celle-ci
          (Famille &gt; Quitter), puis rouvre le lien d’invitation.
        </p>
        <Link to="/" className="btn-primary">
          Retour à la ludothèque
        </Link>
      </main>
    </>
  );
}
