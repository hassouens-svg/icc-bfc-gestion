/** Tableau de bord : vue 360° de l'Église et parcours d'une personne. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Database, GraduationCap, HandHeart, LayoutDashboard, UserPlus, Users } from 'lucide-react';
import { api } from '../lib/api';
import { useMeta } from '../lib/meta';
import { formatDateTime } from '../lib/format';
import { PageHeader, StatCard } from '../components/ui';

const LIENS_ETAPE = {
  evangelisation: '/evangelisation', accueil: '/accueil', discipolat: '/discipolat',
  famille_disciple: '/fideles?etape=famille_disciple', famille_impact: '/familles', membre_actif: '/fideles?etape=membre_actif',
};

export default function Dashboard() {
  const { etapes } = useMeta();
  const [stats, setStats] = useState(null);
  const [evenements, setEvenements] = useState([]);

  useEffect(() => {
    api.get('/stats/overview').then(setStats);
    api.get('/agenda?a_venir=true').then((e) => setEvenements(e.slice(0, 5)));
  }, []);

  return (
    <>
      <PageHeader titre="Tableau de bord" sousTitre="Une seule base de données : les fidèles au cœur de tout le système" icone={LayoutDashboard} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Fidèles" valeur={stats?.total_fideles} icone={Database} />
        <StatCard label="Nouveaux (30 j)" valeur={stats?.nouveaux_30j} icone={UserPlus} couleur="text-blue-600" />
        <StatCard label="Disciples en cours" valeur={stats?.disciples_en_cours} icone={GraduationCap} couleur="text-purple-600" />
        <StatCard label="Familles d'Impact" valeur={stats?.nb_familles} icone={Users} couleur="text-orange-500" />
        <StatCard label="Serviteurs" valeur={stats?.serviteurs} icone={HandHeart} couleur="text-red-500" />
      </div>

      <div className="card mt-6">
        <h2 className="mb-4 font-extrabold uppercase text-slate-700">Parcours d'une personne dans l'Église</h2>
        <div className="flex flex-wrap items-stretch gap-2">
          {etapes.map((e, i) => (
            <div key={e.code} className="flex flex-1 items-center gap-2">
              <Link to={LIENS_ETAPE[e.code] || '/fideles'} className="flex-1 rounded-xl bg-slate-50 p-4 text-center ring-1 ring-slate-200 transition hover:bg-indigo-50">
                <div className="text-3xl font-black text-indigo-700">{stats?.par_etape?.[e.code] ?? 0}</div>
                <div className="text-sm font-bold">{e.label}</div>
                <div className="text-xs text-slate-500">{e.description}</div>
              </Link>
              {i < etapes.length - 1 && <ArrowRight className="hidden h-5 w-5 shrink-0 text-slate-400 xl:block" />}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-bold">À faire</h2>
          <ul className="space-y-2 text-sm">
            <li><Link className="text-indigo-600 hover:underline" to="/evangelisation">{stats?.par_etape?.evangelisation ?? 0} nouveaux convertis à appeler</Link></li>
            <li><Link className="text-indigo-600 hover:underline" to="/accueil">{stats?.par_etape?.accueil ?? 0} nouveaux arrivants à intégrer</Link></li>
            <li><Link className="text-indigo-600 hover:underline" to="/familles">{stats?.sans_famille ?? 0} fidèles sans Famille d'Impact</Link></li>
          </ul>
        </div>
        <div className="card">
          <h2 className="mb-3 font-bold">Prochains événements</h2>
          {evenements.length === 0 ? <p className="text-sm text-slate-500">Aucun événement à venir.</p> : (
            <ul className="space-y-2 text-sm">
              {evenements.map((e) => <li key={e.id}><b>{formatDateTime(e.date)}</b> — {e.titre} <span className="text-slate-400">{e.lieu}</span></li>)}
            </ul>
          )}
          <Link to="/agenda" className="mt-3 inline-block text-sm text-indigo-600 hover:underline">Voir l'agenda →</Link>
        </div>
      </div>
    </>
  );
}
