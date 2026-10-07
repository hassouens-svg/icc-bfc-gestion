"""Familles d'Impact : affectation des fidèles, pilotes, réunions."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..historique import tracer
from ..models import FamilleImpact, Fidele, ReunionFI, User
from ..schemas import FamilleDetail, FamilleIn, MembreIn, ReunionIn, ReunionOut
from ..security import get_current_user, require_admin
from .serializers import famille_out

router = APIRouter(prefix="/api/familles", tags=["Familles d'Impact"])


def _get(db: Session, famille_id: int) -> FamilleImpact:
    famille = db.get(FamilleImpact, famille_id)
    if not famille:
        raise HTTPException(404, "Famille d'Impact introuvable")
    return famille


@router.get("")
def lister(campus_id: int | None = None, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    query = select(FamilleImpact).order_by(FamilleImpact.nom)
    if campus_id:
        query = query.where(FamilleImpact.campus_id == campus_id)
    return [famille_out(f) for f in db.scalars(query)]


@router.post("", status_code=201)
def creer(data: FamilleIn, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    famille = FamilleImpact(**data.model_dump())
    db.add(famille)
    db.commit()
    db.refresh(famille)
    return famille_out(famille)


@router.get("/{famille_id}", response_model=FamilleDetail)
def detail(famille_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    f = _get(db, famille_id)
    data = famille_out(f)
    data["membres"] = f.membres
    data["reunions"] = f.reunions
    return data


@router.put("/{famille_id}")
def modifier(famille_id: int, data: FamilleIn, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    famille = _get(db, famille_id)
    for champ, valeur in data.model_dump().items():
        setattr(famille, champ, valeur)
    db.commit()
    db.refresh(famille)
    return famille_out(famille)


@router.delete("/{famille_id}", status_code=204)
def supprimer(famille_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    famille = _get(db, famille_id)
    for membre in famille.membres:
        membre.famille_impact_id = None
    db.delete(famille)
    db.commit()


@router.post("/{famille_id}/membres", status_code=201)
def ajouter_membre(famille_id: int, data: MembreIn, db: Session = Depends(get_db),
                   user: User = Depends(get_current_user)):
    famille = _get(db, famille_id)
    fidele = db.get(Fidele, data.fidele_id)
    if not fidele:
        raise HTTPException(404, "Fidèle introuvable")
    fidele.famille_impact_id = famille.id
    tracer(db, fidele.id, f"Affecté(e) à la Famille d'Impact « {famille.nom} »", user,
           type="affectation", departement="familles_impact")
    db.commit()
    return {"ok": True}


@router.delete("/{famille_id}/membres/{fidele_id}", status_code=204)
def retirer_membre(famille_id: int, fidele_id: int, db: Session = Depends(get_db),
                   user: User = Depends(get_current_user)):
    famille = _get(db, famille_id)
    fidele = db.get(Fidele, fidele_id)
    if not fidele or fidele.famille_impact_id != famille.id:
        raise HTTPException(404, "Ce fidèle n'est pas dans cette famille")
    fidele.famille_impact_id = None
    tracer(db, fidele.id, f"Retiré(e) de la Famille d'Impact « {famille.nom} »", user,
           type="affectation", departement="familles_impact")
    db.commit()


@router.post("/{famille_id}/reunions", response_model=ReunionOut, status_code=201)
def ajouter_reunion(famille_id: int, data: ReunionIn, db: Session = Depends(get_db),
                    _: User = Depends(get_current_user)):
    _get(db, famille_id)
    reunion = ReunionFI(famille_id=famille_id, **data.model_dump())
    db.add(reunion)
    db.commit()
    db.refresh(reunion)
    return reunion


@router.delete("/reunions/{reunion_id}", status_code=204)
def supprimer_reunion(reunion_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    reunion = db.get(ReunionFI, reunion_id)
    if not reunion:
        raise HTTPException(404, "Réunion introuvable")
    db.delete(reunion)
    db.commit()
