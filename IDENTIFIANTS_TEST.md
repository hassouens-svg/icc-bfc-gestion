# 🔑 IDENTIFIANTS DES COMPTES DE TEST

**MOT DE PASSE UNIVERSEL: `test123`**

---

## 🔴 SUPER ADMIN

| Username | Mot de passe | Ville | Accès |
|----------|--------------|-------|-------|
| admin_test | test123 | Dijon | Multi-villes complet |

**Connexion:** `/acces-specifiques`

---

## 🟣 PASTEUR

| Username | Mot de passe | Ville | Accès |
|----------|--------------|-------|-------|
| pasteur_test | test123 | Dijon | Multi-villes (lecture seule) |

**Connexion:** `/acces-specifiques`

---

## 🔵 SUPERVISEURS PROMOTIONS

| Username | Mot de passe | Ville | Visiteurs visibles |
|----------|--------------|-------|-------------------|
| sup_promos_dijon | test123 | Dijon | ~23 visiteurs |
| sup_promos_chalon | test123 | Chalon-Sur-Saone | ~4 visiteurs |
| sup_promos_milan | test123 | Milan | ~5 visiteurs |

**Connexion:** `/login` → Sélectionner la ville

---

## 🟢 SUPERVISEURS FAMILLES D'IMPACT

| Username | Mot de passe | Ville | Secteurs gérés |
|----------|--------------|-------|----------------|
| sup_fi_dijon | test123 | Dijon | 3 secteurs, 6 FI |
| sup_fi_rome | test123 | Rome | 2 secteurs, 2 FI |

**Connexion:** `/login` → Sélectionner la ville

---

## 🟡 RESPONSABLES DE SECTEUR

| Username | Mot de passe | Ville | Secteur assigné |
|----------|--------------|-------|-----------------|
| resp_sect_dijon1 | test123 | Dijon | Centre-Ville Dijon |
| resp_sect_dijon2 | test123 | Dijon | Fontaine d'Ouche |
| resp_sect_milan | test123 | Milan | Milano Centro |

**Connexion:** `/login` → Sélectionner la ville

---

## 🟠 PILOTES DE FI

| Username | Mot de passe | Ville | FI assignée |
|----------|--------------|-------|-------------|
| pilote_dijon1 | test123 | Dijon | FI Centre-Ville Dijon A |
| pilote_dijon2 | test123 | Dijon | FI Centre-Ville Dijon B |
| pilote_chalon | test123 | Chalon-Sur-Saone | FI Centre Chalon |
| pilote_milan | test123 | Milan | FI Milano Centro |

**Connexion:** `/login` → Sélectionner la ville

---

## 🔴 RESPONSABLES PROMOS / REFERENTS

| Username | Mot de passe | Ville | Mois assigné | Visiteurs visibles |
|----------|--------------|-------|--------------|-------------------|
| referent_dijon_oct | test123 | Dijon | Oct 2024 | 5 visiteurs |
| referent_dijon_nov | test123 | Dijon | Nov 2024 | 6 visiteurs |
| referent_dijon_dec | test123 | Dijon | Dec 2024 | 7 visiteurs |
| referent_chalon_jan | test123 | Chalon-Sur-Saone | Jan 2025 | 4 visiteurs |
| referent_milan_feb | test123 | Milan | Feb 2025 | 5 visiteurs |

**Connexion:** `/login` → Sélectionner la ville → NE PAS sélectionner de département

---

## ⚪ ACCUEIL (LECTURE SEULE)

| Username | Mot de passe | Ville | Accès |
|----------|--------------|-------|-------|
| accueil_dijon | test123 | Dijon | Vue limitée visiteurs |
| accueil_rome | test123 | Rome | Vue limitée visiteurs |

**Connexion:** `/login` → Sélectionner la ville → Département: **Accueil & Intégration**

---

## 🟣 PROMOTIONS (VUE COMPLÈTE VILLE)

| Username | Mot de passe | Ville | Accès |
|----------|--------------|-------|-------|
| promos_dijon | test123 | Dijon | Tous les visiteurs de Dijon |
| promos_chalon | test123 | Chalon-Sur-Saone | Tous les visiteurs de Chalon |
| promos_milan | test123 | Milan | Tous les visiteurs de Milan |

**Connexion:** `/login` → Sélectionner la ville → Département: **Promotions**

---

## 📊 RÉCAPITULATIF PAR RÔLE

### Accès Multi-Villes:
- ✅ **Super Admin** (admin_test)
- ✅ **Pasteur** (pasteur_test)

### Accès Ville Unique:
- 🔵 **Superviseurs Promos** (3 comptes, 3 villes)
- 🟢 **Superviseurs FI** (2 comptes, 2 villes)
- 🟡 **Responsables Secteur** (3 comptes)
- 🟠 **Pilotes FI** (4 comptes)
- 🔴 **Referents** (5 comptes, 5 mois différents)
- ⚪ **Accueil** (2 comptes, lecture seule)
- 🟣 **Promotions** (3 comptes, vue complète)

---

## 🎯 TESTS RECOMMANDÉS

### Test 1: Isolation des mois (Referents)
```
Login: referent_dijon_oct / test123
Résultat attendu: 5 visiteurs d'Oct 2024 uniquement
```

### Test 2: Vue complète ville (Promotions)
```
Login: promos_dijon / test123 → Sélectionner "Promotions"
Résultat attendu: ~23 visiteurs de tous les mois
```

### Test 3: Vue limitée (Accueil)
```
Login: accueil_dijon / test123 → Sélectionner "Accueil & Intégration"
Résultat attendu: Liste en lecture seule, colonnes limitées
```

### Test 4: Multi-villes (Super Admin)
```
Login: admin_test / test123 via /acces-specifiques
Résultat attendu: Toutes les villes, tous les visiteurs (~35)
```

### Test 5: FI assignée (Pilote)
```
Login: pilote_dijon1 / test123
Résultat attendu: Membres de "FI Centre-Ville Dijon A" uniquement
```

---

## 🏙️ DONNÉES PAR VILLE

### Dijon:
- 3 Secteurs
- 6 Familles d'Impact
- ~23 Visiteurs (Oct, Nov, Dec 2024 + Jan 2025)
- 8 Utilisateurs test

### Chalon-Sur-Saone:
- 2 Secteurs
- 2 Familles d'Impact
- ~4 Visiteurs (Jan 2025)
- 3 Utilisateurs test

### Milan:
- 2 Secteurs
- 2 Familles d'Impact
- ~5 Visiteurs (Feb 2025)
- 3 Utilisateurs test

### Rome:
- 2 Secteurs
- 2 Familles d'Impact
- 0 Visiteurs
- 2 Utilisateurs test

### Autres villes:
- Besançon, Dole, Sens, Perugia
- Pas de données test (mais villes créées)

---

## ⚡ COMMANDES RAPIDES

### Créer les données de test:
```bash
python3 /app/CREATE_TEST_DATA.py
```

### Vérifier les utilisateurs:
```bash
# Via MongoDB
mongo test_database
db.users.count()
db.visitors.count()
db.familles_impact.count()
```

### Réinitialiser tout:
```bash
python3 /app/INIT_DATABASE_PRODUCTION.py
python3 /app/CREATE_TEST_DATA.py
```

---

## 📞 SUPPORT

Si un compte ne fonctionne pas:
1. Vérifier que `CREATE_TEST_DATA.py` a été lancé
2. Vérifier le mot de passe: `test123`
3. Vérifier la sélection de ville
4. Vérifier le département (pour Accueil et Promotions)

---

**Tous les comptes sont prêts! Bon test! 🚀**
