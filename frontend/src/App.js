import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@/App.css';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import VisitorsPage from './pages/VisitorsPage';
import VisitorsTablePage from './pages/VisitorsTablePage';
import VisitorDetailPage from './pages/VisitorDetailPage';
import ReferentsPage from './pages/ReferentsPage';
import CitiesPage from './pages/CitiesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import StoppedVisitorsPage from './pages/StoppedVisitorsPage';
import FidelisationPage from './pages/FidelisationPage';
import SecteursPage from './pages/SecteursPage';
import FamillesImpactPage from './pages/FamillesImpactPage';
import FamilleImpactDetailPage from './pages/FamilleImpactDetailPage';
import DashboardPiloteFIPage from './pages/DashboardPiloteFIPage';
import DashboardSuperviseurFIPage from './pages/DashboardSuperviseurFIPage';
import DashboardResponsableSecteurPage from './pages/DashboardResponsableSecteurPage';
import PresencesFITablePage from './pages/PresencesFITablePage';
import DashboardPasteurPage from './pages/DashboardPasteurPage';
import DashboardSuperAdminPage from './pages/DashboardSuperAdminPage';
import DashboardSuperAdminCompletPage from './pages/DashboardSuperAdminCompletPage';
import GestionPermissionsDashboardPage from './pages/GestionPermissionsDashboardPage';
import CulteStatsPage from './pages/CulteStatsPage';
import AffectationFIPage from './pages/AffectationFIPage';
import AccesSpecifiquesPage from './pages/AccesSpecifiquesPage';
import RegisterMembreFIPage from './pages/RegisterMembreFIPage';
import SelectDepartmentPage from './pages/SelectDepartmentPage';
import GestionAccesPage from './pages/GestionAccesPage';
import SelectVillePage from './pages/SelectVillePage';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register-membre-fi" element={<RegisterMembreFIPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/visitors" element={<VisitorsPage />} />
          <Route path="/visitors-table" element={<VisitorsTablePage />} />
          <Route path="/visitor/:id" element={<VisitorDetailPage />} />
          <Route path="/referents" element={<ReferentsPage />} />
          <Route path="/cities" element={<CitiesPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/stopped-visitors" element={<StoppedVisitorsPage />} />
          <Route path="/fidelisation" element={<FidelisationPage />} />
          
          {/* Familles d'Impact Routes */}
          <Route path="/familles-impact/secteurs" element={<SecteursPage />} />
          <Route path="/familles-impact" element={<FamillesImpactPage />} />
          <Route path="/familles-impact/fi/:fiId" element={<FamilleImpactDetailPage />} />
          <Route path="/familles-impact/affectation" element={<AffectationFIPage />} />
          <Route path="/familles-impact/dashboard-pilote" element={<DashboardPiloteFIPage />} />
          <Route path="/familles-impact/presences-table" element={<PresencesFITablePage />} />
          <Route path="/familles-impact/dashboard-superviseur" element={<DashboardSuperviseurFIPage />} />
          <Route path="/familles-impact/dashboard-responsable-secteur" element={<DashboardResponsableSecteurPage />} />
          <Route path="/dashboard-pasteur" element={<DashboardPasteurPage />} />
          <Route path="/dashboard-superadmin" element={<DashboardSuperAdminPage />} />
          <Route path="/dashboard-superadmin-complet" element={<DashboardSuperAdminCompletPage />} />
          <Route path="/gestion-permissions-dashboard" element={<GestionPermissionsDashboardPage />} />
          <Route path="/acces-specifiques" element={<AccesSpecifiquesPage />} />
          <Route path="/select-department" element={<SelectDepartmentPage />} />
          <Route path="/select-ville" element={<SelectVillePage />} />
          <Route path="/gestion-acces" element={<GestionAccesPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
