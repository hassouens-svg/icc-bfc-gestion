"""
Données initiales.

- Toujours : un compte administrateur (admin / admin123) si aucun compte n'existe,
  et les modules de formation de base.
- Si SEED_DEMO_DATA=true : des campus, fidèles, familles... FICTIFS pour tester.
"""
import random
from datetime import date, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import (now, Affectation, Campus, CulteStat, Evenement, FamilleImpact, Fidele, Module,
                     ParcoursDisciple, Promotion, Suivi, User)
from .security import hash_password

MODULES_DE_BASE = ["PCNC", "Au cœur de la Bible", "STAR", "Formation des leaders"]

PRENOMS_H = ["Jean", "Paul", "David", "Samuel", "Daniel", "Josué", "Marc", "Élie", "Caleb", "Joël"]
PRENOMS_F = ["Marie", "Sarah", "Esther", "Ruth", "Déborah", "Anne", "Léa", "Myriam", "Lydie", "Grâce"]
NOMS = ["Martin", "Bernard", "Kouassi", "Mbemba", "Rossi", "Diallo", "Lambert", "Moreau",
        "Nkoulou", "Bianchi", "Petit", "Traoré", "Fontaine", "Esposito", "Leroy"]


def seed(db: Session, demo: bool = True) -> None:
    if db.scalar(select(func.count()).select_from(User)) == 0:
        db.add(User(username="admin", nom_complet="Administrateur", role="super_admin",
                     password_hash=hash_password("admin123")))
    if db.scalar(select(func.count()).select_from(Module)) == 0:
        for i, nom in enumerate(MODULES_DE_BASE):
            db.add(Module(nom=nom, ordre=i))
    db.commit()

    if demo and db.scalar(select(func.count()).select_from(Fidele)) == 0:
        _seed_demo(db)


def _seed_demo(db: Session) -> None:
    rnd = random.Random(42)
    campus = [Campus(nom="Dijon", ville="Dijon", pays="France"),
              Campus(nom="Besançon", ville="Besançon", pays="France"),
              Campus(nom="Rome", ville="Rome", pays="Italie")]
    db.add_all(campus)
    db.flush()

    db.add_all([
        User(username="pasteur", nom_complet="Pasteur (démo)", role="pasteur",
             password_hash=hash_password("pasteur123")),
        User(username="accueil", nom_complet="Équipe Accueil (démo)", role="responsable",
             departement="accueil", campus_id=campus[0].id, password_hash=hash_password("accueil123")),
    ])

    etapes = ["evangelisation", "accueil", "accueil", "discipolat", "famille_disciple",
              "famille_impact", "membre_actif"]
    statut_par_etape = {"evangelisation": "nouveau_converti", "accueil": "nouvel_arrivant",
                        "discipolat": "disciple", "famille_disciple": "disciple",
                        "famille_impact": "baptise", "membre_actif": "serviteur"}
    fideles = []
    for i in range(40):
        sexe = rnd.choice("HF")
        etape = rnd.choice(etapes)
        f = Fidele(
            prenom=rnd.choice(PRENOMS_H if sexe == "H" else PRENOMS_F), nom=rnd.choice(NOMS),
            sexe=sexe, telephone=f"06 00 00 {i // 10:02d} {i % 100:02d}",
            ville=None, campus_id=rnd.choice(campus).id, etape=etape,
            statut_spirituel=statut_par_etape[etape],
            categorie=rnd.choice(["MR", "MF", "autre"]) if etape in ("famille_impact", "membre_actif") else "autre",
            source=rnd.choice(["Évangélisation", "Culte", "Invitation d'un ami", "Réseaux sociaux"]),
            date_premiere_visite=date.today() - timedelta(days=rnd.randint(1, 400)),
            created_at=now() - timedelta(days=rnd.randint(0, 120)),
        )
        f.ville = next(c.ville for c in campus if c.id == f.campus_id)
        fideles.append(f)
    db.add_all(fideles)
    db.flush()

    for f in fideles:
        db.add(Suivi(fidele_id=f.id, type="note", contenu="Fiche créée (données de démonstration)",
                     auteur="Système", departement="accueil", date=f.created_at))
        if f.etape == "evangelisation":
            db.add(Suivi(fidele_id=f.id, type="appel", departement="evangelisation", auteur="Équipe Évangélisation",
                         contenu="Premier appel : personne joignable, intéressée par le culte de dimanche."))

    leaders = [f for f in fideles if f.etape == "membre_actif"] or fideles[:3]
    familles = [
        FamilleImpact(nom="FI Dijon Centre", campus_id=campus[0].id, secteur="Centre",
                      jour_reunion="Mercredi", heure_reunion="19:30", pilote_id=leaders[0].id),
        FamilleImpact(nom="FI Besançon Planoise", campus_id=campus[1].id, secteur="Planoise",
                      jour_reunion="Jeudi", heure_reunion="19:00", pilote_id=leaders[-1].id),
        FamilleImpact(nom="FI Roma Nord", campus_id=campus[2].id, secteur="Nord",
                      jour_reunion="Venerdì", heure_reunion="20:00"),
    ]
    db.add_all(familles)
    db.flush()
    for f in fideles:
        if f.etape in ("famille_impact", "membre_actif"):
            f.famille_impact_id = next(fa.id for fa in familles if fa.campus_id == f.campus_id)

    promo = Promotion(nom="Promotion Janvier 2026", campus_id=campus[0].id,
                      date_debut=date(2026, 1, 11), date_fin=date(2026, 6, 28))
    db.add(promo)
    db.flush()
    for f in fideles:
        if f.etape in ("discipolat", "famille_disciple"):
            db.add(ParcoursDisciple(fidele_id=f.id, promotion_id=promo.id, mentor_id=leaders[0].id))

    for f in leaders[:4]:
        db.add(Affectation(fidele_id=f.id, departement=rnd.choice(["stars", "louange", "accueil", "mpi"]),
                           role="membre"))

    today = date.today()
    for semaines in range(8):
        jour = today - timedelta(days=today.weekday() + 1 + 7 * semaines)  # dimanches passés
        for c in campus:
            db.add(CulteStat(date=jour, campus_id=c.id, hommes=rnd.randint(30, 60),
                             femmes=rnd.randint(40, 80), enfants=rnd.randint(10, 30),
                             nouveaux=rnd.randint(0, 6), personnes_de_passage=rnd.randint(0, 4)))

    db.add_all([
        Evenement(titre="Retraite des jeunes de la BFC", date=now() + timedelta(days=2),
                  lieu="Dijon", departement="juniors"),
        Evenement(titre="Nuit de prière", date=now() + timedelta(days=9),
                  lieu="Besançon", departement="mpi"),
        Evenement(titre="Sortie d'évangélisation", date=now() + timedelta(days=5),
                  lieu="Centre-ville de Dijon", departement="evangelisation"),
    ])
    db.commit()
