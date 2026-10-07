"""
Modèle de données.

Principe : UNE seule table `fideles` au cœur du système (1 fidèle = 1 fiche unique).
Tous les départements (évangélisation, accueil, discipolat, familles d'impact,
services...) se rattachent à cette fiche au lieu de dupliquer les personnes.
"""
from datetime import UTC, date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def now():
    """Date/heure actuelle en UTC (sans fuseau, pour SQLite)."""
    return datetime.now(UTC).replace(tzinfo=None)


class Campus(Base):
    __tablename__ = "campus"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(100), unique=True)
    ville: Mapped[str | None] = mapped_column(String(100))
    pays: Mapped[str | None] = mapped_column(String(100))


class User(Base):
    """Compte de connexion (serviteur, responsable, pasteur, admin)."""
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    nom_complet: Mapped[str] = mapped_column(String(200))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(50), default="serviteur")
    departement: Mapped[str | None] = mapped_column(String(50))
    campus_id: Mapped[int | None] = mapped_column(ForeignKey("campus.id"))
    actif: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class Fidele(Base):
    """La fiche unique d'une personne."""
    __tablename__ = "fideles"

    id: Mapped[int] = mapped_column(primary_key=True)
    # Identité
    nom: Mapped[str] = mapped_column(String(100), index=True)
    prenom: Mapped[str] = mapped_column(String(100), index=True)
    sexe: Mapped[str | None] = mapped_column(String(1))  # "H" / "F"
    date_naissance: Mapped[date | None] = mapped_column(Date)
    # Coordonnées
    telephone: Mapped[str | None] = mapped_column(String(30), index=True)
    email: Mapped[str | None] = mapped_column(String(200), index=True)
    adresse: Mapped[str | None] = mapped_column(String(300))
    ville: Mapped[str | None] = mapped_column(String(100))
    # Église / campus
    campus_id: Mapped[int | None] = mapped_column(ForeignKey("campus.id"))
    # Statut & parcours
    statut_spirituel: Mapped[str] = mapped_column(String(50), default="contact")
    etape: Mapped[str] = mapped_column(String(50), default="accueil", index=True)
    categorie: Mapped[str] = mapped_column(String(20), default="autre")  # MR / MF / autre
    source: Mapped[str | None] = mapped_column(String(100))  # évangélisation, culte, invitation, formulaire...
    date_premiere_visite: Mapped[date | None] = mapped_column(Date)
    famille_impact_id: Mapped[int | None] = mapped_column(ForeignKey("familles_impact.id"))
    notes: Mapped[str | None] = mapped_column(Text)
    actif: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=now, onupdate=now)

    campus: Mapped[Campus | None] = relationship()
    famille_impact: Mapped["FamilleImpact | None"] = relationship(
        back_populates="membres", foreign_keys=[famille_impact_id]
    )
    suivis: Mapped[list["Suivi"]] = relationship(
        back_populates="fidele", cascade="all, delete-orphan", order_by="desc(Suivi.date)"
    )
    affectations: Mapped[list["Affectation"]] = relationship(
        back_populates="fidele", cascade="all, delete-orphan"
    )
    parcours: Mapped[list["ParcoursDisciple"]] = relationship(
        back_populates="fidele", cascade="all, delete-orphan",
        foreign_keys="ParcoursDisciple.fidele_id",
    )

    @property
    def nom_complet(self) -> str:
        return f"{self.prenom} {self.nom}"


class Suivi(Base):
    """Historique : chaque action d'un département sur un fidèle (appel, note, visite...)."""
    __tablename__ = "suivis"

    id: Mapped[int] = mapped_column(primary_key=True)
    fidele_id: Mapped[int] = mapped_column(ForeignKey("fideles.id", ondelete="CASCADE"), index=True)
    departement: Mapped[str | None] = mapped_column(String(50))
    type: Mapped[str] = mapped_column(String(50), default="note")
    contenu: Mapped[str] = mapped_column(Text)
    auteur: Mapped[str | None] = mapped_column(String(200))
    date: Mapped[datetime] = mapped_column(DateTime, default=now)

    fidele: Mapped[Fidele] = relationship(back_populates="suivis")


class Affectation(Base):
    """Service / ministère / responsabilité d'un fidèle dans un département."""
    __tablename__ = "affectations"
    __table_args__ = (UniqueConstraint("fidele_id", "departement", "role"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    fidele_id: Mapped[int] = mapped_column(ForeignKey("fideles.id", ondelete="CASCADE"), index=True)
    departement: Mapped[str] = mapped_column(String(50), index=True)
    role: Mapped[str] = mapped_column(String(50), default="membre")
    date_debut: Mapped[date | None] = mapped_column(Date, default=date.today)
    commentaire: Mapped[str | None] = mapped_column(Text)

    fidele: Mapped[Fidele] = relationship(back_populates="affectations")


class FamilleImpact(Base):
    """Cellule de maison / Famille d'Impact (FI)."""
    __tablename__ = "familles_impact"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(150))
    campus_id: Mapped[int | None] = mapped_column(ForeignKey("campus.id"))
    secteur: Mapped[str | None] = mapped_column(String(100))
    adresse: Mapped[str | None] = mapped_column(String(300))
    jour_reunion: Mapped[str | None] = mapped_column(String(20))
    heure_reunion: Mapped[str | None] = mapped_column(String(10))
    pilote_id: Mapped[int | None] = mapped_column(
        ForeignKey("fideles.id", ondelete="SET NULL", use_alter=True, name="fk_famille_pilote")
    )

    campus: Mapped[Campus | None] = relationship()
    pilote: Mapped[Fidele | None] = relationship(foreign_keys=[pilote_id])
    membres: Mapped[list[Fidele]] = relationship(
        back_populates="famille_impact", foreign_keys=[Fidele.famille_impact_id]
    )
    reunions: Mapped[list["ReunionFI"]] = relationship(
        back_populates="famille", cascade="all, delete-orphan", order_by="desc(ReunionFI.date)"
    )


class ReunionFI(Base):
    __tablename__ = "reunions_fi"

    id: Mapped[int] = mapped_column(primary_key=True)
    famille_id: Mapped[int] = mapped_column(ForeignKey("familles_impact.id", ondelete="CASCADE"))
    date: Mapped[date] = mapped_column(Date)
    theme: Mapped[str | None] = mapped_column(String(200))
    nb_presents: Mapped[int] = mapped_column(Integer, default=0)
    nb_invites: Mapped[int] = mapped_column(Integer, default=0)
    notes: Mapped[str | None] = mapped_column(Text)

    famille: Mapped[FamilleImpact] = relationship(back_populates="reunions")


class Promotion(Base):
    """Promotion de discipolat (ex. « Promo Janvier 2026 »)."""
    __tablename__ = "promotions"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(150))
    campus_id: Mapped[int | None] = mapped_column(ForeignKey("campus.id"))
    date_debut: Mapped[date | None] = mapped_column(Date)
    date_fin: Mapped[date | None] = mapped_column(Date)

    campus: Mapped[Campus | None] = relationship()
    parcours: Mapped[list["ParcoursDisciple"]] = relationship(back_populates="promotion")


class Module(Base):
    """Module de formation (PCNC, Au cœur de la Bible, STAR...)."""
    __tablename__ = "modules"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(150), unique=True)
    ordre: Mapped[int] = mapped_column(Integer, default=0)
    description: Mapped[str | None] = mapped_column(Text)


class ParcoursDisciple(Base):
    """Inscription d'un fidèle dans une promotion, avec son mentor et ses modules validés."""
    __tablename__ = "parcours"
    __table_args__ = (UniqueConstraint("fidele_id", "promotion_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    fidele_id: Mapped[int] = mapped_column(ForeignKey("fideles.id", ondelete="CASCADE"))
    promotion_id: Mapped[int] = mapped_column(ForeignKey("promotions.id", ondelete="CASCADE"))
    mentor_id: Mapped[int | None] = mapped_column(ForeignKey("fideles.id", ondelete="SET NULL"))
    statut: Mapped[str] = mapped_column(String(30), default="en_cours")  # en_cours / termine / abandon

    fidele: Mapped[Fidele] = relationship(back_populates="parcours", foreign_keys=[fidele_id])
    mentor: Mapped[Fidele | None] = relationship(foreign_keys=[mentor_id])
    promotion: Mapped[Promotion] = relationship(back_populates="parcours")
    modules_valides: Mapped[list["ModuleValide"]] = relationship(
        back_populates="parcours", cascade="all, delete-orphan"
    )


class ModuleValide(Base):
    __tablename__ = "modules_valides"
    __table_args__ = (UniqueConstraint("parcours_id", "module_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    parcours_id: Mapped[int] = mapped_column(ForeignKey("parcours.id", ondelete="CASCADE"))
    module_id: Mapped[int] = mapped_column(ForeignKey("modules.id", ondelete="CASCADE"))
    date: Mapped[date] = mapped_column(Date, default=date.today)

    parcours: Mapped[ParcoursDisciple] = relationship(back_populates="modules_valides")


class Evenement(Base):
    """Agenda de l'Église."""
    __tablename__ = "evenements"

    id: Mapped[int] = mapped_column(primary_key=True)
    titre: Mapped[str] = mapped_column(String(200))
    date: Mapped[datetime] = mapped_column(DateTime)
    lieu: Mapped[str | None] = mapped_column(String(200))
    departement: Mapped[str | None] = mapped_column(String(50))
    campus_id: Mapped[int | None] = mapped_column(ForeignKey("campus.id"))
    description: Mapped[str | None] = mapped_column(Text)


class CulteStat(Base):
    """Effectifs d'un culte."""
    __tablename__ = "cultes"

    id: Mapped[int] = mapped_column(primary_key=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    campus_id: Mapped[int | None] = mapped_column(ForeignKey("campus.id"))
    hommes: Mapped[int] = mapped_column(Integer, default=0)
    femmes: Mapped[int] = mapped_column(Integer, default=0)
    enfants: Mapped[int] = mapped_column(Integer, default=0)
    nouveaux: Mapped[int] = mapped_column(Integer, default=0)
    personnes_de_passage: Mapped[int] = mapped_column(Integer, default=0)

    campus: Mapped[Campus | None] = relationship()

    @property
    def total(self) -> int:
        return self.hommes + self.femmes + self.enfants
