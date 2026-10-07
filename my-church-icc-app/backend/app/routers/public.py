"""Routes publiques (sans connexion) : formulaire d'inscription des nouveaux arrivants."""
from datetime import date

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..historique import tracer
from ..models import Campus, Fidele
from ..schemas import CampusOut, FideleIn
from .fideles import trouver_doublon

router = APIRouter(prefix="/api/public", tags=["Public"])


class InscriptionIn(BaseModel):
    nom: str = Field(min_length=1, max_length=100)
    prenom: str = Field(min_length=1, max_length=100)
    sexe: str | None = None
    telephone: str = Field(min_length=6, max_length=30)
    email: EmailStr | None = None
    ville: str | None = None
    campus_id: int | None = None
    comment_connu: str | None = Field(default=None, max_length=200)
    est_nouveau_converti: bool = False
    message: str | None = Field(default=None, max_length=1000)

    @field_validator("email", "sexe", "ville", mode="before")
    @classmethod
    def vide_en_none(cls, v):
        return None if isinstance(v, str) and not v.strip() else v


@router.get("/campus", response_model=list[CampusOut])
def campus(db: Session = Depends(get_db)):
    return db.scalars(select(Campus).order_by(Campus.nom)).all()


@router.post("/inscription", status_code=201)
def inscription(data: InscriptionIn, db: Session = Depends(get_db)):
    fiche = FideleIn(
        nom=data.nom, prenom=data.prenom, sexe=data.sexe, telephone=data.telephone,
        email=data.email, ville=data.ville, campus_id=data.campus_id,
        statut_spirituel="nouveau_converti" if data.est_nouveau_converti else "nouvel_arrivant",
        etape="accueil", source=data.comment_connu or "formulaire",
        date_premiere_visite=date.today(),
    )
    existant = trouver_doublon(db, fiche)
    if existant:
        # On ne crée pas de doublon : on note simplement le retour de la personne.
        tracer(db, existant.id, "Nouvelle inscription via le formulaire public (personne déjà connue)",
               departement="accueil")
        db.commit()
        return {"ok": True, "message": "Merci ! Heureux de vous revoir."}
    fidele = Fidele(**fiche.model_dump())
    db.add(fidele)
    db.flush()
    tracer(db, fidele.id, "Inscription via le formulaire public" + (f" — {data.message}" if data.message else ""),
           departement="accueil")
    db.commit()
    return {"ok": True, "message": "Merci ! Votre inscription a bien été enregistrée. Bienvenue !"}
