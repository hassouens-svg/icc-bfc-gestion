"""Conversion de quelques objets qui demandent un calcul (compteurs, listes d'ids...)."""
from ..models import FamilleImpact, ParcoursDisciple, Promotion
from ..schemas import FamilleOut, ParcoursOut, PromotionOut


def parcours_out(p: ParcoursDisciple) -> ParcoursOut:
    return ParcoursOut(
        id=p.id, fidele_id=p.fidele_id, promotion_id=p.promotion_id, mentor_id=p.mentor_id,
        statut=p.statut, fidele=p.fidele, mentor=p.mentor,
        modules_valides=[m.module_id for m in p.modules_valides],
        promotion_nom=p.promotion.nom if p.promotion else None,
    )


def famille_out(f: FamilleImpact) -> dict:
    data = FamilleOut.model_validate(f).model_dump()
    data["nb_membres"] = len(f.membres)
    return data


def promotion_out(p: Promotion) -> dict:
    data = PromotionOut.model_validate(p).model_dump()
    data["nb_disciples"] = len(p.parcours)
    return data
