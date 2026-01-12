# 🍞 Le Pain du Jour - Application Standalone

Application de méditation quotidienne pour ICC BFC-ITALIE.

## Fonctionnalités

- 📖 Versets du jour
- 🙏 Temps de prière prophétique (vidéos YouTube)
- 📚 Enseignements quotidiens (vidéos YouTube)
- 📊 Sondage de participation
- 🎯 Quiz interactif avec IA
- 📅 Programmation hebdomadaire (Lundi-Vendredi)
- 📈 Statistiques de suivi

## Installation

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Configurer MONGO_URL et EMERGENT_LLM_KEY dans .env

# Lancer le serveur
python server.py
# ou
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend

```bash
cd frontend
yarn install
cp .env.example .env
# Configurer REACT_APP_BACKEND_URL dans .env

# Lancer en développement
yarn start

# Build pour production
yarn build
```

## Configuration

### Backend (.env)

```
MONGO_URL=mongodb://localhost:27017
DB_NAME=pain_du_jour
EMERGENT_LLM_KEY=sk-emergent-xxx  # Pour la génération de quiz avec IA
```

### Frontend (.env)

```
REACT_APP_BACKEND_URL=http://localhost:8001
```

## Déploiement

### Avec Docker

```bash
# Backend
docker build -t pain-du-jour-backend ./backend
docker run -p 8001:8001 -e MONGO_URL=mongodb://... pain-du-jour-backend

# Frontend
docker build -t pain-du-jour-frontend ./frontend
docker run -p 3000:80 pain-du-jour-frontend
```

### Sur Emergent

1. Créer un nouveau projet
2. Uploader le dossier `backend` et `frontend`
3. Configurer les variables d'environnement
4. Déployer

## Structure

```
pain-du-jour-standalone/
├── backend/
│   ├── server.py          # API FastAPI
│   ├── requirements.txt   # Dépendances Python
│   └── .env.example       # Configuration exemple
├── frontend/
│   ├── src/
│   │   ├── pages/         # Pages React
│   │   ├── components/ui/ # Composants Shadcn
│   │   └── App.js         # Router principal
│   ├── package.json       # Dépendances Node
│   └── .env.example       # Configuration exemple
└── README.md
```

## Utilisateurs par défaut

- `superadmin` / `superadmin123` (Super Admin)
- `pasteur` / `pasteur123` (Pasteur)
- `admin` / `admin123` (Gestion Projet)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/pain-du-jour/today | Contenu du jour |
| GET | /api/pain-du-jour/{date} | Contenu d'une date |
| POST | /api/pain-du-jour | Sauvegarder contenu |
| GET | /api/pain-du-jour/livres | Liste des livres bibliques |
| POST | /api/pain-du-jour/youtube-info | Infos vidéo YouTube |
| POST | /api/pain-du-jour/click | Tracker un clic |
| POST | /api/pain-du-jour/sondage | Soumettre sondage |
| GET | /api/pain-du-jour/stats/{annee} | Statistiques |
| GET | /api/pain-du-jour/programmation/{semaine} | Programmation semaine |
| POST | /api/pain-du-jour/programmation | Sauvegarder programmation |

## Licence

© ICC BFC-ITALIE - Tous droits réservés
