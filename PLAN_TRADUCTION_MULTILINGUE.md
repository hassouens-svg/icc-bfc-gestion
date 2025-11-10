# 🌍 Plan d'Implémentation - Traduction Multilingue (FR/EN/IT)

## Vue d'ensemble
Ajouter la traduction complète du site en 3 langues : Français (défaut), Anglais, Italien

---

## 📦 Bibliothèque à installer : react-i18next

```bash
cd /app/frontend
yarn add react-i18next i18next i18next-browser-languagedetector
```

---

## 📁 Structure des fichiers

```
/app/frontend/src/
├── i18n/
│   ├── config.js           # Configuration i18next
│   ├── fr.json            # Traductions françaises
│   ├── en.json            # Traductions anglaises
│   └── it.json            # Traductions italiennes
├── components/
│   └── LanguageSwitcher.jsx  # Bouton sélecteur de langue
└── index.js               # Import config i18n
```

---

## 🔧 Étapes d'implémentation

### 1. Configuration i18next (`/app/frontend/src/i18n/config.js`)

```javascript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationFR from './fr.json';
import translationEN from './en.json';
import translationIT from './it.json';

const resources = {
  fr: { translation: translationFR },
  en: { translation: translationEN },
  it: { translation: translationIT }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    debug: false,
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
```

### 2. Import dans index.js

```javascript
// /app/frontend/src/index.js
import './i18n/config';  // Ajouter cette ligne AVANT import App
```

### 3. Fichiers de traduction

#### `/app/frontend/src/i18n/fr.json` (exemple partiel)
```json
{
  "common": {
    "login": "Connexion",
    "logout": "Déconnexion",
    "dashboard": "Tableau de Bord",
    "save": "Enregistrer",
    "cancel": "Annuler",
    "delete": "Supprimer",
    "edit": "Modifier",
    "search": "Rechercher",
    "loading": "Chargement..."
  },
  "homepage": {
    "title": "Bienvenue sur ICC BFC-ITALIE Connect",
    "subtitle": "Plateforme de gestion multi-villes",
    "selectDepartment": "Sélectionnez votre département",
    "selectCity": "Choisissez votre ville"
  },
  "departments": {
    "promotions": "Promotions",
    "famillesImpact": "Familles d'Impact",
    "accueil": "Accueil & Intégration"
  },
  "visitors": {
    "title": "Visiteurs",
    "newVisitor": "Nouveau Visiteur",
    "firstname": "Prénom",
    "lastname": "Nom",
    "phone": "Téléphone",
    "email": "Email"
  },
  "culteStats": {
    "title": "Statistiques des Cultes",
    "date": "Date",
    "culte1": "Culte 1",
    "culte2": "Culte 2",
    "ejp": "Culte EJP",
    "adultes": "Adultes",
    "enfants": "Enfants",
    "stars": "STARS",
    "totalFideles": "Total Fidèles",
    "totalGeneral": "Total Général"
  }
}
```

#### `/app/frontend/src/i18n/en.json` (exemple partiel)
```json
{
  "common": {
    "login": "Login",
    "logout": "Logout",
    "dashboard": "Dashboard",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "search": "Search",
    "loading": "Loading..."
  },
  "homepage": {
    "title": "Welcome to ICC BFC-ITALY Connect",
    "subtitle": "Multi-city management platform",
    "selectDepartment": "Select your department",
    "selectCity": "Choose your city"
  },
  "culteStats": {
    "title": "Service Statistics",
    "adultes": "Adults",
    "enfants": "Children",
    "stars": "STARS",
    "totalFideles": "Total Faithful",
    "totalGeneral": "Grand Total"
  }
}
```

#### `/app/frontend/src/i18n/it.json` (exemple partiel)
```json
{
  "common": {
    "login": "Accesso",
    "logout": "Disconnettersi",
    "dashboard": "Cruscotto",
    "save": "Salvare",
    "cancel": "Annulla",
    "delete": "Elimina",
    "edit": "Modifica",
    "search": "Cerca",
    "loading": "Caricamento..."
  },
  "homepage": {
    "title": "Benvenuti su ICC BFC-ITALIA Connect",
    "subtitle": "Piattaforma di gestione multi-città",
    "selectDepartment": "Seleziona il tuo dipartimento",
    "selectCity": "Scegli la tua città"
  },
  "culteStats": {
    "title": "Statistiche del Culto",
    "adultes": "Adulti",
    "enfants": "Bambini",
    "stars": "STARS",
    "totalFideles": "Totale Fedeli",
    "totalGeneral": "Totale Generale"
  }
}
```

### 4. Composant LanguageSwitcher

```jsx
// /app/frontend/src/components/LanguageSwitcher.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Globe className="h-4 w-4 mr-2" />
          {currentLanguage.flag} {currentLanguage.name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={i18n.language === lang.code ? 'bg-gray-100' : ''}
          >
            {lang.flag} {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
```

### 5. Utilisation dans les composants

#### Exemple : HomePage

```jsx
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const HomePage = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      {/* Bouton de langue */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      
      <h1>{t('homepage.title')}</h1>
      <p>{t('homepage.subtitle')}</p>
      
      <Button>{t('common.login')}</Button>
    </div>
  );
};
```

#### Exemple : CulteStatsPage

```jsx
const CulteStatsPage = () => {
  const { t } = useTranslation();
  
  return (
    <Card>
      <CardTitle>{t('culteStats.title')}</CardTitle>
      
      <Label>{t('culteStats.adultes')}</Label>
      <Input ... />
      
      <Label>{t('culteStats.enfants')}</Label>
      <Input ... />
      
      <Label>{t('culteStats.stars')}</Label>
      <Input ... />
    </Card>
  );
};
```

---

## 📋 Pages à traduire (priorité)

1. ✅ **HomePage** - Page d'accueil avec sélection de département
2. ✅ **LoginPage** - Connexion
3. ✅ **RegisterPage** - Inscription visiteur
4. ✅ **DashboardPage** - Tableaux de bord
5. ✅ **CulteStatsPage** - Statistiques cultes
6. ✅ **VisitorsPage** - Gestion visiteurs
7. ✅ **Layout** - Navigation
8. ⚠️ Messages toast
9. ⚠️ Messages d'erreur

---

## 🎯 Workflow de traduction

### Étape 1 : Identifier les textes
- Lister tous les textes statiques
- Créer une structure JSON hiérarchique
- Organiser par page/composant

### Étape 2 : Traduction FR → EN
- Utiliser DeepL ou Google Translate pour traduction initiale
- Réviser manuellement les termes spécifiques (STARS, Familles d'Impact, etc.)

### Étape 3 : Traduction FR → IT
- Idem, avec attention particulière pour termes religieux
- "Culte" = "Culto" en italien
- "Fidèle" = "Fedele"

### Étape 4 : Intégration progressive
- Commencer par HomePage et Layout
- Puis pages principales (Dashboard, Visitors)
- Enfin pages secondaires

---

## 🔄 Stockage de la préférence

```javascript
// La langue est automatiquement sauvegardée dans localStorage
// par i18next-browser-languagedetector

// Pour forcer une langue au premier chargement :
localStorage.setItem('i18nextLng', 'fr');

// Pour récupérer la langue actuelle :
const currentLang = localStorage.getItem('i18nextLng') || 'fr';
```

---

## ⚙️ Configuration avancée

### Pluralization (optionnel)
```json
{
  "visitors": {
    "count_zero": "Aucun visiteur",
    "count_one": "{{count}} visiteur",
    "count_other": "{{count}} visiteurs"
  }
}
```

```jsx
// Utilisation
{t('visitors.count', { count: 5 })} // "5 visiteurs"
```

### Interpolation
```json
{
  "welcome": "Bienvenue, {{name}} !"
}
```

```jsx
{t('welcome', { name: user.username })} // "Bienvenue, Jean !"
```

---

## 📊 Estimation

- **Temps d'installation** : 30 min
- **Création fichiers traduction** : 3-4 heures (environ 500-800 clés)
- **Intégration dans composants** : 4-6 heures
- **Tests et corrections** : 2 heures
- **Total estimé** : 10-12 heures de travail

---

## 🚀 Déploiement

1. Installer les dépendances
2. Créer les fichiers de config
3. Créer les 3 fichiers JSON avec traductions minimales
4. Ajouter LanguageSwitcher sur HomePage
5. Tester changement de langue
6. Progressivement remplacer textes par `t()` dans chaque page

---

## ✅ Checklist de validation

- [ ] Installation react-i18next réussie
- [ ] Fichiers fr.json, en.json, it.json créés
- [ ] LanguageSwitcher fonctionne
- [ ] Langue persiste après refresh
- [ ] HomePage traduite
- [ ] Layout traduit
- [ ] CulteStatsPage traduite
- [ ] Messages toast traduits
- [ ] Tests sur 3 langues

---

**Note** : Cette implémentation nécessite un travail conséquent mais est standard et bien documentée. La structure proposée permet une scalabilité facile pour ajouter d'autres langues à l'avenir.
