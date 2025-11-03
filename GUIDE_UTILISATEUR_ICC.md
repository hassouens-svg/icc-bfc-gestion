# Guide Utilisateur - ICC Dijon Connect
## Application de Gestion des Visiteurs ICC

**Version:** 2.0  
**Date:** Décembre 2024  
**Impact Centre Chrétien**

---

## Table des Matières

1. [Présentation de l'Application](#1-présentation-de-lapplication)
2. [Accès et Connexion](#2-accès-et-connexion)
3. [Les Différents Rôles](#3-les-différents-rôles)
4. [Guide par Rôle](#4-guide-par-rôle)
5. [Fonctionnalités Communes](#5-fonctionnalités-communes)
6. [FAQ et Dépannage](#6-faq-et-dépannage)

---

## 1. Présentation de l'Application

### 1.1 Objectif

ICC Dijon Connect est une application web de gestion des visiteurs pour les églises Impact Centre Chrétien. Elle permet de :
- Suivre les nouveaux arrivants et nouveaux convertis
- Gérer les présences aux services (Dimanche et Jeudi)
- Suivre les formations (PCNC, Au cœur de la Bible, STAR)
- Calculer les taux de fidélisation
- Générer des statistiques et exports

### 1.2 Villes Gérées

L'application gère actuellement **8 villes ICC** :
1. Dijon (ville principale - Super Admin)
2. Chalon-Sur-Saone
3. Dole
4. Besançon
5. Sens
6. Milan
7. Perugia
8. Rome

### 1.3 URL d'Accès

**Production :** https://icc-management.emergent.host/

---

## 2. Accès et Connexion

### 2.1 Page d'Accueil

La page d'accueil présente :
- Le logo ICC
- Le titre "Impact Centre Chrétien"
- Deux boutons principaux :
  - **Accueil et Intégration**
  - **Promotions**

### 2.2 Processus de Connexion

1. Sélectionnez votre département (Accueil/Promotions) ou cliquez sur "Se connecter"
2. Sur la page de connexion, remplissez :
   - **Ville** : Sélectionnez votre ville ICC
   - **Nom d'utilisateur** : Votre identifiant
   - **Mot de passe** : Votre mot de passe personnel
3. Cliquez sur "Se connecter"

### 2.3 Inscription Visiteur (Public)

Les nouveaux visiteurs peuvent s'inscrire directement via le lien "Nouveau visiteur? S'inscrire ici" sur la page de connexion.

**Informations demandées :**
- Prénom et Nom
- Ville ICC
- Type de visiteur (Nouveau Arrivant / Nouveau Converti / De Passage)
- Téléphone et Email (optionnel)
- Canal d'arrivée (comment ils ont connu ICC)
- Date de visite

---

## 3. Les Différents Rôles

### 3.1 Hiérarchie des Rôles

```
Super Admin (Admin Dijon)
    ↓
Admin (autres villes)
    ↓
Promotions
    ↓
Référent
    ↓
Accueil & Intégration
```

### 3.2 Super Admin (Admin de Dijon)

**Accès :** TOTAL - Contrôle absolu sur toutes les villes

**Peut :**
- ✅ Gérer tous les admins de toutes les villes
- ✅ Bloquer/débloquer n'importe quel utilisateur
- ✅ Supprimer n'importe quel utilisateur
- ✅ Créer, modifier, supprimer des villes
- ✅ Voir toutes les statistiques de toutes les villes
- ✅ Configurer les permissions des référents
- ✅ Exporter les données en Excel

**Ne peut pas :**
- Rien, il a tous les droits

---

### 3.3 Admin (autres villes)

**Accès :** Limité à SA ville uniquement

**Peut :**
- ✅ Créer, modifier, supprimer des référents de SA ville
- ✅ Gérer les visiteurs de sa ville
- ✅ Voir toutes les statistiques de sa ville
- ✅ Configurer les permissions des référents
- ✅ Supprimer des visiteurs de sa ville
- ✅ Voir les taux de fidélisation globaux
- ✅ Exporter les données de sa ville
- ✅ Voir les statistiques détaillées par ville

**Ne peut pas :**
- ❌ Supprimer d'autres admins
- ❌ Accéder aux données d'autres villes
- ❌ Bloquer des utilisateurs (réservé au Super Admin)
- ❌ Créer ou supprimer des villes

---

### 3.4 Promotions

**Accès :** Vue complète de la ville, sans gestion utilisateurs

**Peut :**
- ✅ Voir tous les visiteurs de tous les mois
- ✅ Voir toutes les statistiques
- ✅ Voir les taux de fidélisation globaux
- ✅ Supprimer des visiteurs
- ✅ Exporter les données
- ✅ Voir les visiteurs avec suivi arrêté

**Ne peut pas :**
- ❌ Créer ou gérer des utilisateurs (référents, admins)
- ❌ Configurer les permissions
- ❌ Gérer les villes

---

### 3.5 Référent

**Accès :** Limité aux visiteurs de SON mois assigné uniquement

**Peut (selon permissions configurées) :**
- ✅ Voir les visiteurs de son mois assigné
- ✅ Marquer les présences (Dimanche/Jeudi)
- ✅ Marquer les formations (PCNC, Bible, STAR)
- ✅ Ajouter des commentaires
- ✅ Arrêter le suivi d'un visiteur (avec raison)
- ✅ Supprimer ses visiteurs (mois assigné uniquement)
- ✅ Voir son taux de fidélisation
- ✅ Voir ses statistiques (mois assigné)

**Ne peut pas (par défaut) :**
- ❌ Voir les visiteurs des autres mois
- ❌ Voir les statistiques globales
- ❌ Créer ou gérer des utilisateurs
- ❌ Supprimer des visiteurs d'autres mois

**Note :** Les permissions peuvent être modifiées par l'Admin.

---

### 3.6 Accueil & Intégration

**Accès :** Consultation simple uniquement

**Peut :**
- ✅ Voir la liste des visiteurs (lecture seule)
- ✅ Voir : Nom, Prénom, Canal d'arrivée, Date d'arrivée

**Ne peut pas :**
- ❌ Modifier quoi que ce soit
- ❌ Voir les détails complets des visiteurs
- ❌ Accéder aux statistiques
- ❌ Marquer des présences

---

## 4. Guide par Rôle

### 4.1 Guide Super Admin (Admin Dijon)

#### Menu Disponible
- Dashboard
- Visiteurs
- Vue Tableau
- Fidélisation
- Référents
- Villes
- Analytics
- Suivi Arrêté

#### Gestion des Villes

**Accéder à la gestion des villes :**
1. Cliquez sur "Villes" dans le menu
2. Vous voyez toutes les villes ICC

**Pour chaque ville, vous pouvez :**

**a) Voir les statistiques détaillées (icône 📈) :**
- Total de référents dans la ville
- Total de visiteurs dans la ville
- Pour chaque référent :
  - Nombre de visiteurs par catégorie (Arrivants, Convertis, De passage)
  - Taux de fidélité moyen

**b) Gérer la ville (icône ⚙️) :**
- Modifier le nom de la ville
- Supprimer la ville (uniquement si vide)

**Créer une nouvelle ville :**
1. Cliquez sur "Nouvelle Ville"
2. Entrez le nom
3. Confirmez

#### Gestion des Utilisateurs

**Créer un utilisateur (Admin/Référent/Promotions/Accueil) :**
1. Allez dans "Référents"
2. Cliquez sur "Créer un Utilisateur"
3. Remplissez :
   - Nom d'utilisateur
   - Mot de passe
   - Ville
   - Rôle
   - Mois assigné (pour référents)
4. Confirmez

**Gérer un référent :**
1. Cliquez sur "Gérer" (⚙️) à côté du référent
2. Vous pouvez :
   - Modifier le nom
   - Changer le mois assigné
   - Configurer les **6 permissions** :
     - Voir tous les mois
     - Modifier les visiteurs
     - Arrêter le suivi
     - Ajouter des commentaires
     - Marquer les présences
     - Voir les analytics

**Supprimer un utilisateur :**
1. Cliquez sur "Gérer"
2. Cliquez sur "Supprimer"
3. Confirmez la suppression

**Bloquer/Débloquer un utilisateur (Super Admin uniquement) :**
1. Cliquez sur "Gérer"
2. Cliquez sur "Bloquer" ou "Débloquer"
3. L'utilisateur bloqué ne pourra plus se connecter

#### Voir les Statistiques Globales

**Dashboard :**
- Total visiteurs de votre ville
- Total référents
- Graphique par canal d'arrivée
- Graphique par mois
- Répartition par type

**Analytics :**
- Graphiques détaillés
- Courbes de rétention
- Export Excel disponible

---

### 4.2 Guide Admin (autres villes)

#### Menu Disponible
- Dashboard
- Visiteurs
- Vue Tableau
- Fidélisation
- Référents
- Villes (lecture seule pour sa ville)
- Analytics
- Suivi Arrêté

#### Gérer les Référents de SA Ville

**Créer un référent :**
1. Allez dans "Référents"
2. Cliquez "Créer un Utilisateur"
3. Sélectionnez :
   - Ville : Votre ville uniquement
   - Rôle : Référent, Accueil, ou Promotions
   - Mois assigné (pour référents)

**Configurer les permissions :**
1. Cliquez "Gérer" sur un référent
2. Activez/désactivez les permissions selon vos besoins

**Supprimer un référent :**
1. Cliquez "Gérer"
2. Cliquez "Supprimer"
3. Confirmez

**Limitations :**
- Ne peut pas supprimer d'autres admins
- Ne peut pas créer d'utilisateurs pour d'autres villes
- Ne peut pas bloquer des utilisateurs

#### Gérer les Visiteurs

**Voir tous les visiteurs :**
- Vue Cartes : `/visitors` - Vue simple en cartes
- Vue Tableau : `/visitors-table` - Vue détaillée avec filtres

**Ajouter un visiteur manuellement :**
1. Allez dans "Visiteurs"
2. Cliquez "Ajouter un Visiteur"
3. Remplissez le formulaire
4. Confirmez

**Supprimer un visiteur :**
- Dans la vue Cartes : Cliquez sur l'icône 🗑️
- Dans la vue Tableau : Cliquez sur "Supprimer"
- Confirmez la suppression

**Voir les détails d'un visiteur :**
1. Cliquez sur le visiteur
2. Vous voyez :
   - Informations personnelles
   - Présences (Dimanche/Jeudi) avec couleurs
   - Formations (PCNC, Bible, STAR)
   - Commentaires

---

### 4.3 Guide Promotions

#### Menu Disponible
- Dashboard
- Visiteurs
- Vue Tableau
- Fidélisation
- Analytics
- Suivi Arrêté

#### Vue Complète sans Gestion

**Voir tous les visiteurs de tous les mois :**
1. Allez dans "Visiteurs" ou "Vue Tableau"
2. Vous voyez TOUS les visiteurs actifs et arrêtés
3. Utilisez les filtres pour affiner

**Statistiques globales :**
- Dashboard : Vue d'ensemble
- Fidélisation : Taux de tous les référents
- Analytics : Graphiques complets

**Export des données :**
1. Allez dans "Analytics"
2. Cliquez "Exporter en Excel"
3. Le fichier se télécharge automatiquement

#### Limites

- Pas de création/modification d'utilisateurs
- Pas de configuration de permissions
- Pas de gestion des villes

---

### 4.4 Guide Référent

#### Menu Disponible
- Dashboard (statistiques de VOTRE mois uniquement)
- Visiteurs (VOTRE mois uniquement)
- Vue Tableau (VOTRE mois uniquement)
- Fidélisation (VOS données uniquement)

#### Voir VOS Visiteurs

**Deux vues disponibles :**

**Vue Cartes (`/visitors`) :**
- Liste simple de vos visiteurs
- Cliquez pour voir les détails

**Vue Tableau (`/visitors-table`) :**
- Vue détaillée avec filtres avancés
- **Filtres disponibles :**
  - Recherche par nom
  - Statut (Actif/Arrêté/Tous)
  - Catégorie (Arrivant/Converti/De Passage)
  - **Date** : Sélectionnez une date précise
  - **Service** : Dimanche / Jeudi / Tous
  - **Présence** : Présent / Absent / Tous

**Exemple d'utilisation des filtres :**
Pour voir qui était absent le dimanche 3 novembre :
1. Date : 3 novembre 2024
2. Service : Dimanche
3. Présence : Absent
4. → Liste affichée avec ❌ dans la colonne

#### Marquer les Présences

1. Cliquez sur un visiteur pour voir ses détails
2. Section "Présences Dimanche" ou "Présences Jeudi"
3. Sélectionnez la date
4. Cochez "Présent" si présent
5. Cliquez "Ajouter"

**Code couleur automatique :**
- 🟢 Vert : Présent
- 🔴 Rouge : Absent

#### Marquer les Formations

1. Dans la fiche du visiteur
2. Section "Formations"
3. Cochez les formations complétées :
   - PCNC
   - Au cœur de la Bible
   - STAR

#### Ajouter des Commentaires

1. Dans la fiche du visiteur
2. Section "Commentaires"
3. Tapez votre commentaire
4. Cliquez "Ajouter le commentaire"

**Tous les commentaires sont horodatés et signés.**

#### Arrêter le Suivi

1. Dans la fiche du visiteur
2. Cliquez "Arrêter le suivi"
3. **Raison obligatoire** : Expliquez pourquoi
4. Confirmez

Le visiteur passe en statut "Arrêté" et n'apparaît plus dans la liste active.

#### Supprimer un Visiteur

**Uniquement vos visiteurs du mois assigné :**
1. Dans Vue Cartes ou Vue Tableau
2. Cliquez sur l'icône 🗑️
3. Confirmez la suppression

**Attention :** La suppression est irréversible !

#### Voir Votre Taux de Fidélisation

1. Allez dans "Fidélisation"
2. Vous voyez :
   - **Total visiteurs** de votre mois
   - **Taux mensuel moyen** de fidélité
   - **Graphique par semaine**
   - **Détails semaine par semaine** :
     - Nombre de présences
     - Nombre attendu
     - Taux en %

**Comment est calculé le taux :**
- 2 services par semaine (Dimanche + Jeudi)
- Taux = (Présences réelles / Présences attendues) × 100
- Exemple : 10 visiteurs, 15 présences sur 20 attendues = 75%

#### Votre Dashboard

**Affiche uniquement VOS statistiques (mois assigné) :**
- Total de vos visiteurs
- Répartition par canal d'arrivée
- Répartition par type
- Graphiques de votre mois

**Vous ne voyez PAS :**
- Les visiteurs des autres mois
- Les statistiques globales de la ville

---

### 4.5 Guide Accueil & Intégration

#### Menu Disponible
- Visiteurs (lecture seule)

#### Vue Simple

**Tableau de consultation uniquement :**
| Nom | Prénom | Canal d'arrivée | Date d'arrivée |
|-----|---------|-----------------|----------------|
| Dupont | Jean | Evangelisation | 15/11/2024 |
| Martin | Marie | Réseaux sociaux | 20/11/2024 |

**Vous pouvez :**
- ✅ Voir la liste de tous les visiteurs
- ✅ Rechercher un visiteur

**Vous ne pouvez pas :**
- ❌ Cliquer sur un visiteur pour voir les détails
- ❌ Modifier quoi que ce soit
- ❌ Marquer des présences
- ❌ Voir les statistiques

---

## 5. Fonctionnalités Communes

### 5.1 Vue Tableau Avancée

**Accessible pour :** Admin, Promotions, Référents

**Chemin :** Menu → "Vue Tableau"

#### Filtres Disponibles

**1. Recherche**
- Tapez un nom ou prénom
- Filtrage instantané

**2. Statut**
- Actifs : Visiteurs en suivi
- Arrêtés : Suivi arrêté
- Tous : Tous les visiteurs

**3. Catégorie**
- Nouveau Arrivant
- Nouveau Converti
- De Passage
- Tous

**4. Date**
- Sélectionnez une date précise
- Affiche les présences pour cette date

**5. Type de Service**
- Dimanche
- Jeudi
- Tous (affiche les deux colonnes)

**6. Présence**
- Présent : Uniquement ceux présents
- Absent : Uniquement ceux absents
- Tous

#### Colonnes du Tableau

- Nom
- Prénom
- Catégorie (badges colorés)
- Statut (Actif/Arrêté)
- **Présence Dimanche** (si date sélectionnée) : ✅ ou ❌
- **Présence Jeudi** (si date sélectionnée) : ✅ ou ❌
- Dernier commentaire
- Actions (Voir / Supprimer)

#### Exemples d'Utilisation

**Cas 1 : Voir tous les absents du jeudi 7 novembre**
1. Date : 7 novembre 2024
2. Service : Jeudi
3. Présence : Absent
→ Liste des absents avec ❌

**Cas 2 : Voir uniquement les Nouveaux Arrivants actifs**
1. Statut : Actifs
2. Catégorie : Nouveau Arrivant
→ Liste filtrée

**Cas 3 : Chercher un visiteur spécifique**
1. Recherche : "Martin"
→ Tous les Martin affichés

---

### 5.2 Statistiques et Analytics

**Accessible pour :** Admin, Promotions

#### Dashboard

**Vue d'ensemble de la ville :**
- **Carte "Total Visiteurs"** : Nombre de visiteurs actifs
- **Carte "Total Référents"** : Nombre de référents/promotions/accueil
- **Graphique "Par Canal d'Arrivée"** : Camembert
  - Evangelisation
  - Réseaux sociaux
  - Invitation membre
  - Par soi-même
- **Graphique "Par Mois"** : Histogramme des arrivées par mois
- **Graphique "Par Type"** : Répartition Arrivants/Convertis/Passage

#### Page Analytics

**Graphiques avancés :**
- Courbes de rétention
- Évolution dans le temps
- **Bouton "Exporter en Excel"** : Télécharge toutes les données

**Contenu de l'export Excel :**
- Liste complète des visiteurs
- Toutes les informations
- Présences
- Formations
- Commentaires

---

### 5.3 Gestion des Villes

**Accessible pour :** Super Admin (lecture seule pour autres Admins)

#### Voir les Statistiques d'une Ville

1. Menu → "Villes"
2. Cliquez sur l'icône 📈 d'une ville

**Affichage :**
- Total référents dans la ville
- Total visiteurs
- **Pour chaque référent :**
  - Nom et mois assigné
  - Total visiteurs
  - Nouveaux arrivants
  - Nouveaux convertis
  - De passage
  - **Taux de fidélité moyen en %**

#### Gérer une Ville (Super Admin uniquement)

1. Cliquez sur l'icône ⚙️
2. Options :
   - **Modifier le nom** : Change automatiquement partout
   - **Supprimer la ville** : Uniquement si aucun utilisateur/visiteur

---

### 5.4 Système de Permissions (Référents)

**Accessible pour :** Admin, Super Admin

#### Les 6 Permissions Configurables

**1. Voir tous les mois**
- ❌ Désactivé (défaut) : Voit uniquement son mois
- ✅ Activé : Voit tous les visiteurs de tous les mois

**2. Modifier les visiteurs**
- ✅ Activé (défaut) : Peut modifier les infos
- ❌ Désactivé : Lecture seule

**3. Arrêter le suivi**
- ✅ Activé (défaut) : Peut arrêter le suivi
- ❌ Désactivé : Ne peut pas arrêter

**4. Ajouter des commentaires**
- ✅ Activé (défaut) : Peut commenter
- ❌ Désactivé : Ne peut pas commenter

**5. Marquer les présences**
- ✅ Activé (défaut) : Peut marquer présent/absent
- ❌ Désactivé : Ne peut pas marquer

**6. Voir les analytics**
- ❌ Désactivé (défaut) : Voit uniquement ses stats
- ✅ Activé : Accès aux analytics globales

#### Configurer les Permissions

1. Menu → "Référents"
2. Cliquez "Gérer" (⚙️) sur un référent
3. Section "Permissions"
4. Activez/désactivez selon vos besoins
5. Cliquez "Mettre à jour"

**Les changements sont immédiats.**

---

### 5.5 Fidélisation

#### Pour les Référents

**Menu → "Fidélisation"**

**Affichage :**
- **Total visiteurs** de votre mois
- **Taux mensuel moyen** (%)
- **Graphique en barres** : Taux par semaine
- **Liste détaillée par semaine** :
  - Numéro de semaine
  - Présences / Attendues
  - Taux en %
  - Couleur selon le taux (vert si >50%, orange sinon)

#### Pour Admin/Promotions

**Menu → "Fidélisation"**

**Vue globale de tous les référents :**
- **Filtres** :
  - Par semaine
  - Par mois
  - Bouton "Réinitialiser"

**Pour chaque référent :**
- Nom et mois assigné
- Total visiteurs
- **Taux mensuel moyen (en grand)**
- Graphique linéaire par semaine

---

### 5.6 Visiteurs Arrêtés

**Accessible pour :** Admin, Promotions

**Menu → "Suivi Arrêté"**

**Liste des visiteurs dont le suivi a été arrêté :**
- Nom, Prénom
- Raison de l'arrêt
- Date d'arrêt
- Arrêté par (nom du référent)

**Utile pour :**
- Suivi des abandons
- Analyse des raisons d'arrêt
- Statistiques de rétention

---

## 6. FAQ et Dépannage

### 6.1 Questions Fréquentes

**Q1 : J'ai oublié mon mot de passe, que faire ?**
→ Contactez votre administrateur de ville qui peut réinitialiser votre mot de passe.

**Q2 : Je suis référent mais je ne vois pas tous les visiteurs, pourquoi ?**
→ Normal ! Vous ne voyez que les visiteurs de VOTRE mois assigné. Si vous avez besoin de voir plus, demandez à l'admin de modifier vos permissions.

**Q3 : Comment savoir quel est mon mois assigné ?**
→ Visible sur votre Dashboard en haut, ou demandez à l'admin.

**Q4 : Je ne peux pas supprimer un visiteur, erreur "Permission denied"**
→ Vous êtes probablement référent et essayez de supprimer un visiteur d'un autre mois. Vous ne pouvez supprimer que VOS visiteurs.

**Q5 : La page de fidélisation n'affiche rien**
→ Vérifiez que vous avez des visiteurs assignés à votre mois et que des présences ont été marquées.

**Q6 : Comment exporter les données ?**
→ Accessible uniquement pour Admin et Promotions : Menu → Analytics → "Exporter en Excel"

**Q7 : Je suis bloqué, je ne peux plus me connecter**
→ Vous avez été bloqué par le Super Admin (Admin Dijon). Contactez-le pour déblocage.

**Q8 : Les statistiques du Dashboard ne correspondent pas**
→ Si vous êtes référent, vous voyez uniquement VOS statistiques (mois assigné), pas les stats globales.

**Q9 : Puis-je modifier mon propre nom d'utilisateur ?**
→ Non, seul l'admin peut modifier les utilisateurs.

**Q10 : Comment ajouter une nouvelle ville ?**
→ Seul le Super Admin (Admin Dijon) peut créer de nouvelles villes.

---

### 6.2 Problèmes Courants

#### Problème : "Invalid credentials" à la connexion

**Solutions :**
1. Vérifiez votre nom d'utilisateur (sensible à la casse)
2. Vérifiez votre mot de passe
3. Vérifiez que vous avez sélectionné la BONNE ville
4. Contactez votre admin pour réinitialisation

#### Problème : Page blanche ou erreur 404

**Solutions :**
1. Actualisez la page (F5)
2. Videz le cache du navigateur
3. Vérifiez votre connexion internet
4. Essayez un autre navigateur

#### Problème : Les données ne se chargent pas

**Solutions :**
1. Attendez quelques secondes
2. Actualisez la page
3. Déconnectez-vous et reconnectez-vous
4. Vérifiez votre rôle (vous n'avez peut-être pas accès)

#### Problème : Je ne vois pas certains menus

**Solution :**
→ Normal ! Les menus affichés dépendent de votre rôle. Consultez la section "Menu Disponible" de votre rôle dans ce guide.

---

### 6.3 Bonnes Pratiques

#### Pour les Admins

✅ **À FAIRE :**
- Configurer les permissions des référents selon vos besoins
- Créer un utilisateur par référent avec un mois assigné
- Exporter régulièrement les données (backup)
- Vérifier les statistiques hebdomadaires
- Suivre les visiteurs avec suivi arrêté

❌ **À ÉVITER :**
- Donner trop de permissions aux référents
- Supprimer des villes avec des données
- Partager vos identifiants
- Oublier d'assigner un mois aux référents

#### Pour les Référents

✅ **À FAIRE :**
- Marquer les présences le jour même
- Ajouter des commentaires réguliers
- Vérifier votre taux de fidélisation
- Utiliser la vue tableau pour filtrer
- Communiquer avec l'admin si problème

❌ **À ÉVITER :**
- Oublier de marquer les présences
- Supprimer un visiteur sans réfléchir (irréversible !)
- Arrêter un suivi sans raison valable

#### Pour Tous

✅ **À FAIRE :**
- Se déconnecter après utilisation
- Utiliser un mot de passe fort
- Signaler tout bug à l'admin
- Lire ce guide en cas de doute

❌ **À ÉVITER :**
- Partager ses identifiants
- Laisser une session ouverte sur ordinateur public
- Modifier des données sans être sûr

---

### 6.4 Support et Contact

**Pour obtenir de l'aide :**

1. **Problème technique :**
   → Contactez votre administrateur de ville

2. **Problème de permissions/accès :**
   → Contactez votre administrateur de ville

3. **Oubli de mot de passe :**
   → Contactez votre administrateur de ville

4. **Demande de nouvelle fonctionnalité :**
   → Contactez le Super Admin (Admin Dijon)

5. **Bug ou erreur grave :**
   → Contactez le Super Admin immédiatement

---

### 6.5 Mises à Jour et Évolutions

**Version actuelle :** 2.0

**Dernières fonctionnalités ajoutées :**
- ✅ Vue Tableau avancée avec filtres
- ✅ Système de permissions pour référents
- ✅ Gestion complète des villes
- ✅ Statistiques détaillées par ville
- ✅ Suppression de visiteurs pour référents
- ✅ Blocage d'utilisateurs (Super Admin)
- ✅ Hiérarchie des rôles complète

**Prochaines évolutions prévues :**
- Notifications par email
- Application mobile
- Rapports PDF automatiques
- Intégration calendrier

---

## Annexes

### Annexe A : Récapitulatif des Accès par Rôle

| Fonctionnalité | Super Admin | Admin | Promotions | Référent | Accueil |
|----------------|-------------|-------|------------|----------|---------|
| Voir tous visiteurs | ✅ | ✅ | ✅ | ❌* | ✅ |
| Modifier visiteurs | ✅ | ✅ | ✅ | ✅* | ❌ |
| Supprimer visiteurs | ✅ | ✅ | ✅ | ✅* | ❌ |
| Créer utilisateurs | ✅ | ✅ | ❌ | ❌ | ❌ |
| Supprimer utilisateurs | ✅ | ✅** | ❌ | ❌ | ❌ |
| Bloquer utilisateurs | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gérer villes | ✅ | ❌ | ❌ | ❌ | ❌ |
| Voir stats globales | ✅ | ✅ | ✅ | ❌ | ❌ |
| Exporter données | ✅ | ✅ | ✅ | ❌ | ❌ |
| Configurer permissions | ✅ | ✅ | ❌ | ❌ | ❌ |

*Selon permissions configurées  
**Sauf autres admins

### Annexe B : Liste des Canaux d'Arrivée

1. **Evangelisation** : Visiteur rencontré lors d'une action d'évangélisation
2. **Réseaux sociaux** : Découvert via Facebook, Instagram, etc.
3. **Invitation par un membre** : Invité par un membre de l'église
4. **Par soi-même** : Venu de sa propre initiative

### Annexe C : Types de Visiteurs

1. **Nouveau Arrivant** : Personne nouvellement arrivée dans la ville/région
2. **Nouveau Converti** : Personne qui vient de se convertir au christianisme
3. **De Passage** : Personne de passage, non résidente

Un visiteur peut avoir plusieurs types simultanément.

### Annexe D : Formations Suivies

1. **PCNC** : Principes Chrétiens de Nouvelle Créature
2. **Au cœur de la Bible** : Formation biblique approfondie
3. **STAR** : Formation sur le service et le leadership

---

## Glossaire

**Assigned Month** (Mois assigné) : Mois attribué à un référent pour le suivi des visiteurs arrivés ce mois-là.

**Canal d'arrivée** : Moyen par lequel le visiteur a découvert l'église ICC.

**Fidélisation** : Taux de présence régulière des visiteurs aux services.

**Référent** : Personne en charge du suivi des visiteurs d'un mois donné.

**Super Admin** : Administrateur principal (Admin Dijon) avec tous les droits sur toutes les villes.

**Suivi arrêté** : Visiteur dont on a décidé de ne plus assurer le suivi (avec raison documentée).

**Tracking stopped** : Terme technique pour "Suivi arrêté".

---

## Notes de Fin

Ce guide a été créé pour faciliter l'utilisation de l'application ICC Dijon Connect. Pour toute question non couverte par ce document, contactez votre administrateur.

**Dernière mise à jour :** Décembre 2024  
**Version du guide :** 2.0  
**Application :** ICC Dijon Connect

---

**© Impact Centre Chrétien - Tous droits réservés**
