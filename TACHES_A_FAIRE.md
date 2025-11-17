# TÂCHES À CORRIGER

## 1️⃣ BUG URGENT : Responsable Promo - Page blanche lors création visiteur
**Problème** : Quand responsable_promo clique sur "Créer nouveau visiteur", page blanche
**Fichier** : `/app/frontend/src/pages/VisitorsPage.jsx`
**Action** : Vérifier console errors, vérifier les permissions

## 2️⃣ DASHBOARD SUPERVISEUR PROMOS - Nouveau tableau
**Fichier** : `/app/frontend/src/pages/DashboardPage.jsx`
**Ajouts nécessaires** :
- Tableau listant toutes les promos de sa ville
- Colonnes : Nom Promo | Nouveaux Arrivants | Nouveaux Convertis | Taux Fidélisation
- Filtre Promo (dropdown)
- Filtre Mois
- En haut du tableau : "Taux de Fidélisation" pour la promo sélectionnée
- Si "Toutes les promos" : moyenne des 12 promos

## 3️⃣ CALCUL FIDÉLISATION
**Formule** : À définir avec l'utilisateur
- Par promo
- Par mois
- Moyenne sur toutes les promos

## 4️⃣ SCOPE
- Superviseur voit uniquement SA ville
- Filtre par promo (sa ville uniquement)
- Filtre par mois

