/** Ajout rapide d'une action dans l'historique d'un fidèle (appel, note, visite...). */
import { useState } from 'react';
import { api } from '../lib/api';
import { ErrorMsg, Field, Modal, SelectMeta } from './ui';

export default function SuiviForm({ fidele, typeParDefaut = 'note', departement, onClose, onSaved }) {
  const [type, setType] = useState(typeParDefaut);
  const [contenu, setContenu] = useState('');
  const [erreur, setErreur] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/fideles/${fidele.id}/suivis`, { type, contenu, departement: departement || null });
      onSaved?.();
      onClose();
    } catch (err) {
      setErreur(err);
    }
  };

  return (
    <Modal titre={`Suivi — ${fidele.prenom} ${fidele.nom}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorMsg error={erreur} />
        <Field label="Type d'action"><SelectMeta liste="types_suivi" value={type} onChange={setType} /></Field>
        <Field label="Compte rendu">
          <textarea className="input" rows={4} required value={contenu} onChange={(e) => setContenu(e.target.value)}
            placeholder="Ex. : Appel effectué, personne joignable, viendra dimanche." />
        </Field>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn-primary">Enregistrer</button>
        </div>
      </form>
    </Modal>
  );
}
