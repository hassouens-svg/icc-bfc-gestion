# 📧 Configuration de l'email expéditeur

## 🔍 Problème actuel

**Email expéditeur actuel** : `chassouens@10272201.brevsend.com`  
**Nom affiché** : "Impact Centre Chrétien BFC-Italie"

L'adresse `@brevsend.com` est le domaine de relais de Brevo (ex-Sendinblue). C'est normal mais pas idéal pour le branding.

---

## ✅ Solutions disponibles

### Option 1 : Utiliser votre email Gmail (Actuel - Simple)

**Avantages** :
- ✅ Aucune configuration supplémentaire
- ✅ Fonctionne immédiatement
- ✅ Gratuit

**Inconvénients** :
- ❌ Affiche `@brevsend.com` dans certains clients
- ❌ Moins professionnel

**Configuration** :
```bash
# Dans /app/backend/.env
SENDER_EMAIL=hassouens@gmail.com
SENDER_NAME=Impact Centre Chrétien BFC-Italie
```

---

### Option 2 : Utiliser un email de domaine personnalisé (Recommandé)

**Exemple** : `contact@impactcentrechretien.com`

**Avantages** :
- ✅ ✨ **Professionnel** - Votre propre domaine
- ✅ Meilleure délivrabilité
- ✅ Branding cohérent
- ✅ Pas de mention `@brevsend.com`

**Prérequis** :
1. Avoir un nom de domaine (ex: `impactcentrechretien.com`)
2. Créer une adresse email sur ce domaine
3. Vérifier le domaine dans Brevo

**Étapes de configuration** :

#### Étape 1 : Acheter un nom de domaine
**Fournisseurs recommandés** :
- OVH (français) : ~10€/an
- Namecheap : ~10€/an
- Google Domains : ~12€/an

**Nom suggéré** :
- `impactcentrechretien.com`
- `icc-bfc.com`
- `impactbfc.org`

#### Étape 2 : Créer une adresse email
Dans votre hébergeur de domaine :
- Créer `contact@votredomaine.com`
- Ou `info@votredomaine.com`
- Ou `noreply@votredomaine.com`

#### Étape 3 : Vérifier le domaine dans Brevo
1. Aller sur https://app.brevo.com
2. Menu "Senders & IP" → "Domains"
3. Cliquer "Add a Domain"
4. Entrer votre domaine : `impactcentrechretien.com`
5. Brevo vous donnera des enregistrements DNS à ajouter :
   - **SPF** (TXT record)
   - **DKIM** (CNAME record)
   - **DMARC** (TXT record) - optionnel

**Exemple d'enregistrements DNS** :
```
Type: TXT
Name: @
Value: v=spf1 include:spf.sendinblue.com ~all

Type: CNAME
Name: mail._domainkey
Value: mail._domainkey.impactcentrechretien.com.sendinblue.com

Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:contact@impactcentrechretien.com
```

#### Étape 4 : Attendre la vérification (24-48h)
Brevo vérifiera automatiquement les enregistrements DNS.

#### Étape 5 : Configurer dans l'application
```bash
# Dans /app/backend/.env
SENDER_EMAIL=contact@impactcentrechretien.com
SENDER_NAME=Impact Centre Chrétien BFC-Italie
```

#### Étape 6 : Redémarrer
```bash
sudo supervisorctl restart backend
```

---

### Option 3 : Utiliser un service email gratuit alternatif

**Gmail for nonprofits** (si vous êtes une association) :
- Google Workspace for Nonprofits
- Gratuit pour les organisations à but non lucratif
- Vous obtenez : `contact@votredomaine.org`

**Zoho Mail Free** :
- 5 utilisateurs gratuits
- Votre propre domaine
- Interface simple

---

## 🛠️ Configuration rapide (Sans domaine personnalisé)

Si vous voulez juste changer l'email actuel sans acheter de domaine :

### 1. Vérifier votre email dans Brevo

1. Aller sur https://app.brevo.com
2. Menu "Senders & IP" → "Senders"
3. Cliquer "Add a Sender"
4. Entrer votre email : `hassouens@gmail.com`
5. Brevo enverra un email de vérification
6. Cliquer sur le lien de vérification

### 2. Créer un nouvel email dédié (Optionnel)

Créer un email Gmail spécifique pour l'église :
- `impactbfcitalie@gmail.com`
- `contact.icc.bfc@gmail.com`

Puis vérifier cet email dans Brevo.

### 3. Mettre à jour la configuration

```bash
# Éditer /app/backend/.env
SENDER_EMAIL=votre-nouveau-email@gmail.com
SENDER_NAME=Impact Centre Chrétien BFC-Italie
```

### 4. Redémarrer
```bash
sudo supervisorctl restart backend
```

---

## 📊 Comparaison des options

| Option | Coût | Professionnalisme | Temps setup | Délivrabilité |
|--------|------|-------------------|-------------|---------------|
| **Email Gmail actuel** | Gratuit | ⭐⭐ | 0 min | ⭐⭐⭐ |
| **Nouveau Gmail dédié** | Gratuit | ⭐⭐⭐ | 5 min | ⭐⭐⭐ |
| **Domaine personnalisé** | ~10€/an | ⭐⭐⭐⭐⭐ | 2-3 jours | ⭐⭐⭐⭐⭐ |

---

## 🎯 Notre recommandation

### Court terme (maintenant) :
✅ **Créer un Gmail dédié**
```
impactbfcitalie@gmail.com
```
- Coût : Gratuit
- Temps : 5 minutes
- Professionnalisme : Meilleur que votre email personnel

### Long terme (dans 1-2 semaines) :
✅ **Acheter un domaine personnalisé**
```
contact@impactcentrechretien.com
```
- Coût : ~10€/an
- Temps : 2-3 jours (vérification DNS)
- Professionnalisme : Excellent
- Délivrabilité : Meilleure

---

## 🔧 Configuration actuelle

Après modification du code, vous pouvez configurer l'expéditeur via les variables d'environnement :

```bash
# Fichier : /app/backend/.env

# Email expéditeur (OBLIGATOIRE - doit être vérifié dans Brevo)
SENDER_EMAIL=hassouens@gmail.com

# Nom affiché (OPTIONNEL)
SENDER_NAME=Impact Centre Chrétien BFC-Italie
```

**Variables par défaut** (si non définies) :
- `SENDER_EMAIL` : `hassouens@gmail.com`
- `SENDER_NAME` : `Impact Centre Chrétien BFC-Italie`

---

## ⚠️ Important : Vérification Brevo

**Règle d'or** : L'email dans `SENDER_EMAIL` **DOIT** être vérifié dans votre compte Brevo.

Si vous changez l'email sans le vérifier dans Brevo :
- ❌ Les emails ne seront PAS envoyés
- ❌ Erreur API Brevo

**Comment vérifier** :
1. Brevo → Senders & IP → Senders
2. Vérifier que votre email est dans la liste
3. Status doit être "Verified" (vert)

---

## 📞 Support

### Problèmes courants

**Q : L'email affiche toujours @brevsend.com**  
**R :** C'est normal avec Gmail/Outlook. Pour l'éviter, utilisez un domaine personnalisé.

**Q : Les emails ne partent plus après changement**  
**R :** Vérifiez que le nouvel email est vérifié dans Brevo.

**Q : Combien coûte un domaine ?**  
**R :** Entre 10€ et 15€ par an selon le fournisseur.

**Q : Peut-on utiliser un email @outlook.com ?**  
**R :** Oui, mais vous devez le vérifier dans Brevo d'abord.

**Q : Le nom s'affiche bizarrement**  
**R :** Changez `SENDER_NAME` dans `.env`. Évitez les caractères spéciaux.

---

## 🎯 Action immédiate recommandée

Pour résoudre votre problème **maintenant** :

1. **Créer un nouvel email Gmail** :
   ```
   impactbfcitalie@gmail.com
   OU
   contact.icc.bfc@gmail.com
   ```

2. **Le vérifier dans Brevo** :
   - Login Brevo
   - Senders & IP → Add Sender
   - Entrer le nouvel email
   - Cliquer sur le lien dans l'email de vérification

3. **Configurer dans l'app** :
   ```bash
   # Éditer /app/backend/.env
   nano /app/backend/.env
   
   # Ajouter :
   SENDER_EMAIL=impactbfcitalie@gmail.com
   SENDER_NAME=Impact Centre Chrétien BFC-Italie
   ```

4. **Redémarrer** :
   ```bash
   sudo supervisorctl restart backend
   ```

5. **Tester** :
   - Envoyer un email test
   - Vérifier l'expéditeur

---

**Temps total** : 10-15 minutes  
**Coût** : Gratuit  
**Résultat** : Email plus professionnel

---

Pour un résultat **vraiment professionnel** à long terme, investissez dans un domaine personnalisé (~10€/an).
