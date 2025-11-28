# 📘 Guide Utilisateur Complet - My Events Church

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Connexion et accès](#connexion-et-accès)
3. [Rôles et permissions](#rôles-et-permissions)
4. [Application principale](#application-principale)
5. [Module Events Church](#module-events-church)
6. [Guide par rôle](#guide-par-rôle)
7. [FAQ et support](#faq-et-support)

---

# Vue d'ensemble

## Présentation de l'application

**My Events Church** est une plateforme complète de gestion d'église comprenant deux modules principaux :

### 🏠 Application Principale (CRM)
Gestion des visiteurs, fidélisation, familles d'impact, statistiques de culte et analytics.

### 📅 Module Events Church
Gestion de projets, événements, communication en masse (email/SMS), et planning d'activités.

---

# Connexion et accès

## Accès à l'application principale

**URL** : `http://votre-domaine.com/login`

**Informations requises** :
- Nom d'utilisateur
- Mot de passe
- Ville (sélection dans la liste)

## Accès au module Events Church

**URL** : `http://votre-domaine.com/events-login`

**Informations requises** :
- Nom d'utilisateur
- Mot de passe

---

# Rôles et permissions

## 🎭 Hiérarchie des rôles

### 1. Super Admin (super_admin) 👑
**Pouvoir** : Accès total et illimité

**Peut** :
- ✅ Accéder à toutes les villes
- ✅ Créer, modifier, supprimer tous les utilisateurs
- ✅ Gérer tous les visiteurs de toutes les villes
- ✅ Voir toutes les statistiques et analytics
- ✅ Exporter/Importer toutes les données
- ✅ Bloquer/débloquer des utilisateurs
- ✅ Réinitialiser les mots de passe
- ✅ Configurer les permissions des utilisateurs
- ✅ Gérer les familles d'impact de toutes les villes
- ✅ Accéder au module Events Church (tous les projets)
- ✅ Gérer les statistiques de culte
- ✅ Accéder aux données d'évangélisation

**Accès aux modules** :
- Application principale : Tous les menus
- Events Church : Tous les menus

---

### 2. Pasteur (pasteur) 🙏
**Pouvoir** : Vue d'ensemble multi-villes + gestion stratégique

**Peut** :
- ✅ Voir les données de toutes les villes
- ✅ Voir les statistiques globales
- ✅ Consulter les analytics détaillées
- ✅ Voir les rapports de fidélisation
- ✅ Voir les statistiques de familles d'impact
- ✅ Voir les statistiques de culte
- ❌ Ne peut PAS créer/modifier des utilisateurs
- ❌ Ne peut PAS modifier les visiteurs directement

**Accès aux modules** :
- Application principale : Vue statistiques uniquement
- Events Church : Consultation projets

---

### 3. Responsable d'Église (responsable_eglise) 🏛️
**Pouvoir** : Gestion complète de SA ville

**Peut** :
- ✅ Voir et gérer les visiteurs de SA ville uniquement
- ✅ Ajouter des commentaires et présences
- ✅ Gérer les formations (PCNC, Bible, STAR)
- ✅ Voir les statistiques de SA ville
- ✅ Accéder au module Events Church
- ✅ Créer et gérer des projets dans SA ville
- ✅ Envoyer des communications (email/SMS)
- ✅ Gérer le planning des activités de SA ville
- ❌ Ne peut PAS voir les autres villes
- ❌ Ne peut PAS créer d'utilisateurs

**Accès aux modules** :
- Application principale : Visiteurs de sa ville
- Events Church : Tous les menus (limité à sa ville)

---

### 4. Gestion Projet (gestion_projet) 📊
**Pouvoir** : Gestion de projets et événements

**Peut** :
- ✅ Créer et gérer des projets
- ✅ Créer et assigner des tâches
- ✅ Envoyer des communications en masse
- ✅ Gérer le planning des activités
- ✅ Créer des campagnes email/SMS
- ✅ Voir les statistiques de projets
- ❌ N'a PAS accès à l'application principale (CRM)

**Accès aux modules** :
- Application principale : ❌ Aucun accès
- Events Church : Tous les menus

---

### 5. Superviseur Promotions (superviseur_promos) 📈
**Pouvoir** : Vue d'ensemble des promotions et référents

**Peut** :
- ✅ Voir tous les visiteurs (toutes promos)
- ✅ Voir les statistiques de fidélisation
- ✅ Voir le tableau des visiteurs
- ✅ Consulter les analytics détaillées
- ❌ Ne peut PAS modifier les visiteurs
- ❌ Ne peut PAS créer d'utilisateurs

**Accès aux modules** :
- Application principale : Vue lecture seule
- Events Church : ❌ Aucun accès

---

### 6. Superviseur FI (superviseur_fi) 🏘️
**Pouvoir** : Vue d'ensemble des Familles d'Impact

**Peut** :
- ✅ Voir toutes les familles d'impact
- ✅ Voir les statistiques FI globales
- ✅ Consulter les présences FI
- ✅ Voir les indicateurs d'affectation
- ❌ Ne peut PAS créer/modifier des FI
- ❌ Ne peut PAS gérer les visiteurs

**Accès aux modules** :
- Application principale : Vue FI uniquement
- Events Church : ❌ Aucun accès

---

### 7. Référent / Accueil / Promotions (referent, accueil, promotions) 👥
**Pouvoir** : Gestion d'une promotion spécifique

**Peut** :
- ✅ Voir les visiteurs de SA promotion (ex: Janvier 2025)
- ✅ Ajouter des présences (dimanche, jeudi)
- ✅ Ajouter des commentaires
- ✅ Marquer les formations (PCNC, Bible, STAR)
- ✅ Arrêter le suivi d'un visiteur
- ✅ Voir les statistiques de SA promotion
- ❌ Ne peut PAS voir les autres promotions (selon permissions)
- ❌ Ne peut PAS créer/supprimer des visiteurs

**Permissions configurables par Super Admin** :
- Voir tous les mois ou seulement le mois assigné
- Éditer les visiteurs
- Arrêter le suivi
- Ajouter des commentaires
- Marquer les présences
- Voir les analytics

**Accès aux modules** :
- Application principale : Visiteurs de sa promo
- Events Church : ❌ Aucun accès

---

### 8. Responsable Secteur (responsable_secteur) 🗺️
**Pouvoir** : Gestion d'un secteur géographique de FI

**Peut** :
- ✅ Voir les FI de SON secteur
- ✅ Créer de nouvelles FI dans son secteur
- ✅ Modifier les FI de son secteur
- ✅ Voir les statistiques de son secteur
- ❌ Ne peut PAS voir les autres secteurs

**Accès aux modules** :
- Application principale : FI de son secteur
- Events Church : ❌ Aucun accès

---

### 9. Pilote FI (pilote_fi) 🏠
**Pouvoir** : Gestion d'une ou plusieurs Familles d'Impact

**Peut** :
- ✅ Voir les membres de SES FI
- ✅ Ajouter/supprimer des membres
- ✅ Marquer les présences des membres
- ✅ Ajouter des commentaires
- ✅ Voir les statistiques de SES FI
- ✅ Affecter des nouveaux arrivants à SA FI
- ❌ Ne peut PAS voir les autres FI
- ❌ Ne peut PAS créer de nouvelles FI

**Accès aux modules** :
- Application principale : Ses FI uniquement
- Events Church : ❌ Aucun accès

---

# Application principale

## 📊 Tableau de bord

### Pour Super Admin / Pasteur
**Statistiques visibles** :
- Nombre total de visiteurs
- Nombre de nouveaux arrivants ce mois
- Taux de fidélisation global
- Nombre de FI actives
- Répartition par ville
- Graphiques de tendances

### Pour Responsable d'Église
**Statistiques de sa ville** :
- Visiteurs de la ville
- Nouveaux arrivants du mois
- Taux de fidélisation
- FI de la ville

### Pour Référent
**Statistiques de sa promotion** :
- Visiteurs de sa promo
- Présences moyennes
- Formations complétées

---

## 👥 Gestion des visiteurs

### Ajouter un visiteur

**Champs obligatoires** :
- Prénom
- Nom
- Téléphone
- Ville
- Type : Nouveau Arrivant / Nouveau Converti / De Passage
- Canal d'arrivée : Comment ils ont connu l'église
- Date de visite

**Champs optionnels** :
- Email
- Adresse
- Tranche d'âge

**Types de visiteurs** :
1. **Nouveau Arrivant** : Personne nouvelle dans l'église
2. **Nouveau Converti** : Personne qui vient d'accepter Christ
3. **De Passage** : Visiteur ponctuel

**Canaux d'arrivée** :
- Ami/Famille
- Réseaux sociaux
- Site web
- Événement spécial
- De passage
- Autre

---

### Suivi des visiteurs

#### Présences Dimanche
- Marquer présent/absent pour chaque dimanche
- Ajouter un commentaire optionnel
- Historique des présences visible

#### Présences Jeudi (EJP)
- Marquer présent/absent pour les jeudis
- Ajouter un commentaire optionnel

#### Formations
3 types de formations disponibles :
- **PCNC** : Programme Cours des Nouveaux Convertis
- **Au Cœur de la Bible** : Formation biblique
- **STAR** : Formation avancée

Cocher la case quand la formation est complétée.

#### Commentaires
- Ajouter des notes importantes
- Visible avec date et auteur
- Utile pour le suivi personnalisé

#### Arrêter le suivi
- Possibilité d'arrêter le suivi d'un visiteur
- Indiquer la raison (déménagement, autre église, etc.)
- Le visiteur passe en "suivi arrêté"

---

### Anciens visiteurs

**Fonctionnalité d'import en masse** :
- Permet d'ajouter des visiteurs des années précédentes
- Format : Excel (.xlsx)
- Colonnes : Prénom, Nom, Téléphone, Email, Type, Canal, Date, Ville, Présences

**Intérêt** :
- Historisation des données
- Vue complète de la croissance de l'église
- Suivi long terme

---

## 🏘️ Familles d'Impact (FI)

### Concept
Les Familles d'Impact sont des cellules de maison pour la communion fraternelle.

### Structure hiérarchique
```
Ville
  └── Secteur (zone géographique)
      └── Famille d'Impact (cellule)
          └── Membres
              └── Présences (chaque jeudi)
```

### Gestion des secteurs
**Super Admin / Responsable d'Église peuvent** :
- Créer des secteurs
- Nommer les secteurs (ex: "Centre-ville", "Nord", "Sud")
- Assigner un responsable de secteur

### Gestion des FI
**Créer une FI** :
- Nom de la FI
- Secteur d'appartenance
- Adresse
- Pilote(s) (un ou plusieurs)
- Horaires (heure de début et fin)

**Informations affichées** :
- Nombre de membres
- Présences moyennes
- Dernière réunion
- Taux d'assiduité

### Gestion des membres
**Ajouter un membre** :
- Manuellement (prénom, nom)
- Depuis les nouveaux arrivants (affectation automatique)

**Marquer les présences** :
- Date du jeudi
- Présent / Absent
- Commentaire optionnel

### Affectation des nouveaux arrivants
**Processus** :
1. Visiteur marqué comme "Nouveau Arrivant"
2. Responsable/Pilote peut l'affecter à une FI
3. Le visiteur devient membre de la FI
4. Suivi des présences commence

### Indicateurs FI
**Pour Super Admin / Pasteur** :
- Vue globale de toutes les FI
- Taux d'affectation des nouveaux arrivants
- FI en stagnation (peu de présences)
- FI en croissance

**Pour Superviseur FI** :
- Vue d'ensemble de toutes les FI
- Comparaison entre FI
- Identification des FI à soutenir

**Pour Responsable Secteur** :
- FI de son secteur uniquement
- Statistiques du secteur

**Pour Pilote FI** :
- Ses FI uniquement
- Liste des membres
- Historique des présences

---

## 📊 Fidélisation

### Concept
Mesure de l'assiduité et de l'engagement des visiteurs.

### Calcul du score
**4 KPI pondérés** :
1. **Présences Dimanche** (40%)
2. **Présences Jeudi/EJP** (20%)
3. **Présences FI** (30%)
4. **Formations complétées** (10%)

**Score global** : Moyenne pondérée sur 100

### Vue Référent
- Voir le score de SA promotion
- Filtrer par semaine ou période
- Graphique d'évolution (52 semaines)
- Liste des visiteurs avec leur score individuel

### Vue Admin
- Score global de toutes les promos
- Comparaison entre promotions
- Identification des promos à risque
- Graphiques de tendances

### Interprétation
- 🟢 **80-100%** : Excellent engagement
- 🟡 **50-79%** : Engagement moyen
- 🔴 **0-49%** : Engagement faible (alerte)

---

## 📈 Analytics

### Tableaux disponibles

#### 1. Vue Tableau - Visiteurs
**Colonnes** :
- Prénom, Nom
- Ville
- Promotion (mois d'arrivée)
- Type
- Canal d'arrivée
- Présences Dimanche
- Présences Jeudi
- FI affectée
- Formations
- Score fidélisation

**Filtres** :
- Par ville
- Par promotion
- Par type
- Par score

#### 2. Vue Tableau - Membres FI
**Colonnes** :
- Prénom, Nom
- FI d'appartenance
- Secteur
- Ville
- Taux de présence FI
- Date d'ajout
- Source (manuel ou nouveau arrivant)

**Filtres** :
- Par FI
- Par secteur
- Par ville

#### 3. Vue Détaillée - Promotions
**Graphiques** :
- Évolution du nombre de visiteurs
- Répartition par type
- Répartition par canal
- Taux de rétention par promo

#### 4. Vue Détaillée - FI
**Graphiques** :
- Nombre de FI par ville
- Nombre de membres par FI
- Taux de présence moyen
- FI en croissance vs stagnation

---

## 📊 Statistiques de culte

### Types de cultes
1. **Culte 1** : Premier service du dimanche
2. **Culte 2** : Deuxième service du dimanche
3. **EJP** : École de Jeudi des Prophètes
4. **Événements spéciaux** : Conférences, séminaires, etc.

### Saisie des stats
**Pour chaque culte** :
- Date
- Ville
- Type de culte
- Nombre total de fidèles
- Nombre d'adultes
- Nombre d'enfants
- Nombre de STARS (personnes formées)
- Commentaire optionnel

### Vue des statistiques
**Par semaine** :
- Total par culte
- Évolution par rapport à la semaine précédente
- Graphiques de tendance

**Par mois** :
- Moyennes mensuelles
- Comparaison avec les mois précédents
- Pics et creux identifiés

**Par ville** :
- Comparaison entre villes
- Croissance par ville

---

## 🔔 Notifications

### Types de notifications
1. **Rappel de présence** : Rappel de marquer les présences du dimanche
2. **FI en stagnation** : Alerte si une FI a peu de présences
3. **Fidélisation faible** : Alerte si une promo a un score < 50%
4. **Visiteur non affecté** : Nouveau arrivant sans FI depuis > 2 semaines

### Destinataires
- Super Admin : Toutes les notifications
- Responsable d'Église : Notifications de sa ville
- Référent : Notifications de sa promo
- Pilote FI : Notifications de ses FI

### Actions
- Marquer comme lu
- Voir les détails (lien direct vers l'élément concerné)

---

## ⚙️ Gestion des accès

### Créer un utilisateur (Super Admin uniquement)

**Informations requises** :
- Nom d'utilisateur
- Mot de passe
- Ville
- Rôle
- Téléphone (optionnel)

**Selon le rôle** :
- **Référent** : Assigner un mois (promotion)
- **Pilote FI** : Assigner une ou plusieurs FI
- **Responsable Secteur** : Assigner un secteur

**Permissions personnalisables** (pour Référents) :
- Peut voir tous les mois
- Peut éditer les visiteurs
- Peut arrêter le suivi
- Peut ajouter des commentaires
- Peut marquer les présences
- Peut voir les analytics

### Gérer les utilisateurs
- Modifier les informations
- Changer le rôle
- Bloquer/débloquer un compte
- Réinitialiser le mot de passe
- Supprimer un utilisateur

---

## 🌍 Gestion des villes

### Ajouter une ville
- Nom de la ville
- Pays (par défaut : France)

### Initialiser les données
**Fonction spéciale** : Crée des données de démo pour tester
- Visiteurs exemples
- FI exemples
- Présences aléatoires

⚠️ **À utiliser uniquement en développement/test**

---

## 📤 Export / Import (Super Admin)

### Export de toutes les données
**Format** : JSON
**Contenu** :
- Tous les visiteurs
- Tous les utilisateurs
- Toutes les FI
- Toutes les présences
- Toutes les stats

**Utilité** :
- Backup complet
- Migration de données
- Audit

### Import de données
**Format** : JSON (même structure que l'export)
**Action** : Écrase les données existantes

⚠️ **Attention** : Action irréversible

---

# Module Events Church

## 🎯 Projets et Événements

### Créer un projet

**Informations** :
- Titre du projet
- Description
- Date de début
- Date de fin
- Budget prévu
- Ville
- Membres de l'équipe (nom, email)

**Statuts** :
- 📋 **Planifié** : Projet en préparation
- 🚀 **En cours** : Projet actif
- ✅ **Terminé** : Projet complété
- ❌ **Annulé** : Projet annulé

### Gérer les tâches

**Créer une tâche** :
- Titre
- Description
- Projet associé
- Assignée à (membre de l'équipe)
- Date limite
- Statut : À faire / En cours / Terminé

**Vue Kanban** :
- Colonnes par statut
- Glisser-déposer pour changer le statut
- Vue d'ensemble du projet

### Commentaires
- Ajouter des notes et discussions
- Visible par tous les membres du projet
- Horodatage et auteur

### Budget
- Budget prévu
- Budget réel (à remplir)
- Écart affiché automatiquement

### Archiver un projet
- Projet archivé = masqué de la vue principale
- Toujours accessible via "Voir les archives"

---

## 📧 Communication Email

### Créer une campagne email

**Étape 1 : Informations de base**
- Titre de la campagne (interne)
- Message de l'email
  - Supporte la personnalisation : `{prenom}` et `{nom}`
  - Exemple : "Bonjour {prenom}, bienvenue à notre événement !"

**Étape 2 : Image (optionnel)**
- Upload d'une image/affiche
- Formats acceptés : JPG, PNG, GIF
- Taille max : 5 MB
- L'image sera affichée dans l'email

**Étape 3 : Destinataires**
- Maximum 300 contacts par campagne

**3 méthodes d'ajout** :

1. **Contact test** : `hassouens@gmail.com` (bouton rapide)

2. **Sélectionner une Box** : Groupe de contacts sauvegardés
   - Cliquez sur "Gérer mes Boxes" pour créer/modifier

3. **Copier-coller** : Coller vos contacts dans la zone de texte
   - Format accepté (un par ligne) :
     ```
     Prénom Nom email@example.com
     Jean Dupont jean@church.org
     Marie Martin marie@domain.com
     ```
   - Ou juste les emails :
     ```
     email1@example.com
     email2@example.com
     ```

**Étape 4 : RSVP (optionnel)**
- ✅ Cocher "Ajouter lien RSVP"
- Les destinataires recevront un lien pour répondre :
  - ✅ Oui
  - ❌ Non
  - 🤷 Peut-être

**Envoi** :
- Cliquer sur "Créer et Envoyer Email"
- Les emails sont envoyés immédiatement via Brevo
- Confirmation de l'envoi avec nombre d'emails envoyés

---

### Page RSVP publique

**Accès** : Lien unique généré automatiquement (envoyé dans l'email)

**Contenu** :
- Titre de la campagne
- Image de l'événement
- Message
- 3 boutons : Oui / Non / Peut-être

**Anonymat** : Pas besoin de connexion pour répondre

**Confirmation** : Message de remerciement après réponse

---

### Historique des emails

**Informations affichées** :
- Titre de la campagne
- Nombre de destinataires
- Date d'envoi
- Statut : ✅ Envoyé / 📦 Archivé

**Actions disponibles** :
- 🔄 **Réutiliser** : Crée une copie pour renvoyer
- 📦 **Archiver** : Masque de la liste principale
- 🗑️ **Supprimer** : Supprime définitivement (confirmation demandée)

**Statistiques RSVP** (si activé) :
- Nombre de "Oui"
- Nombre de "Non"
- Nombre de "Peut-être"
- Pourcentage de réponses

---

## 📱 Communication SMS

### Créer une campagne SMS

**Étape 1 : Informations de base**
- Titre de la campagne (interne)
- Message SMS
  - **Limite : 160 caractères** (au-delà = 2 SMS facturés)
  - Supporte la personnalisation : `{prenom}` et `{nom}`
  - Exemple : "Bonjour {prenom}, culte dimanche 10h !"

**Étape 2 : Destinataires**
- Maximum 300 numéros par campagne

**3 méthodes d'ajout** :

1. **Contact test** : Numéro de test (bouton rapide)

2. **Sélectionner une Box SMS** : Groupe de numéros sauvegardés
   - Cliquez sur "Gérer mes Boxes SMS" pour créer/modifier

3. **Copier-coller** : Coller vos contacts dans la zone de texte
   - Format accepté (un par ligne) :
     ```
     Prénom Nom 0612345678
     Jean Dupont +33612345678
     ```
   - Ou juste les numéros :
     ```
     0612345678
     +33612345678
     ```

**Format des numéros** :
- Format français : `0612345678`
- Format international : `+33612345678` (recommandé)

**Étape 3 : RSVP (optionnel)**
- ✅ Cocher "Ajouter lien RSVP"
- Un lien court sera ajouté au SMS

**Envoi** :
- Cliquer sur "Créer et Envoyer SMS"
- Les SMS sont envoyés immédiatement via Brevo
- Confirmation de l'envoi avec nombre de SMS envoyés

### Configuration Brevo SMS

⚠️ **Important** : Les SMS nécessitent une configuration Brevo

**Prérequis** :
1. Compte Brevo créé (gratuit)
2. Service SMS activé sur Brevo
3. Crédits SMS achetés (~0.05€ par SMS)
4. Numéro expéditeur validé par Brevo (24-48h)

**Guide complet** : Cliquer sur "Voir le guide" dans la page SMS

**Coût approximatif** :
- SMS France : ~0.05€
- SMS international : Variable selon pays

---

### Historique des SMS

**Informations affichées** :
- Titre de la campagne
- Nombre de destinataires
- Extrait du message
- Date d'envoi
- Statut : ✅ Envoyé / 📦 Archivé

**Actions disponibles** :
- 🔄 **Réutiliser** : Crée une copie pour renvoyer
- 📦 **Archiver** : Masque de la liste principale
- 🗑️ **Supprimer** : Supprime définitivement (confirmation demandée)

---

## 📦 Boxes de contacts

### Concept
Les "Boxes" permettent de sauvegarder des groupes de contacts réutilisables.

### Boxes Email

**Créer une box** :
1. Aller sur "Gérer mes Boxes" (depuis page Email)
2. Cliquer sur "Nouvelle Box"
3. Donner un nom (ex: "Équipe Louange", "Jeunes")
4. Coller les contacts (format : Prénom Nom email)
5. Sauvegarder

**Utiliser une box** :
1. Dans le formulaire d'email
2. Sélectionner la box dans le menu déroulant
3. Les contacts sont automatiquement ajoutés

**Gérer les boxes** :
- Voir la liste de toutes les boxes
- Nombre de contacts par box
- Supprimer une box

### Boxes SMS

**Fonctionnement identique** aux boxes email, mais pour les numéros de téléphone.

**Créer une box SMS** :
1. Aller sur "Gérer mes Boxes SMS" (depuis page SMS)
2. Cliquer sur "Nouvelle Box"
3. Donner un nom (ex: "Pilotes FI", "Équipe accueil")
4. Coller les contacts (format : Prénom Nom numéro)
5. Sauvegarder

---

## 📅 Planning des Activités

### Concept
Planification et suivi des activités de l'église par ville.

### Accès selon le rôle

**Super Admin / Pasteur** :
- Peut voir et gérer toutes les villes
- Sélection de la ville sur la page d'accueil
- Bouton "Changer de ville" disponible

**Responsable d'Église** :
- Voit uniquement SA ville
- Accès direct au planning de sa ville
- Pas de sélection de ville

### Créer une activité

**Informations** :
- Nom de l'activité (ex: "Culte de dimanche", "Réunion de prière")
- Date
- Ministères concernés (texte libre : ex: "Jeunesse, Musique")
- Statut :
  - 📅 **À venir** : Activité planifiée
  - ⏳ **Reporté** : Activité reportée
  - ❌ **Annulé** : Activité annulée
  - ✅ **Fait** : Activité réalisée
- Commentaire (optionnel)

### Tableau de planning

**Vue** : Tableau éditable avec toutes les activités

**Colonnes** :
- Nom de l'activité
- Date
- Ministères
- Statut
- Commentaire
- Actions (✏️ Éditer, 🗑️ Supprimer)

**Édition en ligne** :
- Cliquer sur ✏️ pour éditer
- Modifier les champs directement
- Cliquer sur 💾 pour sauvegarder

**Couleurs automatiques** :
- 🟢 **Vert** : Activité fait (statut "Fait")
- 🔴 **Rouge** : Activité en retard (date passée + pas fait)
- 🟡 **Jaune** : Activité reportée
- ⚪ **Blanc** : Activité à venir
- ⚫ **Gris** : Activité annulée

### Indicateurs d'avancement

**KPI affichés en haut de page** :
- 📊 **Total** : Nombre total d'activités
- ✅ **Fait** : Nombre d'activités complétées
- 📅 **À venir** : Nombre d'activités planifiées
- ⏳ **Reporté** : Nombre d'activités reportées
- ❌ **Annulé** : Nombre d'activités annulées
- 🔴 **En retard** : Nombre d'activités non faites après leur date

**Barre de progression** :
- Pourcentage = (Fait / Total) × 100
- 🟢 Vert si ≥ 80%
- 🟡 Jaune si 50-79%
- 🔴 Rouge si < 50%

### Filtres et recherche
- Filtrer par statut
- Rechercher par nom d'activité
- Trier par date

---

## 📊 Évangélisation

### Concept
Suivi des actions d'évangélisation sur le terrain.

### Enregistrer une action

**Informations** :
- Date de l'action
- Ville
- Lieu (ex: "Centre commercial", "Parc", "Porte-à-porte")
- Nombre de personnes contactées
- Nombre de personnes intéressées
- Nombre de décisions (acceptations de Christ)
- Commentaire (optionnel)

### Statistiques

**Vue globale** :
- Total des contacts
- Total des intéressés
- Total des décisions
- Taux de conversion

**Par ville** :
- Comparaison entre villes
- Ville la plus active

**Par période** :
- Évolution mensuelle
- Graphiques de tendance

**Utilité** :
- Mesurer l'impact de l'évangélisation
- Identifier les lieux efficaces
- Motiver les équipes

---

# Guide par rôle

## 👑 Je suis Super Admin

### Au démarrage
1. **Connexion** : `http://votre-domaine.com/login`
   - Username : `superadmin`
   - Mot de passe : (votre mot de passe)
   - Ville : N'importe laquelle

2. **Créer les villes** :
   - Menu "Villes"
   - Ajouter toutes vos villes

3. **Créer les utilisateurs** :
   - Menu "Gestion des Accès"
   - Créer les comptes pour :
     - Pasteurs
     - Responsables d'église
     - Référents
     - Pilotes FI
     - Gestion projet

4. **Créer les secteurs et FI** :
   - Menu "Familles d'Impact"
   - Créer les secteurs par ville
   - Créer les FI par secteur
   - Assigner les pilotes

### Mes tâches quotidiennes
- ✅ Vérifier les notifications importantes
- ✅ Consulter les statistiques globales
- ✅ Répondre aux demandes de réinitialisation de mot de passe
- ✅ Valider les nouveaux utilisateurs

### Mes tâches hebdomadaires
- 📊 Analyser les rapports de fidélisation
- 📊 Vérifier les stats de culte
- 📊 Consulter les analytics détaillées
- 🔔 Vérifier les FI en stagnation

### Mes tâches mensuelles
- 📈 Export des données (backup)
- 📈 Rapport mensuel pour le leadership
- 📈 Ajustement des permissions utilisateurs si besoin

### Module Events Church
- 📅 Voir tous les projets
- 📧 Gérer les communications globales
- 📅 Superviser le planning des activités

---

## 🙏 Je suis Pasteur

### Au démarrage
1. **Connexion** : `http://votre-domaine.com/login`
   - Username : (donné par Super Admin)
   - Mot de passe : (donné par Super Admin)
   - Ville : N'importe laquelle

2. **Tableau de bord** : Vue d'ensemble multi-villes

### Mes tâches quotidiennes
- 📊 Consulter les statistiques globales
- 🔔 Vérifier les notifications importantes

### Mes tâches hebdomadaires
- 📊 Analyser la fidélisation par ville
- 📊 Vérifier les stats de culte
- 📊 Consulter les rapports de FI

### Mes tâches mensuelles
- 📈 Rapport mensuel global
- 📈 Identifier les villes à soutenir
- 📈 Planifier les actions stratégiques

### Vue limitée
⚠️ **Attention** : Vous avez accès en lecture seule. Vous ne pouvez pas modifier les données directement.

---

## 🏛️ Je suis Responsable d'Église

### Au démarrage
1. **Connexion** : `http://votre-domaine.com/login`
   - Ville : VOTRE ville (obligatoire)

2. **Familiarisez-vous avec** :
   - Liste de vos visiteurs
   - Vos FI
   - Vos statistiques

3. **Events Church** : Connexion sur `http://votre-domaine.com/events-login`

### Mes tâches quotidiennes
- 👥 Vérifier les nouveaux visiteurs
- 🔔 Lire les notifications
- 📧 Répondre aux communications internes

### Mes tâches hebdomadaires
- ✅ S'assurer que les présences sont marquées (dimanche + jeudi)
- 📊 Vérifier le score de fidélisation
- 🏘️ Consulter les stats des FI
- 📅 Mettre à jour le planning des activités

### Mes tâches mensuelles
- 📈 Rapport mensuel de la ville
- 📈 Évaluer les référents et pilotes
- 📧 Envoyer des communications à la communauté
- 🎯 Planifier les événements du mois prochain

### Module Events Church
- 🎯 Créer et gérer les projets de votre ville
- 📧 Envoyer des emails/SMS de masse
- 📅 Gérer le planning des activités
- 📦 Créer des boxes de contacts réutilisables

---

## 📊 Je suis Gestion Projet

### Au démarrage
1. **Connexion Events Church** : `http://votre-domaine.com/events-login`

2. **Je n'ai PAS accès à** :
   - L'application principale (CRM)
   - Les visiteurs
   - Les FI

### Mes tâches quotidiennes
- 🎯 Mettre à jour le statut des tâches
- 💬 Répondre aux commentaires de projet

### Mes tâches hebdomadaires
- 🎯 Créer de nouveaux projets
- 📋 Assigner des tâches
- 💰 Mettre à jour les budgets
- 📅 Mettre à jour le planning des activités

### Mes tâches mensuelles
- 📈 Rapport d'avancement des projets
- 📧 Envoyer des communications liées aux événements
- 📦 Organiser et mettre à jour les boxes de contacts

### Mon expertise
- Gestion de projets
- Communication événementielle
- Planification d'activités

---

## 📈 Je suis Superviseur Promotions

### Au démarrage
1. **Connexion** : `http://votre-domaine.com/login`

2. **Je peux voir** :
   - Tous les visiteurs (toutes promos)
   - Statistiques globales
   - Rapports de fidélisation

3. **Je NE peux PAS** :
   - Modifier les visiteurs
   - Créer des utilisateurs
   - Accéder aux FI

### Mes tâches quotidiennes
- 📊 Consulter le tableau des visiteurs
- 🔔 Vérifier les notifications de fidélisation faible

### Mes tâches hebdomadaires
- 📊 Analyser les tendances de fidélisation
- 📊 Identifier les promos à risque
- 📈 Préparer des rapports pour le leadership

### Mes tâches mensuelles
- 📈 Rapport mensuel complet sur toutes les promos
- 📈 Recommandations d'actions
- 📈 Comparaison entre promos

### Mon rôle
Supervision et analyse, pas d'intervention directe.

---

## 🏘️ Je suis Superviseur FI

### Au démarrage
1. **Connexion** : `http://votre-domaine.com/login`

2. **Je peux voir** :
   - Toutes les FI
   - Statistiques FI globales
   - Membres de toutes les FI

3. **Je NE peux PAS** :
   - Créer/modifier des FI
   - Marquer des présences
   - Gérer les visiteurs

### Mes tâches quotidiennes
- 📊 Consulter les statistiques FI

### Mes tâches hebdomadaires
- 🏘️ Identifier les FI en stagnation
- 📊 Vérifier les taux de présence
- 🔔 Alerter les pilotes si besoin

### Mes tâches mensuelles
- 📈 Rapport mensuel FI global
- 📈 Recommandations stratégiques
- 📈 Identification des bonnes pratiques

### Mon rôle
Supervision et analyse des FI, support aux pilotes.

---

## 👥 Je suis Référent / Accueil / Promotions

### Au démarrage
1. **Connexion** : `http://votre-domaine.com/login`

2. **Je vois** :
   - Les visiteurs de MA promotion (ex: Janvier 2025)
   - Le score de fidélisation de ma promo

3. **Mes permissions** : Configurées par le Super Admin
   - Peut varier selon mon rôle spécifique

### Mes tâches quotidiennes
- 👥 Vérifier les nouveaux visiteurs de ma promo
- 🔔 Lire mes notifications

### Mes tâches hebdomadaires (après chaque culte)
- ✅ Marquer les présences dimanche de mes visiteurs
- ✅ Marquer les présences jeudi (EJP) si applicable
- 💬 Ajouter des commentaires sur le suivi
- 📞 Contacter les visiteurs absents

### Mes tâches mensuelles
- 📊 Consulter le score de fidélisation de ma promo
- 📈 Identifier les visiteurs à risque (score faible)
- 🎯 Actions de relance ciblées
- ✅ Mettre à jour les formations (PCNC, Bible, STAR)

### Conseils
- **Soyez régulier** : Marquez les présences chaque semaine
- **Ajoutez des commentaires** : Cela aide le suivi long terme
- **Communiquez** : Contactez les absents pour comprendre pourquoi
- **Célébrez les progrès** : Formations complétées, assiduité, etc.

---

## 🗺️ Je suis Responsable Secteur

### Au démarrage
1. **Connexion** : `http://votre-domaine.com/login`

2. **Je peux voir** :
   - Les FI de MON secteur uniquement
   - Les statistiques de mon secteur

3. **Je peux** :
   - Créer de nouvelles FI dans mon secteur
   - Modifier les FI de mon secteur

### Mes tâches quotidiennes
- 🔔 Vérifier les notifications liées à mon secteur

### Mes tâches hebdomadaires
- 🏘️ Vérifier les présences des FI de mon secteur
- 📊 Consulter les taux de présence
- 🤝 Contacter les pilotes si besoin de soutien

### Mes tâches mensuelles
- 🏘️ Évaluer la santé de chaque FI
- 🏘️ Identifier les FI en difficulté
- 🎯 Planifier des actions de soutien
- 📈 Rapport mensuel du secteur

### Mon rôle
Coordinateur des FI de mon secteur, support aux pilotes.

---

## 🏠 Je suis Pilote FI

### Au démarrage
1. **Connexion** : `http://votre-domaine.com/login`

2. **Je peux voir** :
   - MES FI uniquement (une ou plusieurs)
   - Les membres de mes FI
   - Les présences de mes membres

3. **Je peux** :
   - Ajouter/supprimer des membres
   - Marquer les présences
   - Affecter des nouveaux arrivants à ma FI

### Mes tâches quotidiennes
- 👥 Préparer la réunion FI du jeudi

### Mes tâches hebdomadaires (après chaque FI)
- ✅ Marquer les présences de tous les membres
- 💬 Ajouter des commentaires si nécessaire
- 📞 Contacter les absents
- 🙏 Prier pour les membres

### Mes tâches mensuelles
- 🏘️ Évaluer la croissance de la FI
- 👥 Identifier les membres à risque
- 🎯 Planifier des actions d'intégration
- 📈 Rapport mensuel au responsable de secteur

### Accueil de nouveaux membres
1. **Depuis nouveaux arrivants** :
   - Aller sur "Familles d'Impact"
   - Cliquer sur "Affecter un nouveau arrivant"
   - Sélectionner le visiteur
   - Sélectionner votre FI
   - Confirmer

2. **Manuellement** :
   - Aller sur votre FI
   - Cliquer sur "Ajouter un membre"
   - Entrer prénom et nom
   - Confirmer

### Conseils de pilote
- **Créez une ambiance chaleureuse** : Les membres doivent se sentir chez eux
- **Suivez les absents** : Un SMS/appel fait la différence
- **Priez ensemble** : La prière crée l'unité
- **Encouragez la croissance** : Formations, lectures, etc.
- **Impliquez chacun** : Donnez des responsabilités

---

# FAQ et support

## Questions fréquentes

### Connexion et accès

**Q : J'ai oublié mon mot de passe**
R : Contactez votre Super Admin pour une réinitialisation. Il peut changer votre mot de passe depuis "Gestion des Accès".

**Q : Je ne vois pas certains menus**
R : C'est normal ! Les menus visibles dépendent de votre rôle. Chaque rôle a des accès spécifiques.

**Q : Quelle est la différence entre l'application principale et Events Church ?**
R : 
- **Application principale** : CRM (visiteurs, FI, fidélisation)
- **Events Church** : Gestion de projets et communication

---

### Visiteurs

**Q : Comment ajouter un ancien visiteur des années précédentes ?**
R : Utilisez la fonction "Anciens Visiteurs" avec un fichier Excel.

**Q : Peut-on supprimer un visiteur ?**
R : Non, pas de suppression. Vous pouvez "Arrêter le suivi" avec une raison.

**Q : Comment corriger une erreur sur un visiteur ?**
R : Cliquez sur le visiteur puis sur "Éditer" (selon vos permissions).

**Q : Qui peut voir mes commentaires ?**
R : Tous les utilisateurs ayant accès à ce visiteur (Super Admin, Responsable d'Église, autres référents selon config).

---

### Présences

**Q : J'ai oublié de marquer les présences du dimanche, puis-je le faire en retard ?**
R : Oui ! Vous pouvez marquer les présences de n'importe quelle date passée.

**Q : Peut-on modifier une présence déjà marquée ?**
R : Non, mais vous pouvez ajouter un commentaire pour expliquer.

**Q : Que signifie une case vide dans les présences ?**
R : Cela signifie qu'aucune information n'a été enregistrée pour cette date (ni présent, ni absent).

---

### Familles d'Impact

**Q : Combien de pilotes peut avoir une FI ?**
R : Une FI peut avoir plusieurs pilotes (co-pilotes).

**Q : Peut-on déplacer un membre d'une FI à une autre ?**
R : Non directement. Il faut le supprimer de la première FI et l'ajouter à la seconde.

**Q : Pourquoi certains membres ont "Source : nouveau_arrivant" ?**
R : Cela signifie qu'ils ont été affectés depuis la liste des visiteurs (et non ajoutés manuellement).

---

### Communication

**Q : Combien coûte un email ?**
R : Avec Brevo gratuit : 300 emails/jour gratuits. Au-delà, selon votre abonnement Brevo.

**Q : Combien coûte un SMS ?**
R : Environ 0.05€ par SMS en France. Les crédits sont achetés sur Brevo.

**Q : Pourquoi mes emails arrivent en spam ?**
R : Vérifiez :
- Le nom d'expéditeur est reconnaissable
- Le message n'est pas trop "commercial"
- Votre domaine email est bien configuré (SPF, DKIM)

**Q : Peut-on programmer l'envoi d'un email à une date future ?**
R : Non, pour l'instant l'envoi est immédiat.

**Q : Quelle est la différence entre Archiver et Supprimer une campagne ?**
R : 
- **Archiver** : Cache de la vue principale mais garde les données
- **Supprimer** : Efface définitivement (demande confirmation)

---

### Planning

**Q : Qui peut voir le planning des activités ?**
R : 
- Super Admin / Pasteur : Toutes les villes
- Responsable d'Église : Sa ville uniquement
- Gestion Projet : Toutes les villes

**Q : Peut-on imprimer le planning ?**
R : Utilisez Ctrl+P (Windows) ou Cmd+P (Mac) depuis la page pour imprimer.

**Q : Les activités passées sont-elles supprimées automatiquement ?**
R : Non, elles restent dans le tableau (avec la couleur rouge si non faites).

---

### Statistiques et Analytics

**Q : Comment est calculé le score de fidélisation ?**
R : Moyenne pondérée de 4 KPI :
- Présences Dimanche (40%)
- Présences Jeudi/EJP (20%)
- Présences FI (30%)
- Formations (10%)

**Q : Pourquoi mon score de fidélisation est 0% ?**
R : Cela signifie qu'il n'y a aucune présence enregistrée. Assurez-vous de marquer les présences chaque semaine.

**Q : Peut-on exporter les statistiques ?**
R : Oui, le Super Admin peut exporter toutes les données en JSON.

---

### Technique

**Q : Sur quels navigateurs l'application fonctionne-t-elle ?**
R : Chrome, Firefox, Safari, Edge (versions récentes). Chrome est recommandé.

**Q : L'application fonctionne-t-elle sur mobile ?**
R : Oui, l'application est responsive et fonctionne sur smartphone et tablette.

**Q : Y a-t-il une application mobile native ?**
R : Non, mais vous pouvez ajouter l'application à votre écran d'accueil (comme une app).

**Q : Les données sont-elles sauvegardées automatiquement ?**
R : Oui, toutes les données sont sauvegardées en temps réel dans la base de données.

**Q : Que faire en cas de bug ou d'erreur ?**
R : Contactez votre Super Admin avec :
- Description du problème
- Page où l'erreur s'est produite
- Actions effectuées avant l'erreur
- Capture d'écran si possible

---

## Glossaire

**Analytics** : Rapports et statistiques détaillées

**Box de contacts** : Groupe de contacts sauvegardés pour réutilisation

**Brevo** : Service d'envoi d'emails et SMS (ex-Sendinblue)

**CRUD** : Create, Read, Update, Delete (Créer, Lire, Modifier, Supprimer)

**EJP** : École de Jeudi des Prophètes (culte du jeudi)

**FI** : Famille d'Impact (cellule de maison)

**KPI** : Key Performance Indicator (Indicateur Clé de Performance)

**PCNC** : Programme Cours des Nouveaux Convertis

**Promo / Promotion** : Groupe de visiteurs arrivés le même mois

**RSVP** : Réponse S'il Vous Plaît (système de confirmation de présence)

**STAR** : Formation avancée

**Suivi arrêté** : Visiteur dont on ne fait plus le suivi actif

---

## Support

### Niveaux de support

**Niveau 1 - Auto-assistance** :
- Lire ce guide
- Consulter la FAQ

**Niveau 2 - Super Admin de votre église** :
- Questions sur l'utilisation
- Réinitialisation de mot de passe
- Création de comptes

**Niveau 3 - Support technique** :
- Bugs techniques
- Problèmes de performance
- Demandes de nouvelles fonctionnalités

---

## Bonnes pratiques

### Pour tous les utilisateurs

✅ **À FAIRE** :
- Marquer les présences chaque semaine
- Ajouter des commentaires utiles
- Vérifier les notifications régulièrement
- Utiliser des mots de passe forts
- Se déconnecter après utilisation (surtout sur ordinateur partagé)

❌ **À NE PAS FAIRE** :
- Partager son mot de passe
- Laisser sa session ouverte sur un ordinateur public
- Supprimer des données sans être sûr
- Ignorer les notifications importantes

### Pour les responsables

✅ **En plus** :
- Faire des rapports réguliers
- Encourager l'utilisation par les équipes
- Former les nouveaux utilisateurs
- Surveiller la qualité des données

---

## Conclusion

Cette application est un outil puissant pour gérer efficacement votre église. Utilisez-la régulièrement, explorez ses fonctionnalités, et n'hésitez pas à demander de l'aide en cas de besoin.

**L'objectif** : Mieux servir votre communauté grâce à un suivi organisé et des communications efficaces.

---

**Version du document** : 1.0  
**Date** : Novembre 2025  
**Application** : My Events Church  

---

*Ce guide sera mis à jour régulièrement avec les nouvelles fonctionnalités.*
