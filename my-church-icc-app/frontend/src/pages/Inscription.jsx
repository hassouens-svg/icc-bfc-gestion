/** Formulaire public pour les nouveaux arrivants (lien / QR code à partager le dimanche). */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import { useMeta } from '../lib/meta';
import { SITE } from '../config/site';
import { ErrorMsg, Field } from '../components/ui';

const VIDE = { prenom: '', nom: '', sexe: '', telephone: '', email: '', ville: '', campus_id: '', comment_connu: '', est_nouveau_converti: false, message: '' };

export default function Inscription() {
  const { campus } = useMeta();
  const [form, setForm] = useState(VIDE);
  const [merci, setMerci] = useState(null);
  const [erreur, setErreur] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/public/inscription', { ...form, campus_id: form.campus_id ? Number(form.campus_id) : null });
      setMerci(res.message);
    } catch (err) {
      setErreur(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 p-4">
      <div className="mx-auto mt-6 max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <img src={SITE.logo} alt="" className="mx-auto h-16 w-16" />
          <h1 className="mt-2 text-2xl font-black">Bienvenue chez {SITE.nom} !</h1>
          <p className="text-sm text-slate-500">Laissez-nous vos coordonnées pour que nous puissions vous accompagner.</p>
        </div>
        {merci ? (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
            <p className="text-lg font-semibold">{merci}</p>
            <button className="btn-secondary" onClick={() => { setForm(VIDE); setMerci(null); }}>Inscrire une autre personne</button>
          </div>
        ) : (
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><ErrorMsg error={erreur} /></div>
            <Field label="Prénom *"><input className="input" required value={form.prenom} onChange={set('prenom')} /></Field>
            <Field label="Nom *"><input className="input" required value={form.nom} onChange={set('nom')} /></Field>
            <Field label="Téléphone *"><input className="input" required value={form.telephone} onChange={set('telephone')} /></Field>
            <Field label="Email"><input type="email" className="input" value={form.email} onChange={set('email')} /></Field>
            <Field label="Sexe">
              <select className="input" value={form.sexe} onChange={set('sexe')}>
                <option value="">—</option><option value="H">Homme</option><option value="F">Femme</option>
              </select>
            </Field>
            <Field label="Ville"><input className="input" value={form.ville} onChange={set('ville')} /></Field>
            <Field label="Église / Campus" className="sm:col-span-2">
              <select className="input" value={form.campus_id} onChange={set('campus_id')}>
                <option value="">—</option>
                {campus.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </Field>
            <Field label="Comment nous avez-vous connus ?" className="sm:col-span-2"><input className="input" value={form.comment_connu} onChange={set('comment_connu')} /></Field>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={form.est_nouveau_converti} onChange={set('est_nouveau_converti')} />
              J'ai donné ma vie à Jésus récemment
            </label>
            <Field label="Un message, un sujet de prière ?" className="sm:col-span-2"><textarea className="input" rows={3} value={form.message} onChange={set('message')} /></Field>
            <button className="btn-primary sm:col-span-2">Envoyer</button>
          </form>
        )}
        <p className="mt-6 text-center text-sm"><Link to="/" className="text-indigo-600 hover:underline">← Retour à l'accueil</Link></p>
      </div>
    </div>
  );
}
