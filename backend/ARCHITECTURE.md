# Architecture du Backend - My Events Church

## Vue d'ensemble
Application FastAPI monolithique de **4790 lignes** dans `server.py`.

## Structure actuelle (server.py)

### 📦 **Modèles** (lignes 51-447)
1. **Users & Auth** (51-118)
   - `City`, `CityCreate`
   - `User`, `UserCreate`, `UserUpdate`, `UserLogin`
   
2. **Culte Stats** (119-150)
   - `CulteStats`, `CulteStatsCreate`, `CulteStatsUpdate`
   
3. **Visitors** (151-233)
   - `Visitor`, `VisitorCreate`, `VisitorUpdate`
   - `PresenceEntry`, `CommentEntry`, etc.

4. **Familles d'Impact** (234-326)
   - `Secteur`, `FamilleImpact`, `MembreFI`, `PresenceFI`
   - `Notification`

5. **Events & Projects** (327-447)
   - `Projet`, `Tache`, `CommentaireProjet`
   - `CampagneCommunication`, `RSVP`

### 🛣️ **Routes API**

#### 1. Auth (491-548)
- `POST /api/auth/login`
- `POST /api/auth/register`

#### 2. Users (552-821)
- CRUD complet des utilisateurs
- Blocage/déblocage
- Réinitialisation mot de passe
- Gestion des référents

#### 3. Visitors (825-1206)
- CRUD visiteurs
- Gestion présences (dimanche, jeudi)
- Formations (PCNC, Bible, STAR)
- Commentaires
- Stop tracking
- Bulk add anciens visiteurs

#### 4. Cities (1210-1520)
- CRUD villes
- Statistiques par ville
- Initialisation des données

#### 5. Analytics (1524-1892)
- Stats générales
- Export données
- Fidélisation (referent, admin)
- Analytics détaillées (promos, visiteurs, FI, membres, présences)

#### 6. Familles d'Impact (1960-2571)
- **Secteurs** : CRUD
- **Familles** : CRUD avec pilotes multiples
- **Membres** : CRUD, affectation nouveaux arrivants
- **Présences FI** : Marquage présence
- **Stats** : Pilote, Secteur, Superviseur, Pasteur

#### 7. Notifications (2576-2731)
- Liste notifications
- Marquer comme lu
- Génération automatique

#### 8. Culte Stats (3267-3473)
- CRUD statistiques de culte
- Résumés par date

#### 9. Admin (3477-3896)
- Export/Import données
- Génération mots de passe
- Export credentials
- Migration présences

#### 10. Events & Projects (3899-4435)
- **Projets** : CRUD, archivage
- **Tâches** : CRUD
- **Commentaires** : CRUD
- **Campagnes** : Envoi email/SMS avec Brevo
  - RSVP public
  - Upload images
  - Stats RSVP

#### 11. Contact Groups (4439-4510)
- **Email** : CRUD boxes de contacts
- **SMS** : CRUD boxes SMS

#### 12. Planning Activités (4514-4569)
- CRUD activités de planning
- Filtrage par ville

#### 13. Évangélisation (4660-4788)
- Enregistrement données évangélisation
- Stats par ville/période

### 🔐 **Authentification & Sécurité**
- JWT avec `SECRET_KEY`
- BCrypt pour hashing mots de passe
- `get_current_user()` : Vérifie token JWT
- `get_current_active_user()` : Vérifie utilisateur actif + non bloqué

### 💾 **Base de données MongoDB**
Collections principales :
- `users`
- `visitors`
- `cities`
- `secteurs`
- `familles_impact`
- `membres_fi`
- `presences_fi`
- `notifications`
- `projets`
- `taches`
- `commentaires_projets`
- `campagnes`
- `rsvp_responses`
- `contact_groups`
- `contact_groups_sms`
- `planning_activites` ✨ (nouveau)
- `culte_stats`
- `evangelisation`

### 📨 **Intégrations externes**
1. **Brevo (ex-Sendinblue)**
   - Envoi d'emails via API
   - Envoi de SMS via API
   - Variables d'env: `BREVO_API_KEY`, `BREVO_SENDER_NUMBER`

2. **File Upload**
   - Images stockées dans `/app/frontend/public/uploads/`
   - Accès public via URLs

## Points critiques de stabilité

### ⚠️ **Risques identifiés**
1. **Taille excessive** : 4790 lignes dans un seul fichier
2. **Couplage fort** : Toutes les routes dépendent du même contexte
3. **Difficile à tester** : Pas de tests unitaires isolés
4. **Pas de séparation des concerns** : Modèles + Routes + Business Logic mélangés

### 🎯 **Priorités de refactoring** (pour future amélioration)
1. ✅ **Déjà fait** : Utilitaires (`utils/database.py`, `utils/auth.py`)
2. 🔄 **Prochaine étape** : Extraire Planning (petit, indépendant)
3. 🔄 **Ensuite** : Contact Groups
4. 🔄 **Puis** : Communication & Events
5. 🔄 **Important** : Auth & Users
6. 🔄 **Complexe** : Visitors, FI, Analytics

### ✅ **Recommandations**
- **NE PAS** refactoriser en production sans tests complets
- **CRÉER** des tests avant toute extraction majeure
- **EXTRAIRE** un module à la fois
- **VALIDER** après chaque extraction
- **DOCUMENTER** les dépendances entre modules

## Dernières modifications
- ✅ Champ "Ministères" changé de `List[str]` à `str` (texte libre)
- ✅ Gestion des campagnes SMS ajoutée (Archive, Delete, Reuse)
- ✅ Contact Groups pour Email et SMS créés
- ✅ Module Planning Activités ajouté
