/** La base unique des fidèles : recherche, filtres, création. */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Database, Plus } from 'lucide-react';
import { api, qs } from '../lib/api';
import FideleForm from '../components/FideleForm';
import FideleTable from '../components/FideleTable';
import { PageHeader, SelectCampus, SelectMeta } from '../components/ui';

export default function Fideles() {
  const [params, setParams] = useSearchParams();
  const [fideles, setFideles] = useState(null);
  const [creation, setCreation] = useState(false);
  const filtres = Object.fromEntries(params);
  const setFiltre = (k) => (v) => {
    const p = new URLSearchParams(params);
    v ? p.set(k, v) : p.delete(k);
    setParams(p, { replace: true });
  };

  const charger = () => api.get(`/fideles${qs(filtres)}`).then(setFideles);
  useEffect(() => { charger(); }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <PageHeader titre="Les Fidèles" sousTitre="1 fidèle = 1 fiche unique, partagée par tous les départements" icone={Database}
        actions={<button className="btn-primary" onClick={() => setCreation(true)}><Plus className="h-4 w-4" /> Nouvelle fiche</button>} />

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-5">
        <input className="input md:col-span-2" placeholder="Rechercher (nom, téléphone, email)…" value={filtres.q || ''} onChange={(e) => setFiltre('q')(e.target.value)} />
        <SelectMeta liste="etapes" vide="Toutes les étapes" value={filtres.etape} onChange={setFiltre('etape')} />
        <SelectMeta liste="statuts" vide="Tous les statuts" value={filtres.statut_spirituel} onChange={setFiltre('statut_spirituel')} />
        <SelectCampus value={filtres.campus_id} onChange={setFiltre('campus_id')} />
      </div>
      <p className="mb-2 text-sm text-slate-500">{fideles?.length ?? '…'} résultat(s)</p>
      <FideleTable fideles={fideles} />
      {creation && <FideleForm onClose={() => setCreation(false)} onSaved={charger} />}
    </>
  );
}
