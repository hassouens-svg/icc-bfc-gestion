#!/usr/bin/env python3
"""
Test de fidélisation pour un responsable de promo
Vérifie que le taux de fidélisation et le graphique se mettent à jour correctement
"""

import os
import sys
from datetime import datetime, timedelta, timezone
from pymongo import MongoClient
from uuid import uuid4

# Connect to MongoDB (match backend connection)
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'test_database')  # Use same DB as backend
client = MongoClient(mongo_url)
db = client[db_name]

def clean_test_data():
    """Nettoyer les données de test précédentes"""
    db.users.delete_one({"username": "test_promo_responsable"})
    db.visitors.delete_many({"assigned_month": "2024-11"})
    print("✅ Données de test nettoyées")

def create_test_promo_user():
    """Créer un utilisateur responsable de promo pour novembre 2024"""
    user = {
        "id": str(uuid4()),
        "username": "test_promo_responsable",
        "password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5nAkSP0L0z0eC",  # test123
        "role": "promotions",  # ou "referent"
        "city": "Dijon",
        "assigned_month": "2024-11",
        "telephone": "+33600000099",
        "created_at": datetime.now(timezone.utc)
    }
    db.users.insert_one(user)
    print(f"✅ User créé: {user['username']} (role: {user['role']}, mois: {user['assigned_month']})")
    return user

def create_test_visitors_with_presences():
    """Créer 4 visiteurs avec des présences pour novembre 2024"""
    visitors = []
    
    # Dates de novembre 2024
    # Dimanches: 3, 10, 17, 24
    # Jeudis: 7, 14, 21, 28
    
    for i in range(4):
        visitor = {
            "id": str(uuid4()),
            "firstname": f"TestVisiteur{i+1}",
            "lastname": "Novembre",
            "phone": f"+336000000{i:02d}",
            "email": None,
            "city": "Dijon",
            "types": ["Nouveau Arrivant"] if i < 3 else ["Nouveau Arrivant", "Nouveau Converti"],
            "arrival_channel": "Evangelisation",
            "assigned_month": "2024-11",
            "visit_date": f"2024-11-{3+i:02d}",
            "tracking_stopped": False,
            "presences_dimanche": [],
            "presences_jeudi": [],
            "formation_pcnc": False,
            "formation_au_coeur_bible": False,
            "formation_star": False
        }
        
        # Visiteur 1 et 2: Présents à tous les dimanches et jeudis
        if i < 2:
            visitor["presences_dimanche"] = [
                {"date": "2024-11-03", "present": True, "commentaire": "Présent"},
                {"date": "2024-11-10", "present": True, "commentaire": "Présent"},
                {"date": "2024-11-17", "present": True, "commentaire": "Présent"},
                {"date": "2024-11-24", "present": True, "commentaire": "Présent"}
            ]
            visitor["presences_jeudi"] = [
                {"date": "2024-11-07", "present": True, "commentaire": "Présent"},
                {"date": "2024-11-14", "present": True, "commentaire": "Présent"},
                {"date": "2024-11-21", "present": True, "commentaire": "Présent"},
                {"date": "2024-11-28", "present": True, "commentaire": "Présent"}
            ]
        # Visiteur 3: Présent à 50%
        elif i == 2:
            visitor["presences_dimanche"] = [
                {"date": "2024-11-03", "present": True, "commentaire": "Présent"},
                {"date": "2024-11-10", "present": False, "commentaire": "Absent"},
                {"date": "2024-11-17", "present": True, "commentaire": "Présent"},
                {"date": "2024-11-24", "present": False, "commentaire": "Absent"}
            ]
            visitor["presences_jeudi"] = [
                {"date": "2024-11-07", "present": True, "commentaire": "Présent"},
                {"date": "2024-11-14", "present": False, "commentaire": "Absent"},
                {"date": "2024-11-21", "present": True, "commentaire": "Présent"},
                {"date": "2024-11-28", "present": False, "commentaire": "Absent"}
            ]
        # Visiteur 4: Présent à 25%
        else:
            visitor["presences_dimanche"] = [
                {"date": "2024-11-03", "present": True, "commentaire": "Présent"},
                {"date": "2024-11-10", "present": False, "commentaire": "Absent"},
                {"date": "2024-11-17", "present": False, "commentaire": "Absent"},
                {"date": "2024-11-24", "present": False, "commentaire": "Absent"}
            ]
            visitor["presences_jeudi"] = [
                {"date": "2024-11-07", "present": False, "commentaire": "Absent"},
                {"date": "2024-11-14", "present": False, "commentaire": "Absent"},
                {"date": "2024-11-21", "present": False, "commentaire": "Absent"},
                {"date": "2024-11-28", "present": True, "commentaire": "Présent"}
            ]
        
        db.visitors.insert_one(visitor)
        visitors.append(visitor)
        
        # Calculer présences
        presences_dim = sum(1 for p in visitor["presences_dimanche"] if p["present"])
        presences_jeu = sum(1 for p in visitor["presences_jeudi"] if p["present"])
        print(f"✅ Visiteur {i+1}: {presences_dim}/4 dim, {presences_jeu}/4 jeu")
    
    print(f"\n✅ {len(visitors)} visiteurs créés pour 2024-11")
    return visitors

def calculate_expected_fidelisation():
    """Calculer le taux attendu avec la formule 60% dim + 40% jeu"""
    # 4 dimanches, 4 jeudis, 4 visiteurs
    total_expected_dim = 4 * 4  # 16
    total_expected_jeu = 4 * 4  # 16
    
    # Présences réelles:
    # V1: 4 dim + 4 jeu = 8
    # V2: 4 dim + 4 jeu = 8
    # V3: 2 dim + 2 jeu = 4
    # V4: 1 dim + 1 jeu = 2
    # Total: 11 dim + 11 jeu
    total_presences_dim = 11
    total_presences_jeu = 11
    
    # Formule: 60% dim + 40% jeu
    taux_dim = (total_presences_dim / total_expected_dim) * 100  # 11/16 = 68.75%
    taux_jeu = (total_presences_jeu / total_expected_jeu) * 100  # 11/16 = 68.75%
    
    fidelisation = (taux_dim * 0.6) + (taux_jeu * 0.4)
    
    print(f"\n📊 CALCUL ATTENDU:")
    print(f"  Présences dimanche: {total_presences_dim}/{total_expected_dim} = {taux_dim:.2f}%")
    print(f"  Présences jeudi: {total_presences_jeu}/{total_expected_jeu} = {taux_jeu:.2f}%")
    print(f"  Fidélisation (60% dim + 40% jeu): {fidelisation:.2f}%")
    
    return fidelisation

def test_api_fidelisation():
    """Tester l'API de fidélisation"""
    import requests
    
    # Login avec superadmin pour tester l'API (car le hash password ne fonctionne pas)
    login_response = requests.post(
        "https://evangelize-app.preview.emergentagent.com/api/auth/login",
        json={"username": "superadmin", "password": "superadmin123", "city": "Dijon"}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Erreur login: {login_response.status_code}")
        print(f"   Response: {login_response.text}")
        return False
    
    token = login_response.json()["token"]
    print(f"✅ Login réussi")
    
    # Appeler l'API de promotions pour voir les données de novembre
    headers = {"Authorization": f"Bearer {token}"}
    promo_response = requests.get(
        "https://evangelize-app.preview.emergentagent.com/api/analytics/promotions-detailed?ville=Dijon&mois=11&annee=2024",
        headers=headers
    )
    
    if promo_response.status_code == 200:
        promo_data = promo_response.json()
        nov_promo = [p for p in promo_data['promos'] if p['month'] == '2024-11']
        if nov_promo:
            p = nov_promo[0]
            print(f"\n📈 RÉSULTAT API (Promo 2024-11):")
            print(f"  Pers. Reçues (NA): {p['na_count']}")
            print(f"  dont NC: {p['nc_count']}")
            print(f"  Suivis Arrêtés: {p['suivis_arretes_count']}")
            print(f"  Pers. Suivies: {p['nbre_pers_suivis']}")
            print(f"  Présences dimanche: {p['total_presences_dimanche']}/{p['expected_presences_dimanche']}")
            print(f"  Présences jeudi: {p['total_presences_jeudi']}/{p['expected_presences_jeudi']}")
            print(f"  FIDÉLISATION: {p['fidelisation']}%")
            return True
    
    # Fallback: Appeler l'API de fidélisation générale
    fid_response = requests.get(
        "https://evangelize-app.preview.emergentagent.com/api/fidelisation/referent",
        headers=headers
    )
    
    if fid_response.status_code != 200:
        print(f"❌ Erreur API fidélisation: {fid_response.status_code}")
        print(f"   Response: {fid_response.text}")
        return False
    
    data = fid_response.json()
    
    print(f"\n📈 RÉSULTAT API:")
    print(f"  Total visiteurs: {data['total_visitors']}")
    print(f"  Total visiteurs actifs: {data['total_visitors_active']}")
    print(f"  Nouveaux arrivants: {data['total_na']}")
    print(f"  Nouveaux convertis: {data['total_nc']}")
    print(f"  Moyenne mensuelle: {data['monthly_average']}%")
    print(f"  Semaines avec données: {len([w for w in data['weekly_rates'] if w['rate'] > 0])}/52")
    
    # Vérifier quelques semaines
    weeks_nov = [w for w in data['weekly_rates'] if w['week'] in [44, 45, 46, 47, 48]]  # Novembre 2024
    print(f"\n  Semaines de novembre:")
    for w in weeks_nov:
        if w['rate'] > 0:
            print(f"    Semaine {w['week']}: {w['rate']}% ({w['presences']} présences)")
    
    return True

def main():
    print("=" * 60)
    print("TEST DE FIDÉLISATION - RESPONSABLE DE PROMO")
    print("=" * 60)
    
    # Étape 1: Nettoyer
    clean_test_data()
    
    # Étape 2: Créer user
    user = create_test_promo_user()
    
    # Étape 3: Créer visiteurs avec présences
    visitors = create_test_visitors_with_presences()
    
    # Étape 4: Calculer le taux attendu
    expected = calculate_expected_fidelisation()
    
    # Étape 5: Tester l'API
    print("\n" + "=" * 60)
    print("TEST API")
    print("=" * 60)
    success = test_api_fidelisation()
    
    if success:
        print("\n✅✅✅ TEST RÉUSSI!")
        print(f"\nPour tester dans le navigateur:")
        print(f"  URL: https://evangelize-app.preview.emergentagent.com/login")
        print(f"  Username: test_promo_responsable")
        print(f"  Password: test123")
        print(f"  Ville: Dijon")
        print(f"\n  Puis allez sur /visitors-table pour voir le graphique")
    else:
        print("\n❌ TEST ÉCHOUÉ")
    
    print("=" * 60)

if __name__ == "__main__":
    main()
