"""Statistiques : base de données de l'Église, personnes reçues, effectifs des cultes."""
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import now, Affectation, CulteStat, FamilleImpact, Fidele, ParcoursDisciple, User
from ..schemas import CulteIn, CulteOut
from ..security import get_current_user

router = APIRouter(prefix="/api/stats", tags=["Statistiques"])


def _compter_par(db: Session, colonne, campus_id: int | None):
    query = select(colonne, func.count()).where(Fidele.actif.is_(True)).group_by(colonne)
    if campus_id:
        query = query.where(Fidele.campus_id == campus_id)
    return {cle or "non_renseigne": n for cle, n in db.execute(query)}


@router.get("/overview")
def overview(campus_id: int | None = None, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    base = select(func.count()).select_from(Fidele).where(Fidele.actif.is_(True))
    if campus_id:
        base = base.where(Fidele.campus_id == campus_id)
    il_y_a_30j = now() - timedelta(days=30)

    cultes_q = select(CulteStat).order_by(CulteStat.date.desc()).limit(12)
    if campus_id:
        cultes_q = cultes_q.where(CulteStat.campus_id == campus_id)
    cultes = list(reversed(db.scalars(cultes_q).all()))

    return {
        "total_fideles": db.scalar(base),
        "nouveaux_30j": db.scalar(base.where(Fidele.created_at >= il_y_a_30j)),
        "sans_famille": db.scalar(base.where(Fidele.famille_impact_id.is_(None))),
        "nb_familles": db.scalar(select(func.count()).select_from(FamilleImpact)),
        "disciples_en_cours": db.scalar(
            select(func.count()).select_from(ParcoursDisciple).where(ParcoursDisciple.statut == "en_cours")
        ),
        "serviteurs": db.scalar(select(func.count(func.distinct(Affectation.fidele_id)))),
        "par_etape": _compter_par(db, Fidele.etape, campus_id),
        "par_statut": _compter_par(db, Fidele.statut_spirituel, campus_id),
        "par_categorie": _compter_par(db, Fidele.categorie, campus_id),
        "par_sexe": _compter_par(db, Fidele.sexe, campus_id),
        "par_campus": {str(k): v for k, v in _compter_par(db, Fidele.campus_id, None).items()},
        "cultes": [CulteOut.model_validate(c).model_dump(mode="json") for c in cultes],
    }


@router.get("/cultes", response_model=list[CulteOut])
def lister_cultes(campus_id: int | None = None, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    query = select(CulteStat).order_by(CulteStat.date.desc())
    if campus_id:
        query = query.where(CulteStat.campus_id == campus_id)
    return db.scalars(query).all()


@router.post("/cultes", response_model=CulteOut, status_code=201)
def ajouter_culte(data: CulteIn, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    culte = CulteStat(**data.model_dump())
    db.add(culte)
    db.commit()
    db.refresh(culte)
    return culte


@router.delete("/cultes/{culte_id}", status_code=204)
def supprimer_culte(culte_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    culte = db.get(CulteStat, culte_id)
    if not culte:
        raise HTTPException(404, "Culte introuvable")
    db.delete(culte)
    db.commit()
