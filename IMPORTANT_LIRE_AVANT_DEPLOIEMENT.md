# ⚠️ IMPORTANT - À LIRE AVANT DE DÉPLOYER

## 🔴 Problème actuel en production

Les villes ne s'affichent pas sur la page d'accueil car elles n'existent pas dans la base de données de production.

## ✅ Solution en 3 étapes

### Étape 1 : Déployer le code
Déployez normalement l'application sur Emergent.

### Étape 2 : Initialiser les villes (CRITIQUE)
Après le déploiement, exécutez cette commande **UNE SEULE FOIS** :

#### Option A : Via curl (Recommandé - Copier-coller dans le terminal)

```bash
# Remplacez VOTRE-URL et VOTRE_MOT_DE_PASSE
TOKEN=$(curl -s -X POST "https://VOTRE-URL.emergent.host/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"VOTRE_MOT_DE_PASSE","city":"Dijon"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))") && \
echo "Token obtenu: ${TOKEN:0:20}..." && \
curl -s -X POST "https://VOTRE-URL.emergent.host/api/cities/initialize" \
  -H "Authorization: Bearer $TOKEN"
```

#### Option B : Via script Python

```bash
# 1. Éditez le fichier init_cities_production.py
nano init_cities_production.py

# 2. Modifiez les lignes 9-11 avec vos informations
PRODUCTION_URL = "https://votre-url.emergent.host"
SUPERADMIN_PASSWORD = "votre_mot_de_passe"

# 3. Exécutez le script
python3 init_cities_production.py
```

#### Option C : Via Postman/Insomnia

1. **POST** `https://votre-url/api/auth/login`
   - Body JSON: 
   ```json
   {
     "username": "superadmin",
     "password": "votre_mot_de_passe",
     "city": "Dijon"
   }
   ```
   - Copiez le token de la réponse

2. **POST** `https://votre-url/api/cities/initialize`
   - Headers: `Authorization: Bearer VOTRE_TOKEN`

### Étape 3 : Vérifier
Allez sur votre URL de production et connectez-vous. Vous devriez maintenant voir toutes les villes.

---

## 📋 Villes créées automatiquement

### 🇮🇹 Villes d'Italie :
- Milan
- Rome  
- Perugia
- Bologne
- Turin

### 🇫🇷 Villes de France :
- Dijon
- Auxerre
- Besançon
- Chalon-Sur-Saone
- Dole
- Sens

---

## 🆘 En cas de problème

### Les villes ne s'affichent toujours pas ?

1. **Vérifiez que l'initialisation a fonctionné** :
   ```bash
   curl https://votre-url.emergent.host/api/cities
   ```
   Vous devriez voir la liste des villes avec leurs pays.

2. **Vérifiez les logs de la console du navigateur** (F12) :
   - Allez sur la page de sélection de ville
   - Ouvrez la console (F12 → Console)
   - Cherchez des erreurs en rouge

3. **Si aucune ville n'est retournée par l'API** :
   - Le endpoint d'initialisation n'a pas été exécuté
   - Ou vous n'êtes pas connecté en tant que superadmin
   - Exécutez à nouveau l'étape 2

### Erreur "Only super_admin can initialize cities" ?
- Vérifiez que vous utilisez le bon username/password
- Vérifiez que le compte est bien de rôle "super_admin"

---

## 📞 Support
Si le problème persiste après avoir suivi toutes ces étapes, contactez le support avec :
- Les logs de la console navigateur (F12)
- Le résultat de `curl https://votre-url/api/cities`
