"""Discipolat : promotions, modules, parcours de chaque disciple et mentorat."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..historique import tracer
from ..models import Fidele, Module, ModuleValide, ParcoursDisciple, Promotion, User
from ..schemas import (ModuleIn, ModuleOut, ParcoursIn, ParcoursOut, ParcoursUpdate,
                       PromotionDetail, PromotionIn)
from ..security import get_current_user, require_admin
from .serializers import parcours_out, promotion_out

router = APIRouter(prefix="/api/discipolat", tags=["Discipolat"])


# ----- Modules -----
@router.get("/modules", response_model=list[ModuleOut])
def lister_modules(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.scalars(select(Module).order_by(Module.ordre, Module.nom)).all()


@router.post("/modules", response_model=ModuleOut, status_code=201)
def creer_module(data: ModuleIn, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    module = Module(**data.model_dump())
    db.add(module)
    try:
        db.commit()
    except IntegrityError:
        raise HTTPException(409, "Un module porte déjà ce nom")
    db.refresh(module)
    return module


@router.delete("/modules/{module_id}", status_code=204)
def supprimer_module(module_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    module = db.get(Module, module_id)
    if not module:
        raise HTTPException(404, "Module introuvable")
    db.delete(module)
    db.commit()


# ----- Promotions -----
@router.get("/promotions")
def lister_promotions(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    promos = db.scalars(select(Promotion).order_by(Promotion.date_debut.desc())).all()
    return [promotion_out(p) for p in promos]


@router.post("/promotions", status_code=201)
def creer_promotion(data: PromotionIn, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    promo = Promotion(**data.model_dump())
    db.add(promo)
    db.commit()
    db.refresh(promo)
    return promotion_out(promo)


@router.get("/promotions/{promo_id}", response_model=PromotionDetail)
def detail_promotion(promo_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    promo = db.get(Promotion, promo_id)
    if not promo:
        raise HTTPException(404, "Promotion introuvable")
    data = promotion_out(promo)
    data["parcours"] = [parcours_out(p) for p in promo.parcours]
    return data


@router.put("/promotions/{promo_id}")
def modifier_promotion(promo_id: int, data: PromotionIn, db: Session = Depends(get_db),
                       _: User = Depends(get_current_user)):
    promo = db.get(Promotion, promo_id)
    if not promo:
        raise HTTPException(404, "Promotion introuvable")
    for champ, valeur in data.model_dump().items():
        setattr(promo, champ, valeur)
    db.commit()
    return promotion_out(promo)


@router.delete("/promotions/{promo_id}", status_code=204)
def supprimer_promotion(promo_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    promo = db.get(Promotion, promo_id)
    if not promo:
        raise HTTPException(404, "Promotion introuvable")
    for p in list(promo.parcours):
        db.delete(p)
    db.delete(promo)
    db.commit()


# ----- Parcours des disciples -----
@router.post("/parcours", response_model=ParcoursOut, status_code=201)
def inscrire(data: ParcoursIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    fidele = db.get(Fidele, data.fidele_id)
    promo = db.get(Promotion, data.promotion_id)
    if not fidele or not promo:
        raise HTTPException(404, "Fidèle ou promotion introuvable")
    parcours = ParcoursDisciple(**data.model_dump())
    db.add(parcours)
    if fidele.etape in ("evangelisation", "accueil"):
        fidele.etape = "discipolat"
    tracer(db, fidele.id, f"Inscrit(e) dans la promotion « {promo.nom} »", user,
           type="affectation", departement="discipolat")
    try:
        db.commit()
    except IntegrityError:
        raise HTTPException(409, "Ce fidèle est déjà inscrit dans cette promotion")
    db.refresh(parcours)
    return parcours_out(parcours)


@router.put("/parcours/{parcours_id}", response_model=ParcoursOut)
def modifier_parcours(parcours_id: int, data: ParcoursUpdate, db: Session = Depends(get_db),
                      _: User = Depends(get_current_user)):
    parcours = db.get(ParcoursDisciple, parcours_id)
    if not parcours:
        raise HTTPException(404, "Parcours introuvable")
    for champ, valeur in data.model_dump(exclude_unset=True).items():
        setattr(parcours, champ, valeur)
    db.commit()
    db.refresh(parcours)
    return parcours_out(parcours)


@router.delete("/parcours/{parcours_id}", status_code=204)
def desinscrire(parcours_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    parcours = db.get(ParcoursDisciple, parcours_id)
    if not parcours:
        raise HTTPException(404, "Parcours introuvable")
    db.delete(parcours)
    db.commit()


@router.post("/parcours/{parcours_id}/modules/{module_id}", response_model=ParcoursOut)
def basculer_module(parcours_id: int, module_id: int, db: Session = Depends(get_db),
                    user: User = Depends(get_current_user)):
    """Coche / décoche un module validé."""
    parcours = db.get(ParcoursDisciple, parcours_id)
    module = db.get(Module, module_id)
    if not parcours or not module:
        raise HTTPException(404, "Parcours ou module introuvable")
    existant = next((m for m in parcours.modules_valides if m.module_id == module_id), None)
    if existant:
        parcours.modules_valides.remove(existant)
    else:
        parcours.modules_valides.append(ModuleValide(module_id=module_id))
        tracer(db, parcours.fidele_id, f"Module validé : {module.nom}", user,
               type="note", departement="discipolat")
    db.commit()
    db.refresh(parcours)
    return parcours_out(parcours)
