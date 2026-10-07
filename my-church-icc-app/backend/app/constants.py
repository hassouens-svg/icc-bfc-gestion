"""
Listes de référence de l'application.

👉 C'est LE fichier à modifier pour ajouter une étape du parcours, un département,
   un rôle ou un type de suivi. Le frontend récupère ces listes via GET /api/meta,
   il n'y a donc rien à dupliquer côté interface.
"""

# Parcours d'une personne dans l'Église (dans l'ordre)
ETAPES_PARCOURS = [
    {"code": "evangelisation", "label": "Évangélisation", "description": "La personne est rencontrée"},
    {"code": "accueil", "label": "Accueil & Intégration", "description": "La personne est accueillie et suivie"},
    {"code": "discipolat", "label": "Discipolat", "description": "La personne suit son parcours de disciple"},
    {"code": "famille_disciple", "label": "Famille de disciple", "description": "La personne est intégrée dans une famille"},
    {"code": "famille_impact", "label": "Famille d'Impact", "description": "La personne sert et grandit en communauté"},
    {"code": "membre_actif", "label": "Membre actif", "description": "La personne s'implique et devient leader"},
]

STATUTS_SPIRITUELS = [
    {"code": "contact", "label": "Contact"},
    {"code": "nouveau_converti", "label": "Nouveau converti"},
    {"code": "nouvel_arrivant", "label": "Nouvel arrivant"},
    {"code": "disciple", "label": "Disciple"},
    {"code": "baptise", "label": "Baptisé"},
    {"code": "serviteur", "label": "Serviteur"},
    {"code": "leader", "label": "Leader"},
]

# Catégories utilisées dans les statistiques de l'Église
CATEGORIES_MEMBRE = [
    {"code": "MR", "label": "MR"},
    {"code": "MF", "label": "MF"},
    {"code": "autre", "label": "Ni MR ni MF"},
]

# Départements / ministères de l'Église
DEPARTEMENTS = [
    {"code": "evangelisation", "label": "Évangélisation"},
    {"code": "accueil", "label": "Accueil & Intégration"},
    {"code": "discipolat", "label": "Promotions & Discipolat"},
    {"code": "familles_impact", "label": "Familles d'Impact"},
    {"code": "mpi", "label": "MPI - Ministère de la Prière"},
    {"code": "stars", "label": "Ministère des STARS"},
    {"code": "juniors", "label": "Juniors"},
    {"code": "louange", "label": "Louange"},
    {"code": "technique", "label": "Technique / Média"},
    {"code": "administration", "label": "Administration"},
]

# Rôles dans un département (affectations & responsabilités)
ROLES_AFFECTATION = [
    {"code": "membre", "label": "Membre"},
    {"code": "responsable", "label": "Responsable"},
    {"code": "adjoint", "label": "Adjoint"},
    {"code": "pilote", "label": "Pilote"},
    {"code": "mentor", "label": "Mentor"},
]

# Types d'actions enregistrées dans l'historique d'un fidèle
TYPES_SUIVI = [
    {"code": "note", "label": "Note"},
    {"code": "appel", "label": "Appel (phoning)"},
    {"code": "message", "label": "Message / SMS"},
    {"code": "visite", "label": "Visite"},
    {"code": "rencontre", "label": "Rencontre"},
    {"code": "etape", "label": "Changement d'étape"},
    {"code": "affectation", "label": "Affectation"},
]

# Rôles des comptes utilisateurs (droits d'accès)
ROLES_UTILISATEUR = [
    {"code": "super_admin", "label": "Super administrateur"},
    {"code": "pasteur", "label": "Pasteur"},
    {"code": "responsable", "label": "Responsable de département"},
    {"code": "serviteur", "label": "Serviteur"},
]
# Rôles qui ont accès à l'administration (comptes, campus, suppression)
ROLES_ADMIN = {"super_admin", "pasteur"}


def codes(liste):
    return [item["code"] for item in liste]
