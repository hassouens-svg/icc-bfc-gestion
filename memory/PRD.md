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
│   ├── pages/
│   │   ├── BergeriesChoixPage.jsx      # Choix Promotions/Groupes
│   │   ├── BergeriesDisciplesPage.jsx  # Liste groupes + création
│   │   ├── BergerieDiscipleDetailPage.jsx # Détail groupe
│   │   ├── PainDuJourAdminPage.jsx     # Admin avec 5 onglets
│   │   ├── BergeriesPublicPage.jsx     # Liste promotions
│   │   ├── HomePage.jsx                # Accueil avec bannière
│   │   └── LoginPage.jsx               # Connexion
│   └── App.js                          # Routing
└── tests/
    ├── test_bergeries_disciples.py
    └── test_bergeries_pain_du_jour.py
```

---

## Last Updated
- **Date**: January 13, 2026
- **Session 2**: 
  - ✅ Bouton "+ Ancien Visiteur" → "Ajouter une personne" (PublicBergerieVisitorsPage)
  - ✅ "Ministère des promotions" → "Bergeries" dans la liste des départements Stars
  - ✅ Clic sur département Stars ne redirige plus vers l'accueil (mode public ajouté)
  - ✅ Nouvel endpoint `/api/stars/public/departement/{dept}` pour accès public
  - ✅ Villes affichées avec pays entre parenthèses (cityUtils.js créé)
  - ✅ Navigation vers département conserve le contexte (ville, mode public)
- **Session 1**: 
  - ✅ Page de redirection corrigée (RedirectPage sans hooks router)
  - ✅ AuthProvider ajouté dans App.js
  - ✅ AuthContext avec initialisation synchrone (résout perte de session)
  - ✅ Formulaire Recensement Stars fonctionne
  - ✅ Tests: 100% pass (13/13 backend, 5/5 frontend)
  - Carte Bergeries sur homepage sans description ✅
  - Tous les textes "Promotion/Promo" → "Bergerie" ✅
  - Doublon ville Chalon corrigé ✅

