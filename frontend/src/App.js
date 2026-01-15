import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@/App.css';
import { CitiesProvider } from './contexts/CitiesContext';
import { SelectedCityProvider } from './contexts/SelectedCityContext';
import { AuthProvider } from './contexts/AuthContext';
import RedirectPage from './pages/RedirectPage';
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
import RSVPLinksPage from './pages/RSVPLinksPage';
import PublicEventRSVPPage from './pages/PublicEventRSVPPage';
import ProjetsList from './pages/ProjetsList';
import ProjetDetailPage from './pages/ProjetDetailPage';
import CommunicationPage from './pages/CommunicationPage';
import RSVPPublicPage from './pages/RSVPPublicPage';
import EventsStatsPage from './pages/EventsStatsPage';
import PlanningActivitesPage from './pages/PlanningActivitesPage';
import CommunicationEmailPage from './pages/CommunicationEmailPage';
import CommunicationSMSPage from './pages/CommunicationSMSPage';
import CommunicationWhatsAppPage from './pages/CommunicationWhatsAppPage';
import RSVPManagementPage from './pages/RSVPManagementPage';
import ContactGroupsPage from './pages/ContactGroupsPage';
import ContactGroupsSMSPage from './pages/ContactGroupsSMSPage';
import ContactGroupsWhatsAppPage from './pages/ContactGroupsWhatsAppPage';
import RSVPPage from './pages/RSVPPage';
import EvangelisationPage from './pages/EvangelisationPage';
import SecteursPage from './pages/SecteursPage';
import GererFIPage from './pages/GererFIPage';
import FamillesImpactPage from './pages/FamillesImpactPage';
import FamilleImpactDetailPage from './pages/FamilleImpactDetailPage';
import DashboardPiloteFIPage from './pages/DashboardPiloteFIPage';
import DashboardSuperviseurFIPage from './pages/DashboardSuperviseurFIPage';
import DashboardSuperviseurPromosPage from './pages/DashboardSuperviseurPromosPage';
import DashboardResponsableSecteurPage from './pages/DashboardResponsableSecteurPage';
import MarquerPresenceBergersPage from './pages/MarquerPresenceBergersPage';
import HistoriquePresenceBergersPage from './pages/HistoriquePresenceBergersPage';
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
import SelectAccountPage from './pages/SelectAccountPage';
import GestionAccesPage from './pages/GestionAccesPage';
import AttributionPilotesPage from './pages/AttributionPilotesPage';
import SelectVillePage from './pages/SelectVillePage';
import AdminDataPage from './pages/AdminDataPage';
import AffectationPilotesFIPage from './pages/AffectationPilotesFIPage';
import AffectationResponsablesSecteurPage from './pages/AffectationResponsablesSecteurPage';
import NotificationsPage from './pages/NotificationsPage';
import MinistereStarsLoginPage from './pages/MinistereStarsLoginPage';
import MinistereStarsDashboardPage from './pages/MinistereStarsDashboardPage';
import MinistereStarsDepartementPage from './pages/MinistereStarsDepartementPage';
import RecensementStarsPage from './pages/RecensementStarsPage';
import PainDuJourPage from './pages/PainDuJourPage';
import PainDuJourAdminPage from './pages/PainDuJourAdminPage';
import PainDuJourQuizPage from './pages/PainDuJourQuizPage';
import SelectBergeriePage from './pages/SelectBergeriePage';
import SelectBergeriePublicPage from './pages/SelectBergeriePublicPage';
import BergerieDashboardPage from './pages/BergerieDashboardPage';
import SuiviDisciplesPage from './pages/SuiviDisciplesPage';
import ReproductionPage from './pages/ReproductionPage';
// Public Bergerie Pages (identical UI to authenticated)
import PublicBergerieDashboardPage from './pages/PublicBergerieDashboardPage';
import PublicBergerieVisitorsPage from './pages/PublicBergerieVisitorsPage';
import PublicBergerieVisitorsTablePage from './pages/PublicBergerieVisitorsTablePage';
import PublicBergerieSuiviDisciplesPage from './pages/PublicBergerieSuiviDisciplesPage';
import PublicBergerieReproductionPage from './pages/PublicBergerieReproductionPage';
import PublicBergerieMarquerPresencesPage from './pages/PublicBergerieMarquerPresencesPage';
import PublicBergerieVisitorDetailPage from './pages/PublicBergerieVisitorDetailPage';
import BergeriesLoginPage from './pages/BergeriesLoginPage';
import BergeriesPublicPage from './pages/BergeriesPublicPage';
import PCNCPage from './pages/PCNCPage';
import SelectVilleStarsPage from './pages/SelectVilleStarsPage';
import SelectVilleBergersEglisePage from './pages/SelectVilleBergersEglisePage';
import BergeriesChoixPage from './pages/BergeriesChoixPage';
import BergeriesDisciplesPage from './pages/BergeriesDisciplesPage';
import BergerieDiscipleDetailPage from './pages/BergerieDiscipleDetailPage';
import MembreBergerieDetailPage from './pages/MembreBergerieDetailPage';
import StrategiesBergeriePage from './pages/StrategiesBergeriePage';
import EJPPage from './pages/EJPPage';
import EJPCultesPage from './pages/EJPCultesPage';
import EJPPlanningExhortationPage from './pages/EJPPlanningExhortationPage';
import AccesBergeriesAdminPage from './pages/AccesBergeriesAdminPage';

function App() {
  // Check if we're on the OLD production domain specifically (not preview domains)
  const isOldProductionDomain = typeof window !== 'undefined' && 
    window.location.hostname === 'italian-church-app.emergent.host';
  
  // If on old production domain, show redirect page
  if (isOldProductionDomain) {
    return <RedirectPage />;
  }
  
  return (
    <div className="App">
      <AuthProvider>
      <CitiesProvider>
        <SelectedCityProvider>
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
          <Route path="/events/rsvp-links" element={<RSVPLinksPage />} />
          <Route path="/rsvp/:eventId" element={<PublicEventRSVPPage />} />
          <Route path="/events/planning" element={<PlanningActivitesPage />} />
          <Route path="/events/projets" element={<ProjetsList />} />
          <Route path="/events/projets/:id" element={<ProjetDetailPage />} />
          <Route path="/events/communication" element={<CommunicationPage />} />
          <Route path="/events/email" element={<CommunicationEmailPage />} />
          <Route path="/events/sms" element={<CommunicationSMSPage />} />
          <Route path="/events/whatsapp" element={<CommunicationWhatsAppPage />} />
          <Route path="/events/rsvp-management" element={<RSVPManagementPage />} />
          <Route path="/events/contact-groups" element={<ContactGroupsPage />} />
          <Route path="/events/contact-groups-sms" element={<ContactGroupsSMSPage />} />
          <Route path="/events/contact-groups-whatsapp" element={<ContactGroupsWhatsAppPage />} />
          <Route path="/events/stats" element={<EventsStatsPage />} />
          
          {/* RSVP Page (public - no auth) */}
          <Route path="/rsvp/:campagneId" element={<RSVPPage />} />
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
          <Route path="/berger-presences" element={<MarquerPresenceBergersPage />} />
          <Route path="/berger-presences/historique" element={<HistoriquePresenceBergersPage />} />
          
          {/* BERGERIES - Page de choix (Promotions vs Groupes de disciples) */}
          <Route path="/bergeries" element={<BergeriesChoixPage />} />
          <Route path="/bergeries/strategies" element={<StrategiesBergeriePage />} />
          <Route path="/bergeries-promotions" element={<BergeriesPublicPage />} />
          <Route path="/bergeries-select" element={<SelectBergeriePage />} />
          <Route path="/bergeries-dashboard" element={<SelectBergeriePage />} />
          
          {/* BERGERIES - Groupes de Disciples */}
          <Route path="/bergeries-disciples" element={<BergeriesDisciplesPage />} />
          <Route path="/bergerie-disciple/:id" element={<BergerieDiscipleDetailPage />} />
          <Route path="/bergeries-disciples/:bergerieId/membre/:membreId" element={<MembreBergerieDetailPage />} />
          
          {/* EJP - Église des Jeunes Prodiges */}
          <Route path="/ejp" element={<EJPPage />} />
          <Route path="/ejp/cultes" element={<EJPCultesPage />} />
          <Route path="/ejp/planning-exhortation" element={<EJPPlanningExhortationPage />} />
          
          {/* Accès Admin aux Bergeries (Superadmin/Pasteur) */}
          <Route path="/admin/bergeries" element={<AccesBergeriesAdminPage />} />
          
          {/* Public Bergerie Routes - UI identique à l'authentifié */}
          <Route path="/bergerie/dashboard" element={<PublicBergerieDashboardPage />} />
          <Route path="/bergerie/visitors" element={<PublicBergerieVisitorsPage />} />
          <Route path="/bergerie/visitor/:id" element={<PublicBergerieVisitorDetailPage />} />
          <Route path="/bergerie/visitors-table" element={<PublicBergerieVisitorsTablePage />} />
          <Route path="/bergerie/suivi-disciples" element={<PublicBergerieSuiviDisciplesPage />} />
          <Route path="/bergerie/reproduction" element={<PublicBergerieReproductionPage />} />
          <Route path="/bergerie/marquer-presences" element={<PublicBergerieMarquerPresencesPage />} />
          
          {/* Legacy routes - redirect to new public routes */}
          <Route path="/suivi-disciples" element={<SuiviDisciplesPage />} />
          <Route path="/reproduction" element={<ReproductionPage />} />
          
          {/* PCNC - Parcours de Croissance */}
          <Route path="/pcnc" element={<PCNCPage />} />
          <Route path="/pcnc/:classeId" element={<PCNCPage />} />
          
          {/* Ministère des Stars - Sélecteur de ville public */}
          <Route path="/select-ville-stars" element={<SelectVilleStarsPage />} />
          
          {/* Accès Bergers Église - Sélecteur de ville public */}
          <Route path="/select-ville-bergers-eglise" element={<SelectVilleBergersEglisePage />} />
          
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
          <Route path="/select-account" element={<SelectAccountPage />} />
          <Route path="/select-ville" element={<SelectVillePage />} />
          <Route path="/gestion-acces" element={<GestionAccesPage />} />
          <Route path="/attribution-pilotes" element={<AttributionPilotesPage />} />
          <Route path="/admin-data" element={<AdminDataPage />} />
          <Route path="/affectation-pilotes-fi" element={<AffectationPilotesFIPage />} />
          <Route path="/affectation-responsables-secteur" element={<AffectationResponsablesSecteurPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          
          {/* Page de redirection (pour test) */}
          <Route path="/redirect-test" element={<RedirectPage />} />
          
          {/* Ministère des STARS */}
          <Route path="/ministere-stars-login" element={<MinistereStarsLoginPage />} />
          <Route path="/ministere-stars/dashboard" element={<MinistereStarsDashboardPage />} />
          <Route path="/ministere-stars/:ville" element={<MinistereStarsDashboardPage />} />
          <Route path="/ministere-stars/departement/:departement" element={<MinistereStarsDepartementPage />} />
          <Route path="/recensement-stars" element={<RecensementStarsPage />} />
          
          {/* Le Pain du Jour */}
          <Route path="/pain-du-jour" element={<PainDuJourPage />} />
          <Route path="/pain-du-jour/admin" element={<PainDuJourAdminPage />} />
          <Route path="/pain-du-jour/quiz/:date" element={<PainDuJourQuizPage />} />
        </Routes>
      </BrowserRouter>
      </SelectedCityProvider>
      </CitiesProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
