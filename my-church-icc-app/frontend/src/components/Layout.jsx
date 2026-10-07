/**
 * Mise en page des pages connectées : menu latéral + contenu.
 * 👉 Pour ajouter un lien dans le menu, ajoutez une ligne dans MENU.
 */
import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  BarChart3, BookOpen, CalendarDays, HandHeart, Heart, Home, LayoutDashboard, LogOut, Menu,
  Settings, Star, TrendingUp, UserCheck, Users, X, Database,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { SITE } from '../config/site';

const MENU = [
  { titre: 'Tableau de bord', lien: '/tableau-de-bord', icone: LayoutDashboard },
  { titre: 'Les Fidèles (base unique)', lien: '/fideles', icone: Database },
  { section: 'Parcours' },
  { titre: 'Évangélisation', lien: '/evangelisation', icone: Heart },
  { titre: 'Accueil & Intégration', lien: '/accueil', icone: UserCheck },
  { titre: 'Discipolat', lien: '/discipolat', icone: TrendingUp },
  { titre: "Familles d'Impact", lien: '/familles', icone: Users },
  { section: 'Départements' },
  { titre: 'Services & ministères', lien: '/services', icone: HandHeart },
  { titre: 'MPI (Prière)', lien: '/services/mpi', icone: BookOpen },
  { titre: 'STARS', lien: '/services/stars', icone: Star },
  { titre: 'Statistiques', lien: '/statistiques', icone: BarChart3 },
  { titre: 'Agenda', lien: '/agenda', icone: CalendarDays },
  { section: 'Administration', admin: true },
  { titre: 'Comptes & campus', lien: '/admin', icone: Settings, admin: true },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const [ouvert, setOuvert] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-0.5 p-3">
      {MENU.filter((m) => !m.admin || isAdmin).map((m, i) =>
        m.section ? (
          <div key={i} className="mt-4 px-3 text-[11px] font-bold uppercase tracking-wider text-indigo-200/70">{m.section}</div>
        ) : (
          <NavLink key={m.lien} to={m.lien} end onClick={() => setOuvert(false)}
            className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-white/15 text-white' : 'text-indigo-100 hover:bg-white/10'}`}>
            <m.icone className="h-4 w-4" /> {m.titre}
          </NavLink>
        ),
      )}
    </nav>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform overflow-y-auto bg-gradient-to-b from-indigo-900 via-indigo-800 to-purple-900 transition lg:static lg:translate-x-0 ${ouvert ? 'translate-x-0' : '-translate-x-full'}`}>
        <Link to="/" className="flex items-center gap-3 border-b border-white/10 p-4">
          <img src={SITE.logo} alt="" className="h-10 w-10" />
          <div className="leading-tight text-white">
            <div className="font-extrabold">{SITE.nom}</div>
            <div className="text-xs text-indigo-200">{SITE.nomApplication}</div>
          </div>
        </Link>
        {nav}
      </aside>
      {ouvert && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOuvert(false)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
          <button className="rounded p-1 lg:hidden" onClick={() => setOuvert(!ouvert)} aria-label="Menu">
            {ouvert ? <X /> : <Menu />}
          </button>
          <Link to="/" className="hidden items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 lg:flex"><Home className="h-4 w-4" /> Accueil</Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline"><b>{user?.nom_complet}</b> <span className="text-slate-400">· {user?.role}</span></span>
            <button onClick={logout} className="btn-secondary !px-3 !py-1.5"><LogOut className="h-4 w-4" /> Déconnexion</button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
