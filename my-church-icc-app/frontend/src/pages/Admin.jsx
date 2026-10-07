/** Administration : comptes utilisateurs et campus. */
import { useEffect, useState } from 'react';
import { Pencil, Plus, Settings, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { useMeta } from '../lib/meta';
import { Badge, ErrorMsg, Field, Modal, PageHeader, SelectCampus, SelectMeta } from '../components/ui';

export default function Admin() {
  const { label, campusNom, campus, setCampus } = useMeta();
  const [users, setUsers] = useState([]);
  const [edition, setEdition] = useState(null);
  const [nouveauCampus, setNouveauCampus] = useState({ nom: '', ville: '', pays: '' });

  const charger = () => {
    api.get('/users').then(setUsers);
    api.get('/campus').then(setCampus);
  };
  useEffect(() => { charger(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const supprimer = async (u) => { if (confirm(`Supprimer le compte ${u.username} ?`)) { await api.del(`/users/${u.id}`); charger(); } };
  const ajouterCampus = async (e) => {
    e.preventDefault();
    await api.post('/campus', nouveauCampus);
    setNouveauCampus({ nom: '', ville: '', pays: '' });
    charger();
  };

  return (
    <>
      <PageHeader titre="Administration" sousTitre="Comptes de connexion et campus" icone={Settings}
        actions={<button className="btn-primary" onClick={() => setEdition({})}><Plus className="h-4 w-4" /> Nouveau compte</button>} />

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="table">
          <thead><tr><th>Identifiant</th><th>Nom</th><th>Rôle</th><th>Département</th><th>Campus</th><th>Statut</th><th /></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="font-mono">{u.username}</td><td>{u.nom_complet}</td>
                <td>{label('roles_utilisateur', u.role)}</td>
                <td>{u.departement ? label('departements', u.departement) : '—'}</td>
                <td>{u.campus_id ? campusNom(u.campus_id) : 'Tous'}</td>
                <td>{u.actif ? <Badge className="bg-green-100 text-green-700">Actif</Badge> : <Badge>Désactivé</Badge>}</td>
                <td className="flex justify-end gap-2">
                  <button onClick={() => setEdition(u)}><Pencil className="h-4 w-4 text-slate-500" /></button>
                  <button onClick={() => supprimer(u)}><Trash2 className="h-4 w-4 text-red-500" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card mt-6">
        <h2 className="mb-3 font-bold">Campus / Églises</h2>
        <div className="mb-3 flex flex-wrap gap-2">{campus.map((c) => <Badge key={c.id} className="bg-indigo-50 text-indigo-700">{c.nom} {c.pays && `(${c.pays})`}</Badge>)}</div>
        <form onSubmit={ajouterCampus} className="grid gap-2 sm:grid-cols-4">
          <input className="input" placeholder="Nom *" required value={nouveauCampus.nom} onChange={(e) => setNouveauCampus({ ...nouveauCampus, nom: e.target.value })} />
          <input className="input" placeholder="Ville" value={nouveauCampus.ville} onChange={(e) => setNouveauCampus({ ...nouveauCampus, ville: e.target.value })} />
          <input className="input" placeholder="Pays" value={nouveauCampus.pays} onChange={(e) => setNouveauCampus({ ...nouveauCampus, pays: e.target.value })} />
          <button className="btn-secondary">Ajouter le campus</button>
        </form>
      </div>

      {edition && <UserForm user={edition} onClose={() => setEdition(null)} onSaved={charger} />}
    </>
  );
}

function UserForm({ user, onClose, onSaved }) {
  const [form, setForm] = useState({ username: '', nom_complet: '', password: '', role: 'serviteur', departement: '', campus_id: null, actif: true, ...user });
  const [erreur, setErreur] = useState(null);
  const set = (k) => (v) => setForm({ ...form, [k]: v?.target ? v.target.value : v });
  const submit = async (e) => {
    e.preventDefault();
    const data = { ...form, password: form.password || null, departement: form.departement || null };
    try {
      user.id ? await api.put(`/users/${user.id}`, data) : await api.post('/users', data);
      onSaved();
      onClose();
    } catch (err) { setErreur(err); }
  };
  return (
    <Modal titre={user.id ? 'Modifier le compte' : 'Nouveau compte'} onClose={onClose}>
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><ErrorMsg error={erreur} /></div>
        <Field label="Identifiant *"><input className="input" required value={form.username} onChange={set('username')} /></Field>
        <Field label="Nom complet *"><input className="input" required value={form.nom_complet} onChange={set('nom_complet')} /></Field>
        <Field label={user.id ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe *'} className="col-span-2">
          <input type="password" className="input" required={!user.id} minLength={6} value={form.password || ''} onChange={set('password')} />
        </Field>
        <Field label="Rôle"><SelectMeta liste="roles_utilisateur" value={form.role} onChange={set('role')} /></Field>
        <Field label="Département"><SelectMeta liste="departements" vide="—" value={form.departement} onChange={set('departement')} /></Field>
        <Field label="Campus"><SelectCampus value={form.campus_id} onChange={set('campus_id')} vide="Tous" /></Field>
        <label className="flex items-center gap-2 self-end text-sm"><input type="checkbox" checked={form.actif} onChange={(e) => setForm({ ...form, actif: e.target.checked })} /> Compte actif</label>
        <div className="col-span-2 flex justify-end"><button className="btn-primary">Enregistrer</button></div>
      </form>
    </Modal>
  );
}
