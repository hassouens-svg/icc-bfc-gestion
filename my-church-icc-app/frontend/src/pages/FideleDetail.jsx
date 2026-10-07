/** La fiche unique d'un fidèle : vue 360° (identité, parcours, affectations, historique). */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, MessageSquarePlus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useMeta } from '../lib/meta';
import { formatDate, formatDateTime } from '../lib/format';
import FideleForm from '../components/FideleForm';
import SuiviForm from '../components/SuiviForm';
import { Badge, EtapeBadge, Field, SelectMeta } from '../components/ui';

export default function FideleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { etapes, label } = useMeta();
  const [f, setF] = useState(null);
  const [edition, setEdition] = useState(false);
  const [suivi, setSuivi] = useState(false);
  const [affect, setAffect] = useState({ departement: 'accueil', role: 'membre' });

  const charger = () => api.get(`/fideles/${id}`).then(setF);
  useEffect(() => { charger(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!f) return <div className="p-10 text-center text-slate-500">Chargement…</div>;
  const indexEtape = etapes.findIndex((e) => e.code === f.etape);

  const changerEtape = async (etape) => { await api.post(`/fideles/${id}/etape`, { etape }); charger(); };
  const ajouterAffectation = async () => { await api.post('/affectations', { fidele_id: f.id, ...affect }); charger(); };
  const retirerAffectation = async (aid) => { await api.del(`/affectations/${aid}`); charger(); };
  const supprimer = async () => {
    if (!confirm(`Supprimer définitivement la fiche de ${f.prenom} ${f.nom} ?`)) return;
    await api.del(`/fideles/${id}`);
    navigate('/fideles');
  };

  const Info = ({ titre, children }) => (
    <div><div className="label">{titre}</div><div className="text-sm">{children || '—'}</div></div>
  );

  return (
    <>
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600"><ArrowLeft className="h-4 w-4" /> Retour</button>

      <div className="card mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl font-black text-white">
            {f.prenom[0]}{f.nom[0]}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">{f.prenom} {f.nom}</h1>
            <div className="mt-1 flex flex-wrap gap-2">
              <EtapeBadge etape={f.etape} />
              <Badge>{label('statuts', f.statut_spirituel)}</Badge>
              <Badge className="bg-indigo-50 text-indigo-700">{label('categories', f.categorie)}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setSuivi(true)}><MessageSquarePlus className="h-4 w-4" /> Ajouter un suivi</button>
          <button className="btn-primary" onClick={() => setEdition(true)}><Pencil className="h-4 w-4" /> Modifier</button>
          {isAdmin && <button className="btn-danger" onClick={supprimer}><Trash2 className="h-4 w-4" /></button>}
        </div>
      </div>

      {/* Parcours */}
      <div className="card mb-6">
        <h2 className="mb-3 font-bold">Parcours dans l'Église</h2>
        <div className="flex flex-wrap gap-2">
          {etapes.map((e, i) => (
            <button key={e.code} onClick={() => changerEtape(e.code)} title="Cliquer pour placer le fidèle à cette étape"
              className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-bold transition ${i <= indexEtape ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              {i < indexEtape && <Check className="h-3 w-3" />} {e.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <div className="card grid grid-cols-2 gap-4">
            <Info titre="Téléphone">{f.telephone}</Info>
            <Info titre="Email">{f.email}</Info>
            <Info titre="Sexe">{f.sexe === 'H' ? 'Homme' : f.sexe === 'F' ? 'Femme' : null}</Info>
            <Info titre="Naissance">{f.date_naissance && formatDate(f.date_naissance)}</Info>
            <Info titre="Adresse">{[f.adresse, f.ville].filter(Boolean).join(', ')}</Info>
            <Info titre="Campus">{f.campus_nom}</Info>
            <Info titre="Source">{f.source}</Info>
            <Info titre="1re visite">{f.date_premiere_visite && formatDate(f.date_premiere_visite)}</Info>
            <Info titre="Famille d'Impact">{f.famille_impact_id && <Link className="text-indigo-600 hover:underline" to={`/familles/${f.famille_impact_id}`}>{f.famille_impact_nom}</Link>}</Info>
            <Info titre="Fiche créée">{formatDate(f.created_at)}</Info>
            {f.notes && <div className="col-span-2"><Info titre="Notes">{f.notes}</Info></div>}
          </div>

          <div className="card">
            <h2 className="mb-3 font-bold">Discipolat</h2>
            {f.parcours.length === 0 ? <p className="text-sm text-slate-500">Pas encore inscrit(e) dans une promotion. <Link to="/discipolat" className="text-indigo-600 hover:underline">Inscrire</Link></p> : (
              <ul className="space-y-2 text-sm">
                {f.parcours.map((p) => (
                  <li key={p.id}><b>{p.promotion_nom}</b> — {p.modules_valides.length} module(s) validé(s)
                    {p.mentor && <> · mentor : {p.mentor.prenom} {p.mentor.nom}</>} <Badge>{p.statut}</Badge></li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h2 className="mb-3 font-bold">Affectations & responsabilités</h2>
            <ul className="mb-3 space-y-2 text-sm">
              {f.affectations.map((a) => (
                <li key={a.id} className="flex items-center justify-between">
                  <span><b>{label('departements', a.departement)}</b> — {label('roles_affectation', a.role)}</span>
                  <button className="text-xs text-red-600 hover:underline" onClick={() => retirerAffectation(a.id)}>retirer</button>
                </li>
              ))}
              {f.affectations.length === 0 && <li className="text-slate-500">Aucune affectation.</li>}
            </ul>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Département"><SelectMeta liste="departements" value={affect.departement} onChange={(v) => setAffect({ ...affect, departement: v })} /></Field>
              <Field label="Rôle"><SelectMeta liste="roles_affectation" value={affect.role} onChange={(v) => setAffect({ ...affect, role: v })} /></Field>
              <button className="btn-secondary col-span-2" onClick={ajouterAffectation}>Affecter</button>
            </div>
          </div>
        </div>

        <div className="card lg:col-span-2">
          <h2 className="mb-3 font-bold">Historique & suivi ({f.suivis.length})</h2>
          <ol className="relative space-y-4 border-l-2 border-indigo-100 pl-5">
            {f.suivis.map((s) => (
              <li key={s.id} className="relative">
                <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-indigo-500 ring-4 ring-white" />
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <b className="text-slate-700">{label('types_suivi', s.type)}</b>
                  {s.departement && <Badge>{label('departements', s.departement)}</Badge>}
                  <span>{formatDateTime(s.date)} · {s.auteur}</span>
                </div>
                <p className="mt-1 whitespace-pre-line text-sm">{s.contenu}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {edition && <FideleForm fidele={f} onClose={() => setEdition(false)} onSaved={charger} />}
      {suivi && <SuiviForm fidele={f} onClose={() => setSuivi(false)} onSaved={charger} />}
    </>
  );
}
