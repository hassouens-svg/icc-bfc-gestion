/** Discipolat : promotions, modules, suivi des étapes et mentorat. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { formatDate } from '../lib/format';
import FidelePicker from '../components/FidelePicker';
import { Empty, ErrorMsg, Field, Modal, PageHeader, SelectCampus } from '../components/ui';

export default function Discipolat() {
  const [promos, setPromos] = useState([]);
  const [modules, setModules] = useState([]);
  const [promoId, setPromoId] = useState(null);
  const [promo, setPromo] = useState(null);
  const [nouvellePromo, setNouvellePromo] = useState(false);
  const [nouveauModule, setNouveauModule] = useState('');
  const [erreur, setErreur] = useState(null);

  const chargerListes = () => {
    api.get('/discipolat/promotions').then((p) => { setPromos(p); if (!promoId && p[0]) setPromoId(p[0].id); });
    api.get('/discipolat/modules').then(setModules);
  };
  const chargerPromo = () => promoId && api.get(`/discipolat/promotions/${promoId}`).then(setPromo);
  useEffect(() => { chargerListes(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { chargerPromo(); }, [promoId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Après chaque action : on recharge la promotion affichée et les compteurs des onglets.
  const action = (fn) => async (...args) => {
    setErreur(null);
    try { await fn(...args); chargerPromo(); chargerListes(); } catch (e) { setErreur(e); chargerPromo(); }
  };
  const inscrire = action((f) => api.post('/discipolat/parcours', { fidele_id: f.id, promotion_id: promoId }));
  const basculer = action((p, m) => {
    // Mise à jour immédiate de la case (sans attendre la réponse du serveur)
    const valides = p.modules_valides.includes(m.id) ? p.modules_valides.filter((id) => id !== m.id) : [...p.modules_valides, m.id];
    setPromo((pr) => ({ ...pr, parcours: pr.parcours.map((x) => (x.id === p.id ? { ...x, modules_valides: valides } : x)) }));
    return api.post(`/discipolat/parcours/${p.id}/modules/${m.id}`);
  });
  const setMentor = action((p, mentor) => api.put(`/discipolat/parcours/${p.id}`, { mentor_id: mentor.id }));
  const setStatut = action((p, statut) => api.put(`/discipolat/parcours/${p.id}`, { statut }));
  const retirer = action((p) => confirm('Retirer ce disciple de la promotion ?') && api.del(`/discipolat/parcours/${p.id}`));
  const ajouterModule = async (e) => {
    e.preventDefault();
    try { await api.post('/discipolat/modules', { nom: nouveauModule, ordre: modules.length }); setNouveauModule(''); chargerListes(); } catch (err) { setErreur(err); }
  };

  return (
    <>
      <PageHeader titre="Promotions & Discipolat" sousTitre="Parcours de disciple, modules, suivi des étapes et mentorat" icone={GraduationCap}
        actions={<button className="btn-primary" onClick={() => setNouvellePromo(true)}><Plus className="h-4 w-4" /> Nouvelle promotion</button>} />
      <ErrorMsg error={erreur} />

      <div className="mb-4 flex flex-wrap gap-2">
        {promos.map((p) => (
          <button key={p.id} onClick={() => setPromoId(p.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${p.id === promoId ? 'bg-indigo-600 text-white' : 'bg-white ring-1 ring-slate-200'}`}>
            {p.nom} <span className="opacity-70">({p.nb_disciples})</span>
          </button>
        ))}
      </div>

      {!promo ? <Empty>Créez une première promotion pour commencer.</Empty> : (
        <div className="card">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">{promo.nom}</h2>
              <p className="text-sm text-slate-500">Du {formatDate(promo.date_debut)} au {formatDate(promo.date_fin)}</p>
            </div>
            <div className="w-full max-w-sm"><FidelePicker onSelect={inscrire} placeholder="Inscrire un fidèle…" /></div>
          </div>
          {promo.parcours.length === 0 ? <Empty>Aucun disciple inscrit.</Empty> : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Disciple</th>{modules.map((m) => <th key={m.id} className="text-center">{m.nom}</th>)}<th>Mentor</th><th>Statut</th><th /></tr></thead>
                <tbody>
                  {promo.parcours.map((p) => (
                    <tr key={p.id}>
                      <td><Link to={`/fideles/${p.fidele.id}`} className="font-semibold hover:text-indigo-600">{p.fidele.prenom} {p.fidele.nom}</Link></td>
                      {modules.map((m) => (
                        <td key={m.id} className="text-center">
                          <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={p.modules_valides.includes(m.id)} onChange={() => basculer(p, m)} />
                        </td>
                      ))}
                      <td className="min-w-48">
                        {p.mentor ? <span className="text-sm">{p.mentor.prenom} {p.mentor.nom}</span> : <FidelePicker placeholder="Choisir…" onSelect={(m) => setMentor(p, m)} />}
                      </td>
                      <td>
                        <select className="input !py-1" value={p.statut} onChange={(e) => setStatut(p, e.target.value)}>
                          <option value="en_cours">En cours</option><option value="termine">Terminé</option><option value="abandon">Abandon</option>
                        </select>
                      </td>
                      <td><button onClick={() => retirer(p)} className="text-red-500"><Trash2 className="h-4 w-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="card mt-6">
        <h2 className="mb-3 font-bold">Modules de formation</h2>
        <form onSubmit={ajouterModule} className="flex gap-2">
          <input className="input" placeholder="Nom du nouveau module" value={nouveauModule} onChange={(e) => setNouveauModule(e.target.value)} required />
          <button className="btn-secondary">Ajouter</button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">{modules.map((m) => <span key={m.id} className="rounded-full bg-purple-50 px-3 py-1 text-sm text-purple-700">{m.nom}</span>)}</div>
      </div>

      {nouvellePromo && <PromoForm onClose={() => setNouvellePromo(false)} onSaved={(p) => { chargerListes(); setPromoId(p.id); }} />}
    </>
  );
}

function PromoForm({ onClose, onSaved }) {
  const [form, setForm] = useState({ nom: '', campus_id: null, date_debut: '', date_fin: '' });
  const submit = async (e) => {
    e.preventDefault();
    const p = await api.post('/discipolat/promotions', { ...form, date_debut: form.date_debut || null, date_fin: form.date_fin || null });
    onSaved(p);
    onClose();
  };
  return (
    <Modal titre="Nouvelle promotion" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Nom *"><input className="input" required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Promotion Septembre 2026" /></Field>
        <Field label="Campus"><SelectCampus value={form.campus_id} onChange={(v) => setForm({ ...form, campus_id: v })} vide="—" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Début"><input type="date" className="input" value={form.date_debut} onChange={(e) => setForm({ ...form, date_debut: e.target.value })} /></Field>
          <Field label="Fin"><input type="date" className="input" value={form.date_fin} onChange={(e) => setForm({ ...form, date_fin: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end"><button className="btn-primary">Créer</button></div>
      </form>
    </Modal>
  );
}
