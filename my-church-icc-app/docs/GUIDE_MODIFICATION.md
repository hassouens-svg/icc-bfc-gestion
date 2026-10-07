# Guide de modification

Les modifications les plus courantes, pas à pas.

## 1. Changer le nom, le slogan, le bandeau ou l'annonce
Fichier : `frontend/src/config/site.js`. À l'enregistrement, la page se met à jour toute seule.
Le logo est `frontend/public/logo.svg` : remplacez-le par votre image, ou changez `logo:` dans `site.js`.

## 2. Ajouter / renommer une carte sur la page d'accueil
Fichier : `frontend/src/config/departements.js`. Copier un bloc `{ titre, description, icone, couleur, lien }`.
- Icônes : https://lucide.dev/icons (nom en PascalCase, à importer en haut du fichier)
- Couleurs : classes Tailwind, par ex. `from-teal-400 to-teal-600`

## 3. Ajouter un département, une étape, un statut, un rôle, un type de suivi
Fichier : `backend/app/constants.py`. Ajouter une ligne `{"code": "...", "label": "..."}`.
Redémarrer le backend : toutes les listes déroulantes du frontend sont mises à jour automatiquement.

> Ne changez pas le `code` d'un élément déjà utilisé (il est stocké en base). Le `label` peut être modifié librement.

Pour une page dédiée à un nouveau département (comme STARS ou MPI), un lien vers `/services/<code>`
suffit souvent : la page « Services & ministères » s'adapte au département.

## 4. Ajouter un champ à la fiche fidèle (ex. « profession »)
1. `backend/app/models.py` → classe `Fidele` : `profession: Mapped[str | None] = mapped_column(String(100))`
2. `backend/app/schemas.py` → classe `FideleBase` : `profession: str | None = None`
3. `frontend/src/components/FideleForm.jsx` → ajouter `profession: ''` dans `VIDE`, puis un `<Field>`
4. (optionnel) l'afficher dans `frontend/src/pages/FideleDetail.jsx`

⚠️ SQLite ne modifie pas une table existante : en développement, supprimer `backend/icc.db` puis redémarrer.
Pour une base en production, utiliser un outil de migration comme [Alembic](https://alembic.sqlalchemy.org).

## 5. Ajouter une nouvelle page
1. Créer `frontend/src/pages/MaPage.jsx` (s'inspirer d'`Agenda.jsx`)
2. Dans `frontend/src/App.jsx` : l'importer et ajouter `<Route path="/ma-page" element={<MaPage />} />`
3. Dans `frontend/src/components/Layout.jsx` : ajouter une ligne dans `MENU`

## 6. Ajouter une route d'API
1. Créer `backend/app/routers/mon_module.py` (s'inspirer d'`agenda.py`)
2. L'ajouter dans la liste de `backend/app/main.py`
3. Tester sur http://localhost:8000/docs
4. L'appeler depuis le frontend : `await api.get('/mon-module')`

## 7. Passer à PostgreSQL
`pip install "psycopg[binary]"` puis dans `backend/.env` :
`DATABASE_URL=postgresql+psycopg://utilisateur:motdepasse@localhost:5432/icc`

## Règle d'or
Une personne n'existe **qu'une seule fois** dans la table `fideles`. Un module qui parle de personnes
doit stocker un `fidele_id` et ne jamais recopier le nom ou le téléphone. Pour tracer une action, utiliser
`tracer(...)` (`backend/app/historique.py`) : elle apparaît alors dans l'historique de la fiche.
