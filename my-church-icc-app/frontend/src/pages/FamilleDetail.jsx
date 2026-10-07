import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Users } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { formatDate, today } from '../lib/format';
import FidelePicker from '../components/FidelePicker';
import { EtapeBadge, Field, PageHeader } from '../components/ui';
import { FamilleForm } from './Familles';

export default function FamilleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [f, setF] = useState(null);
  const [edition, setEdition] = useState(false);
  const [reunion, setReunion] = useState({ date: today(), theme: '', nb_presents: 0, nb_invites: 0, notes: '' });

  const charger = () => api.get(`/familles/${id}`).then(setF);
  useEffect(() => { charger(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!f) return <div className="p-10 text-center text-slate-500">Chargement…</div>;

  const ajouterMembre = async (fidele) => { await api.post(`/familles/${id}/membres`, { fidele_id: fidele.id }); charger(); };
  const retirerMembre = async (fid) => { await api.del(`/familles/${id}/membres/${fid}`); charger(); };
  const ajouterReunion = async (e) => {
    e.preventDefault();
    await api.post(`/familles/${id}/reunions`, { ...reunion, nb_presents: Number(reunion.nb_presents), nb_invites: Number(reunion.nb_invites) });
    setReunion({ ...reunion, theme: '', notes: '' });
    charger();
  };
  const supprimer = async () => {
    if (!confirm('Supprimer cette Famille d\'Impact ? Les membres seront conservés dans la base.')) return;
    await api.del(`/familles/${id}`);
    navigate('/familles');
  };

  return (
    <>
      <Link to="/familles" className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600"><ArrowLeft className="h-4 w-4" /> Familles d'Impact</Link>
      <PageHeader titre={f.nom} icone={Users}
        sousTitre={`${f.jour_reunion || ''} ${f.heure_reunion || ''} · Pilote : ${f.pilote ? `${f.pilote.prenom} ${f.pilote.nom}` : '—'}`}
        actions={<>
          <button className="btn-secondary" onClick={() => setEdition(true)}><Pencil className="h-4 w-4" /> Modifier</button>
          {isAdmin && <button className="btn-danger" onClick={supprimer}><Trash2 className="h-4 w-4" /></button>}
        </>} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-bold">Membres ({f.membres.length})</h2>
          <FidelePicker onSelect={ajouterMembre} placeholder="Ajouter un membre…" />
          <ul className="mt-3 divide-y text-sm">
            {f.membres.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2">
                <Link to={`/fideles/${m.id}`} className="font-semibold hover:text-indigo-600">{m.prenom} {m.nom}</Link>
                <div className="flex items-center gap-3"><EtapeBadge etape={m.etape} /><button className="text-xs text-red-600 hover:underline" onClick={() => retirerMembre(m.id)}>retirer</button></div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2 className="mb-3 font-bold">Réunions & activités</h2>
          <form onSubmit={ajouterReunion} className="mb-4 grid grid-cols-2 gap-2">
            <Field label="Date"><input type="date" className="input" required value={reunion.date} onChange={(e) => setReunion({ ...reunion, date: e.target.value })} /></Field>
            <Field label="Thème"><input className="input" value={reunion.theme} onChange={(e) => setReunion({ ...reunion, theme: e.target.value })} /></Field>
            <Field label="Présents"><input type="number" min="0" className="input" value={reunion.nb_presents} onChange={(e) => setReunion({ ...reunion, nb_presents: e.target.value })} /></Field>
            <Field label="Invités"><input type="number" min="0" className="input" value={reunion.nb_invites} onChange={(e) => setReunion({ ...reunion, nb_invites: e.target.value })} /></Field>
            <button className="btn-secondary col-span-2">Enregistrer la réunion</button>
          </form>
          <table className="table">
            <thead><tr><th>Date</th><th>Thème</th><th>Présents</th><th>Invités</th></tr></thead>
            <tbody>{f.reunions.map((r) => <tr key={r.id}><td>{formatDate(r.date)}</td><td>{r.theme || '—'}</td><td>{r.nb_presents}</td><td>{r.nb_invites}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
      {edition && <FamilleForm famille={f} onClose={() => setEdition(false)} onSaved={charger} />}
    </>
  );
}
