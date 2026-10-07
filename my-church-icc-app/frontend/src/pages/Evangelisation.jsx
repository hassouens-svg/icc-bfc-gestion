/** Évangélisation : enregistrement des nouveaux convertis, phoning, suivi. */
import { useEffect, useState } from 'react';
import { ArrowRight, Heart, Phone, Plus } from 'lucide-react';
import { api } from '../lib/api';
import FideleForm from '../components/FideleForm';
import FideleTable from '../components/FideleTable';
import SuiviForm from '../components/SuiviForm';
import { PageHeader } from '../components/ui';

export default function Evangelisation() {
  const [fideles, setFideles] = useState(null);
  const [creation, setCreation] = useState(false);
  const [appel, setAppel] = useState(null);

  const charger = () => api.get('/fideles?etape=evangelisation').then(setFideles);
  useEffect(() => { charger(); }, []);

  const versAccueil = async (f) => {
    await api.post(`/fideles/${f.id}/etape`, { etape: 'accueil', commentaire: "Transmis à l'Accueil & Intégration" });
    charger();
  };

  return (
    <>
      <PageHeader titre="Dynamique d'Évangélisation" sousTitre="Les personnes rencontrées — phoning et suivi personnalisé" icone={Heart}
        actions={<button className="btn-primary" onClick={() => setCreation(true)}><Plus className="h-4 w-4" /> Nouveau converti</button>} />
      <FideleTable fideles={fideles} colonnes={['telephone', 'campus', 'statut', 'date']}
        actions={(f) => (
          <div className="flex justify-end gap-2">
            <button className="btn-secondary !px-2 !py-1" onClick={() => setAppel(f)}><Phone className="h-4 w-4" /> Appel</button>
            <button className="btn-secondary !px-2 !py-1" onClick={() => versAccueil(f)} title="Passer à l'étape Accueil">Accueil <ArrowRight className="h-4 w-4" /></button>
          </div>
        )} />
      {creation && (
        <FideleForm valeursParDefaut={{ etape: 'evangelisation', statut_spirituel: 'nouveau_converti', source: 'Évangélisation' }}
          onClose={() => setCreation(false)} onSaved={charger} />
      )}
      {appel && <SuiviForm fidele={appel} typeParDefaut="appel" departement="evangelisation" onClose={() => setAppel(null)} onSaved={charger} />}
    </>
  );
}
