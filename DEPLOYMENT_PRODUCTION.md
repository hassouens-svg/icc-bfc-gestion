# 🚀 Déploiement en Production - Configuration RSVP et Images

## ⚠️ IMPORTANT : Configuration des URLs

### Problème actuel
- L'URL actuelle dans `.env` est : `https://discipleship-track.preview.emergentagent.com`
- Ceci est l'URL de **PREVIEW/TEST**, pas de PRODUCTION
- Les liens RSVP dans les emails pointent vers cette URL preview

### Solution pour la production

#### 1. Obtenir votre URL de production

**Emergent Platform** génère automatiquement une URL de production quand vous déployez.

Format typique :
```
https://votre-app-nom.emergentagent.com
OU
https://ministry-hub-32.app.emergentagent.com
```

**Comment trouver votre URL de production :**
1. Aller sur le dashboard Emergent
2. Voir la section "Deployment" ou "Production URL"
3. Copier l'URL complète

#### 2. Mettre à jour les fichiers de configuration

**Fichier `/app/frontend/.env`** :
```bash
# REMPLACER l'URL preview par l'URL de production
REACT_APP_BACKEND_URL=https://VOTRE-URL-PRODUCTION.emergentagent.com
WDS_SOCKET_PORT=443
REACT_APP_ENABLE_VISUAL_EDITS=false
ENABLE_HEALTH_CHECK=false
```

**Fichier `/app/backend/.env`** (ajouter cette ligne) :
```bash
FRONTEND_URL=https://VOTRE-URL-PRODUCTION.emergentagent.com
```

#### 3. Redémarrer les services

```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

#### 4. Vérifier

**Test 1 : Accès aux images**
```bash
curl -I https://VOTRE-URL-PRODUCTION/api/uploads/nom-image.jpeg
```
Devrait retourner `HTTP 200 OK`

**Test 2 : Créer un email de test**
1. Aller sur Communication Email
2. Upload une image
3. Vérifier que l'URL est : `https://VOTRE-URL-PRODUCTION/api/uploads/...`
4. Ouvrir cette URL dans un navigateur : l'image doit s'afficher

**Test 3 : RSVP**
1. Créer une campagne avec RSVP activé
2. Ajouter votre email personnel
3. Envoyer l'email
4. Cliquer sur "Répondre maintenant" dans l'email
5. ✅ Devrait ouvrir la page RSVP sur votre URL de PRODUCTION (pas preview)

---

## 🖼️ Nouvelle Interface RSVP

### Changements effectués

**AVANT** :
- Icône calendrier en haut
- Titre au centre
- Image au milieu (petite)
- Boutons en bas

**APRÈS** :
- ✅ **Image EN HAUT** (grande, pleine largeur)
- Titre juste après l'image
- Message de confirmation
- ✅ **Boutons EN BAS** (bien visibles)

### Structure visuelle

```
┌─────────────────────────────┐
│                             │
│     IMAGE DE L'ÉVÉNEMENT    │
│     (Affiche complète)      │
│                             │
├─────────────────────────────┤
│  📅 Confirmation Présence   │
│     Titre de l'événement    │
├─────────────────────────────┤
│  📋 Merci de confirmer...   │
├─────────────────────────────┤
│  ✅ Oui, je serai présent   │
│  ❌ Non, je ne pourrai pas  │
│  🤔 Je ne sais pas encore   │
├─────────────────────────────┤
│   Impact Centre Chrétien    │
└─────────────────────────────┘
```

---

## 🔧 Dépannage

### Problème : Les images ne s'affichent pas dans les emails

**Vérifications** :
1. L'image est-elle uploadée correctement ?
   ```bash
   ls -lh /app/backend/uploads/
   ```

2. L'endpoint est-il accessible ?
   ```bash
   curl -I http://localhost:8001/api/uploads/nom-image.jpeg
   ```

3. L'URL dans la campagne est-elle correcte ?
   - Doit contenir `/api/uploads/`
   - Doit pointer vers l'URL de production

**Solution** :
- Si anciennes campagnes ont mauvaise URL, utiliser le script de migration :
  ```bash
  python /tmp/fix_campaign_urls.py
  ```

### Problème : RSVP redirige vers preview

**Cause** : `REACT_APP_BACKEND_URL` pointe toujours vers preview

**Solution** :
1. Mettre à jour `/app/frontend/.env` avec l'URL de production
2. Redémarrer frontend :
   ```bash
   sudo supervisorctl restart frontend
   ```
3. Renvoyer l'email (les nouveaux emails auront la bonne URL)

### Problème : L'image ne s'affiche pas sur la page RSVP

**Vérifications** :
1. L'URL de l'image est-elle correcte dans la campagne ?
2. Le navigateur peut-il accéder à `/api/uploads/` ?

**Solution** :
- Ouvrir la console du navigateur (F12)
- Vérifier les erreurs réseau
- S'assurer que l'image est accessible publiquement

---

## 📊 Checklist de déploiement production

### Avant déploiement

- [ ] Obtenir l'URL de production Emergent
- [ ] Mettre à jour `REACT_APP_BACKEND_URL` dans `/app/frontend/.env`
- [ ] Ajouter `FRONTEND_URL` dans `/app/backend/.env`
- [ ] Vérifier que le dossier `/app/backend/uploads/` existe
- [ ] S'assurer que les permissions sont correctes

### Après déploiement

- [ ] Tester l'accès aux images : `curl -I URL/api/uploads/test.jpg`
- [ ] Créer un email de test avec image
- [ ] Vérifier que l'image s'affiche dans l'email reçu
- [ ] Créer une campagne RSVP de test
- [ ] Cliquer sur le lien RSVP et vérifier l'URL
- [ ] Vérifier que l'image s'affiche sur la page RSVP
- [ ] Tester les 3 boutons de réponse
- [ ] Vérifier que la réponse est enregistrée

### URLs à vérifier

```bash
# Images accessibles
https://PROD-URL/api/uploads/image.jpeg

# Page RSVP accessible
https://PROD-URL/rsvp/CAMPAGNE-ID?contact=email@example.com

# API publique campagne
https://PROD-URL/api/public/campagne/CAMPAGNE-ID

# API publique RSVP
https://PROD-URL/api/public/rsvp
```

---

## 💡 Bonnes pratiques

### 1. Images
- ✅ Toujours uploader via l'interface (pas manuellement)
- ✅ Format recommandé : JPEG (plus léger)
- ✅ Taille max : 5 MB
- ✅ Dimensions recommandées : 1200x630 px (format paysage)

### 2. RSVP
- ✅ Toujours tester avec votre propre email d'abord
- ✅ Vérifier le lien avant d'envoyer à beaucoup de monde
- ✅ L'image sur la page RSVP aide les gens à se souvenir de l'événement

### 3. Emails
- ✅ Maximum 300 destinataires par campagne
- ✅ Toujours ajouter une image (attire l'attention)
- ✅ Personnaliser avec `{prenom}` et `{nom}`
- ✅ Tester d'abord avec 1-2 contacts

---

## 📞 Support

Si après avoir suivi ce guide vous avez toujours des problèmes :

1. **Vérifier les logs backend** :
   ```bash
   tail -f /var/log/supervisor/backend.err.log
   ```

2. **Vérifier les logs frontend** :
   ```bash
   tail -f /var/log/supervisor/frontend.err.log
   ```

3. **Tester l'endpoint d'upload** :
   ```bash
   curl -X GET http://localhost:8001/api/uploads/test.jpeg
   ```

4. **Vérifier la configuration** :
   ```bash
   cat /app/frontend/.env | grep BACKEND_URL
   cat /app/backend/.env | grep FRONTEND_URL
   ```

---

**Important** : Ce guide doit être suivi **AVANT** d'envoyer des emails en production. Les liens RSVP ne peuvent pas être modifiés après l'envoi de l'email.
