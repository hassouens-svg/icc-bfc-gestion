# 🔐 IDENTIFIANTS ICC BFC-ITALIE - LISTE COMPLÈTE

## 📋 Date de mise à jour : 5 Novembre 2024

---

## 🔑 ACCÈS SPÉCIFIQUES (Pasteur & Super Admin)

**Page de connexion :** `/acces-specifiques`

### Super Administrateur 👑
- **Login :** `superadmin`
- **Mot de passe :** `superadmin123`
- **Ville :** Dijon
- **Rôle :** super_admin
- **Accès :** TOUT - Peut tout voir et tout modifier sur toutes les villes

### Pasteur ⛪
- **Login :** `pasteur`
- **Mot de passe :** `pasteur123`
- **Ville :** Dijon
- **Rôle :** pasteur
- **Accès :** TOUT - Lecture seule sur toutes les villes (Promotions + FI)

---

## 🔑 ACCÈS NORMAUX (Autres rôles)

**Page de connexion :** `/login`

### Superviseur Promotions 📊
- **Login :** `admin`
- **Mot de passe :** `admin123`
- **Ville :** Dijon
- **Rôle :** superviseur_promos
- **Accès :** Gestion complète des Promotions de sa ville uniquement

### Superviseur Familles d'Impact 💙
- **Login :** `superviseur_fi`
- **Mot de passe :** `superviseur123`
- **Ville :** Dijon
- **Rôle :** superviseur_fi
- **Accès :** Gestion complète des FI de sa ville uniquement

### Responsable de Promos 👥
- **Login :** `referent1`
- **Mot de passe :** `referent123`
- **Ville :** Dijon
- **Rôle :** referent
- **Mois assigné :** Janvier 2025 (2025-01)
- **Accès :** Gestion des visiteurs de son mois uniquement

### Pilote de Famille d'Impact 🎯
- **Login :** `pilote1`
- **Mot de passe :** `pilote123`
- **Ville :** Dijon
- **Rôle :** pilote_fi
- **FI assignée :** FI République Modifiée
- **Accès :** Gestion de sa FI uniquement (membres, présences)

### Responsable de Secteur 🗺️
- **Login :** `responsable_secteur1`
- **Mot de passe :** `resp123`
- **Ville :** Dijon
- **Rôle :** responsable_secteur
- **Secteur assigné :** Centre-ville Modifié
- **Accès :** Vue des FI de son secteur uniquement

### Accueil et Intégration 👋
- **Login :** `accueil1`
- **Mot de passe :** `accueil123`
- **Ville :** Dijon
- **Rôle :** accueil
- **Accès :** Lecture seule des nouveaux arrivants

### Promotions 📈
- **Login :** `promotions1`
- **Mot de passe :** `promo123`
- **Ville :** Dijon
- **Rôle :** promotions
- **Accès :** Vue complète Promotions de sa ville (tous les mois)

---

## 🏙️ VILLES DISPONIBLES

**Total : 8 villes**

### France (Bourgogne-Franche-Comté)
1. Dijon
2. Chalon-Sur-Saone
3. Besançon
4. Dole
5. Sens

### Italie
6. Milan
7. Perugia
8. Rome

**Note :** Aucun doublon. Chaque ville n'apparaît qu'une seule fois dans la base de données.

---

## 🎯 FLUX DE CONNEXION

### Pour Pasteur et Super Admin :
1. Aller sur `/acces-specifiques`
2. Entrer le login et mot de passe (TOUT EN MINUSCULES)
3. Cliquer "Se connecter"
4. → Redirection automatique vers `/select-ville`
5. Choisir "Toutes les villes" OU une ville spécifique
6. Choisir le département : "Promotions" OU "Familles d'Impact"
7. → Accès au dashboard complet

### Pour les autres rôles :
1. Aller sur `/login`
2. Sélectionner la ville : Dijon (ou autre)
3. Entrer le login et mot de passe (TOUT EN MINUSCULES)
4. Cliquer "Se connecter"
5. → Choisir le département approprié
6. → Accès au dashboard

---

## ⚠️ POINTS IMPORTANTS

1. **Tous les identifiants sont en MINUSCULES**
2. **Pas d'espaces avant/après les login/password**
3. **Tous les comptes ont été vérifiés et testés le 5 Novembre 2024**
4. **Tous les mots de passe ont été réinitialisés et sont fonctionnels**
5. **Aucun doublon de ville dans la base de données**

---

## 🧪 TESTS EFFECTUÉS

- ✅ Tous les 9 comptes testés avec succès (backend)
- ✅ Connexion Pasteur testée avec screenshot (frontend)
- ✅ Connexion Super Admin testée (backend)
- ✅ Vérification base de données : 8 villes uniques, 0 doublon
- ✅ Tous les mots de passe hashés correctement avec bcrypt
- ✅ Tous les rôles assignés correctement

---

## 📞 SUPPORT

Si un identifiant ne fonctionne pas :
1. Vérifier qu'il n'y a pas d'espaces
2. Vérifier que tout est en minuscules
3. Vider le cache du navigateur (Ctrl+Shift+R)
4. Vérifier la console JavaScript (F12) pour les erreurs
5. Utiliser le fichier de test : `/app/test_all_logins.py`

---

**Dernière vérification : 5 Novembre 2024, 03:25 UTC**
**Statut : ✅ TOUS LES IDENTIFIANTS FONCTIONNELS**
