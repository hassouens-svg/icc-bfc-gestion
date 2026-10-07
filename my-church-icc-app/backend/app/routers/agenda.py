"""Agenda de l'Église."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import now, Evenement, User
from ..schemas import EvenementIn, EvenementOut
from ..security import get_current_user

router = APIRouter(prefix="/api/agenda", tags=["Agenda"])


@router.get("", response_model=list[EvenementOut])
def lister(a_venir: bool = False, departement: str | None = None, db: Session = Depends(get_db),
           _: User = Depends(get_current_user)):
    query = select(Evenement).order_by(Evenement.date)
    if a_venir:
        query = query.where(Evenement.date >= now())
    if departement:
        query = query.where(Evenement.departement == departement)
    return db.scalars(query).all()


@router.post("", response_model=EvenementOut, status_code=201)
def creer(data: EvenementIn, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    evt = Evenement(**data.model_dump())
    db.add(evt)
    db.commit()
    db.refresh(evt)
    return evt


@router.put("/{evt_id}", response_model=EvenementOut)
def modifier(evt_id: int, data: EvenementIn, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    evt = db.get(Evenement, evt_id)
    if not evt:
        raise HTTPException(404, "Événement introuvable")
    for champ, valeur in data.model_dump().items():
        setattr(evt, champ, valeur)
    db.commit()
    db.refresh(evt)
    return evt


@router.delete("/{evt_id}", status_code=204)
def supprimer(evt_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    evt = db.get(Evenement, evt_id)
    if not evt:
        raise HTTPException(404, "Événement introuvable")
    db.delete(evt)
    db.commit()
