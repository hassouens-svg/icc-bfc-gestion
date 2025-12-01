# 🚀 Guide de Déploiement - My Event Church / ICC BFC-ITALIE

## Prérequis

- MongoDB Atlas cluster configuré
- Compte Emergen pour le déploiement
- Variables d'environnement configurées

---

## ⚙️ Configuration des Variables d'Environnement

### Backend (REQUIS)

Les variables suivantes DOIVENT être configurées dans Emergent Secrets avant le déploiement :

```bash
# MongoDB (OBLIGATOIRE)
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=your_database_name

# Sécurité (OBLIGATOIRE)
SECRET_KEY=your-very-secure-random-key-min-32-characters

# CORS (OBLIGATOIRE)
CORS_ORIGINS=https://italian-church-app.emergent.host

# URLs (OBLIGATOIRE)
REACT_APP_BACKEND_URL=https://italian-church-app.emergent.host
FRONTEND_URL=https://italian-church-app.emergent.host

# Email via Brevo (OPTIONNEL)
BREVO_API_KEY=xkeysib-your-api-key
SENDER_EMAIL=noreply@yourdomain.com
SENDER_NAME=ICC BFC-ITALIE
BREVO_SMS_SENDER=ICC
```

### Frontend (REQUIS)

```bash
# Backend API URL (OBLIGATOIRE)
REACT_APP_BACKEND_URL=https://italian-church-app.emergent.host

# WebSocket (développement uniquement)
WDS_SOCKET_PORT=0
```

---

## 🔐 Génération de SECRET_KEY Sécurisée

Utilisez cette commande pour générer une clé secrète forte :

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 📦 Configuration MongoDB Atlas

1. Créez un cluster MongoDB Atlas sur [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Créez une base de données (ex: `icc_bfc_italie_prod`)
3. Créez un utilisateur avec droits lecture/écriture
4. Ajoutez votre IP (ou 0.0.0.0/0 pour tout autoriser)
5. Copiez votre connection string :
   ```
   mongodb+srv://username:password@cluster.mongodb.net/
   ```

---

## 🚀 Déploiement sur Emergent

### Étape 1 : Configurer les Secrets

Dans l'interface Emergent, allez dans **Settings → Secrets** et ajoutez :

```
MONGO_URL=mongodb+srv://...
DB_NAME=icc_bfc_italie_prod
SECRET_KEY=<généré avec la commande ci-dessus>
CORS_ORIGINS=https://italian-church-app.emergent.host
REACT_APP_BACKEND_URL=https://italian-church-app.emergent.host
FRONTEND_URL=https://italian-church-app.emergent.host
```

### Étape 2 : Déployer

1. Commitez vos changements :
   ```bash
   git add .
   git commit -m "Prepare for production deployment"
   git push
   ```

2. Dans Emergent, cliquez sur **Deploy**

3. Attendez que le build se termine (5-10 minutes)

4. Une fois déployé, vérifiez :
   - Backend health check : `https://italian-church-app.emergent.host/health`
   - Frontend : `https://italian-church-app.emergent.host`

---

## ⚠️ Points d'Attention

### 1. Pas de Hardcoded Values
✅ **CORRECT** : `SECRET_KEY = os.environ["SECRET_KEY"]`  
❌ **INCORRECT** : `SECRET_KEY = os.environ.get("SECRET_KEY", "default-value")`

Le code a été mis à jour pour **exiger** les variables d'environnement (pas de fallback).

### 2. CORS Configuration
Assurez-vous que `CORS_ORIGINS` correspond exactement à l'URL de votre frontend :
```
CORS_ORIGINS=https://italian-church-app.emergent.host
```

### 3. MongoDB Connection
- Utilisez **MongoDB Atlas** (pas de MongoDB local en production)
- Format : `mongodb+srv://` (avec SSL)
- Vérifiez que l'IP du cluster Kubernetes est autorisée

### 4. Backend URL
Les deux variables doivent pointer vers la même URL :
```
REACT_APP_BACKEND_URL=https://italian-church-app.emergent.host
FRONTEND_URL=https://italian-church-app.emergent.host
```

---

## 🔍 Debugging

### Si le déploiement échoue avec status 520

1. Vérifiez les logs :
   ```bash
   kubectl logs -f deployment/italian-church-app
   ```

2. Vérifications communes :
   - ✅ Toutes les variables d'environnement sont définies
   - ✅ MongoDB connection string est correct
   - ✅ SECRET_KEY a au moins 32 caractères
   - ✅ CORS_ORIGINS correspond au domaine frontend

### Si la connexion MongoDB échoue

1. Vérifiez l'IP whitelist dans MongoDB Atlas
2. Testez la connexion :
   ```python
   from motor.motor_asyncio import AsyncIOMotorClient
   client = AsyncIOMotorClient("your-mongo-url")
   await client.admin.command('ping')
   ```

### Si le frontend ne charge pas

1. Vérifiez que `REACT_APP_BACKEND_URL` est correct
2. Ouvrez la console développeur (F12) pour voir les erreurs
3. Vérifiez CORS :
   ```bash
   curl -H "Origin: https://italian-church-app.emergent.host" \
        -H "Access-Control-Request-Method: GET" \
        -X OPTIONS https://italian-church-app.emergent.host/health
   ```

---

## 📊 Monitoring

### Health Checks

- **Backend** : `GET /health` → `{"status": "healthy"}`
- **Database** : Vérifié automatiquement au démarrage

### Logs

Accédez aux logs via :
```bash
kubectl logs -f deployment/italian-church-app
```

ou dans l'interface Emergent : **Logs** → **Application Logs**

---

## 🔄 Migration des Données

Si vous migrez depuis un environnement existant :

1. Exportez les données depuis MongoDB local :
   ```bash
   mongodump --uri="mongodb://localhost:27017/test_database" --out=dump/
   ```

2. Importez dans MongoDB Atlas :
   ```bash
   mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/" dump/
   ```

---

## 📝 Checklist de Déploiement

- [ ] MongoDB Atlas cluster créé et configuré
- [ ] Variables d'environnement configurées dans Emergent Secrets
- [ ] SECRET_KEY généré de manière sécurisée (32+ caractères)
- [ ] CORS_ORIGINS correspond au domaine frontend
- [ ] MongoDB connection string testé
- [ ] Code committé et pushé
- [ ] Déploiement lancé dans Emergent
- [ ] Health check réussi (`/health` retourne 200)
- [ ] Frontend accessible et fonctionnel
- [ ] Login test réussi
- [ ] Dashboard superadmin accessible

---

## 🆘 Support

En cas de problème :
1. Vérifiez les logs de déploiement
2. Consultez ce guide
3. Contactez le support Emergent

---

## 🎉 Déploiement Réussi !

Une fois tous les checks validés, votre application est en production ! 🚀
