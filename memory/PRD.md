# ICC BFC-ITALIE Connect - Product Requirements Document

## Original Problem Statement
Application de gestion pour l'église Impact Centre Chrétien BFC-ITALIE. Système complet pour :
- Gestion des nouveaux arrivants et convertis (Promotions/Bergeries)
- Groupes de disciples
- Ministère des Stars
- Familles d'Impact
- Événements et RSVP
- Communication (Email, SMS, WhatsApp)
- Pain du Jour (méditation)
- **KPI Discipolat** (Système de suivi mensuel des disciples)

## Tech Stack
- **Frontend**: React + Shadcn/UI + TailwindCSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Integrations**: OpenAI GPT-4o (Emergent Key), YouTube API, Brevo (emails/SMS)

## User Personas
1. **Pasteur/Super Admin**: Accès complet multi-villes
2. **Responsable d'église**: Gestion d'une ville spécifique
3. **Superviseur Promos**: Gestion des promotions mensuelles
4. **Référent**: Suivi de visiteurs assignés
5. **Berger de groupe**: Responsable d'un groupe de disciples
6. **Star**: Bénévole dans un département

---

## Core Features - Status

### ✅ Completed Features

#### KPI Discipolat (Jan 15, 2026) ✅ NEW
- **Système de scoring mensuel** avec 6 critères pondérés
- **Critères et coefficients**:
  - Présence Culte Dimanche (×3)
  - Présence FI (×3)
  - Présence Réunion Disciples (×2)
  - Service à l'Église (×2)
  - Consommation Pain du Jour (×1)
  - Baptême (×1)
- **Calcul**: Score = Σ(Valeur × Poids)
- **Niveaux de statut**:
  - Non classé: 0-14 pts
  - Débutant: 15-30 pts
  - Intermédiaire: 31-51 pts
  - Confirmé: 52+ pts
- **Composant KPIDiscipolat** sur la page de détail visiteur
- **Badges KPI** sur la page Suivi Disciples (score moyen + nb mois)
- **Dialog "Méthode KPI"** expliquant la méthode de calcul
- **Historique** des mois enregistrés avec navigation rapide

#### Authentication & Authorization
- Login avec sélection de ville
- Rôles multiples (super_admin, pasteur, superviseur_promos, referent, etc.)
- Token JWT avec redirection intelligente

#### Bergeries (Promotions)
- Liste des bergeries par mois
- Dashboard de suivi des visiteurs
- Marquage de présences (dimanche/jeudi)
- Formations (PCNC, Au cœur de la Bible, Star)
- Suivi des disciples (statut Oui/Non/En cours)
- Reproduction et évangélisation

#### Groupes de Disciples (NEW - Jan 2026)
- Page intermédiaire de choix (/bergeries)
- Liste de 47+ groupes (/bergeries-disciples)
  - 41 groupes statiques issus du Google Sheet
  - Nouvelles bergeries créées manuellement
- Filtrage par ville
- **Création manuelle de bergeries** (nom, responsable, ville) ✅ NEW
- Page de détail avec 3 onglets:
  - Membres (CRUD)
  - Suivi Disciples (statut)
  - Reproduction (objectifs, contacts)
- API complète backend

#### Pain du Jour
- Méditation quotidienne
- Quiz interactif
- Admin panel avec 5 onglets:
  - Contenu (date spécifique)
  - **Semaine** (programmation hebdomadaire Lundi-Vendredi) ✅ NEW
  - Versets
  - Quiz
  - Stats

#### Ministère des Stars
- Dashboard par département
- Accès public par ville
- 15 départements + Modération
- Recensement des stars

#### Familles d'Impact
- Gestion des secteurs
- Attribution des pilotes
- Dashboard superviseur

#### Événements
- Création/gestion d'événements
- Système RSVP public
- Statistiques de participation

---

## Known Issues

### ✅ RESOLVED (Jan 13, 2026)
- **~~Session Loss on Navigation~~**: CORRIGÉ - AuthContext utilise maintenant une initialisation synchrone dans useState
- **~~Page de redirection vide~~**: CORRIGÉ - RedirectPage réécrit sans hooks react-router
- **~~Erreur Recensement Stars~~**: CORRIGÉ - Endpoint /api/stars/public/register fonctionne

### P3 - Low Priority / Blocked
- **Brevo API Key Invalid**: Emails transactionnels non fonctionnels (besoin nouvelle clé utilisateur)

---

## Backlog / Future Tasks

### P0 - Critical
- [ ] Refactoring backend server.py (monolithique → routes/models/services)
- [ ] Nettoyage fichiers inutilisés (PublicBergerie*, etc.)

### P1 - High
- [ ] Intégration données Bergerie avec "Dynamique d'Évangélisation"
- [x] ~~Stabilité session utilisateur~~ ✅ CORRIGÉ

### P2 - Medium
- [ ] Refactoring grands composants frontend (DashboardPage.jsx)
- [ ] Tests automatisés supplémentaires

---

## API Endpoints - KPI Discipolat

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/visitors/{visitor_id}/kpi | Enregistrer KPIs pour un mois |
| GET | /api/visitors/{visitor_id}/kpi | Récupérer tous les KPIs d'un visiteur |
| GET | /api/visitors/{visitor_id}/kpi/{mois} | Récupérer KPI pour un mois spécifique |
| GET | /api/visitors/kpi/all-statuses | Récupérer statuts moyens de tous les visiteurs |

## API Endpoints - Groupes de Disciples

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/bergeries-disciples/list | Liste des groupes (statiques + créés) |
| POST | /api/bergeries-disciples/create | Créer une nouvelle bergerie |
| GET | /api/bergeries-disciples/{id} | Info d'un groupe |
| GET | /api/bergeries-disciples/{id}/membres | Membres, objectifs, contacts |
| POST | /api/bergeries-disciples/{id}/membres | Ajouter un membre |
| PUT | /api/bergeries-disciples/membres/{id} | Modifier un membre |
| DELETE | /api/bergeries-disciples/membres/{id} | Supprimer un membre |
| POST | /api/bergeries-disciples/membres/{id}/disciple | Maj statut disciple |
| POST | /api/bergeries-disciples/{id}/objectifs | Ajouter objectif |
| POST | /api/bergeries-disciples/{id}/contacts | Ajouter contact évangélisé |

## API Endpoints - Pain du Jour Programmation

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/pain-du-jour/programmation/{semaine} | Récupérer programmation d'une semaine |
| POST | /api/pain-du-jour/programmation | Sauvegarder et appliquer programmation |
| GET | /api/pain-du-jour/programmations | Liste toutes les programmations |

---

## Files Structure

```
/app/
├── backend/
│   └── server.py              # Backend monolithique (à refactorer)
├── frontend/src/
│   ├── components/
│   │   └── KPIDiscipolat.jsx         # Composant KPI pour détail visiteur ✅ NEW
│   ├── pages/
│   │   ├── SuiviDisciplesPage.jsx    # Affiche badges KPI par visiteur ✅ UPDATED
│   │   ├── VisitorDetailPage.jsx     # Détail visiteur avec KPIDiscipolat ✅ UPDATED
│   │   ├── BergeriesChoixPage.jsx    # Choix Promotions/Groupes
│   │   ├── BergeriesDisciplesPage.jsx # Liste groupes + création
│   │   ├── BergerieDiscipleDetailPage.jsx # Détail groupe
│   │   ├── PainDuJourAdminPage.jsx   # Admin avec 5 onglets
│   │   ├── BergeriesPublicPage.jsx   # Liste promotions
│   │   ├── HomePage.jsx              # Accueil avec bannière
│   │   └── LoginPage.jsx             # Connexion
│   └── App.js                        # Routing
└── tests/
    ├── test_kpi_discipolat.py        # Tests KPI ✅ NEW (11 tests)
    ├── test_bergeries_disciples.py
    └── test_bergeries_pain_du_jour.py
```

---

## Last Updated
- **Date**: January 13, 2026
- **Session 2 - Pain du Jour & Corrections finales**: 
  - ✅ **Pain du Jour - Sélecteur de versets complet** :
    - Liste des 66 livres de la Bible (AT + NT) avec séparateurs
    - Format standard : Livre (dropdown), Chapitre, Verset début, Verset fin
    - Lien SmartBible automatique : `https://smartbible.fr/bible/lsg/{Livre}/{Chapitre}`
    - **Page publique** : "EMCI TV" → "SmartBible" partout
    - **Page admin Semaine** : formulaire complet avec v.début et v.fin
    - **Page admin Versets** : aperçu en temps réel avec lien SmartBible
  - ✅ Bouton "+ Ancien Visiteur" → "Ajouter une personne"
  - ✅ "Ministère des promotions" → "Bergeries"
  - ✅ Clic département Stars ne redirige plus vers l'accueil
  - ✅ Villes avec pays : "Dijon (France)", "Milan (Italie)"
  - ✅ Bugs assignedMonth.split corrigés
  - ✅ Endpoints publics Stars corrigés
- **Session 1**: 
  - ✅ Page de redirection corrigée
  - ✅ AuthProvider + AuthContext synchrone
  - ✅ Formulaire Recensement Stars fonctionne

