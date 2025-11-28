# 📚 Guide Utilisateur - Mode d'emploi

## Fichiers disponibles

### 📘 GUIDE_UTILISATEUR_COMPLET.md
**Format** : Markdown (texte formaté)
**Utilisation** : 
- Lecture directe sur GitHub, GitLab, ou tout éditeur markdown
- Facile à modifier et mettre à jour
- Recherche de texte rapide

**Comment le lire** :
- Sur GitHub/GitLab : S'affiche automatiquement avec formatage
- Sur votre ordinateur : Ouvrir avec n'importe quel éditeur de texte
- Recommandé : VS Code, Typora, ou Obsidian

---

### 📕 GUIDE_UTILISATEUR_COMPLET.pdf (À générer)
**Format** : PDF
**Utilisation** :
- Impression
- Partage par email
- Lecture sur tablette/liseuse
- Distribution aux utilisateurs

---

## 🔄 Comment générer le PDF

### Méthode 1 : Script automatique (Linux/Mac)

```bash
cd /app
./convert_guide_to_pdf.sh
```

Le PDF sera créé dans `/app/GUIDE_UTILISATEUR_COMPLET.pdf`

---

### Méthode 2 : Pandoc (si script ne fonctionne pas)

**Prérequis** :
```bash
apt-get update
apt-get install -y pandoc wkhtmltopdf
```

**Conversion** :
```bash
pandoc /app/GUIDE_UTILISATEUR_COMPLET.md \
    -o /app/GUIDE_UTILISATEUR_COMPLET.pdf \
    --pdf-engine=wkhtmltopdf \
    --toc \
    --toc-depth=3 \
    -V geometry:margin=1in
```

---

### Méthode 3 : En ligne (sans installation)

**Option A : dillinger.io**
1. Allez sur https://dillinger.io/
2. Copiez-collez le contenu du fichier .md
3. Cliquez sur "Export as" → "PDF"

**Option B : markdown-pdf.com**
1. Allez sur https://www.markdown-pdf.com/
2. Uploadez le fichier .md
3. Téléchargez le PDF généré

**Option C : VS Code**
1. Installez l'extension "Markdown PDF"
2. Ouvrez le fichier .md
3. Ctrl+Shift+P → "Markdown PDF: Export (pdf)"

---

### Méthode 4 : Google Docs (pour personnalisation avancée)

1. Ouvrez le fichier .md dans un éditeur
2. Copiez tout le contenu
3. Allez sur https://docs.google.com
4. Créez un nouveau document
5. Collez le contenu
6. Ajustez le formatage si besoin
7. Fichier → Télécharger → PDF

---

## ✏️ Comment modifier le guide

### Modifier le contenu

1. Ouvrez `/app/GUIDE_UTILISATEUR_COMPLET.md`
2. Modifiez le texte en markdown
3. Sauvegardez
4. Régénérez le PDF

### Syntaxe Markdown de base

```markdown
# Titre de niveau 1
## Titre de niveau 2
### Titre de niveau 3

**Texte en gras**
*Texte en italique*

- Liste à puces
- Item 2
  - Sous-item

1. Liste numérotée
2. Item 2

[Lien](https://exemple.com)

> Citation

`code inline`

```
Bloc de code
```
```

---

## 📤 Comment distribuer le guide

### Option 1 : Partage direct du PDF
- Email aux utilisateurs
- Upload sur Google Drive / Dropbox
- Partagé dans un groupe WhatsApp / Telegram

### Option 2 : Intégration dans l'application
Placez le PDF dans `/app/frontend/public/` et ajoutez un lien dans l'interface :

```jsx
<a href="/GUIDE_UTILISATEUR.pdf" download>
  📘 Télécharger le guide utilisateur
</a>
```

### Option 3 : Page d'aide intégrée
Convertissez le markdown en HTML et intégrez-le directement dans une page de l'application.

---

## 📋 Checklist de mise à jour

Quand mettre à jour le guide :
- ✅ Ajout d'une nouvelle fonctionnalité
- ✅ Modification d'un rôle ou de permissions
- ✅ Changement d'une interface utilisateur
- ✅ Correction d'une erreur dans le guide
- ✅ Ajout de nouveaux rôles

Après modification :
1. ✅ Vérifier la syntaxe markdown
2. ✅ Relire pour les fautes
3. ✅ Régénérer le PDF
4. ✅ Tester la lecture du PDF
5. ✅ Incrémenter le numéro de version
6. ✅ Mettre à jour la date
7. ✅ Redistribuer aux utilisateurs

---

## 🎨 Personnalisation du PDF

### Modifier les marges
```bash
-V geometry:margin=0.75in  # Marges plus petites
-V geometry:margin=1.5in   # Marges plus grandes
```

### Ajouter une page de garde
Créez un fichier `cover.md` :
```markdown
---
title: "Guide Utilisateur"
subtitle: "My Events Church"
author: "Impact Centre Chrétien BFC"
date: "Novembre 2025"
---

\newpage
```

Puis convertissez :
```bash
pandoc cover.md GUIDE_UTILISATEUR_COMPLET.md -o guide.pdf
```

### Changer la police
```bash
-V mainfont="Arial"
-V fontsize=11pt
```

### Ajouter un logo/image
Dans le markdown :
```markdown
![Logo](chemin/vers/logo.png)
```

---

## 🔍 Recherche rapide

Pour trouver rapidement une information :

**Dans le .md** : Ctrl+F (ou Cmd+F sur Mac)

**Dans le PDF** : Utilisez la fonction de recherche de votre lecteur PDF

**Table des matières** : Au début du document pour navigation rapide

---

## 📞 Support

### Problèmes de conversion
- Vérifiez que pandoc et wkhtmltopdf sont installés
- Essayez la méthode en ligne
- Vérifiez les erreurs dans la syntaxe markdown

### Contenu manquant ou incorrect
- Vérifiez la dernière version du fichier
- Comparez avec les fonctionnalités réelles de l'application
- Mettez à jour si nécessaire

### Questions sur le contenu
- Référez-vous au Super Admin
- Testez la fonctionnalité dans l'application
- Ajoutez à la FAQ si question fréquente

---

## 📊 Statistiques du guide

**Pages** : ~60-70 pages (en PDF)
**Mots** : ~12,000 mots
**Sections principales** : 7
**Rôles couverts** : 9
**FAQ** : 30+ questions

---

## 🔄 Historique des versions

### Version 1.0 - Novembre 2025
- ✅ Création initiale
- ✅ Tous les rôles documentés
- ✅ Application principale complète
- ✅ Module Events Church complet
- ✅ FAQ et glossaire
- ✅ Guides par rôle

### Prochaines versions (à prévoir)
- Screenshots d'écran pour chaque section
- Tutoriels vidéo (liens)
- Cas d'usage concrets
- Exercices pratiques

---

## 💡 Conseils

1. **Imprimez en couleur** si possible (pour les codes couleur des statuts)
2. **Créez une version courte** (Quick Start Guide) de 5-10 pages pour les nouveaux
3. **Traduisez** si vous avez des utilisateurs non francophones
4. **Mettez à jour régulièrement** : Un guide obsolète est pire que pas de guide
5. **Collectez les retours** : Demandez aux utilisateurs ce qui manque

---

*Ce guide est un document vivant. N'hésitez pas à l'améliorer au fil du temps !*
