/** Agenda de l'Église. */
import { useEffect, useState } from 'react';
import { CalendarDays, MapPin, Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { useMeta } from '../lib/meta';
import { Badge, Empty, Field, Modal, PageHeader, SelectCampus, SelectMeta } from '../components/ui';

export default function Agenda() {
  const { label } = useMeta();
  const [evenements, setEvenements] = useState([]);
  const [passes, setPasses] = useState(false);
  const [creation, setCreation] = useState(false);

  const charger = () => api.get(`/agenda${passes ? '' : '?a_venir=true'}`).then(setEvenements);
  useEffect(() => { charger(); }, [passes]); // eslint-disable-line react-hooks/exhaustive-deps
  const supprimer = async (id) => { if (confirm('Supprimer cet événement ?')) { await api.del(`/agenda/${id}`); charger(); } };

  return (
    <>
      <PageHeader titre="Agenda de l'Église" icone={CalendarDays}
        actions={<>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={passes} onChange={(e) => setPasses(e.target.checked)} /> Inclure les événements passés</label>
          <button className="btn-primary" onClick={() => setCreation(true)}><Plus className="h-4 w-4" /> Événement</button>
        </>} />
      {evenements.length === 0 ? <Empty>Aucun événement.</Empty> : (
        <div className="space-y-3">
          {evenements.map((e) => {
            const d = new Date(e.date);
            return (
              <div key={e.id} className="card flex items-center gap-4">
                <div className="w-16 shrink-0 rounded-xl bg-indigo-600 py-2 text-center text-white">
                  <div className="text-2xl font-black leading-none">{d.getDate()}</div>
                  <div className="text-xs uppercase">{d.toLocaleDateString('fr-FR', { month: 'short' })}</div>
                </div>
                <div className="flex-1">
                  <div className="font-bold">{e.titre}</div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    <span>{d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    {e.lieu && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.lieu}</span>}
                    {e.departement && <Badge>{label('departements', e.departement)}</Badge>}
                  </div>
                  {e.description && <p className="mt-1 text-sm">{e.description}</p>}
                </div>
                <button className="text-red-500" onClick={() => supprimer(e.id)}><Trash2 className="h-4 w-4" /></button>
              </div>
            );
          })}
        </div>
      )}
      {creation && <EvenementForm onClose={() => setCreation(false)} onSaved={charger} />}
    </>
  );
}

function EvenementForm({ onClose, onSaved }) {
  const [form, setForm] = useState({ titre: '', date: '', lieu: '', departement: '', campus_id: null, description: '' });
  const set = (k) => (v) => setForm({ ...form, [k]: v?.target ? v.target.value : v });
  const submit = async (e) => {
    e.preventDefault();
    await api.post('/agenda', { ...form, departement: form.departement || null });
    onSaved();
    onClose();
  };
  return (
    <Modal titre="Nouvel événement" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Titre *"><input className="input" required value={form.titre} onChange={set('titre')} /></Field>
        <Field label="Date et heure *"><input type="datetime-local" className="input" required value={form.date} onChange={set('date')} /></Field>
        <Field label="Lieu"><input className="input" value={form.lieu} onChange={set('lieu')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Département"><SelectMeta liste="departements" vide="—" value={form.departement} onChange={set('departement')} /></Field>
          <Field label="Campus"><SelectCampus value={form.campus_id} onChange={set('campus_id')} vide="—" /></Field>
        </div>
        <Field label="Description"><textarea className="input" rows={3} value={form.description} onChange={set('description')} /></Field>
        <div className="flex justify-end"><button className="btn-primary">Créer</button></div>
      </form>
    </Modal>
  );
}
