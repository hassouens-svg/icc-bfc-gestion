# 🚀 INSTRUCTIONS APRÈS DÉPLOIEMENT - ICC BFC-ITALIE

## ⚠️ IMPORTANT : À LIRE ET SUIVRE OBLIGATOIREMENT

---

## 🔴 PROBLÈME IDENTIFIÉ

Après le déploiement, vous avez constaté :
- ❌ Aucun identifiant ne fonctionne
- ❌ Deux "Dijon" apparaissent
- ❌ Les données de preview ne sont pas présentes

### CAUSE :
**Le déploiement crée une NOUVELLE base de données VIDE ou avec de vieilles données.**

Les données MongoDB de l'environnement preview **NE SONT PAS** automatiquement transférées lors du déploiement.

---

## ✅ SOLUTION : Initialiser la Base de Données

### Étape 1 : Accéder au Terminal

Après le déploiement, accédez au terminal de votre nouveau site via :
- Emergent Dashboard → Votre projet → Terminal
- OU via SSH si configuré

### Étape 2 : Lancer le Script d'Initialisation

```bash
cd /app
python3 INIT_DATABASE_PRODUCTION.py
```

### Étape 3 : Vérifier les Résultats

Le script va :
1. ✅ Supprimer TOUTES les villes existantes (élimine les doublons)
2. ✅ Supprimer TOUS les utilisateurs existants (pour recréer proprement)
3. ✅ Créer 8 villes UNIQUES (pas de doublon)
4. ✅ Créer 9 utilisateurs avec mots de passe corrects
5. ✅ Tester tous les mots de passe

**Résultat attendu :**
```
================================================================================
INITIALISATION TERMINÉE AVEC SUCCÈS ✅
================================================================================

Vous pouvez maintenant vous connecter avec:
  - superadmin / superadmin123 (/acces-specifiques)
  - pasteur / pasteur123 (/acces-specifiques)
  - admin / admin123 (/login → Dijon)
```

---

## 🧪 Étape 4 : Tests de Vérification

### Test 1 : Vérifier les Villes
```bash
cd /app
python3 -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

async def check():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    cities = await db.cities.find({}, {'_id': 0, 'name': 1}).to_list(length=None)
    city_names = [c['name'] for c in cities]
    
    print(f'Total villes: {len(cities)}')
    print(f'Villes: {sorted(city_names)}')
    
    # Vérifier doublons
    duplicates = [name for name in city_names if city_names.count(name) > 1]
    if duplicates:
        print(f'⚠️  DOUBLONS: {set(duplicates)}')
    else:
        print('✅ Aucun doublon')
    
    client.close()

asyncio.run(check())
"
```

### Test 2 : Tester un Login
```bash
curl -X POST https://votre-site.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","city":"Dijon"}'
```

**Résultat attendu :**
```json
{
  "token": "eyJ...",
  "user": {
    "username": "admin",
    "role": "superviseur_promos",
    "city": "Dijon"
  }
}
```

### Test 3 : Vérifier les Villes via API
```bash
curl https://votre-site.com/api/cities
```

**Résultat attendu :**
```json
[
  {"id": "...", "name": "Besançon"},
  {"id": "...", "name": "Chalon-Sur-Saone"},
  {"id": "...", "name": "Dijon"},
  {"id": "...", "name": "Dole"},
  {"id": "...", "name": "Milan"},
  {"id": "...", "name": "Perugia"},
  {"id": "...", "name": "Rome"},
  {"id": "...", "name": "Sens"}
]
```

**Total : 8 villes, PAS DE DOUBLON**

---

## 🎯 Étape 5 : Test Manuel dans le Navigateur

### Test Accès Spécifiques
1. Aller sur : `https://votre-site.com/acces-specifiques`
2. Login : `pasteur`
3. Password : `pasteur123`
4. Cliquer "Se connecter"
5. ✅ Devrait afficher "Connexion réussie!" et rediriger vers `/select-ville`
6. ✅ Devrait voir 9 cartes : **1 "Toutes les villes" + 8 villes individuelles**
7. ✅ **UN SEUL "Dijon"** dans la liste

### Test Login Normal
1. Aller sur : `https://votre-site.com/login`
2. Sélectionner ville : **Dijon**
3. Login : `admin`
4. Password : `admin123`
5. Cliquer "Se connecter"
6. ✅ Devrait afficher "Connexion réussie!"
7. Choisir département : "Promotions"
8. ✅ Accès au dashboard

---

## 📋 Liste Complète des Identifiants

### ACCÈS SPÉCIFIQUES (`/acces-specifiques`)
- **Super Admin** : `superadmin` / `superadmin123`
- **Pasteur** : `pasteur` / `pasteur123`

### LOGIN NORMAL (`/login` → Ville: Dijon)
- **Superviseur Promos** : `admin` / `admin123`
- **Superviseur FI** : `superviseur_fi` / `superviseur123`
- **Responsable Promos** : `referent1` / `referent123`
- **Pilote FI** : `pilote1` / `pilote123`
- **Resp. Secteur** : `responsable_secteur1` / `resp123`
- **Accueil** : `accueil1` / `accueil123`
- **Promotions** : `promotions1` / `promo123`

---

## 🔄 En Cas de Problème

### Si les identifiants ne fonctionnent toujours pas :

1. **Vérifier les services** :
```bash
sudo supervisorctl status
```

2. **Redémarrer le backend** :
```bash
sudo supervisorctl restart backend
```

3. **Vérifier les logs backend** :
```bash
tail -50 /var/log/supervisor/backend.err.log
```

4. **Relancer l'initialisation** :
```bash
cd /app
python3 INIT_DATABASE_PRODUCTION.py
```

### Si vous voyez encore deux Dijon :

1. **Vérifier la base MongoDB** :
```bash
cd /app
python3 -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

async def fix():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    # Supprimer TOUTES les villes
    result = await db.cities.delete_many({})
    print(f'Supprimé {result.deleted_count} villes')
    
    # Recréer proprement
    import uuid
    cities = [
        {'id': str(uuid.uuid4()), 'name': 'Dijon'},
        {'id': str(uuid.uuid4()), 'name': 'Chalon-Sur-Saone'},
        {'id': str(uuid.uuid4()), 'name': 'Besançon'},
        {'id': str(uuid.uuid4()), 'name': 'Dole'},
        {'id': str(uuid.uuid4()), 'name': 'Sens'},
        {'id': str(uuid.uuid4()), 'name': 'Milan'},
        {'id': str(uuid.uuid4()), 'name': 'Perugia'},
        {'id': str(uuid.uuid4()), 'name': 'Rome'},
    ]
    await db.cities.insert_many(cities)
    print(f'Créé {len(cities)} villes uniques')
    
    client.close()

asyncio.run(fix())
"
```

2. **Vider le cache du navigateur** : Ctrl+Shift+R

---

## 📞 Support

Si le problème persiste après avoir suivi TOUTES ces étapes :
1. Vérifier que le script `INIT_DATABASE_PRODUCTION.py` s'est bien exécuté sans erreur
2. Vérifier les logs backend pour voir les erreurs
3. Contacter le support Emergent avec les logs

---

## ✅ Checklist Finale

Après avoir suivi toutes les étapes, vous devriez avoir :

- ✅ 8 villes dans la base de données (0 doublon)
- ✅ 9 utilisateurs créés avec mots de passe corrects
- ✅ Tous les identifiants fonctionnent
- ✅ Page de sélection de ville affiche 9 cartes (1 "Toutes" + 8 villes)
- ✅ UN SEUL "Dijon" visible
- ✅ Connexion Pasteur/Admin fonctionne
- ✅ Dashboards accessibles

---

**🎉 VOTRE APPLICATION EST MAINTENANT OPÉRATIONNELLE !**
