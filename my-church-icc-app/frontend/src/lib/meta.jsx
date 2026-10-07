/**
 * Les listes de référence (étapes, statuts, départements...) viennent du backend
 * (backend/app/constants.py). Ce contexte les rend disponibles partout.
 */
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

const MetaContext = createContext(null);
const VIDE = { etapes: [], statuts: [], categories: [], departements: [], roles_affectation: [], types_suivi: [], roles_utilisateur: [] };

export function MetaProvider({ children }) {
  const [meta, setMeta] = useState(VIDE);
  const [campus, setCampus] = useState([]);
  useEffect(() => {
    api.get('/meta').then(setMeta).catch(() => {});
    api.get('/public/campus').then(setCampus).catch(() => {});
  }, []);

  /** label('etapes', 'accueil') -> 'Accueil & Intégration' */
  const label = (liste, code) => meta[liste]?.find((x) => x.code === code)?.label ?? code ?? '—';
  const campusNom = (id) => campus.find((c) => c.id === id)?.nom ?? '—';
  return (
    <MetaContext.Provider value={{ ...meta, campus, setCampus, label, campusNom }}>
      {children}
    </MetaContext.Provider>
  );
}

export const useMeta = () => useContext(MetaContext);
