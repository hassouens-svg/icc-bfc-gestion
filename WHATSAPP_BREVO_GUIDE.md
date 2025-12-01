# 📱 Guide d'intégration WhatsApp avec Brevo

## Vue d'ensemble

Cette fonctionnalité vous permet d'envoyer des messages WhatsApp à vos contacts via l'API Brevo (anciennement Sendinblue). WhatsApp Business via Brevo offre un canal de communication direct et professionnel avec vos membres.

---

## 🚀 Étapes de configuration

### 1. Créer un compte Brevo

1. Rendez-vous sur [https://www.brevo.com](https://www.brevo.com)
2. Créez un compte gratuit ou connectez-vous
3. Vérifiez votre compte via l'email de confirmation

### 2. Activer WhatsApp Business

1. Dans votre tableau de bord Brevo, allez dans **Conversations → WhatsApp**
2. Cliquez sur **Commencer avec WhatsApp**
3. Suivez les étapes pour :
   - Créer ou connecter votre compte WhatsApp Business
   - Vérifier votre numéro de téléphone professionnel
   - Accepter les conditions d'utilisation de Meta

> ⚠️ **Important** : Vous devez avoir un numéro de téléphone professionnel dédié pour WhatsApp Business

### 3. Créer des modèles de messages (Templates)

WhatsApp nécessite que tous les messages soient basés sur des **templates approuvés** par Meta.

1. Dans Brevo, allez dans **WhatsApp → Templates**
2. Cliquez sur **Créer un template**
3. Configurez votre template :
   - **Nom** : Un identifiant unique (ex: `invitation_evenement`)
   - **Catégorie** : Marketing, Utilitaire, ou Authentification
   - **Langue** : Français
   - **Message** : Votre texte avec variables optionnelles (ex: `{{1}}` pour le nom)
   
4. Soumettez le template pour approbation par Meta
5. Attendez l'approbation (généralement 24-48h)

**Exemple de template d'invitation :**
```
Bonjour {{1}},

Vous êtes invité(e) à notre prochain événement : {{2}}

📅 Date : {{3}}
📍 Lieu : {{4}}

Répondez "OUI" pour confirmer votre présence.

Merci !
Impact Centre Chrétien
```

### 4. Obtenir votre clé API Brevo

1. Dans Brevo, allez dans **Paramètres → API Keys** (icône en haut à droite)
2. Cliquez sur **Générer une nouvelle clé API**
3. Donnez un nom à votre clé (ex: "My Events Church WhatsApp")
4. **Copiez votre clé API** (elle commence par `xkeysib-...`)

### 5. Configurer l'application

1. Ouvrez le fichier `/app/backend/.env`
2. Ajoutez votre clé API Brevo :
   ```env
   BREVO_API_KEY=xkeysib-votre-cle-api-ici
   ```
3. Redémarrez le backend :
   ```bash
   sudo supervisorctl restart backend
   ```

---

## 💬 Utilisation de la fonctionnalité

### Créer une campagne WhatsApp

1. Connectez-vous à **My Events Church**
2. Allez dans **💬 WhatsApp** dans le menu
3. Remplissez le formulaire :
   - **Titre** : Nom de votre campagne (pour vos archives)
   - **ID du modèle** : L'ID du template Brevo que vous avez créé
   - **Message** : Le texte avec les variables
4. Importez vos contacts :
   - **Via une Box** : Sélectionnez une box de contacts existante
   - **Via Excel** : Importez un fichier avec colonnes `prenom`, `nom`, `telephone`
   - **Via copier-coller** : Collez une liste de numéros
5. Cliquez sur **Envoyer**

### Gérer les Boxes de contacts

1. Allez dans **Gérer les Boxes** depuis la page WhatsApp
2. Créez une nouvelle Box avec un nom descriptif
3. Importez vos contacts via Excel
4. Utilisez la Box pour vos prochaines campagnes

---

## 📋 Format du fichier Excel

Votre fichier Excel doit contenir les colonnes suivantes :

| prenom  | nom      | telephone     |
|---------|----------|---------------|
| Jean    | Dupont   | +33612345678  |
| Marie   | Martin   | 0687654321    |
| Pierre  | Durand   | +33698765432  |

**Notes importantes** :
- Le format du téléphone peut être international (+33) ou local (06)
- Assurez-vous que les numéros sont au bon format pour WhatsApp
- Évitez les espaces dans les numéros

---

## 🔧 Implémentation technique (Backend)

### Code actuel

Le code backend actuel sauvegarde les campagnes mais n'envoie pas encore via Brevo. Voici comment implémenter l'envoi réel :

```python
# Dans /app/backend/server.py, modifier la fonction send_whatsapp_campaign

import os
import requests

@api_router.post("/events/whatsapp/send")
async def send_whatsapp_campaign(campaign: WhatsAppCampaign, user: dict = Depends(get_current_user)):
    """Envoyer une campagne WhatsApp via Brevo"""
    try:
        # Récupérer la clé API
        brevo_api_key = os.environ.get('BREVO_API_KEY')
        if not brevo_api_key:
            raise HTTPException(status_code=500, detail="Clé API Brevo non configurée")
        
        # Sauvegarder la campagne
        campagne_doc = {
            "id": str(uuid.uuid4()),
            "type": "whatsapp",
            "titre": campaign.titre,
            "message": campaign.message,
            "template_id": campaign.template_id,
            "destinataires_count": len(campaign.destinataires),
            "created_by": user["username"],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.campagnes_communication.insert_one(campagne_doc)
        
        # Envoyer via Brevo WhatsApp API
        success_count = 0
        failed_count = 0
        
        for contact in campaign.destinataires:
            try:
                # Formater le numéro de téléphone
                phone = contact.telephone.strip()
                if not phone.startswith('+'):
                    # Ajouter +33 pour France si nécessaire
                    if phone.startswith('0'):
                        phone = '+33' + phone[1:]
                    else:
                        phone = '+' + phone
                
                # Envoyer via Brevo
                response = requests.post(
                    'https://api.brevo.com/v3/whatsapp/sendMessage',
                    headers={
                        'api-key': brevo_api_key,
                        'Content-Type': 'application/json'
                    },
                    json={
                        'phoneNumber': phone,
                        'templateId': campaign.template_id,
                        'contentType': 'template',
                        'parameters': {
                            '1': contact.prenom,
                            '2': contact.nom,
                            # Ajoutez d'autres paramètres selon votre template
                        }
                    },
                    timeout=10
                )
                
                if response.status_code == 200:
                    success_count += 1
                else:
                    failed_count += 1
                    print(f"Erreur envoi WhatsApp à {phone}: {response.text}")
                    
            except Exception as e:
                failed_count += 1
                print(f"Erreur envoi WhatsApp: {str(e)}")
        
        return {
            "message": "Campagne WhatsApp envoyée",
            "campaign_id": campagne_doc["id"],
            "success_count": success_count,
            "failed_count": failed_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Installer la dépendance

Si pas déjà installé, ajoutez `requests` dans `/app/backend/requirements.txt` :
```txt
requests>=2.31.0
```

Et installez :
```bash
cd /app/backend
pip install requests
```

---

## 📊 API Brevo WhatsApp - Documentation

### Endpoint d'envoi
```
POST https://api.brevo.com/v3/whatsapp/sendMessage
```

### Headers
```json
{
  "api-key": "xkeysib-votre-cle",
  "Content-Type": "application/json"
}
```

### Body
```json
{
  "phoneNumber": "+33612345678",
  "templateId": "nom_du_template",
  "contentType": "template",
  "parameters": {
    "1": "Jean",
    "2": "Dupont"
  }
}
```

### Réponse succès (200)
```json
{
  "messageId": "abc123",
  "status": "sent"
}
```

---

## ❓ FAQ

### Pourquoi utiliser des templates ?

WhatsApp impose l'utilisation de templates pour tous les messages sortants. Cela garantit la qualité et empêche le spam.

### Combien coûte l'envoi via Brevo ?

Brevo facture les messages WhatsApp selon leur plan. Consultez [https://www.brevo.com/pricing/](https://www.brevo.com/pricing/) pour les tarifs actuels.

### Puis-je envoyer des images ou vidéos ?

Oui, mais vous devez les inclure dans votre template WhatsApp lors de sa création dans Brevo.

### Que faire si mon template est refusé ?

Vérifiez que :
- Le message respecte les règles de WhatsApp (pas de spam, langage approprié)
- La catégorie choisie correspond au type de message
- Le template n'est pas trop promotionnel

### Comment suivre les réponses ?

Les réponses arrivent dans votre compte Brevo, dans **Conversations → WhatsApp**. Vous pouvez configurer des webhooks pour les recevoir dans votre application.

---

## 🔗 Ressources utiles

- [Documentation Brevo WhatsApp](https://developers.brevo.com/docs/whatsapp)
- [API Brevo](https://developers.brevo.com/reference)
- [Politiques WhatsApp Business](https://www.whatsapp.com/legal/business-policy)
- [Créer des templates WhatsApp](https://help.brevo.com/hc/en-us/articles/6535837696274-Create-WhatsApp-message-templates)

---

## ✅ Checklist de mise en route

- [ ] Compte Brevo créé
- [ ] WhatsApp Business activé dans Brevo
- [ ] Numéro de téléphone professionnel vérifié
- [ ] Au moins 1 template créé et approuvé par Meta
- [ ] Clé API Brevo obtenue
- [ ] Clé API ajoutée dans `.env`
- [ ] Backend redémarré
- [ ] Test d'envoi effectué

---

## 🎉 C'est prêt !

Vous pouvez maintenant envoyer des campagnes WhatsApp professionnelles à vos membres depuis My Events Church ! 💬
