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

#### KPI Discipolat (Jan 15, 2026 - Mise à jour) ✅ UPDATED
- **Système de scoring mensuel** avec 6 critères pondérés
- **Critères et coefficients (MIS À JOUR)**:
  - Présence Dimanche Église (×5)
  - Présence FI (×2)
  - Présence Réunion Disciples (×3)
  - Service à l'Église (×6)
  - Consommation Pain du Jour (×5)
  - Baptême (×2)
- **Calcul**: Score = Σ(Valeur × Poids) - Score max: 75 pts
- **Niveaux de statut (MIS À JOUR)**:
  - Non classé: 0-19 pts
  - Débutant: 20-39 pts
  - Intermédiaire: 40-59 pts
  - Confirmé: 60+ pts
- **Composant KPIDiscipolat** sur la page de détail visiteur
- **Badges KPI** sur la page Suivi Disciples (score moyen + nb mois)
- **Dialog "Méthode KPI"** expliquant la méthode de calcul
- **Historique** des mois enregistrés avec navigation rapide
- **Statut manuel** ✅ NEW - Bouton par visiteur pour définir un statut qui remplace le calcul automatique
- **KPIs pour membres bergeries** ✅ NEW - Même système disponible pour les groupes de disciples

#### EJP - Église des Jeunes Prodiges ✅ NEW
- **Carte sur la page d'accueil** avec "À venir" comme description
- **Carte dans Planning des Activités** (EJP Dijon) en rose/pink

#### EJP - Église des Jeunes Prodiges ✅ NEW Jan 2026
- **Page principale** (`/ejp`) avec 2 cartes
- **Cultes** (`/ejp/cultes`) :
  - Upload audio (MP3, WAV)
  - Date, titre, nom de l'orateur
  - Lecture audio intégrée dans l'app
  - CRUD complet
- **Planning Exhortation** (`/ejp/planning-exhortation`) :
  - Date format "Dimanche 14 janvier"
  - Nom de l'exhortateur
  - CRUD complet (ajouter, modifier, supprimer)
  - Groupé par mois
- **Départements EJP** ajoutés au recensement Stars :
  - EJP-Prière - Intercession
  - EJP-Coordination, EJP-MLA, EJP-Sono
  - EJP-Modération, EJP-COM, EJP-Accueil
  - EJP-Communion Fraternelle

#### Accès Administration (Superadmin/Pasteur) ✅ NEW Jan 2026
- **Page** `/admin/bergeries` pour accéder à toutes les bergeries/promotions
- **Filtres** : Type (Bergeries/Promotions), Ville, Recherche
- **Lien dans le menu** pour superadmin et pasteur
- Permet de voir et entrer dans n'importe quelle bergerie comme si on était le berger

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

#### Groupes de Disciples (Bergeries) ✅ UPDATED Jan 2026
- Page intermédiaire de choix (/bergeries)
- Liste de 47+ groupes (/bergeries-disciples)
  - 41 groupes statiques issus du Google Sheet
  - Nouvelles bergeries créées manuellement
- Filtrage par ville
- **Création manuelle de bergeries** (nom, responsable, ville)
- Page de détail avec 3 onglets:
  - Membres (CRUD)
  - Suivi Disciples avec **boutons "Voir KPIs"** par membre ✅ NEW
  - Reproduction (objectifs, contacts)
- **Page détail membre** (/bergeries-disciples/:bergerieId/membre/:membreId) ✅ NEW
  - Informations de base (nom, téléphone, profession)
  - Composant KPIDiscipolat complet avec les 6 critères
- API complète backend incluant endpoints KPI membres

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

## API Endpoints - Agenda Annuel Départements ✅ NEW

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/stars/agenda/{departement} | Récupérer l'agenda d'un département (params: semestre, annee, ville) |
| POST | /api/stars/agenda/{departement} | Créer entrée agenda (authentifié) |
| POST | /api/stars/agenda-public | Créer entrée agenda (formulaire public) |
| PUT | /api/stars/agenda/entry/{id}/statut | Mettre à jour le statut d'une entrée |
| DELETE | /api/stars/agenda/entry/{id} | Supprimer une entrée |

## API Endpoints - Stars Publics ✅ VERIFIED

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/stars/public/stats | Stats publiques (total, actifs, non_actifs, par_departement) |
| GET | /api/stars/public/list | Liste des stars (params: ville, statut) |
| GET | /api/stars/public/multi-departements | Stars servant dans plusieurs départements |
| GET | /api/stars/public/single-departement | Stars servant dans un seul département |

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
    ├── test_bergeries_pain_du_jour.py
    └── test_stars_agenda_iteration8.py  # NEW - 15 tests Stars publics + Agenda
```

---

## Last Updated
- **Date**: January 20, 2026
- **Session 5 - Stars Stats Publiques & Agenda Annuel**:
  - ✅ **Bug Stats publiques Stars CORRIGÉ** : 
    - L'URL utilisait `&statut=` au lieu de `?statut=` quand pas de ville
    - Corrigé avec `URLSearchParams` pour construire les paramètres correctement
    - Stats Dijon: Total=4, Actifs=3, Non-Actifs=1
  - ✅ **Agenda Annuel des Départements IMPLÉMENTÉ** :
    - Nouvelle page `/agenda-departement/:departement` pour visualiser l'agenda
    - Nouveau formulaire public `/agenda-public` pour soumettre des entrées
    - Endpoints backend: `GET /api/stars/agenda/{departement}`, `POST /api/stars/agenda-public`
    - Filtrage par semestre et année
    - Statuts: Planifié, Fait, Pas fait, En retard
  - ✅ **Liens Agenda ajoutés** :
    - Section "Lien Agenda Annuel des Départements" sur `/ministere-stars/:ville`
    - Bouton "Voir l'Agenda Annuel" sur `/ministere-stars/departement/:departement`
  - ✅ **Dialogs Stars actifs/inactifs fonctionnels** :
    - Clic sur carte "Stars Actives" ouvre un dialog avec liste des stars actifs
    - Clic sur carte "Non Actives" ouvre un dialog avec liste des stars inactifs
  - ✅ **HomePage optimisée** : Chargement en ~1 seconde
  - ✅ **15 nouveaux tests passés** (iteration_8) - Stars publics + Agenda
- **Session 4 - Corrections bugs critiques**:
  - ✅ **Bug KPIs membres bergerie** : Corrigé la collection MongoDB (`membres_disciples` au lieu de `membres_bergerie`)
  - ✅ **Bug page blanche après Retour** : Corrigé la route (`/bergerie-disciple/` au lieu de `/bergeries-disciples/`)
  - ✅ **Bug erreurs en boucle Suivi/Reproduction** : Corrigé la gestion de `assigned_month` (tableau vs chaîne)
  - ✅ **Bug syntaxe AuthContext** : Corrigé `}q catch` → `} catch`
  - ✅ **Bug isOldProductionDomain** : Supprimé le bloc de code avec variable non définie
- **Session 3 - Vérification Analytics & Tests**:
  - ✅ **Bug Analytics RÉSOLU** : Les endpoints retournent maintenant des valeurs correctes
    - `/api/analytics/promotions-detailed` - Filtres ville/mois/année fonctionnels
    - `/api/analytics/age-distribution` - Filtrage par année OK
    - `/api/analytics/arrival-channel-distribution` - Filtrage par année OK
  - ✅ **Dashboard Super Admin fonctionne** :
    - 67 visiteurs total (53 en 2024, 14 en 2025)
    - Tous les filtres (ville, mois, année) fonctionnent globalement
    - Graphiques et tableaux s'affichent correctement
  - ✅ **15 tests automatisés passés** (iteration_7)
  - ✅ **EJP section vérifiée** :
    - Page principale avec cartes Cultes et Planning Exhortation
    - Upload audio fonctionnel
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

