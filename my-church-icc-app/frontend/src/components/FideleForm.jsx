/** Formulaire de création / modification d'une fiche fidèle (utilisé partout). */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Field, Modal, SelectCampus, SelectMeta } from './ui';

const VIDE = {
  nom: '', prenom: '', sexe: '', date_naissance: '', telephone: '', email: '', adresse: '', ville: '',
  campus_id: null, statut_spirituel: 'contact', etape: 'accueil', categorie: 'autre', source: '',
  date_premiere_visite: '', notes: '', famille_impact_id: null, actif: true,
};

export default function FideleForm({ fidele, valeursParDefaut = {}, onClose, onSaved }) {
  const [form, setForm] = useState({ ...VIDE, ...valeursParDefaut, ...(fidele || {}) });
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const set = (champ) => (v) => setForm((f) => ({ ...f, [champ]: v?.target ? v.target.value : v }));

  const submit = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);
    const data = { ...form, date_naissance: form.date_naissance || null, date_premiere_visite: form.date_premiere_visite || null };
    try {
      const res = fidele ? await api.put(`/fideles/${fidele.id}`, data) : await api.post('/fideles', data);
      onSaved?.(res);
      onClose();
    } catch (err) {
      setErreur(err);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Modal titre={fidele ? 'Modifier la fiche' : 'Nouvelle fiche fidèle'} onClose={onClose} large>
      <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {erreur && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">
            {erreur.message}
            {erreur.detail?.fidele_id && (
              <> — <Link className="font-bold underline" to={`/fideles/${erreur.detail.fidele_id}`} onClick={onClose}>ouvrir sa fiche</Link></>
            )}
          </div>
        )}
        <Field label="Prénom *"><input className="input" required value={form.prenom} onChange={set('prenom')} /></Field>
        <Field label="Nom *"><input className="input" required value={form.nom} onChange={set('nom')} /></Field>
        <Field label="Sexe">
          <select className="input" value={form.sexe || ''} onChange={set('sexe')}>
            <option value="">—</option><option value="H">Homme</option><option value="F">Femme</option>
          </select>
        </Field>
        <Field label="Date de naissance"><input type="date" className="input" value={form.date_naissance || ''} onChange={set('date_naissance')} /></Field>
        <Field label="Téléphone"><input className="input" value={form.telephone || ''} onChange={set('telephone')} /></Field>
        <Field label="Email"><input type="email" className="input" value={form.email || ''} onChange={set('email')} /></Field>
        <Field label="Adresse"><input className="input" value={form.adresse || ''} onChange={set('adresse')} /></Field>
        <Field label="Ville"><input className="input" value={form.ville || ''} onChange={set('ville')} /></Field>
        <Field label="Église / Campus"><SelectCampus value={form.campus_id} onChange={set('campus_id')} vide="—" /></Field>
        <Field label="Statut spirituel"><SelectMeta liste="statuts" value={form.statut_spirituel} onChange={set('statut_spirituel')} /></Field>
        <Field label="Étape du parcours"><SelectMeta liste="etapes" value={form.etape} onChange={set('etape')} /></Field>
        <Field label="Catégorie (MR / MF)"><SelectMeta liste="categories" value={form.categorie} onChange={set('categorie')} /></Field>
        <Field label="Comment nous a-t-il/elle connus ?"><input className="input" value={form.source || ''} onChange={set('source')} /></Field>
        <Field label="Première visite"><input type="date" className="input" value={form.date_premiere_visite || ''} onChange={set('date_premiere_visite')} /></Field>
        <Field label="Notes" className="sm:col-span-2"><textarea className="input" rows={3} value={form.notes || ''} onChange={set('notes')} /></Field>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn-primary" disabled={envoi}>{envoi ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </form>
    </Modal>
  );
}
