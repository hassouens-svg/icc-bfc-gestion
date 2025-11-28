import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@/App.css';
import { CitiesProvider } from './contexts/CitiesContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import VisitorsPage from './pages/VisitorsPage';
import VisitorsTablePage from './pages/VisitorsTablePage';
import VisitorDetailPage from './pages/VisitorDetailPage';
import MarquerPresencesPage from './pages/MarquerPresencesPage';
import ReferentsPage from './pages/ReferentsPage';
import CitiesPage from './pages/CitiesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import StoppedVisitorsPage from './pages/StoppedVisitorsPage';
import DeletedVisitorsPage from './pages/DeletedVisitorsPage';
import EventsManagementPage from './pages/EventsManagementPage';
import EventsLoginPage from './pages/EventsLoginPage';
import ProjetsList from './pages/ProjetsList';
import ProjetDetailPage from './pages/ProjetDetailPage';
import CommunicationPage from './pages/CommunicationPage';
import RSVPPublicPage from './pages/RSVPPublicPage';
import EventsStatsPage from './pages/EventsStatsPage';
import PlanningActivitesPage from './pages/PlanningActivitesPage';
import EvangelisationPage from './pages/EvangelisationPage';
import SecteursPage from './pages/SecteursPage';
import GererFIPage from './pages/GererFIPage';
import FamillesImpactPage from './pages/FamillesImpactPage';
import FamilleImpactDetailPage from './pages/FamilleImpactDetailPage';
import DashboardPiloteFIPage from './pages/DashboardPiloteFIPage';
import DashboardSuperviseurFIPage from './pages/DashboardSuperviseurFIPage';
import DashboardSuperviseurPromosPage from './pages/DashboardSuperviseurPromosPage';
import DashboardResponsableSecteurPage from './pages/DashboardResponsableSecteurPage';
import MarquerPresencesFIPage from './pages/MarquerPresencesFIPage';
import VueTableauFIPage from './pages/VueTableauFIPage';
import TrouverMaFIPage from './pages/TrouverMaFIPage';
import IntroductionFIPage from './pages/IntroductionFIPage';
import DashboardPasteurPage from './pages/DashboardPasteurPage';
import DashboardSuperAdminPage from './pages/DashboardSuperAdminPage';
import DashboardSuperAdminCompletPage from './pages/DashboardSuperAdminCompletPage';
import GestionPermissionsDashboardPage from './pages/GestionPermissionsDashboardPage';
import CulteStatsPage from './pages/CulteStatsPage';
import AffectationFIPage from './pages/AffectationFIPage';
import AccesSpecifiquesPage from './pages/AccesSpecifiquesPage';
import AccesBergersEglisePage from './pages/AccesBergersEglisePage';
import RegisterMembreFIPage from './pages/RegisterMembreFIPage';
import SelectDepartmentPage from './pages/SelectDepartmentPage';
import GestionAccesPage from './pages/GestionAccesPage';
import AttributionPilotesPage from './pages/AttributionPilotesPage';
import SelectVillePage from './pages/SelectVillePage';
import AdminDataPage from './pages/AdminDataPage';
import AffectationPilotesFIPage from './pages/AffectationPilotesFIPage';
import AffectationResponsablesSecteurPage from './pages/AffectationResponsablesSecteurPage';

function App() {
  return (
    <div className="App">
      <CitiesProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register-membre-fi" element={<RegisterMembreFIPage />} />
          <Route path="/introduction-fi" element={<IntroductionFIPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/visitors" element={<VisitorsPage />} />
          <Route path="/visitors-table" element={<VisitorsTablePage />} />
          <Route path="/visitor/:id" element={<VisitorDetailPage />} />
          <Route path="/marquer-presences" element={<MarquerPresencesPage />} />
          <Route path="/referents" element={<ReferentsPage />} />
          <Route path="/cities" element={<CitiesPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/stopped-visitors" element={<StoppedVisitorsPage />} />
          <Route path="/deleted-visitors" element={<DeletedVisitorsPage />} />
          <Route path="/events-login" element={<EventsLoginPage />} />
          <Route path="/events-management" element={<EventsManagementPage />} />
          <Route path="/events/planning" element={<PlanningActivitesPage />} />
          <Route path="/events/projets" element={<ProjetsList />} />
          <Route path="/events/projets/:id" element={<ProjetDetailPage />} />
          <Route path="/events/communication" element={<CommunicationPage />} />
          <Route path="/events/stats" element={<EventsStatsPage />} />
          <Route path="/rsvp/:campagneId/:reponse" element={<RSVPPublicPage />} />
          <Route path="/evangelisation" element={<EvangelisationPage />} />
          
          {/* Familles d'Impact Routes */}
          <Route path="/familles-impact/secteurs" element={<SecteursPage />} />
          <Route path="/familles-impact/gerer-fi" element={<GererFIPage />} />
          <Route path="/familles-impact" element={<FamillesImpactPage />} />
          <Route path="/familles-impact/fi/:fiId" element={<FamilleImpactDetailPage />} />
          <Route path="/familles-impact/affectation" element={<AffectationFIPage />} />
          <Route path="/familles-impact/dashboard-pilote" element={<DashboardPiloteFIPage />} />
          <Route path="/marquer-presences-fi" element={<MarquerPresencesFIPage />} />
          <Route path="/vue-tableau-fi" element={<VueTableauFIPage />} />
          <Route path="/trouver-ma-fi" element={<TrouverMaFIPage />} />
          <Route path="/familles-impact/dashboard-superviseur" element={<DashboardSuperviseurFIPage />} />
          <Route path="/dashboard-superviseur-promos" element={<DashboardSuperviseurPromosPage />} />
          <Route path="/familles-impact/dashboard-responsable-secteur" element={<DashboardResponsableSecteurPage />} />
          <Route path="/dashboard-pasteur" element={<DashboardSuperAdminCompletPage />} />
          {/* Redirection : Ancienne page -> Nouvelle page complète */}
          <Route path="/dashboard-superadmin" element={<DashboardSuperAdminCompletPage />} />
          <Route path="/dashboard-superadmin-complet" element={<DashboardSuperAdminCompletPage />} />
          <Route path="/gestion-permissions-dashboard" element={<GestionPermissionsDashboardPage />} />
          <Route path="/culte-stats" element={<CulteStatsPage />} />
          <Route path="/acces-specifiques" element={<AccesSpecifiquesPage />} />
          <Route path="/acces-bergers-eglise" element={<AccesBergersEglisePage />} />
          <Route path="/select-department" element={<SelectDepartmentPage />} />
          <Route path="/select-ville" element={<SelectVillePage />} />
          <Route path="/gestion-acces" element={<GestionAccesPage />} />
          <Route path="/attribution-pilotes" element={<AttributionPilotesPage />} />
          <Route path="/admin-data" element={<AdminDataPage />} />
          <Route path="/affectation-pilotes-fi" element={<AffectationPilotesFIPage />} />
          <Route path="/affectation-responsables-secteur" element={<AffectationResponsablesSecteurPage />} />
        </Routes>
      </BrowserRouter>
      </CitiesProvider>
    </div>
  );
}

export default App;
