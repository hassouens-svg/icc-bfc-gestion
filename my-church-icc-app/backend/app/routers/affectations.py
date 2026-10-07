"""Services & ministères : qui sert où (STARS, Juniors, Louange, MPI...)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..constants import DEPARTEMENTS
from ..database import get_db
from ..historique import tracer
from ..models import Affectation, Fidele, User
from ..schemas import AffectationIn, AffectationOut
from ..security import get_current_user

router = APIRouter(prefix="/api/affectations", tags=["Services & ministères"])
LABEL_DEPT = {d["code"]: d["label"] for d in DEPARTEMENTS}


@router.get("", response_model=list[AffectationOut])
def lister(departement: str | None = None, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    query = select(Affectation).order_by(Affectation.departement)
    if departement:
        query = query.where(Affectation.departement == departement)
    return db.scalars(query).all()


@router.post("", response_model=AffectationOut, status_code=201)
def creer(data: AffectationIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not db.get(Fidele, data.fidele_id):
        raise HTTPException(404, "Fidèle introuvable")
    affectation = Affectation(**data.model_dump(exclude_none=True))
    db.add(affectation)
    tracer(db, data.fidele_id, f"Affecté(e) : {LABEL_DEPT[data.departement]} ({data.role})", user,
           type="affectation", departement=data.departement)
    try:
        db.commit()
    except IntegrityError:
        raise HTTPException(409, "Cette affectation existe déjà")
    db.refresh(affectation)
    return affectation


@router.delete("/{affectation_id}", status_code=204)
def supprimer(affectation_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    affectation = db.get(Affectation, affectation_id)
    if not affectation:
        raise HTTPException(404, "Affectation introuvable")
    tracer(db, affectation.fidele_id, f"Fin d'affectation : {LABEL_DEPT.get(affectation.departement)}",
           user, type="affectation", departement=affectation.departement)
    db.delete(affectation)
    db.commit()
