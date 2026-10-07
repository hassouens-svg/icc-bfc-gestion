/** Champ de recherche pour choisir un fidèle existant dans la base unique. */
import { useEffect, useState } from 'react';
import { api, qs } from '../lib/api';

export default function FidelePicker({ onSelect, placeholder = 'Rechercher un fidèle (nom, téléphone)…', filtres = {} }) {
  const [q, setQ] = useState('');
  const [resultats, setResultats] = useState([]);

  useEffect(() => {
    if (q.length < 2) return setResultats([]);
    const t = setTimeout(() => api.get(`/fideles${qs({ q, limit: 10, ...filtres })}`).then(setResultats), 250);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative">
      <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} />
      {resultats.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg bg-white shadow-lg ring-1 ring-slate-200">
          {resultats.map((f) => (
            <li key={f.id}>
              <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-indigo-50"
                onClick={() => { onSelect(f); setQ(''); setResultats([]); }}>
                <b>{f.prenom} {f.nom}</b> <span className="text-slate-400">{f.telephone}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
