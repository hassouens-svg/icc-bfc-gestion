/** Statistiques : base de données de l'Église (MR / MF), personnes reçues, effectifs des cultes. */
import { useEffect, useState } from 'react';
import { BarChart3, Trash2 } from 'lucide-react';
import { api, qs } from '../lib/api';
import { useMeta } from '../lib/meta';
import { formatDate, today } from '../lib/format';
import { Field, PageHeader, SelectCampus, StatCard } from '../components/ui';

function Barres({ titre, donnees, labelDe }) {
  const entrees = Object.entries(donnees || {});
  const max = Math.max(1, ...entrees.map(([, v]) => v));
  return (
    <div className="card">
      <h3 className="mb-3 font-bold">{titre}</h3>
      <div className="space-y-2">
        {entrees.map(([k, v]) => (
          <div key={k} className="flex items-center gap-2 text-sm">
            <div className="w-40 shrink-0 truncate text-slate-600">{labelDe(k)}</div>
            <div className="h-5 flex-1 rounded bg-slate-100"><div className="h-5 rounded bg-indigo-500" style={{ width: `${(v / max) * 100}%` }} /></div>
            <div className="w-8 text-right font-bold">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const CULTE_VIDE = { date: today(), campus_id: null, hommes: 0, femmes: 0, enfants: 0, nouveaux: 0, personnes_de_passage: 0 };

export default function Statistiques() {
  const { label, campusNom } = useMeta();
  const [campusId, setCampusId] = useState(null);
  const [stats, setStats] = useState(null);
  const [cultes, setCultes] = useState([]);
  const [culte, setCulte] = useState(CULTE_VIDE);

  const charger = () => {
    api.get(`/stats/overview${qs({ campus_id: campusId })}`).then(setStats);
    api.get(`/stats/cultes${qs({ campus_id: campusId })}`).then(setCultes);
  };
  useEffect(() => { charger(); }, [campusId]); // eslint-disable-line react-hooks/exhaustive-deps

  const ajouter = async (e) => {
    e.preventDefault();
    const nombres = Object.fromEntries(['hommes', 'femmes', 'enfants', 'nouveaux', 'personnes_de_passage'].map((k) => [k, Number(culte[k])]));
    await api.post('/stats/cultes', { ...culte, ...nombres });
    setCulte(CULTE_VIDE);
    charger();
  };
  const supprimer = async (id) => { await api.del(`/stats/cultes/${id}`); charger(); };
  const maxCulte = Math.max(1, ...(stats?.cultes || []).map((c) => c.total));

  return (
    <>
      <PageHeader titre="Statistiques" sousTitre="Base de données de l'Église, personnes reçues et de passage, effectifs des cultes" icone={BarChart3}
        actions={<SelectCampus value={campusId} onChange={setCampusId} />} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Fidèles actifs" valeur={stats?.total_fideles} />
        <StatCard label="MR" valeur={stats?.par_categorie?.MR ?? 0} />
        <StatCard label="MF" valeur={stats?.par_categorie?.MF ?? 0} />
        <StatCard label="Ni MR ni MF" valeur={stats?.par_categorie?.autre ?? 0} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Barres titre="Par étape du parcours" donnees={stats?.par_etape} labelDe={(k) => label('etapes', k)} />
        <Barres titre="Par statut spirituel" donnees={stats?.par_statut} labelDe={(k) => label('statuts', k)} />
        {!campusId && <Barres titre="Par campus" donnees={stats?.par_campus} labelDe={(k) => (k === 'non_renseigne' ? 'Non renseigné' : campusNom(Number(k)))} />}
        <Barres titre="Par sexe" donnees={stats?.par_sexe} labelDe={(k) => ({ H: 'Hommes', F: 'Femmes' }[k] || 'Non renseigné')} />
      </div>

      <div className="card mt-6">
        <h3 className="mb-3 font-bold">Effectifs des cultes (12 derniers)</h3>
        <div className="flex h-48 items-end gap-2">
          {(stats?.cultes || []).map((c) => (
            <div key={c.id} className="flex flex-1 flex-col items-center gap-1" title={`${formatDate(c.date)} — ${c.total} personnes`}>
              <span className="text-xs font-bold">{c.total}</span>
              <div className="w-full rounded-t bg-gradient-to-t from-indigo-600 to-purple-500" style={{ height: `${(c.total / maxCulte) * 140}px` }} />
              <span className="text-[10px] text-slate-500">{formatDate(c.date).slice(0, 5)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card mt-6">
        <h3 className="mb-3 font-bold">Saisir les effectifs d'un culte</h3>
        <form onSubmit={ajouter} className="grid grid-cols-2 gap-3 md:grid-cols-8">
          <Field label="Date" className="col-span-2 md:col-span-1"><input type="date" required className="input" value={culte.date} onChange={(e) => setCulte({ ...culte, date: e.target.value })} /></Field>
          <Field label="Campus" className="col-span-2 md:col-span-2"><SelectCampus value={culte.campus_id} onChange={(v) => setCulte({ ...culte, campus_id: v })} vide="—" /></Field>
          {[['hommes', 'Hommes'], ['femmes', 'Femmes'], ['enfants', 'Enfants'], ['nouveaux', 'Nouveaux'], ['personnes_de_passage', 'De passage']].map(([k, l]) => (
            <Field key={k} label={l}><input type="number" min="0" className="input" value={culte[k]} onChange={(e) => setCulte({ ...culte, [k]: e.target.value })} /></Field>
          ))}
          <button className="btn-primary col-span-2 md:col-span-8">Enregistrer</button>
        </form>
        <div className="mt-4 overflow-x-auto">
          <table className="table">
            <thead><tr><th>Date</th><th>Campus</th><th>H</th><th>F</th><th>Enfants</th><th>Total</th><th>Nouveaux</th><th>De passage</th><th /></tr></thead>
            <tbody>
              {cultes.slice(0, 30).map((c) => (
                <tr key={c.id}>
                  <td>{formatDate(c.date)}</td><td>{campusNom(c.campus_id)}</td><td>{c.hommes}</td><td>{c.femmes}</td><td>{c.enfants}</td>
                  <td className="font-bold">{c.total}</td><td>{c.nouveaux}</td><td>{c.personnes_de_passage}</td>
                  <td><button className="text-red-500" onClick={() => supprimer(c.id)}><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
