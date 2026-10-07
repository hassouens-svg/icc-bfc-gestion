"""
La base unique des fidèles : c'est ici que TOUS les départements lisent et écrivent.
Les pages Évangélisation, Accueil, etc. utilisent ces mêmes routes avec des filtres.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..constants import ETAPES_PARCOURS
from ..database import get_db
from ..historique import tracer
from ..models import Fidele, Suivi, User
from ..schemas import EtapeIn, FideleDetail, FideleIn, FideleOut, SuiviIn, SuiviOut
from ..security import get_current_user, require_admin
from .serializers import parcours_out

router = APIRouter(prefix="/api/fideles", tags=["Fidèles"])

LABEL_ETAPE = {e["code"]: e["label"] for e in ETAPES_PARCOURS}


def _get(db: Session, fidele_id: int) -> Fidele:
    fidele = db.get(Fidele, fidele_id)
    if not fidele:
        raise HTTPException(404, "Fidèle introuvable")
    return fidele


def trouver_doublon(db: Session, data: FideleIn, exclure_id: int | None = None) -> Fidele | None:
    """Aucune duplication : même téléphone, même email, ou même nom+prénom+téléphone vide."""
    conditions = []
    if data.telephone:
        tel = data.telephone.replace(" ", "")
        conditions.append(func.replace(Fidele.telephone, " ", "") == tel)
    if data.email:
        conditions.append(func.lower(Fidele.email) == data.email.lower())
    if not conditions:
        conditions.append(
            (func.lower(Fidele.nom) == data.nom.lower()) & (func.lower(Fidele.prenom) == data.prenom.lower())
        )
    query = select(Fidele).where(or_(*conditions))
    if exclure_id:
        query = query.where(Fidele.id != exclure_id)
    return db.scalar(query)


@router.get("", response_model=list[FideleOut])
def lister(
    q: str | None = Query(None, description="Recherche nom, prénom, téléphone, email"),
    etape: str | None = None,
    statut_spirituel: str | None = None,
    categorie: str | None = None,
    campus_id: int | None = None,
    famille_impact_id: int | None = None,
    sans_famille: bool = False,
    actif: bool | None = True,
    skip: int = 0,
    limit: int = Query(200, le=1000),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = select(Fidele)
    if q:
        like = f"%{q.lower()}%"
        query = query.where(or_(
            func.lower(Fidele.nom).like(like), func.lower(Fidele.prenom).like(like),
            Fidele.telephone.like(like), func.lower(Fidele.email).like(like),
        ))
    if etape:
        query = query.where(Fidele.etape == etape)
    if statut_spirituel:
        query = query.where(Fidele.statut_spirituel == statut_spirituel)
    if categorie:
        query = query.where(Fidele.categorie == categorie)
    if campus_id:
        query = query.where(Fidele.campus_id == campus_id)
    if famille_impact_id:
        query = query.where(Fidele.famille_impact_id == famille_impact_id)
    if sans_famille:
        query = query.where(Fidele.famille_impact_id.is_(None))
    if actif is not None:
        query = query.where(Fidele.actif == actif)
    query = query.order_by(Fidele.created_at.desc()).offset(skip).limit(limit)
    return db.scalars(query).all()


@router.post("", response_model=FideleOut, status_code=201)
def creer(data: FideleIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    doublon = trouver_doublon(db, data)
    if doublon:
        raise HTTPException(409, {
            "message": f"Cette personne existe déjà : {doublon.nom_complet}",
            "fidele_id": doublon.id,
        })
    fidele = Fidele(**data.model_dump())
    db.add(fidele)
    db.flush()
    tracer(db, fidele.id, f"Fiche créée (étape : {LABEL_ETAPE[fidele.etape]})", user, type="note")
    db.commit()
    db.refresh(fidele)
    return fidele


@router.get("/{fidele_id}", response_model=FideleDetail)
def detail(fidele_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    f = _get(db, fidele_id)
    data = FideleOut.model_validate(f).model_dump()
    data["suivis"] = f.suivis
    data["affectations"] = f.affectations
    data["parcours"] = [parcours_out(p) for p in f.parcours]
    data["famille_impact_nom"] = f.famille_impact.nom if f.famille_impact else None
    data["campus_nom"] = f.campus.nom if f.campus else None
    return data


@router.put("/{fidele_id}", response_model=FideleOut)
def modifier(fidele_id: int, data: FideleIn, db: Session = Depends(get_db),
             user: User = Depends(get_current_user)):
    fidele = _get(db, fidele_id)
    doublon = trouver_doublon(db, data, exclure_id=fidele_id)
    if doublon and (data.telephone or data.email):
        raise HTTPException(409, {
            "message": f"Ce téléphone/email appartient déjà à {doublon.nom_complet}",
            "fidele_id": doublon.id,
        })
    ancienne_etape = fidele.etape
    for champ, valeur in data.model_dump().items():
        setattr(fidele, champ, valeur)
    if ancienne_etape != fidele.etape:
        tracer(db, fidele.id, f"Étape : {LABEL_ETAPE[ancienne_etape]} → {LABEL_ETAPE[fidele.etape]}",
               user, type="etape")
    db.commit()
    db.refresh(fidele)
    return fidele


@router.delete("/{fidele_id}", status_code=204)
def supprimer(fidele_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    db.delete(_get(db, fidele_id))
    db.commit()


@router.post("/{fidele_id}/etape", response_model=FideleOut)
def changer_etape(fidele_id: int, data: EtapeIn, db: Session = Depends(get_db),
                  user: User = Depends(get_current_user)):
    fidele = _get(db, fidele_id)
    texte = f"Étape : {LABEL_ETAPE[fidele.etape]} → {LABEL_ETAPE[data.etape]}"
    if data.commentaire:
        texte += f" — {data.commentaire}"
    fidele.etape = data.etape
    tracer(db, fidele.id, texte, user, type="etape")
    db.commit()
    db.refresh(fidele)
    return fidele


@router.get("/{fidele_id}/suivis", response_model=list[SuiviOut])
def lister_suivis(fidele_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return _get(db, fidele_id).suivis


@router.post("/{fidele_id}/suivis", response_model=SuiviOut, status_code=201)
def ajouter_suivi(fidele_id: int, data: SuiviIn, db: Session = Depends(get_db),
                  user: User = Depends(get_current_user)):
    _get(db, fidele_id)
    suivi = tracer(db, fidele_id, data.contenu, user, type=data.type, departement=data.departement)
    db.commit()
    db.refresh(suivi)
    return suivi


@router.delete("/suivis/{suivi_id}", status_code=204)
def supprimer_suivi(suivi_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    suivi = db.get(Suivi, suivi_id)
    if not suivi:
        raise HTTPException(404, "Suivi introuvable")
    db.delete(suivi)
    db.commit()
