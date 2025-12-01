# 🔧 Correction des Stats Villes en Production

## Problème Identifié

Les stats villes affichent **des zéros en production** alors qu'elles fonctionnent en preview.

**Cause probable** : 
1. Les filtres de date sont trop stricts
2. La structure des données (format de `assigned_month` et `date`) peut différer entre preview et production
3. Les données en production peuvent ne pas correspondre exactement aux requêtes

---

## Solutions Appliquées

### 1. Filtres de Visiteurs Plus Flexibles

**Avant** :
```python
if mois:
    visitor_query["assigned_month"] = f"{annee}-{str(mois).zfill(2)}"
else:
    visitor_query["assigned_month"] = {"$regex": f"^{annee}-"}
```

**Après** :
```python
# Multiple patterns pour matcher différents formats
visitor_query["$or"] = [
    {"assigned_month": f"{annee}-{str(mois).zfill(2)}"},
    {"assigned_month": {"$regex": f"^{annee}-{str(mois).zfill(2)}"}},
    {"assigned_month": {"$regex": f"{annee}-{str(mois).zfill(2)}"}}
]
```

### 2. Filtres de Cultes Plus Flexibles

**Avant** :
```python
culte_query["date"] = {"$gte": date_filter_start, "$lt": date_filter_end}
```

**Après** :
```python
# Support string dates ET datetime objects
culte_query["$or"] = [
    {"date": {"$gte": date_filter_start, "$lt": date_filter_end}},
    {"date": {"$gte": datetime_obj_start, "$lt": datetime_obj_end}}
]
```

### 3. Endpoint de Diagnostic Ajouté

Nouvel endpoint : `GET /debug/data-structure?ville=Dijon`

**Utilisation** :
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://italian-church-app.emergent.host/api/debug/data-structure?ville=Dijon"
```

**Retourne** :
```json
{
  "ville": "Dijon",
  "visitors": {
    "count": 59,
    "sample": { ... },
    "assigned_months": ["2024-08", "2024-09", ...]
  },
  "cultes": {
    "count": 5,
    "sample": { ... },
    "dates": ["2025-11-03", ...]
  }
}
```

---

## Diagnostic en Production

### Étape 1 : Vérifier la Structure des Données

1. Connectez-vous à l'application en production
2. Appelez l'endpoint de diagnostic :
   ```bash
   curl -H "Authorization: Bearer TOKEN" \
     "https://italian-church-app.emergent.host/api/debug/data-structure?ville=VotreVille"
   ```

3. Vérifiez la réponse :
   - `visitors.count` : Nombre de visiteurs (doit être > 0)
   - `visitors.assigned_months` : Formats des mois assignés
   - `cultes.count` : Nombre de cultes (doit être > 0)
   - `cultes.dates` : Formats des dates

### Étape 2 : Identifier le Problème

**Si `visitors.count = 0` :**
- Les données n'ont pas été migrées vers production
- Vérifiez le `city` / `ville` name (case-sensitive)

**Si `assigned_months` a un format différent :**
- Exemple trouvé : `["2024-08", "2024-09,2025-09"]` (certains ont plusieurs mois)
- Le code géré maintenant avec `$or` et regex flexible

**Si `cultes.count = 0` :**
- Collection `culte_stats` vide en production
- Vérifiez le nom exact : `culte_stats` vs `cultes`

**Si `dates` ont un format datetime :**
- Le code supporte maintenant les deux formats (string et datetime)

### Étape 3 : Tester les Stats

1. Allez sur `/cities` en production
2. Cliquez sur une ville
3. Vérifiez que les stats s'affichent :
   - **Personnes Reçues** : Total, de passage, résident, etc.
   - **Statistiques Cultes** : Moy. Adultes, Enfants, Total Services
   - **Familles d'Impact** : Secteurs, Familles, Membres
   - **Évangélisation** : KPIs pour Église et FI

---

## Solutions Alternatives

### Si les Filtres Ne Fonctionnent Toujours Pas

**Option 1 : Désactiver les filtres temporairement**
```python
# Dans get_stats_pasteur, ligne ~2633
visitor_query = {"city": ville}  # Pas de filtre de date
```

**Option 2 : Revoir la structure de assigned_month**

Si certains visiteurs ont `assigned_month = "2024-08,2025-08"` (plusieurs mois), il faut :
```python
# Splitter et vérifier chaque mois
for visitor in visitors:
    months = visitor.get("assigned_month", "").split(",")
    if f"{annee}-{str(mois).zfill(2)}" in months:
        # Inclure ce visiteur
```

**Option 3 : Normaliser les dates en production**

Script de migration :
```python
# Normaliser assigned_month pour avoir un seul mois
for visitor in db.visitors.find():
    if "," in visitor.get("assigned_month", ""):
        first_month = visitor["assigned_month"].split(",")[0]
        db.visitors.update_one(
            {"id": visitor["id"]},
            {"$set": {"assigned_month": first_month}}
        )
```

---

## Checklist de Vérification

- [ ] Endpoint de diagnostic accessible : `/debug/data-structure`
- [ ] `visitors.count > 0` pour au moins une ville
- [ ] `cultes.count > 0` pour au moins une ville
- [ ] Format de `assigned_months` vérifié
- [ ] Format de `dates` vérifié
- [ ] Page `/cities` affiche des données (pas de zéros)
- [ ] Filtres Année/Mois fonctionnent
- [ ] Toutes les sections affichent des stats :
  - [ ] Personnes Reçues
  - [ ] Statistiques Cultes
  - [ ] Familles d'Impact
  - [ ] Évangélisation

---

## Contact et Support

Si le problème persiste :
1. Partagez la sortie de `/debug/data-structure`
2. Partagez une capture d'écran de la page `/cities`
3. Vérifiez les logs backend :
   ```bash
   kubectl logs -f deployment/italian-church-app
   ```

---

## Note sur "Gestion de Projet"

**Q : Pourquoi je ne vois pas "Gestion de Projet" quand je crée un accès ?**

**R : C'est normal !** Seul le **Super Admin** peut créer des comptes "Gestion de Projet".

**Vérifiez** :
1. Êtes-vous connecté en tant que `super_admin` ?
2. Le rôle apparaît dans le menu déroulant **uniquement pour super_admin**
3. Code : ligne 401-406 de `GestionAccesPage.jsx`

**Pour créer un compte Gestion de Projet** :
1. Connectez-vous avec le compte `superadmin`
2. Allez dans "Gestion d'Accès"
3. Cliquez sur "Nouvel Utilisateur"
4. Sélectionnez le rôle : **"Gestion de Projet"** (visible uniquement pour super_admin)
