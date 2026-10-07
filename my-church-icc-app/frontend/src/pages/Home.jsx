/** Page d'accueil publique (bandeau, logo, « Choisissez votre département »). */
import { Link, useNavigate } from 'react-router-dom';
import { Info, LogIn, UserPlus } from 'lucide-react';
import { SITE } from '../config/site';
import { DEPARTEMENTS_ACCUEIL } from '../config/departements';
import { useAuth } from '../lib/auth';

function Bandeau() {
  const items = [...SITE.bandeau, ...SITE.bandeau];
  return (
    <div className="overflow-hidden bg-gradient-to-r from-fuchsia-600 via-indigo-600 to-purple-600 py-2 text-white">
      <div className="flex w-max animate-marquee gap-16 whitespace-nowrap font-bold">
        {items.map((m, i) => (
          <span key={i} className="flex items-center gap-16">
            <span className="[&_b]:text-yellow-300" dangerouslySetInnerHTML={{ __html: m }} />
            <span>•</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900">
      <Bandeau />

      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 pt-4">
        {SITE.annonce ? (
          <div className="flex items-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-sm font-semibold text-indigo-700 shadow">
            <Info className="h-4 w-4" /> {SITE.annonce}
          </div>
        ) : <span />}
        <div className="flex gap-2">
          <Link to="/inscription" className="btn bg-white/10 text-white ring-1 ring-white/30 hover:bg-white/20">
            <UserPlus className="h-4 w-4" /> Je suis nouveau
          </Link>
          <Link to={user ? '/tableau-de-bord' : '/connexion'} className="btn bg-white text-indigo-700 hover:bg-indigo-50">
            <LogIn className="h-4 w-4" /> {user ? 'Mon espace' : 'Connexion'}
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-16 text-center">
        <img src={SITE.logo} alt="Logo" className="mx-auto mt-6 h-40 w-40 drop-shadow-2xl" />
        <h1 className="mt-6 text-4xl font-black tracking-tight text-white md:text-6xl">{SITE.nom}</h1>
        <p className="mt-3 text-lg text-indigo-100">{SITE.sousTitre}</p>

        <h2 className="mb-8 mt-12 text-2xl font-extrabold text-white md:text-3xl">Choisissez votre département</h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {DEPARTEMENTS_ACCUEIL.map((d) => (
            <button key={d.titre} onClick={() => navigate(d.lien)}
              className="group rounded-2xl bg-white/95 p-6 text-center shadow-xl transition hover:-translate-y-1 hover:bg-white">
              <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${d.couleur} shadow-lg transition group-hover:scale-110`}>
                <d.icone className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-800">{d.titre}</h3>
              {d.sousTitre && <p className="text-xs italic text-slate-500">{d.sousTitre}</p>}
              <p className="mt-2 text-sm text-slate-600">{d.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
