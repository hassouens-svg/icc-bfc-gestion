/**
 * Liste de toutes les pages de l'application.
 * 👉 Pour ajouter une page : créer src/pages/MaPage.jsx, l'importer ici,
 *    ajouter une <Route>, puis un lien dans src/components/Layout.jsx (MENU).
 */
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { RequireAuth } from './lib/auth';
import Accueil from './pages/Accueil';
import Admin from './pages/Admin';
import Agenda from './pages/Agenda';
import Dashboard from './pages/Dashboard';
import Discipolat from './pages/Discipolat';
import Evangelisation from './pages/Evangelisation';
import FamilleDetail from './pages/FamilleDetail';
import Familles from './pages/Familles';
import FideleDetail from './pages/FideleDetail';
import Fideles from './pages/Fideles';
import Home from './pages/Home';
import Inscription from './pages/Inscription';
import Login from './pages/Login';
import Services from './pages/Services';
import Statistiques from './pages/Statistiques';

export default function App() {
  return (
    <Routes>
      {/* Pages publiques */}
      <Route path="/" element={<Home />} />
      <Route path="/connexion" element={<Login />} />
      <Route path="/inscription" element={<Inscription />} />

      {/* Pages protégées (avec menu latéral) */}
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route path="/tableau-de-bord" element={<Dashboard />} />
        <Route path="/fideles" element={<Fideles />} />
        <Route path="/fideles/:id" element={<FideleDetail />} />
        <Route path="/evangelisation" element={<Evangelisation />} />
        <Route path="/accueil" element={<Accueil />} />
        <Route path="/discipolat" element={<Discipolat />} />
        <Route path="/familles" element={<Familles />} />
        <Route path="/familles/:id" element={<FamilleDetail />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:departement" element={<Services />} />
        <Route path="/statistiques" element={<Statistiques />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/admin" element={<RequireAuth admin><Admin /></RequireAuth>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
