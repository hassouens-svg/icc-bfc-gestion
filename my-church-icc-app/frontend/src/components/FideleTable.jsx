/** Tableau de fidèles cliquable (réutilisé par plusieurs départements). */
import { useNavigate } from 'react-router-dom';
import { useMeta } from '../lib/meta';
import { formatDate } from '../lib/format';
import { Empty, EtapeBadge } from './ui';

export default function FideleTable({ fideles, colonnes = ['telephone', 'campus', 'etape', 'statut', 'date'], actions }) {
  const navigate = useNavigate();
  const { label, campusNom } = useMeta();
  if (!fideles) return <div className="p-6 text-center text-slate-500">Chargement…</div>;
  if (!fideles.length) return <Empty>Aucun fidèle trouvé.</Empty>;
  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <table className="table">
        <thead>
          <tr>
            <th>Nom</th>
            {colonnes.includes('telephone') && <th>Téléphone</th>}
            {colonnes.includes('campus') && <th>Campus</th>}
            {colonnes.includes('etape') && <th>Étape</th>}
            {colonnes.includes('statut') && <th>Statut</th>}
            {colonnes.includes('date') && <th>Ajouté le</th>}
            {actions && <th />}
          </tr>
        </thead>
        <tbody>
          {fideles.map((f) => (
            <tr key={f.id} className="cursor-pointer hover:bg-indigo-50/50" onClick={() => navigate(`/fideles/${f.id}`)}>
              <td className="font-semibold">{f.prenom} {f.nom}</td>
              {colonnes.includes('telephone') && <td>{f.telephone || '—'}</td>}
              {colonnes.includes('campus') && <td>{campusNom(f.campus_id)}</td>}
              {colonnes.includes('etape') && <td><EtapeBadge etape={f.etape} /></td>}
              {colonnes.includes('statut') && <td>{label('statuts', f.statut_spirituel)}</td>}
              {colonnes.includes('date') && <td>{formatDate(f.created_at)}</td>}
              {actions && <td onClick={(e) => e.stopPropagation()} className="text-right">{actions(f)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
