export const formatDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
export const formatDateTime = (d) =>
  d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
export const today = () => new Date().toISOString().slice(0, 10);

/** Couleurs des badges d'étape (modifiable). */
export const COULEURS_ETAPE = {
  evangelisation: 'bg-green-100 text-green-800',
  accueil: 'bg-blue-100 text-blue-800',
  discipolat: 'bg-purple-100 text-purple-800',
  famille_disciple: 'bg-yellow-100 text-yellow-800',
  famille_impact: 'bg-orange-100 text-orange-800',
  membre_actif: 'bg-slate-800 text-white',
};
