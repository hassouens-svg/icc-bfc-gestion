# Refactoring de server.py

## État actuel
- `server.py` : 4790 lignes - MONOLITHE CRITIQUE
- Tous les endpoints, modèles, et logique dans un seul fichier

## Structure cible
```
/app/backend/
├── server.py (fichier principal simplifié)
├── models/
│   ├── __init__.py
│   ├── users.py
│   ├── visitors.py
│   ├── events.py
│   ├── planning.py
│   └── fi.py (Familles d'Impact)
├── routers/
│   ├── __init__.py
│   ├── auth.py
│   ├── users.py
│   ├── visitors.py
│   ├── cities.py
│   ├── analytics.py
│   ├── fi.py (Familles d'Impact)
│   ├── events.py (Projets & Communication)
│   ├── planning.py
│   └── culte_stats.py
└── utils/
    ├── __init__.py
    ├── database.py (MongoDB connection)
    └── auth.py (JWT, password hashing)
```

## Stratégie de migration progressive

### Phase 1 : Utilitaires (✅ FAIT)
- [x] Créer `utils/database.py` pour la connexion MongoDB
- [x] Créer `utils/auth.py` pour JWT et authentification
- [x] Créer les répertoires `models/` et `routers/`

### Phase 2 : Extraction des routes indépendantes (À FAIRE)
Ordre de priorité pour minimiser les risques :
1. Planning des activités (petit module, récent, bien délimité)
2. Contact Groups (petit, indépendant)
3. Communication & Events (moyennement couplé)
4. Auth & Users (critique mais bien défini)
5. Visitors (gros module, beaucoup de dépendances)
6. Familles d'Impact (module complexe)
7. Analytics (dépend de tous les autres)

### Phase 3 : Nettoyage final
- Supprimer le code dupliqué de server.py
- Valider que tout fonctionne
- Tests complets

## Commandes de test après chaque migration
```bash
# Vérifier que le backend démarre
sudo supervisorctl restart backend
sudo supervisorctl status backend

# Tester les endpoints principaux
curl -X POST http://localhost:8001/api/auth/login -H "Content-Type: application/json" -d '{"username":"superadmin","password":"superadmin123","city":"Dijon"}'

# Tester avec l'agent de testing
```

## Notes importantes
- **TOUJOURS tester après chaque extraction**
- **NE PAS** supprimer le code de server.py tant que les routes ne sont pas validées
- **Garder** le système fonctionnel à chaque étape
- La migration complète pourrait prendre plusieurs sessions
