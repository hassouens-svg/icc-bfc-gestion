def test_login_refuse_mauvais_mot_de_passe(client):
    r = client.post("/api/auth/login", json={"username": "admin", "password": "faux"})
    assert r.status_code == 401


def test_routes_protegees(client):
    del client.headers["Authorization"]
    assert client.get("/api/fideles").status_code == 401


def test_fiche_unique_et_doublon(client):
    r = client.post("/api/fideles", json={"nom": "Martin", "prenom": "Jean", "telephone": "06 11 22 33 44"})
    assert r.status_code == 201
    fid = r.json()["id"]
    # même téléphone (espaces différents) => refusé
    r = client.post("/api/fideles", json={"nom": "Autre", "prenom": "Nom", "telephone": "0611223344"})
    assert r.status_code == 409
    assert r.json()["detail"]["fidele_id"] == fid


def test_parcours_complet(client):
    fid = client.post("/api/fideles", json={"nom": "Diallo", "prenom": "Sarah", "etape": "evangelisation"}).json()["id"]

    # Évangélisation : appel
    assert client.post(f"/api/fideles/{fid}/suivis", json={"type": "appel", "contenu": "Joignable"}).status_code == 201
    # Accueil
    assert client.post(f"/api/fideles/{fid}/etape", json={"etape": "accueil"}).json()["etape"] == "accueil"

    # Discipolat
    promo = client.post("/api/discipolat/promotions", json={"nom": "Promo test"}).json()
    parcours = client.post("/api/discipolat/parcours", json={"fidele_id": fid, "promotion_id": promo["id"]}).json()
    module_id = client.get("/api/discipolat/modules").json()[0]["id"]
    parcours = client.post(f"/api/discipolat/parcours/{parcours['id']}/modules/{module_id}").json()
    assert parcours["modules_valides"] == [module_id]

    # Famille d'Impact
    fi = client.post("/api/familles", json={"nom": "FI Test"}).json()
    assert client.post(f"/api/familles/{fi['id']}/membres", json={"fidele_id": fid}).status_code == 201

    # Service
    assert client.post("/api/affectations", json={"fidele_id": fid, "departement": "stars"}).status_code == 201

    fiche = client.get(f"/api/fideles/{fid}").json()
    assert fiche["etape"] == "discipolat"
    assert fiche["famille_impact_nom"] == "FI Test"
    assert len(fiche["parcours"]) == 1
    assert len(fiche["affectations"]) == 1
    assert len(fiche["suivis"]) >= 5  # tout l'historique est sur la fiche

    stats = client.get("/api/stats/overview").json()
    assert stats["total_fideles"] == 1


def test_inscription_publique_sans_doublon(client):
    del client.headers["Authorization"]
    data = {"nom": "Rossi", "prenom": "Anna", "telephone": "+39 333 000 0000"}
    assert client.post("/api/public/inscription", json=data).status_code == 201
    assert client.post("/api/public/inscription", json=data).status_code == 201
    from app.database import SessionLocal
    from app.models import Fidele
    with SessionLocal() as db:
        assert db.query(Fidele).count() == 1


def test_valeur_inconnue_refusee(client):
    r = client.post("/api/fideles", json={"nom": "A", "prenom": "B", "etape": "nimporte"})
    assert r.status_code == 422
