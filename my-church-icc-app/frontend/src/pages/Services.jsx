/** Services & ministères (STARS, MPI, Juniors, Louange...) : qui sert où. */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { HandHeart, Trash2 } from 'lucide-react';
import { api, qs } from '../lib/api';
import { useMeta } from '../lib/meta';
import { formatDate } from '../lib/format';
import FidelePicker from '../components/FidelePicker';
import { Empty, ErrorMsg, Field, PageHeader, SelectMeta } from '../components/ui';

export default function Services() {
  const { departement } = useParams();
  const navigate = useNavigate();
  const { label } = useMeta();
  const [liste, setListe] = useState(null);
  const [role, setRole] = useState('membre');
  const [erreur, setErreur] = useState(null);

  const charger = () => api.get(`/affectations${qs({ departement })}`).then(setListe);
  useEffect(() => { charger(); }, [departement]); // eslint-disable-line react-hooks/exhaustive-deps

  const ajouter = async (f) => {
    setErreur(null);
    try { await api.post('/affectations', { fidele_id: f.id, departement, role }); charger(); } catch (e) { setErreur(e); }
  };
  const retirer = async (a) => { await api.del(`/affectations/${a.id}`); charger(); };

  return (
    <>
      <PageHeader titre={departement ? label('departements', departement) : 'Services & ministères'} icone={HandHeart}
        sousTitre="Les serviteurs sont choisis dans la base unique des fidèles" />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="Département" className="w-64">
          <SelectMeta liste="departements" vide="Tous" value={departement} onChange={(v) => navigate(v ? `/services/${v}` : '/services')} />
        </Field>
        {departement && <>
          <Field label="Rôle" className="w-40"><SelectMeta liste="roles_affectation" value={role} onChange={setRole} /></Field>
          <div className="w-80"><span className="label">Ajouter un serviteur</span><FidelePicker onSelect={ajouter} /></div>
        </>}
      </div>
      <ErrorMsg error={erreur} />
      {!liste ? null : liste.length === 0 ? <Empty>Personne n'est encore affecté ici.</Empty> : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="table">
            <thead><tr><th>Fidèle</th><th>Téléphone</th>{!departement && <th>Département</th>}<th>Rôle</th><th>Depuis</th><th /></tr></thead>
            <tbody>
              {liste.map((a) => (
                <tr key={a.id}>
                  <td><Link className="font-semibold hover:text-indigo-600" to={`/fideles/${a.fidele_id}`}>{a.fidele?.prenom} {a.fidele?.nom}</Link></td>
                  <td>{a.fidele?.telephone || '—'}</td>
                  {!departement && <td>{label('departements', a.departement)}</td>}
                  <td>{label('roles_affectation', a.role)}</td>
                  <td>{formatDate(a.date_debut)}</td>
                  <td className="text-right"><button className="text-red-500" onClick={() => retirer(a)}><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
