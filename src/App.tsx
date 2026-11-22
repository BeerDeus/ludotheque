import { Route, Routes } from 'react-router';
import { SessionGate } from './components/SessionGate';
import { GamesProvider } from './components/GamesProvider';
import { firebaseConfigured } from './lib/firebase';
import ListPage from './pages/ListPage';
import DetailPage from './pages/DetailPage';
import FamilyPage from './pages/FamilyPage';
import AlreadyInFamily from './pages/AlreadyInFamily';
import Toaster from './components/Toaster';

export default function App() {
  if (!firebaseConfigured) {
    return (
      <div className="mx-auto max-w-md p-6">
        <h1 className="mb-2 text-xl font-semibold">Configuration Firebase manquante</h1>
        <p className="text-sm text-slate-500">
          Copie <code>.env.example</code> en <code>.env</code>, remplis la config web Firebase puis relance le build.
        </p>
      </div>
    );
  }
  return (
    <SessionGate>
      <GamesProvider>
        <Routes>
          <Route path="/" element={<ListPage />} />
          <Route path="/jeu/:id" element={<DetailPage />} />
          <Route path="/famille" element={<FamilyPage />} />
          <Route path="/rejoindre/:code" element={<AlreadyInFamily />} />
          <Route path="*" element={<ListPage />} />
        </Routes>
        <Toaster />
      </GamesProvider>
    </SessionGate>
  );
}
