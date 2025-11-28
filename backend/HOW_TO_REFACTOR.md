# Guide de Refactorisation Sûre de server.py

## ⚠️ AVERTISSEMENT
**server.py fait 4790 lignes et est CRITIQUE en production.**  
**Ne jamais refactoriser sans tests complets et backup.**

## Stratégie recommandée : Refactoring Incrémental

### Phase 1 : Préparation (FAIT ✅)
```bash
/app/backend/
├── utils/
│   ├── database.py  # Connexion MongoDB
│   └── auth.py      # JWT, hashing, get_current_user
├── models/          # Pour futurs modèles Pydantic
└── routers/         # Pour futurs routers FastAPI
```

### Phase 2 : Extraction du premier module (PLANNING)

#### Étape 1 : Créer le modèle
```python
# /app/backend/models/planning.py
from pydantic import BaseModel, Field
from datetime import datetime, timezone
import uuid

class PlanningActivite(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nom: str
    date: str
    ministeres: str  # Texte libre
    statut: str
    commentaire: str = ""
    ville: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
```

#### Étape 2 : Créer le router
```python
# /app/backend/routers/planning.py
from fastapi import APIRouter, Depends, HTTPException
from models.planning import PlanningActivite
from utils.database import db
from utils.auth import get_current_user
from datetime import datetime, timezone

router = APIRouter(prefix="/planning", tags=["Planning"])

@router.get("/activites")
async def get_activites(ville: str, user: dict = Depends(get_current_user)):
    activites = await db.planning_activites.find(
        {"ville": ville}, 
        {"_id": 0}
    ).sort("date", 1).to_list(1000)
    return activites

@router.post("/activites")
async def create_activite(activite: PlanningActivite, user: dict = Depends(get_current_user)):
    activite_dict = activite.model_dump()
    activite_dict["created_by"] = user["username"]
    await db.planning_activites.insert_one(activite_dict)
    return {"message": "Activité créée", "id": activite.id}

@router.put("/activites/{activite_id}")
async def update_activite(activite_id: str, activite: PlanningActivite, user: dict = Depends(get_current_user)):
    activite_dict = activite.model_dump()
    activite_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.planning_activites.update_one(
        {"id": activite_id},
        {"$set": activite_dict}
    )
    return {"message": "Activité mise à jour"}

@router.delete("/activites/{activite_id}")
async def delete_activite(activite_id: str, user: dict = Depends(get_current_user)):
    await db.planning_activites.delete_one({"id": activite_id})
    return {"message": "Activité supprimée"}
```

#### Étape 3 : Intégrer dans server.py
```python
# Dans server.py, APRÈS la ligne 49 (api_router = APIRouter(prefix="/api"))

from routers import planning

# ... (garder tout le code existant) ...

# AVANT la ligne "app.include_router(api_router)"
api_router.include_router(planning.router)

# Puis include comme d'habitude
app.include_router(api_router)
```

#### Étape 4 : Tester
```bash
# Redémarrer le backend
sudo supervisorctl restart backend

# Tester l'endpoint
curl -X GET "http://localhost:8001/api/planning/activites?ville=Dijon" \
  -H "Authorization: Bearer <TOKEN>"

# Vérifier que le frontend fonctionne
# Aller sur http://localhost:3000/events/planning
```

#### Étape 5 : Nettoyer (SEULEMENT si tests OK)
```python
# Commenter ou supprimer les lignes 4514-4569 de server.py
# (le modèle PlanningActivite et les 4 endpoints)
```

### Phase 3 : Répéter pour chaque module

**Ordre suggéré** (du plus simple au plus complexe) :
1. ✅ Planning (80 lignes) - **À faire en premier**
2. Contact Groups Email + SMS (70 lignes)
3. Évangélisation (130 lignes)
4. Culte Stats (210 lignes)
5. Projects & Events (540 lignes)
6. Cities (310 lignes)
7. Users (270 lignes)
8. Visitors (380 lignes)
9. Familles d'Impact (610 lignes)
10. Analytics (370 lignes)

### Template pour chaque module

```python
# 1. models/<module>.py
from pydantic import BaseModel
# Copier les modèles Pydantic du module

# 2. routers/<module>.py
from fastapi import APIRouter, Depends, HTTPException
from models.<module> import *
from utils.database import db
from utils.auth import get_current_user

router = APIRouter(prefix="/<module>", tags=["<Module>"])

# Copier tous les endpoints du module

# 3. Dans server.py
from routers import <module>
api_router.include_router(<module>.router)

# 4. Tester et valider

# 5. Commenter/supprimer l'ancien code
```

## 🧪 Tests obligatoires après chaque extraction

### Tests Backend
```bash
# 1. Le serveur démarre
sudo supervisorctl restart backend
tail -f /var/log/supervisor/backend.err.log

# 2. Endpoint de santé
curl http://localhost:8001/api/

# 3. Login fonctionne
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"superadmin123","city":"Dijon"}'

# 4. Module extrait fonctionne
curl -X GET "http://localhost:8001/api/<module>/<endpoint>" \
  -H "Authorization: Bearer <TOKEN>"
```

### Tests Frontend
```bash
# Vérifier que les pages se chargent
# Tester les fonctionnalités du module extrait
# Vérifier qu'aucune autre fonctionnalité n'est cassée
```

## ❌ ERREURS À ÉVITER

1. **Ne jamais** extraire plusieurs modules à la fois
2. **Ne jamais** supprimer le code de server.py avant validation complète
3. **Ne jamais** refactoriser sans backup de la base de données
4. **Ne jamais** deployer en production sans tests complets
5. **Ne jamais** oublier les imports relatifs (`.` vs chemin absolu)

## 🎯 Objectif final

```
/app/backend/
├── server.py (200 lignes - juste l'app principale + middleware)
├── models/
│   ├── users.py
│   ├── visitors.py
│   ├── events.py
│   ├── planning.py
│   ├── fi.py
│   └── ...
├── routers/
│   ├── auth.py
│   ├── users.py
│   ├── visitors.py
│   ├── planning.py
│   ├── events.py
│   ├── fi.py
│   └── ...
└── utils/
    ├── database.py
    ├── auth.py
    └── helpers.py
```

## 📚 Ressources
- FastAPI Bigger Applications: https://fastapi.tiangolo.com/tutorial/bigger-applications/
- ARCHITECTURE.md : Vue d'ensemble complète du système
- REFACTORING_README.md : Statut de la refactorisation

## 🤝 Conclusion
**La refactorisation doit être progressive, testée, et documentée.**  
**Chaque extraction est une mini-migration indépendante.**  
**La stabilité du système est TOUJOURS prioritaire.**
