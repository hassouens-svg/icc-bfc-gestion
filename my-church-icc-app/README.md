# My Church ICC App — ICC BFC-Italie

> **Une seule base de données : les FIDÈLES au cœur de tout le système.**
> 1 fidèle = 1 fiche unique, partagée par tous les départements.

Plateforme centralisée de gestion de l'Église (Impact Centre Chrétien — Bourgogne-Franche-Comté et Italie).

```
   ÉVANGÉLISATION ─┐                        ┌─ FAMILLES D'IMPACT
 ACCUEIL & INTÉGR. ─┼──►  BASE UNIQUE   ◄───┼─ STATISTIQUES
        DISCIPOLAT ─┘     LES FIDÈLES       └─ AUTRES DÉPARTEMENTS (STARS, MPI, Juniors, Agenda…)

Parcours :  Évangélisation → Accueil → Discipolat → Famille de disciple → Famille d'Impact → Membre actif
```

## Fonctionnalités

| Module | Ce qu'on peut faire |
|---|---|
| **Les Fidèles** | Fiche unique (identité, coordonnées, campus, statut spirituel, catégorie MR/MF), recherche, filtres, **détection des doublons** (même téléphone ou email) |
| **Fiche 360°** | Parcours cliquable, affectations & responsabilités, discipolat, Famille d'Impact, **historique de toutes les actions** de tous les départements |
| **Évangélisation** | Enregistrement des nouveaux convertis, phoning (compte rendu d'appel), passage à l'Accueil |
| **Accueil & Intégration** | Nouveaux arrivants, suivi, affectation initiale, **formulaire public** `/inscription` (lien / QR code) |
| **Discipolat** | Promotions, modules (PCNC, Au cœur de la Bible, STAR…), cases à cocher par disciple, mentor, statut |
| **Familles d'Impact** | Familles, pilotes, membres, réunions (présents / invités), liste des fidèles à intégrer |
| **Services & ministères** | STARS, MPI, Juniors, Louange… : qui sert où et avec quel rôle |
| **Statistiques** | MR / MF / ni MR ni MF, par étape, statut, campus, sexe, effectifs des cultes |
| **Agenda** | Événements de l'Église par département / campus |
| **Administration** | Comptes de connexion (rôles), campus |

## Technologies (simples et répandues)

- **Backend** : Python 3.11+ · [FastAPI](https://fastapi.tiangolo.com) · SQLAlchemy · SQLite par défaut (PostgreSQL possible)
- **Frontend** : React 18 · Vite · Tailwind CSS · icônes [lucide](https://lucide.dev/icons)

## Démarrage rapide

### Option 1 — avec Docker (le plus simple)
```bash
docker compose up --build
```
Ouvrir http://localhost:5173

### Option 2 — sans Docker

**Backend** (terminal 1) :
```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows : .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # Windows : copy .env.example .env
uvicorn app.main:app --reload
```
API : http://localhost:8000 · Documentation interactive : **http://localhost:8000/docs**

**Frontend** (terminal 2) :
```bash
cd frontend
npm install
npm run dev
```
Application : http://localhost:5173

### Comptes de démonstration

| Identifiant | Mot de passe | Rôle |
|---|---|---|
| `admin` | `admin123` | Super administrateur |
| `pasteur` | `pasteur123` | Pasteur |
| `accueil` | `accueil123` | Responsable Accueil |

⚠️ Les données de démonstration (personnes, campus…) sont **fictives**. En production : mettre `SEED_DEMO_DATA=false`, changer `SECRET_KEY` et le mot de passe `admin`.

### Tests
```bash
cd backend && pytest
```

## Organisation du code

```
backend/
  app/
    constants.py     ← ⭐ listes : étapes du parcours, départements, statuts, rôles…
    models.py        ← tables de la base (Fidele au centre)
    schemas.py       ← formats des données de l'API
    routers/         ← un fichier par module (fideles.py, familles.py, discipolat.py…)
    historique.py    ← trace chaque action dans l'historique du fidèle
    seed.py          ← données initiales / démo
    main.py          ← point d'entrée
  tests/
frontend/
  src/
    config/site.js          ← ⭐ nom de l'Église, bandeau défilant, annonce
    config/departements.js  ← ⭐ cartes de la page d'accueil
    pages/                  ← une page par écran
    components/             ← composants réutilisables (Layout, formulaires, tableaux)
    lib/api.js              ← appels au backend
```

👉 Voir **[docs/GUIDE_MODIFICATION.md](docs/GUIDE_MODIFICATION.md)** pour les modifications courantes, pas à pas,
et **[CONTRIBUTING.md](CONTRIBUTING.md)** pour travailler à plusieurs sur GitHub.
