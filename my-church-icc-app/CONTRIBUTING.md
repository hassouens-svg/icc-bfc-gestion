# Travailler à plusieurs

1. Récupérer le projet : `git clone <url-du-dépôt>`
2. Créer une branche par modification : `git checkout -b ma-modification`
3. Vérifier que tout fonctionne : `cd backend && pytest` puis `cd frontend && npm run build`
4. Envoyer : `git push -u origin ma-modification`, puis ouvrir une Pull Request sur GitHub
5. L'autre personne relit, puis fusionne dans `main`

Conventions : code et textes en français, une page = un fichier dans `frontend/src/pages`,
un module d'API = un fichier dans `backend/app/routers`.
