"""Formats des données échangées avec le frontend (validation automatique)."""
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from .constants import (
    CATEGORIES_MEMBRE, DEPARTEMENTS, ETAPES_PARCOURS, ROLES_AFFECTATION,
    ROLES_UTILISATEUR, STATUTS_SPIRITUELS, TYPES_SUIVI, codes,
)


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


def _check(value, liste, nom):
    if value is not None and value not in codes(liste):
        raise ValueError(f"{nom} inconnu : {value}")
    return value


# ---------- Auth & utilisateurs ----------
class LoginIn(BaseModel):
    username: str
    password: str


class UserOut(ORM):
    id: int
    username: str
    nom_complet: str
    role: str
    departement: str | None = None
    campus_id: int | None = None
    actif: bool


class UserIn(BaseModel):
    username: str = Field(min_length=3)
    nom_complet: str
    password: str | None = Field(default=None, min_length=6)
    role: str = "serviteur"
    departement: str | None = None
    campus_id: int | None = None
    actif: bool = True

    _r = field_validator("role")(lambda cls, v: _check(v, ROLES_UTILISATEUR, "Rôle"))
    _d = field_validator("departement")(lambda cls, v: _check(v, DEPARTEMENTS, "Département"))


class TokenOut(BaseModel):
    token: str
    user: UserOut


# ---------- Campus ----------
class CampusIn(BaseModel):
    nom: str
    ville: str | None = None
    pays: str | None = None


class CampusOut(ORM, CampusIn):
    id: int


# ---------- Fidèles ----------
class FideleBase(BaseModel):
    nom: str = Field(min_length=1)
    prenom: str = Field(min_length=1)
    sexe: str | None = None
    date_naissance: date | None = None
    telephone: str | None = None
    email: EmailStr | None = None
    adresse: str | None = None
    ville: str | None = None
    campus_id: int | None = None
    statut_spirituel: str = "contact"
    etape: str = "accueil"
    categorie: str = "autre"
    source: str | None = None
    date_premiere_visite: date | None = None
    famille_impact_id: int | None = None
    notes: str | None = None
    actif: bool = True

    @field_validator("email", "telephone", "adresse", "ville", "sexe", "source", "notes", mode="before")
    @classmethod
    def vide_en_none(cls, v):
        return None if isinstance(v, str) and not v.strip() else v

    _s = field_validator("statut_spirituel")(lambda cls, v: _check(v, STATUTS_SPIRITUELS, "Statut"))
    _e = field_validator("etape")(lambda cls, v: _check(v, ETAPES_PARCOURS, "Étape"))
    _c = field_validator("categorie")(lambda cls, v: _check(v, CATEGORIES_MEMBRE, "Catégorie"))


class FideleIn(FideleBase):
    pass


class FideleOut(ORM, FideleBase):
    id: int
    created_at: datetime
    updated_at: datetime
    email: str | None = None  # pas de revalidation en sortie


class FideleMini(ORM):
    id: int
    nom: str
    prenom: str
    telephone: str | None = None
    etape: str


class SuiviIn(BaseModel):
    type: str = "note"
    contenu: str = Field(min_length=1)
    departement: str | None = None

    _t = field_validator("type")(lambda cls, v: _check(v, TYPES_SUIVI, "Type de suivi"))
    _d = field_validator("departement")(lambda cls, v: _check(v, DEPARTEMENTS, "Département"))


class SuiviOut(ORM):
    id: int
    fidele_id: int
    departement: str | None
    type: str
    contenu: str
    auteur: str | None
    date: datetime


class EtapeIn(BaseModel):
    etape: str
    commentaire: str | None = None

    _e = field_validator("etape")(lambda cls, v: _check(v, ETAPES_PARCOURS, "Étape"))


# ---------- Affectations ----------
class AffectationIn(BaseModel):
    fidele_id: int
    departement: str
    role: str = "membre"
    date_debut: date | None = None
    commentaire: str | None = None

    _d = field_validator("departement")(lambda cls, v: _check(v, DEPARTEMENTS, "Département"))
    _r = field_validator("role")(lambda cls, v: _check(v, ROLES_AFFECTATION, "Rôle"))


class AffectationOut(ORM):
    id: int
    fidele_id: int
    departement: str
    role: str
    date_debut: date | None
    commentaire: str | None
    fidele: FideleMini | None = None


# ---------- Familles d'Impact ----------
class FamilleIn(BaseModel):
    nom: str
    campus_id: int | None = None
    secteur: str | None = None
    adresse: str | None = None
    jour_reunion: str | None = None
    heure_reunion: str | None = None
    pilote_id: int | None = None


class FamilleOut(ORM, FamilleIn):
    id: int
    pilote: FideleMini | None = None
    nb_membres: int = 0


class ReunionIn(BaseModel):
    date: date
    theme: str | None = None
    nb_presents: int = 0
    nb_invites: int = 0
    notes: str | None = None


class ReunionOut(ORM, ReunionIn):
    id: int
    famille_id: int


class FamilleDetail(FamilleOut):
    membres: list[FideleMini] = []
    reunions: list[ReunionOut] = []


class MembreIn(BaseModel):
    fidele_id: int


# ---------- Discipolat ----------
class ModuleIn(BaseModel):
    nom: str
    ordre: int = 0
    description: str | None = None


class ModuleOut(ORM, ModuleIn):
    id: int


class PromotionIn(BaseModel):
    nom: str
    campus_id: int | None = None
    date_debut: date | None = None
    date_fin: date | None = None


class PromotionOut(ORM, PromotionIn):
    id: int
    nb_disciples: int = 0


class ParcoursIn(BaseModel):
    fidele_id: int
    promotion_id: int
    mentor_id: int | None = None
    statut: str = "en_cours"


class ParcoursUpdate(BaseModel):
    mentor_id: int | None = None
    statut: str | None = None


class ParcoursOut(ORM):
    id: int
    fidele_id: int
    promotion_id: int
    mentor_id: int | None
    statut: str
    fidele: FideleMini
    mentor: FideleMini | None = None
    modules_valides: list[int] = []
    promotion_nom: str | None = None


class PromotionDetail(PromotionOut):
    parcours: list[ParcoursOut] = []


# ---------- Agenda ----------
class EvenementIn(BaseModel):
    titre: str
    date: datetime
    lieu: str | None = None
    departement: str | None = None
    campus_id: int | None = None
    description: str | None = None


class EvenementOut(ORM, EvenementIn):
    id: int


# ---------- Statistiques ----------
class CulteIn(BaseModel):
    date: date
    campus_id: int | None = None
    hommes: int = 0
    femmes: int = 0
    enfants: int = 0
    nouveaux: int = 0
    personnes_de_passage: int = 0


class CulteOut(ORM, CulteIn):
    id: int
    total: int


# ---------- Fiche complète (vue 360°) ----------
class FideleDetail(FideleOut):
    suivis: list[SuiviOut] = []
    affectations: list[AffectationOut] = []
    parcours: list[ParcoursOut] = []
    famille_impact_nom: str | None = None
    campus_nom: str | None = None
