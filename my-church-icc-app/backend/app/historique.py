"""Petit utilitaire pour tracer chaque action dans l'historique du fidèle."""
from sqlalchemy.orm import Session

from .models import Suivi, User


def tracer(db: Session, fidele_id: int, contenu: str, user: User | None = None,
           type: str = "note", departement: str | None = None) -> Suivi:
    suivi = Suivi(
        fidele_id=fidele_id,
        contenu=contenu,
        type=type,
        departement=departement or (user.departement if user else None),
        auteur=user.nom_complet if user else "Formulaire public",
    )
    db.add(suivi)
    return suivi
