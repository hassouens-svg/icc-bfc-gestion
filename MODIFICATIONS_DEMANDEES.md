# MODIFICATIONS DEMANDÉES - CONSOLIDATION COMPLÈTE

## PARTIE 1: DASHBOARDS (superadmin, pasteur, responsable_eglise)

### 1.1 Réorganisation des KPIs (lignes 583-640)
**AVANT:** 5 cartes
1. Total Promos
2. Total Personnes Reçues  
3. Nouveaux Arrivants
4. Nouveaux Convertis
5. Fidélisation Moyenne

**APRÈS:** 7 cartes (dans l'ordre)
1. Total Personnes Reçues (= total visiteurs du tableau)
2. Nombre NA (= Total Personnes Reçues)
3. Nombre NC
4. Nombre "De Passage"
5. Nombre Suivis Arrêtés
6. Nombre Personnes Suivies (= NA - Suivis Arrêtés)
7. Fidélisation Moyenne

### 1.2 Logique des calculs
- NA = Total personnes reçues (tous sont NA au départ)
- Personnes suivies = NA - Suivis arrêtés
- Dans le tableau "Fidélisation par Promo": 
  - NA = Personnes reçues
  - Personnes suivies = NA - Suivis arrêtés

### 1.3 Tableau Fidélisation par Promo
- Doit se mettre à jour avec les présences JEUDI cochées (actuellement 0)
- Respecter la pondération: 40% dimanche + 60% jeudi

### 1.4 Permission "Gérer villes"
- Visible UNIQUEMENT pour: superadmin, pasteur
- CACHER pour: superviseur_promos, tous les autres

## PARTIE 2: VUE FAMILLE D'IMPACT

### 2.1 Réorganisation layout
- Déplacer tableau "Fidélisation par Famille d'Impact" 
- Le mettre juste SOUS "Analyse des Présences FI par Date"
- Le filtre date doit agir sur le tableau

### 2.2 Calcul fidélisation FI
- Basé sur présences cochées par PILOTES
- Exemple: FI République centre: 8 membres, 4 présences = 50%
- KPIs = total pour TOUTES les FI

### 2.3 Remontée présences
Présences cochées par pilote (bouton vert) doivent remonter à:
- Responsable de secteur
- Superviseur FI  
- Dashboards: pasteur, superadmin, responsable d'église

### 2.4 Dashboard PILOTE
- Ajouter tableau de présence en bas des KPIs
- Dans section "Analyse des Présences FI"

### 2.5 Dashboard SUPERVISEUR FI
- Corriger: rien ne s'affiche dans filtres secteurs et FI
- Ajouter tableau de présence en bas des KPIs
- STABILISER: messages d'erreur, chiffres qui bougent

### 2.6 Dashboard RESPONSABLE SECTEUR
- STABILISER: messages d'erreur, chiffres qui bougent

## PARTIE 3: PERMISSIONS & ACCÈS

### 3.1 Création d'accès
- **Responsable de secteur**: peut créer UNIQUEMENT "pilote"
- **Superviseur FI**: peut créer "pilote" ET "responsable de secteur"

### 3.2 Liste des rôles
- Superviseur FI a: [pilote, responsable_secteur]
- Responsable secteur a: [pilote]

### 3.3 Attribution FI
- Responsable secteur peut attribuer pilotes existants aux FI de son secteur

## ORDRE D'IMPLÉMENTATION

1. ✅ Backend: Ajouter champs manquants (de_passage, suivi_arrete) à modèle Visitor
2. ✅ Backend: Corriger calcul fidélisation pour inclure présences jeudi
3. ✅ Frontend: Réorganiser KPIs dashboards
4. ✅ Frontend: Corriger tableau Fidélisation par Promo
5. ✅ Frontend: Permissions "Gérer villes"
6. ✅ Frontend: Réorganiser layout FI
7. ✅ Frontend: Stabiliser dashboards FI (pilote, superviseur, resp secteur)
8. ✅ Backend: Permissions création d'accès
9. ✅ Frontend: Attribution pilotes par resp secteur
