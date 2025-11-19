# Initialisation et Migration des Villes

## Problème
1. Les villes ne s'affichent pas sur la page d'accueil en production
2. Les villes italiennes affichent "France" au lieu de "Italie"

## Solution
Un endpoint d'initialisation a été créé qui :
- Crée automatiquement toutes les villes si elles n'existent pas
- Met à jour les pays des villes existantes

## ⚠️ INSTRUCTIONS CRITIQUES POUR LA PRODUCTION

### 🚀 COMMANDE UNIQUE À EXÉCUTER (Recommandé)

Copiez-collez cette commande dans votre terminal (remplacez l'URL et le mot de passe) :

```bash
# Commande tout-en-un (remplacez VOTRE-URL et VOTRE_MOT_DE_PASSE)
TOKEN=$(curl -s -X POST "https://VOTRE-URL.emergent.host/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"VOTRE_MOT_DE_PASSE","city":"Dijon"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))") && \
curl -s -X POST "https://VOTRE-URL.emergent.host/api/cities/initialize" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

**Résultat attendu** :
```json
{
  "success": true,
  "message": "X villes créées, Y villes mises à jour",
  "created_count": X,
  "updated_count": Y,
  "total_cities": Z
}
```

### Option 2 : Via Postman/Insomnia

1. **Login** :
   - URL : `POST https://votre-url-production.com/api/auth/login`
   - Body (JSON) :
   ```json
   {
     "username": "superadmin",
     "password": "votre_mot_de_passe",
     "city": "Dijon"
   }
   ```
   - Copiez le token de la réponse

2. **Migration** :
   - URL : `POST https://votre-url-production.com/api/cities/migrate-countries`
   - Headers : `Authorization: Bearer VOTRE_TOKEN`
   - Pas de body nécessaire

### Option 3 : Via MongoDB directement (Si vous avez accès)

```javascript
// Connectez-vous à votre base MongoDB de production
use votre_base_de_donnees;

// Mettez à jour les villes italiennes
db.cities.updateMany(
  { name: { $in: ['Milan', 'Rome', 'Perugia', 'Bologne', 'Turin'] } },
  { $set: { country: 'Italie' } }
);

// Mettez à jour les villes françaises
db.cities.updateMany(
  { name: { $in: ['Dijon', 'Auxerre', 'Besançon', 'Chalon-Sur-Saone', 'Chalon-sur-Saone', 'Dole', 'Sens'] } },
  { $set: { country: 'France' } }
);

// Vérifiez le résultat
db.cities.find({}, { name: 1, country: 1 }).pretty();
```

## Villes mises à jour

### Villes d'Italie :
- Milan → Italie
- Rome → Italie
- Perugia → Italie
- Bologne → Italie
- Turin → Italie

### Villes de France :
- Dijon → France
- Auxerre → France
- Besançon → France
- Chalon-Sur-Saone → France
- Chalon-sur-Saone → France
- Dole → France
- Sens → France

## Vérification

Après la migration, vérifiez que les villes affichent le bon pays :
```bash
curl "https://votre-url-production.com/api/cities"
```

Vous devriez voir chaque ville avec son champ `"country"` correctement défini.

## Note importante

- Cet endpoint nécessite les droits **super_admin**
- La migration peut être exécutée plusieurs fois sans problème (elle met à jour uniquement les villes qui existent)
- Après la migration, les changements sont immédiats (pas besoin de redéployer)
