"""Administration : campus et comptes utilisateurs (réservé super_admin / pasteur)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Campus, User
from ..schemas import CampusIn, CampusOut, UserIn, UserOut
from ..security import get_current_user, hash_password, require_admin

router = APIRouter(prefix="/api", tags=["Administration"])


@router.get("/campus", response_model=list[CampusOut])
def lister_campus(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.scalars(select(Campus).order_by(Campus.nom)).all()


@router.post("/campus", response_model=CampusOut, status_code=201)
def creer_campus(data: CampusIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    campus = Campus(**data.model_dump())
    db.add(campus)
    try:
        db.commit()
    except IntegrityError:
        raise HTTPException(409, "Ce campus existe déjà")
    db.refresh(campus)
    return campus


@router.put("/campus/{campus_id}", response_model=CampusOut)
def modifier_campus(campus_id: int, data: CampusIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    campus = db.get(Campus, campus_id)
    if not campus:
        raise HTTPException(404, "Campus introuvable")
    for champ, valeur in data.model_dump().items():
        setattr(campus, champ, valeur)
    db.commit()
    db.refresh(campus)
    return campus


@router.get("/users", response_model=list[UserOut])
def lister_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.scalars(select(User).order_by(User.username)).all()


@router.post("/users", response_model=UserOut, status_code=201)
def creer_user(data: UserIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    if not data.password:
        raise HTTPException(422, "Mot de passe obligatoire (6 caractères minimum)")
    user = User(**data.model_dump(exclude={"password"}), password_hash=hash_password(data.password))
    user.username = user.username.strip().lower()
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        raise HTTPException(409, "Cet identifiant est déjà utilisé")
    db.refresh(user)
    return user


@router.put("/users/{user_id}", response_model=UserOut)
def modifier_user(user_id: int, data: UserIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "Utilisateur introuvable")
    for champ, valeur in data.model_dump(exclude={"password"}).items():
        setattr(user, champ, valeur)
    user.username = user.username.strip().lower()
    if data.password:
        user.password_hash = hash_password(data.password)
    try:
        db.commit()
    except IntegrityError:
        raise HTTPException(409, "Cet identifiant est déjà utilisé")
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=204)
def supprimer_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    if user_id == admin.id:
        raise HTTPException(400, "Vous ne pouvez pas supprimer votre propre compte")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "Utilisateur introuvable")
    db.delete(user)
    db.commit()
