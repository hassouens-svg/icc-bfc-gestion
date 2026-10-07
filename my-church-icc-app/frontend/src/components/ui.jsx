/** Petits composants d'interface réutilisables. */
import { X } from 'lucide-react';
import { useMeta } from '../lib/meta';
import { COULEURS_ETAPE } from '../lib/format';

export function PageHeader({ titre, sousTitre, icone: Icone, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        {Icone && (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow">
            <Icone className="h-6 w-6" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{titre}</h1>
          {sousTitre && <p className="text-sm text-slate-500">{sousTitre}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, valeur, icone: Icone, couleur = 'text-indigo-600' }) {
  return (
    <div className="card flex items-center gap-4">
      {Icone && <Icone className={`h-8 w-8 ${couleur}`} />}
      <div>
        <div className="text-2xl font-extrabold">{valeur ?? '…'}</div>
        <div className="text-xs font-semibold uppercase text-slate-500">{label}</div>
      </div>
    </div>
  );
}

export function Modal({ titre, onClose, children, large = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4" onClick={onClose}>
      <div className={`mt-10 w-full ${large ? 'max-w-3xl' : 'max-w-lg'} rounded-2xl bg-white p-6 shadow-xl`} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{titre}</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-slate-100" aria-label="Fermer"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children, className = '' }) {
  return <label className={`block ${className}`}><span className="label">{label}</span>{children}</label>;
}

/** <Select liste="etapes" .../> utilise les listes de référence du backend. */
export function SelectMeta({ liste, value, onChange, vide, className = 'input', ...rest }) {
  const meta = useMeta();
  return (
    <select className={className} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...rest}>
      {vide !== undefined && <option value="">{vide}</option>}
      {meta[liste]?.map((x) => <option key={x.code} value={x.code}>{x.label}</option>)}
    </select>
  );
}

export function SelectCampus({ value, onChange, vide = 'Tous les campus', className = 'input' }) {
  const { campus } = useMeta();
  return (
    <select className={className} value={value ?? ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}>
      <option value="">{vide}</option>
      {campus.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
    </select>
  );
}

export function EtapeBadge({ etape }) {
  const { label } = useMeta();
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${COULEURS_ETAPE[etape] || 'bg-slate-100'}`}>
      {label('etapes', etape)}
    </span>
  );
}

export function Badge({ children, className = 'bg-slate-100 text-slate-700' }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>{children}</span>;
}

export function Empty({ children = 'Aucun élément pour le moment.' }) {
  return <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">{children}</div>;
}

export function ErrorMsg({ error }) {
  if (!error) return null;
  return <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error.message || String(error)}</div>;
}
