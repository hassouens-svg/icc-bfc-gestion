# ICC Dijon Connect - Application de Suivi des Visiteurs

## Description
Application web complète pour la gestion et le suivi des visiteurs des églises ICC (Impact Centre Chrétien) dans plusieurs villes.

## Fonctionnalités

### 🔐 Système d'Authentification Multi-Rôles
- **Admin / Promotion**: Accès complet à toutes les fonctionnalités
- **Référent**: Accès limité aux visiteurs de leur mois assigné
- **Accueil et Intégration**: Vue simplifiée - liste des noms uniquement

### 👥 Gestion des Visiteurs
- Ajout manuel de visiteurs (avec tous les détails)
- Formulaire public d'inscription accessible depuis n'importe quel navigateur
- Recherche et filtrage des visiteurs
- Détails complets de chaque visiteur

### 📅 Suivi des Présences (Calendrier)
- Enregistrement des présences Dimanche et Jeudi
- Système de dropdown Oui/Non avec code couleur (Vert/Rouge)
- Historique complet des présences par date

### 🎓 Suivi des Formations
- PCNC (checkboxes)
- Au cœur de la bible (checkboxes)
- STAR (checkboxes)

### 💬 Système de Commentaires
- Ajout de commentaires sur chaque visiteur
- Historique avec auteur et date

### ⏸️ Arrêt du Suivi
- Bouton "Arrêter le suivi" avec demande de raison
- Confirmation avant l'arrêt
- Conservation dans la base de données
- Vue admin dédiée pour les visiteurs avec suivi arrêté

### 📊 Analytics et Statistiques
- Dashboard avec statistiques globales
- Graphiques:
  - Histogramme des arrivées par mois
  - Camembert par canal d'arrivée
  - Camembert par type de visiteur
  - Courbe de croissance
- Export Excel de toutes les données

### 🏙️ Gestion Multi-Villes
8 villes ICC disponibles:
- Dijon, Chalon-Sur-Saone, Dole, Besançon, Sens, Milan, Perugia, Rome

## URLs de l'Application

### Production
- **Connexion**: https://videosum-2.preview.emergentagent.com/login
- **Inscription Publique**: https://videosum-2.preview.emergentagent.com/register

### Identifiants par Défaut
**Admin Dijon:**
- Ville: Dijon
- Nom d'utilisateur: `admin`
- Mot de passe: `admin123`

## Architecture Technique

### Backend (FastAPI)
- **Framework**: FastAPI (Python)
- **Base de données**: MongoDB
- **Authentification**: JWT
- **Hash de mots de passe**: bcrypt
- **Export**: pandas + openpyxl

### Frontend (React)
- **Framework**: React 19
- **Routing**: React Router v7
- **UI Components**: Radix UI + shadcn/ui
- **Styling**: Tailwind CSS
- **Graphiques**: Recharts
- **Notifications**: Sonner

## Permissions par Rôle

| Fonctionnalité | Admin/Promotion | Référent | Accueil |
|----------------|-----------------|----------|---------|
| Voir tous les visiteurs | ✅ | ❌ (son mois uniquement) | ✅ (noms uniquement) |
| Ajouter visiteur | ✅ | ✅ | ❌ |
| Voir détails visiteur | ✅ | ✅ (son mois) | ❌ |
| Ajouter présences | ✅ | ✅ (son mois) | ❌ |
| Ajouter commentaires | ✅ | ✅ (son mois) | ❌ |
| Marquer formations | ✅ | ✅ (son mois) | ❌ |
| Arrêter suivi | ✅ | ✅ (son mois) | ❌ |
| Voir suivi arrêté | ✅ | ❌ | ❌ |
| Créer référents | ✅ | ❌ | ❌ |
| Gérer villes | ✅ | ❌ | ❌ |
| Analytics | ✅ | ❌ | ❌ |
| Export Excel | ✅ | ❌ | ❌ |
