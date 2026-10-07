"""Listes de référence pour le frontend (voir app/constants.py)."""
from fastapi import APIRouter

from .. import constants

router = APIRouter(prefix="/api/meta", tags=["Référentiels"])


@router.get("")
def meta():
    return {
        "etapes": constants.ETAPES_PARCOURS,
        "statuts": constants.STATUTS_SPIRITUELS,
        "categories": constants.CATEGORIES_MEMBRE,
        "departements": constants.DEPARTEMENTS,
        "roles_affectation": constants.ROLES_AFFECTATION,
        "types_suivi": constants.TYPES_SUIVI,
        "roles_utilisateur": constants.ROLES_UTILISATEUR,
    }
