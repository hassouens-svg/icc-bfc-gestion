# 🖼️ Guide : Images sur la page RSVP

## ✅ Comment ça marche ?

### Comportement de la page RSVP

La page RSVP affiche l'affiche de l'événement **EN HAUT** si et seulement si :
1. La campagne a une image uploadée
2. L'image est accessible sur le serveur

### Cas possibles

#### 1. ✅ Campagne AVEC image
**Résultat** : L'affiche s'affiche en grand en haut de la page

```
┌─────────────────────────┐
│                         │
│   AFFICHE ÉVÉNEMENT     │
│   (Image complète)      │
│                         │
├─────────────────────────┤
│ Confirmation Présence   │
│ Titre événement         │
├─────────────────────────┤
│ ✅ Oui                  │
│ ❌ Non                  │
│ 🤔 Peut-être            │
└─────────────────────────┘
```

#### 2. ❌ Campagne SANS image
**Résultat** : Placeholder "Affiche non disponible"

```
┌─────────────────────────┐
│         ❓              │
│  Affiche non disponible │
├─────────────────────────┤
│ Confirmation Présence   │
│ Titre événement         │
├─────────────────────────┤
│ ✅ Oui                  │
│ ❌ Non                  │
│ 🤔 Peut-être            │
└─────────────────────────┘
```

---

## 🔍 Vérifier si une campagne a une image

### Méthode 1 : Depuis l'interface

1. Aller sur **Communication Email** ou **Communication SMS**
2. Regarder l'historique des campagnes
3. Si une campagne a une image, vous la verrez dans la prévisualisation

### Méthode 2 : Depuis la page RSVP Management

1. Aller sur **✉️ RSVP** dans le menu Events Church
2. Sélectionner une campagne
3. Les campagnes avec images auront une prévisualisation

---

## ✅ Comment ajouter une image à une campagne

### Pour une NOUVELLE campagne

1. **Aller sur Communication Email** ou **Communication SMS**
2. **Créer nouvelle campagne**
3. **Upload une image** :
   - Cliquer sur le bouton d'upload
   - Sélectionner votre affiche (JPG, PNG, GIF)
   - Taille max : 5 MB
   - Recommandé : 1200x630 px
4. **Activer RSVP** (cocher la case)
5. **Envoyer**

### Pour une campagne EXISTANTE

❌ **Important** : On ne peut pas ajouter une image à une campagne déjà envoyée.

**Solutions** :
1. **Réutiliser la campagne** (bouton 🔄)
   - Cliquer sur 🔄 pour copier la campagne
   - Upload une nouvelle image
   - Activer RSVP
   - Renvoyer

2. **Créer une nouvelle campagne**
   - Copier le contenu de l'ancienne
   - Upload l'image
   - Activer RSVP
   - Envoyer

---

## 🧪 Test de votre campagne

### Test 1 : Vérifier l'URL de l'image

Dans la base de données, l'URL de l'image doit ressembler à :
```
https://faithflow-14.preview.emergentagent.com/api/uploads/campaign_XXXXXXXX.jpeg
```

### Test 2 : Accès direct à l'image

Ouvrir l'URL de l'image dans un navigateur :
- ✅ **Si l'image s'affiche** : Tout va bien
- ❌ **Si erreur 404** : Le fichier n'existe pas

### Test 3 : Page RSVP

1. Créer une campagne de test avec RSVP
2. Upload une image
3. Envoyer à votre propre email
4. Cliquer sur le lien RSVP dans l'email
5. ✅ L'image devrait s'afficher en haut

---

## 📊 État actuel des campagnes

D'après la vérification, voici l'état de vos campagnes avec RSVP :

| Campagne | Image ? |
|----------|---------|
| Séminaire Spécial | ❌ Aucune |
| Test RSVP Email Backend | ❌ Aucune |
| Test RSVP SMS Backend | ❌ Aucune |
| Tshsh | ❌ Aucune |
| Camp Spécial | ❌ Aucune |
| 21jours de jeûne et de prière | ❌ Aucune |
| Ah oui | ❌ Aucune |
| **Jeune et prière** | ✅ **OUI** |
| **Test 4** | ✅ **OUI** |

**Résultat** : Seulement 2 campagnes sur 10 ont une image.

---

## ❓ FAQ

### Q : Pourquoi certaines campagnes affichent "Affiche non disponible" ?

**R :** Parce que ces campagnes ont été créées **sans uploader d'image**. C'est normal et attendu.

### Q : Peut-on ajouter une image après l'envoi ?

**R :** ❌ Non. Il faut réutiliser la campagne (🔄) et créer une nouvelle version avec l'image.

### Q : L'image doit-elle avoir un format spécifique ?

**R :** 
- **Formats acceptés** : JPG, PNG, GIF
- **Taille max** : 5 MB
- **Recommandé** : 1200x630 px (format paysage)

### Q : Que se passe-t-il si l'image est trop lourde ?

**R :** L'upload sera refusé. Compressez votre image avant de l'uploader.

### Q : L'image s'affiche en preview mais pas dans l'email

**R :** Ce problème a été résolu. Les images sont maintenant servies via `/api/uploads/` et sont accessibles depuis tous les clients email.

### Q : Peut-on avoir une campagne RSVP sans image ?

**R :** ✅ **Oui** ! C'est tout à fait possible. La page RSVP fonctionnera normalement, mais sans l'affiche en haut.

---

## 🎯 Recommandations

### Pour vos futures campagnes :

1. ✅ **Toujours uploader une image**
   - Les affiches attirent l'attention
   - Elles donnent le contexte de l'événement
   - Elles rendent la page RSVP plus attrayante

2. ✅ **Créer des affiches optimisées**
   - Format : 1200x630 px
   - Poids : < 500 KB (compressée)
   - Texte lisible même en petit

3. ✅ **Tester avant l'envoi massif**
   - Envoyer à vous-même d'abord
   - Cliquer sur le lien RSVP
   - Vérifier que l'image s'affiche

---

## 🔧 En cas de problème

### Image ne se charge pas (même si uploadée)

**Vérifications** :
1. Ouvrir la console du navigateur (F12)
2. Aller sur l'onglet "Network"
3. Recharger la page RSVP
4. Chercher l'URL de l'image
5. Vérifier le code de statut :
   - ✅ **200 OK** : Tout va bien
   - ❌ **404 Not Found** : Fichier manquant
   - ❌ **403 Forbidden** : Problème de permissions
   - ❌ **500 Server Error** : Problème serveur

**Solutions** :
- Si 404 : Le fichier n'existe pas → Réuploader
- Si 403 : Problème de permissions → Contacter support
- Si 500 : Problème serveur → Contacter support

---

## ✅ Résumé

**Pour que l'image s'affiche sur la page RSVP :**

1. ✅ Créer une campagne (Email ou SMS)
2. ✅ **UPLOADER UNE IMAGE**
3. ✅ Activer RSVP
4. ✅ Envoyer
5. ✅ Le lien RSVP affichera l'image en haut

**Si pas d'image uploadée :**
- ❌ "Affiche non disponible" s'affichera
- ✅ La page RSVP fonctionnera quand même
- ✅ Les utilisateurs pourront répondre

---

**Version** : 1.0  
**Date** : 29 Novembre 2025  
**Testé et validé** : ✅
