# 🧪 GUIDE DE TESTS COMPLET - ICC BFC-ITALIE

**Après avoir lancé `CREATE_TEST_DATA.py`**

---

## 🔑 COMPTES UTILISATEURS DE TEST

**Mot de passe pour TOUS les comptes: `test123`**

### 1. **Super Admin** 🔴
```
Username: admin_test
Ville: Dijon
```
**Ce qu'il peut faire:**
- ✅ Voir TOUTES les données de TOUTES les villes
- ✅ Gérer tous les utilisateurs (création, modification, suppression)
- ✅ Réinitialiser les mots de passe
- ✅ Gérer les villes
- ✅ Accès aux statistiques multi-villes (Promotions + FI)
- ✅ Dashboard Super Admin complet

**Pages à tester:**
- `/acces-specifiques` → Login
- `/dashboard-superadmin` → Vue complète multi-villes
- `/gestion-acces` → Gérer tous les utilisateurs
- `/cities` → Gérer les villes
- `/analytics` → Analytics multi-villes
- `/fidelisation/admin` → Fidélisation tous referents
- `/fi/stats/superviseur` → Stats FI multi-villes

---

### 2. **Pasteur** 🟣
```
Username: pasteur_test
Ville: Dijon
```
**Ce qu'il peut faire:**
- ✅ Voir TOUTES les données de TOUTES les villes (LECTURE SEULE)
- ✅ Accès aux statistiques multi-villes (Promotions + FI)
- ✅ Dashboard Pasteur complet
- ❌ Ne peut PAS modifier, créer ou supprimer

**Pages à tester:**
- `/acces-specifiques` → Login
- `/select-ville` → Sélectionner "Toutes les villes"
- `/dashboard-pasteur` → Vue complète multi-villes
- `/analytics` → Analytics multi-villes
- `/fidelisation/admin` → Fidélisation tous referents
- `/visiteurs` → Tous les visiteurs (lecture seule)

---

### 3. **Superviseurs Promotions** 🔵
```
sup_promos_dijon / test123 (Dijon)
sup_promos_chalon / test123 (Chalon-Sur-Saone)
sup_promos_milan / test123 (Milan)
```
**Ce qu'ils peuvent faire:**
- ✅ Voir les visiteurs de LEUR ville uniquement
- ✅ Créer/modifier/supprimer des visiteurs de leur ville
- ✅ Gérer les referents de leur ville
- ✅ Voir les stats de fidélisation de leur ville
- ✅ Créer des nouveaux referents
- ❌ Ne peuvent PAS voir les autres villes

**Pages à tester:**
- `/login` → Sélectionner leur ville
- `/dashboard` → Stats de leur ville uniquement
- `/visiteurs` → Visiteurs de leur ville
- `/referents` → Gérer les referents
- `/fidelisation/admin` → Fidélisation de leur ville
- `/analytics` → Analytics de leur ville

---

### 4. **Superviseurs Familles d'Impact** 🟢
```
sup_fi_dijon / test123 (Dijon)
sup_fi_rome / test123 (Rome)
```
**Ce qu'ils peuvent faire:**
- ✅ Gérer les secteurs de leur ville
- ✅ Gérer les Familles d'Impact de leur ville
- ✅ Voir les stats FI de leur ville
- ✅ Affecter des nouveaux arrivants aux FI
- ❌ Ne peuvent PAS voir les autres villes

**Pages à tester:**
- `/login` → Sélectionner leur ville
- `/secteurs` → Gérer les secteurs
- `/fi/admin` → Voir toutes les FI de la ville
- `/fi/stats/superviseur` → Stats FI de la ville
- `/fi/affectation` → Affecter visiteurs aux FI

---

### 5. **Responsables de Secteur** 🟡
```
resp_sect_dijon1 / test123 (Secteur Centre-Ville Dijon)
resp_sect_dijon2 / test123 (Secteur Fontaine d'Ouche)
resp_sect_milan / test123 (Secteur Milano Centro)
```
**Ce qu'ils peuvent faire:**
- ✅ Voir les FI de LEUR secteur uniquement
- ✅ Voir les membres de leurs FI
- ✅ Voir les stats de leurs FI
- ✅ Recevoir des notifications (FI stagnantes)
- ❌ Ne peuvent PAS modifier les FI

**Pages à tester:**
- `/login` → Sélectionner leur ville
- `/dashboard-responsable-secteur` → Dashboard de leur secteur
- `/fi/secteur/{secteur_id}` → FI de leur secteur

---

### 6. **Pilotes de FI** 🟠
```
pilote_dijon1 / test123 (FI Centre-Ville Dijon A)
pilote_dijon2 / test123 (FI Centre-Ville Dijon B)
pilote_chalon / test123 (FI Centre Chalon)
pilote_milan / test123 (FI Milano Centro)
```
**Ce qu'ils peuvent faire:**
- ✅ Voir les membres de LEUR FI uniquement
- ✅ Ajouter des membres à leur FI
- ✅ Supprimer des membres de leur FI
- ✅ Marquer les présences du jeudi
- ✅ Voir leur tableau de présences
- ✅ Recevoir des notifications (rappels jeudi)
- ❌ Ne peuvent PAS voir les autres FI

**Pages à tester:**
- `/login` → Sélectionner leur ville
- `/dashboard-pilote` → Dashboard de leur FI
- `/presences-fi` → Tableau des présences
- Notifications → Cliquer sur la cloche

---

### 7. **Responsables de Promotions / Referents** 🔴
```
referent_dijon_oct / test123 (Mois Oct 2024)
referent_dijon_nov / test123 (Mois Nov 2024)
referent_dijon_dec / test123 (Mois Dec 2024)
referent_chalon_jan / test123 (Mois Jan 2025)
referent_milan_feb / test123 (Mois Feb 2025)
```
**Ce qu'ils peuvent faire:**
- ✅ Voir les visiteurs de LEUR mois assigné uniquement
- ✅ Créer/modifier des visiteurs de leur mois
- ✅ Voir leurs propres stats de fidélisation
- ❌ Ne peuvent PAS voir les autres mois

**Pages à tester:**
- `/login` → Sélectionner leur ville
- `/visiteurs` → Visiteurs de leur mois uniquement
- `/fidelisation` → Leurs stats personnelles
- `/stopped-visitors` → Visiteurs arrêtés de leur mois

**TEST IMPORTANT:**
- Login avec `referent_dijon_oct` → Ne doit voir QUE les 5 visiteurs d'Oct 2024
- Login avec `referent_dijon_nov` → Ne doit voir QUE les 6 visiteurs de Nov 2024

---

### 8. **Accueil** ⚪
```
accueil_dijon / test123 (Dijon)
accueil_rome / test123 (Rome)
```
**Ce qu'ils peuvent faire:**
- ✅ Voir les visiteurs de leur ville (LECTURE SEULE)
- ✅ Vue limitée (seulement nom, prénom, canal d'arrivée)
- ❌ Ne peuvent PAS créer, modifier ou supprimer

**Pages à tester:**
- `/login` → Sélectionner leur ville
- Sélectionner département → **Accueil & Intégration**
- `/visiteurs` → Vue limitée en lecture seule

---

### 9. **Promotions** 🟣
```
promos_dijon / test123 (Dijon)
promos_chalon / test123 (Chalon-Sur-Saone)
promos_milan / test123 (Milan)
```
**Ce qu'ils peuvent faire:**
- ✅ Voir TOUS les visiteurs de leur ville (tous les mois)
- ✅ Créer/modifier/supprimer des visiteurs
- ✅ Voir les stats complètes de leur ville
- ❌ Ne peuvent PAS voir les autres villes

**Pages à tester:**
- `/login` → Sélectionner leur ville
- Sélectionner département → **Promotions**
- `/visiteurs` → Tous les visiteurs de la ville
- `/analytics` → Stats de leur ville
- `/fidelisation/admin` → Fidélisation de tous les referents

---

## 🧪 SCÉNARIOS DE TEST PAR FONCTIONNALITÉ

### ✅ **1. AUTHENTIFICATION & DÉPARTEMENTS**

**Test 1.1: Login Standard**
1. Aller sur `/login`
2. Sélectionner ville: Dijon
3. Username: `referent_dijon_oct` / Password: `test123`
4. ✅ Devrait rediriger vers sélection de département
5. NE PAS sélectionner de département, cliquer "Continuer"
6. ✅ Devrait aller au dashboard et ne voir QUE les visiteurs d'Oct 2024

**Test 1.2: Login avec Département Promotions**
1. Login avec `referent_dijon_nov` / `test123`
2. Sélectionner département: **Promotions**
3. ✅ Devrait voir TOUS les visiteurs de Dijon (pas seulement Nov)

**Test 1.3: Login Accueil (Vue limitée)**
1. Login avec `accueil_dijon` / `test123`
2. Sélectionner département: **Accueil & Intégration**
3. Aller sur `/visiteurs`
4. ✅ Devrait voir une vue limitée (seulement nom, prénom, canal)
5. ✅ Pas de boutons de modification

**Test 1.4: Accès Spécifiques (Super Admin / Pasteur)**
1. Aller sur `/acces-specifiques`
2. Login avec `admin_test` / `test123`
3. ✅ Devrait rediriger directement vers `/dashboard-superadmin`

---

### ✅ **2. GESTION DES VISITEURS (PROMOTIONS)**

**Test 2.1: Referent - Filtre par mois assigné**
1. Login: `referent_dijon_oct` (SANS département)
2. Aller sur `/visiteurs`
3. ✅ Doit voir exactement 5 visiteurs (Oct 2024)
4. Logout et login avec `referent_dijon_nov`
5. ✅ Doit voir exactement 6 visiteurs (Nov 2024)

**Test 2.2: Créer un visiteur**
1. Login: `sup_promos_dijon`
2. Aller sur `/visiteurs`
3. Cliquer "Ajouter un visiteur"
4. Remplir le formulaire
5. ✅ Le visiteur devrait apparaître dans la liste

**Test 2.3: Modifier un visiteur**
1. Login: `promos_dijon`
2. Sélectionner un visiteur
3. Modifier ses informations
4. ✅ Les modifications devraient être sauvegardées

**Test 2.4: Visiteurs arrêtés**
1. Login: `referent_dijon_oct`
2. Aller sur `/stopped-visitors`
3. ✅ Voir les visiteurs qui ne viennent plus

---

### ✅ **3. FIDÉLISATION**

**Test 3.1: Vue Referent (personnelle)**
1. Login: `referent_dijon_oct`
2. Aller sur `/fidelisation`
3. ✅ Doit voir SES propres stats de fidélisation
4. ✅ Graphique par semaine
5. ✅ Moyenne mensuelle

**Test 3.2: Vue Admin (tous les referents)**
1. Login: `sup_promos_dijon`
2. Aller sur `/fidelisation/admin`
3. ✅ Doit voir les stats de TOUS les referents de Dijon
4. ✅ Tableau avec taux de fidélisation par referent

**Test 3.3: Timeline 2025-2030**
1. Login: `sup_promos_dijon`
2. Aller sur `/fidelisation/admin`
3. Changer le filtre de mois
4. ✅ Devrait avoir des mois jusqu'à Décembre 2030

**Test 3.4: Multi-villes (Pasteur)**
1. Login: `pasteur_test` (via accès spécifiques)
2. Sélectionner "Toutes les villes"
3. Aller sur `/fidelisation/admin`
4. ✅ Doit voir les referents de TOUTES les villes

---

### ✅ **4. FAMILLES D'IMPACT**

**Test 4.1: Superviseur FI - Gérer secteurs**
1. Login: `sup_fi_dijon`
2. Aller sur `/secteurs`
3. ✅ Voir les 3 secteurs de Dijon
4. Créer un nouveau secteur
5. Modifier un secteur existant
6. ✅ Changements sauvegardés

**Test 4.2: Voir les FI d'un secteur**
1. Login: `sup_fi_dijon`
2. Aller sur `/secteurs`
3. Cliquer sur "Centre-Ville Dijon"
4. ✅ Voir les 2 FI du secteur

**Test 4.3: Pilote FI - Dashboard**
1. Login: `pilote_dijon1`
2. Aller sur `/dashboard-pilote`
3. ✅ Voir les membres de SA FI uniquement
4. ✅ Bouton "Ajouter un membre"
5. ✅ Stats de présence

**Test 4.4: Marquer les présences**
1. Login: `pilote_dijon1`
2. Aller sur `/dashboard-pilote`
3. Cocher les présences du jeudi
4. Cliquer "Enregistrer les présences"
5. ✅ Présences sauvegardées

**Test 4.5: Tableau des présences**
1. Login: `pilote_dijon1`
2. Aller sur `/presences-fi`
3. ✅ Voir le tableau avec tous les membres
4. ✅ Historique des présences par date
5. ✅ Taux de fidélisation calculé

**Test 4.6: Responsable de Secteur**
1. Login: `resp_sect_dijon1`
2. Aller sur `/dashboard-responsable-secteur`
3. ✅ Voir toutes les FI de SON secteur
4. ✅ Stats agrégées du secteur

**Test 4.7: Affecter des visiteurs aux FI**
1. Login: `sup_fi_dijon`
2. Aller sur `/fi/affectation`
3. Sélectionner des "nouveaux arrivants"
4. Les affecter à une FI
5. ✅ Visiteur devient membre de la FI

---

### ✅ **5. ANALYTICS & STATISTIQUES**

**Test 5.1: Analytics par ville (Superviseur)**
1. Login: `sup_promos_dijon`
2. Aller sur `/analytics`
3. ✅ Stats de Dijon uniquement
4. ✅ Graphiques par canal d'arrivée
5. ✅ Évolution temporelle

**Test 5.2: Analytics multi-villes (Super Admin)**
1. Login: `admin_test`
2. Aller sur `/dashboard-superadmin`
3. Filtrer par ville: "Toutes les villes"
4. ✅ Voir les stats de TOUTES les villes
5. Filtrer par département: "Promotions" / "Familles d'Impact"
6. ✅ Stats filtrées correctement

**Test 5.3: Analytics multi-villes (Pasteur)**
1. Login: `pasteur_test`
2. Sélectionner "Toutes les villes"
3. Aller sur `/dashboard-pasteur`
4. ✅ Voir les KPIs multi-villes
5. ✅ Graphiques agrégés

---

### ✅ **6. GESTION DES UTILISATEURS**

**Test 6.1: Créer un utilisateur (Super Admin)**
1. Login: `admin_test`
2. Aller sur `/gestion-acces`
3. Cliquer "Ajouter un utilisateur"
4. Remplir le formulaire
5. ✅ Utilisateur créé

**Test 6.2: Modifier un utilisateur**
1. Login: `admin_test`
2. Aller sur `/gestion-acces`
3. Cliquer sur l'icône "Éditer" d'un utilisateur
4. Modifier le username
5. Pour un Pilote FI: Assigner une FI
6. Pour un Responsable Secteur: Assigner un secteur
7. ✅ Modifications sauvegardées

**Test 6.3: Réinitialiser un mot de passe**
1. Login: `admin_test`
2. Aller sur `/gestion-acces`
3. Cliquer sur l'icône "Clé" d'un utilisateur
4. Entrer un nouveau mot de passe
5. ✅ Mot de passe réinitialisé
6. Tester le login avec le nouveau mot de passe

**Test 6.4: Créer un referent (Superviseur)**
1. Login: `sup_promos_dijon`
2. Aller sur `/referents`
3. Cliquer "Créer un nouveau responsable"
4. Remplir le formulaire avec un mois assigné
5. ✅ Referent créé

**Test 6.5: Gérer les membres d'équipe (Superviseur)**
1. Login: `sup_promos_dijon`
2. Aller sur `/referents`
3. Cliquer "Gérer" sur un referent
4. Modifier le mois assigné
5. ✅ Changement sauvegardé

---

### ✅ **7. NOTIFICATIONS**

**Test 7.1: Badge de notifications**
1. Login avec n'importe quel utilisateur
2. Regarder l'icône de cloche en haut à droite
3. ✅ Badge avec nombre de notifications non lues

**Test 7.2: Voir les notifications**
1. Cliquer sur la cloche
2. ✅ Popover avec liste des notifications
3. ✅ Timestamp et message

**Test 7.3: Marquer comme lu**
1. Cliquer sur une notification non lue
2. ✅ Notification marquée comme lue
3. ✅ Badge mis à jour

**Test 7.4: Génération automatique (Superviseur)**
1. Login: `sup_promos_dijon`
2. Aller sur `/notifications` ou dashboard
3. Cliquer sur "Générer les notifications"
4. ✅ Notifications créées pour les pilotes et responsables

---

### ✅ **8. GESTION DES VILLES**

**Test 8.1: Voir les villes (Super Admin)**
1. Login: `admin_test`
2. Aller sur `/cities`
3. ✅ Voir les 8 villes (Dijon, Chalon, Besançon, Dole, Sens, Milan, Perugia, Rome)

**Test 8.2: Créer une ville**
1. Login: `admin_test`
2. Aller sur `/cities`
3. Cliquer "Ajouter une ville"
4. Nom: "Lyon"
5. ✅ Ville créée

**Test 8.3: Modifier une ville**
1. Cliquer sur une ville
2. Modifier le nom
3. ✅ Changement sauvegardé

**Test 8.4: Supprimer une ville**
1. Cliquer sur l'icône de suppression
2. Confirmer
3. ✅ Ville supprimée

---

### ✅ **9. ENREGISTREMENT PUBLIC**

**Test 9.1: Formulaire d'inscription**
1. Aller sur `/register`
2. Remplir tous les champs
3. ✅ Message de succès
4. ✅ Redirection vers la page d'accueil

**Test 9.2: Vérifier l'enregistrement**
1. Login avec `sup_promos_dijon`
2. Aller sur `/visiteurs`
3. ✅ Le visiteur enregistré devrait apparaître

---

### ✅ **10. DASHBOARDS SPÉCIFIQUES**

**Test 10.1: Dashboard Super Admin**
1. Login: `admin_test`
2. ✅ Vue complète avec KPIs Promos et FI
3. ✅ Filtres Ville et Département
4. ✅ Boutons d'actions rapides

**Test 10.2: Dashboard Pasteur**
1. Login: `pasteur_test`
2. Sélectionner "Toutes les villes"
3. ✅ Vue identique au Super Admin mais lecture seule
4. ✅ Pas de boutons de gestion

**Test 10.3: Dashboard Superviseur Promos**
1. Login: `sup_promos_dijon`
2. ✅ Stats de Dijon uniquement
3. ✅ KPIs promotions

**Test 10.4: Dashboard Pilote FI**
1. Login: `pilote_dijon1`
2. ✅ Liste des membres de SA FI
3. ✅ Cocher les présences
4. ✅ Bouton "Ajouter un membre"

---

## 🎯 TESTS D'ACCÈS (PERMISSIONS)

### **Test Permission 1: Isolation des villes**
1. Login: `sup_promos_dijon`
2. ✅ Ne doit voir QUE les données de Dijon
3. Login: `sup_promos_milan`
4. ✅ Ne doit voir QUE les données de Milan

### **Test Permission 2: Accueil lecture seule**
1. Login: `accueil_dijon`
2. Essayer de créer un visiteur
3. ✅ Bouton "Ajouter" ne devrait PAS être visible
4. Essayer de modifier un visiteur
5. ✅ Bouton "Modifier" ne devrait PAS être visible

### **Test Permission 3: Réinitialisation mot de passe (Super Admin only)**
1. Login: `sup_promos_dijon`
2. Aller sur `/referents`
3. ✅ Icône de clé (reset password) ne devrait PAS être visible
4. Logout et login avec `admin_test`
5. Aller sur `/gestion-acces`
6. ✅ Icône de clé devrait être visible

### **Test Permission 4: Multi-villes (Pasteur & Super Admin)**
1. Login: `pasteur_test`
2. ✅ Option "Toutes les villes" disponible
3. Sélectionner et voir données multi-villes ✅
4. Logout et login avec `sup_promos_dijon`
5. ✅ PAS d'option "Toutes les villes"

---

## 📊 RÉSUMÉ DES DONNÉES DE TEST

Après `CREATE_TEST_DATA.py`, vous aurez:

### Utilisateurs (25 comptes):
- 1 Super Admin
- 1 Pasteur
- 3 Superviseurs Promos (Dijon, Chalon, Milan)
- 2 Superviseurs FI (Dijon, Rome)
- 3 Responsables de Secteur (Dijon x2, Milan)
- 4 Pilotes FI (Dijon x2, Chalon, Milan)
- 5 Referents (Oct, Nov, Dec à Dijon; Jan à Chalon; Feb à Milan)
- 2 Accueil (Dijon, Rome)
- 3 Promotions (Dijon, Chalon, Milan)

### Données:
- 9 Secteurs (Dijon x3, Chalon x2, Milan x2, Rome x2)
- 14 Familles d'Impact réparties dans 4 villes
- ~35 Visiteurs répartis sur Oct 2024 - Feb 2025
- ~13 Membres dans les FI
- ~40 Présences enregistrées

---

## 🚀 COMMENT LANCER LES TESTS

### 1. Créer les données:
```bash
python3 /app/CREATE_TEST_DATA.py
```

### 2. Tester méthodiquement:
- Commencer par les tests d'authentification
- Tester chaque rôle un par un
- Vérifier les permissions
- Tester les fonctionnalités avancées

### 3. Noter les bugs:
Si vous trouvez un problème, notez:
- Le compte utilisé
- La page/URL
- L'action effectuée
- Le résultat attendu vs obtenu

---

## ✅ CHECKLIST COMPLÈTE

### Authentification:
- [ ] Login standard
- [ ] Login avec département
- [ ] Accès spécifiques
- [ ] Logout

### Visiteurs:
- [ ] Liste filtrée par rôle
- [ ] Créer un visiteur
- [ ] Modifier un visiteur
- [ ] Supprimer un visiteur
- [ ] Visiteurs arrêtés

### Fidélisation:
- [ ] Vue referent (personnelle)
- [ ] Vue admin (tous)
- [ ] Timeline 2025-2030
- [ ] Graphiques

### Familles d'Impact:
- [ ] Créer/modifier secteur
- [ ] Créer/modifier FI
- [ ] Ajouter membre FI
- [ ] Marquer présences
- [ ] Tableau présences
- [ ] Affecter visiteurs

### Analytics:
- [ ] Stats par ville
- [ ] Stats multi-villes
- [ ] Graphiques

### Utilisateurs:
- [ ] Créer utilisateur
- [ ] Modifier utilisateur
- [ ] Reset password
- [ ] Assigner FI/Secteur

### Villes:
- [ ] Liste villes
- [ ] Créer ville
- [ ] Modifier ville
- [ ] Supprimer ville

### Notifications:
- [ ] Badge affiché
- [ ] Liste notifications
- [ ] Marquer comme lu
- [ ] Génération auto

### Dashboards:
- [ ] Super Admin
- [ ] Pasteur
- [ ] Superviseur
- [ ] Pilote FI
- [ ] Responsable Secteur

---

**Bon test! 🎯**
