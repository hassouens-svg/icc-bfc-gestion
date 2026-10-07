/** Familles d'Impact : liste des familles et des fidèles à affecter. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, Plus, Users } from 'lucide-react';
import { api } from '../lib/api';
import { useMeta } from '../lib/meta';
import FidelePicker from '../components/FidelePicker';
import { Empty, Field, Modal, PageHeader, SelectCampus } from '../components/ui';

export default function Familles() {
  const { campusNom } = useMeta();
  const [familles, setFamilles] = useState([]);
  const [sansFamille, setSansFamille] = useState([]);
  const [edition, setEdition] = useState(null);

  const charger = () => {
    api.get('/familles').then(setFamilles);
    api.get('/fideles?sans_famille=true&etape=famille_disciple').then(setSansFamille);
  };
  useEffect(() => { charger(); }, []);

  return (
    <>
      <PageHeader titre="Familles d'Impact" sousTitre="Affectation dans une FI, suivi des membres, responsables, réunions" icone={Users}
        actions={<button className="btn-primary" onClick={() => setEdition({})}><Plus className="h-4 w-4" /> Nouvelle famille</button>} />

      {familles.length === 0 ? <Empty>Aucune Famille d'Impact.</Empty> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {familles.map((f) => (
            <Link key={f.id} to={`/familles/${f.id}`} className="card transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between">
                <h3 className="font-extrabold">{f.nom}</h3>
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">{f.nb_membres} membres</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">{campusNom(f.campus_id)}{f.secteur && ` · ${f.secteur}`}</p>
              <div className="mt-3 space-y-1 text-sm text-slate-600">
                {f.jour_reunion && <div className="flex items-center gap-1"><Clock className="h-4 w-4" /> {f.jour_reunion} {f.heure_reunion}</div>}
                {f.adresse && <div className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {f.adresse}</div>}
                <div>Pilote : <b>{f.pilote ? `${f.pilote.prenom} ${f.pilote.nom}` : '—'}</b></div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="card mt-6">
        <h2 className="mb-1 font-bold">À intégrer dans une Famille d'Impact</h2>
        <p className="mb-3 text-sm text-slate-500">Fidèles à l'étape « Famille de disciple » qui n'ont pas encore de FI.</p>
        {sansFamille.length === 0 ? <p className="text-sm text-slate-500">Tout le monde a une famille 🎉</p> : (
          <ul className="divide-y text-sm">
            {sansFamille.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <Link to={`/fideles/${f.id}`} className="font-semibold hover:text-indigo-600">{f.prenom} {f.nom}</Link>
                <select className="input !w-56 !py-1" defaultValue="" onChange={async (e) => {
                  await api.post(`/familles/${e.target.value}/membres`, { fidele_id: f.id });
                  charger();
                }}>
                  <option value="" disabled>Affecter à…</option>
                  {familles.map((fa) => <option key={fa.id} value={fa.id}>{fa.nom}</option>)}
                </select>
              </li>
            ))}
          </ul>
        )}
      </div>

      {edition && <FamilleForm famille={edition} onClose={() => setEdition(null)} onSaved={charger} />}
    </>
  );
}

export function FamilleForm({ famille, onClose, onSaved }) {
  const [form, setForm] = useState({ nom: '', campus_id: null, secteur: '', adresse: '', jour_reunion: '', heure_reunion: '', pilote_id: null, ...famille });
  const [pilote, setPilote] = useState(famille.pilote || null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    const data = { ...form, pilote_id: pilote?.id ?? null };
    famille.id ? await api.put(`/familles/${famille.id}`, data) : await api.post('/familles', data);
    onSaved();
    onClose();
  };
  return (
    <Modal titre={famille.id ? 'Modifier la famille' : "Nouvelle Famille d'Impact"} onClose={onClose}>
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <Field label="Nom *" className="col-span-2"><input className="input" required value={form.nom} onChange={set('nom')} /></Field>
        <Field label="Campus"><SelectCampus value={form.campus_id} onChange={(v) => setForm({ ...form, campus_id: v })} vide="—" /></Field>
        <Field label="Secteur"><input className="input" value={form.secteur || ''} onChange={set('secteur')} /></Field>
        <Field label="Adresse" className="col-span-2"><input className="input" value={form.adresse || ''} onChange={set('adresse')} /></Field>
        <Field label="Jour de réunion"><input className="input" value={form.jour_reunion || ''} onChange={set('jour_reunion')} placeholder="Mercredi" /></Field>
        <Field label="Heure"><input type="time" className="input" value={form.heure_reunion || ''} onChange={set('heure_reunion')} /></Field>
        <div className="col-span-2">
          <span className="label">Pilote</span>
          {pilote ? <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"><b>{pilote.prenom} {pilote.nom}</b><button type="button" className="text-red-600" onClick={() => setPilote(null)}>changer</button></div>
            : <FidelePicker onSelect={setPilote} />}
        </div>
        <div className="col-span-2 flex justify-end"><button className="btn-primary">Enregistrer</button></div>
      </form>
    </Modal>
  );
}
