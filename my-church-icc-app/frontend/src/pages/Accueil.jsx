/** Accueil & Intégration : nouveaux arrivants, suivi, affectation initiale. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, MessageSquarePlus, Plus, UserCheck } from 'lucide-react';
import { api } from '../lib/api';
import FideleForm from '../components/FideleForm';
import FideleTable from '../components/FideleTable';
import SuiviForm from '../components/SuiviForm';
import { PageHeader, SelectMeta } from '../components/ui';

export default function Accueil() {
  const [fideles, setFideles] = useState(null);
  const [creation, setCreation] = useState(false);
  const [suivi, setSuivi] = useState(null);
  const lienInscription = `${window.location.origin}/inscription`;

  const charger = () => api.get('/fideles?etape=accueil').then(setFideles);
  useEffect(() => { charger(); }, []);

  const affecter = async (f, etape) => {
    if (!etape) return;
    await api.post(`/fideles/${f.id}/etape`, { etape, commentaire: 'Affectation initiale par l\'Accueil' });
    charger();
  };

  return (
    <>
      <PageHeader titre="Accueil & Intégration" sousTitre="Nouveaux arrivants — informations d'intégration et affectation initiale" icone={UserCheck}
        actions={<button className="btn-primary" onClick={() => setCreation(true)}><Plus className="h-4 w-4" /> Nouvel arrivant</button>} />

      <div className="card mb-4 flex flex-wrap items-center justify-between gap-3 bg-indigo-50 text-sm">
        <span>📝 Formulaire public à partager (lien / QR code le dimanche) : <Link to="/inscription" className="font-bold text-indigo-700 underline">{lienInscription}</Link></span>
        <button className="btn-secondary !py-1" onClick={() => navigator.clipboard.writeText(lienInscription)}><Copy className="h-4 w-4" /> Copier</button>
      </div>

      <FideleTable fideles={fideles}
        actions={(f) => (
          <div className="flex justify-end gap-2">
            <button className="btn-secondary !px-2 !py-1" onClick={() => setSuivi(f)}><MessageSquarePlus className="h-4 w-4" /></button>
            <SelectMeta liste="etapes" vide="Orienter vers…" value="" onChange={(v) => affecter(f, v)} className="input !w-40 !py-1" />
          </div>
        )} />
      {creation && <FideleForm valeursParDefaut={{ etape: 'accueil', statut_spirituel: 'nouvel_arrivant' }} onClose={() => setCreation(false)} onSaved={charger} />}
      {suivi && <SuiviForm fidele={suivi} departement="accueil" onClose={() => setSuivi(null)} onSaved={charger} />}
    </>
  );
}
