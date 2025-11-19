# Migration des Pays des Villes

## Problème
Les villes italiennes affichent "France" au lieu de "Italie" en production.

## Solution
Un endpoint de migration a été créé pour mettre à jour automatiquement tous les pays des villes.

## Instructions pour exécuter la migration en PRODUCTION

### Option 1 : Via curl (Recommandé)

1. **Connectez-vous en tant que superadmin** et obtenez votre token :
```bash
curl -X POST "https://votre-url-production.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"votre_mot_de_passe","city":"Dijon"}'
```

2. **Copiez le token** retourné dans la réponse (champ `"token"`)

3. **Exécutez la migration** :
```bash
curl -X POST "https://votre-url-production.com/api/cities/migrate-countries" \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI"
```

4. **Vérifiez le résultat**. Vous devriez voir :
```json
{
  "success": true,
  "message": "X villes mises à jour",
  "updated_count": X
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
