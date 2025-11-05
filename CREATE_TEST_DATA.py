#!/usr/bin/env python3
"""
SCRIPT DE CRÉATION DE DONNÉES DE TEST COMPLÈTES
Crée des utilisateurs, secteurs, FI, membres, visiteurs, et présences pour tester toutes les fonctionnalités
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import os
import uuid
from datetime import datetime, timedelta
from dotenv import load_dotenv
import random

load_dotenv('/app/backend/.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_test_data():
    print("=" * 80)
    print("CRÉATION DES DONNÉES DE TEST COMPLÈTES")
    print("=" * 80)
    
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # ====================
    # 1. RÉCUPÉRER LES VILLES
    # ====================
    print("\n1. RÉCUPÉRATION DES VILLES...")
    print("-" * 80)
    
    cities = await db.cities.find().to_list(length=None)
    city_names = {city['name']: city['id'] for city in cities}
    
    if len(cities) < 8:
        print("   ⚠️  Moins de 8 villes trouvées. Assurez-vous d'avoir lancé INIT_DATABASE_PRODUCTION.py")
        return
    
    print(f"   ✅ {len(cities)} villes trouvées")
    for city in cities:
        print(f"      - {city['name']}")
    
    # ====================
    # 2. CRÉER DES SECTEURS DANS PLUSIEURS VILLES
    # ====================
    print("\n2. CRÉATION DES SECTEURS...")
    print("-" * 80)
    
    secteurs = []
    
    # Secteurs pour Dijon
    secteurs_dijon = [
        {"id": str(uuid.uuid4()), "name": "Centre-Ville Dijon", "city": "Dijon", "responsable_name": "Marie Dubois"},
        {"id": str(uuid.uuid4()), "name": "Fontaine d'Ouche", "city": "Dijon", "responsable_name": "Jean Martin"},
        {"id": str(uuid.uuid4()), "name": "Chenôve", "city": "Dijon", "responsable_name": "Sophie Laurent"},
    ]
    
    # Secteurs pour Chalon
    secteurs_chalon = [
        {"id": str(uuid.uuid4()), "name": "Centre Chalon", "city": "Chalon-Sur-Saone", "responsable_name": "Pierre Durand"},
        {"id": str(uuid.uuid4()), "name": "Saint-Jean", "city": "Chalon-Sur-Saone", "responsable_name": "Claire Moreau"},
    ]
    
    # Secteurs pour Milan
    secteurs_milan = [
        {"id": str(uuid.uuid4()), "name": "Milano Centro", "city": "Milan", "responsable_name": "Giuseppe Rossi"},
        {"id": str(uuid.uuid4()), "name": "Porta Venezia", "city": "Milan", "responsable_name": "Maria Bianchi"},
    ]
    
    # Secteurs pour Rome
    secteurs_rome = [
        {"id": str(uuid.uuid4()), "name": "Roma Centro", "city": "Rome", "responsable_name": "Marco Ferrari"},
        {"id": str(uuid.uuid4()), "name": "Trastevere", "city": "Rome", "responsable_name": "Elena Romano"},
    ]
    
    secteurs = secteurs_dijon + secteurs_chalon + secteurs_milan + secteurs_rome
    
    await db.secteurs.insert_many(secteurs)
    print(f"   ✅ Créé {len(secteurs)} secteurs dans 4 villes")
    
    # ====================
    # 3. CRÉER DES FAMILLES D'IMPACT
    # ====================
    print("\n3. CRÉATION DES FAMILLES D'IMPACT...")
    print("-" * 80)
    
    familles = []
    
    # FI pour Dijon
    for secteur in secteurs_dijon:
        familles.append({
            "id": str(uuid.uuid4()),
            "name": f"FI {secteur['name']} A",
            "city": "Dijon",
            "secteur_id": secteur['id'],
            "pilote_name": f"Pilote {secteur['name']} A",
            "meeting_day": "Jeudi",
            "meeting_time": "19:00"
        })
        familles.append({
            "id": str(uuid.uuid4()),
            "name": f"FI {secteur['name']} B",
            "city": "Dijon",
            "secteur_id": secteur['id'],
            "pilote_name": f"Pilote {secteur['name']} B",
            "meeting_day": "Jeudi",
            "meeting_time": "20:00"
        })
    
    # FI pour Chalon
    for secteur in secteurs_chalon:
        familles.append({
            "id": str(uuid.uuid4()),
            "name": f"FI {secteur['name']}",
            "city": "Chalon-Sur-Saone",
            "secteur_id": secteur['id'],
            "pilote_name": f"Pilote {secteur['name']}",
            "meeting_day": "Jeudi",
            "meeting_time": "19:00"
        })
    
    # FI pour Milan
    for secteur in secteurs_milan:
        familles.append({
            "id": str(uuid.uuid4()),
            "name": f"FI {secteur['name']}",
            "city": "Milan",
            "secteur_id": secteur['id'],
            "pilote_name": f"Pilote {secteur['name']}",
            "meeting_day": "Giovedì",
            "meeting_time": "19:30"
        })
    
    # FI pour Rome
    for secteur in secteurs_rome:
        familles.append({
            "id": str(uuid.uuid4()),
            "name": f"FI {secteur['name']}",
            "city": "Rome",
            "secteur_id": secteur['id'],
            "pilote_name": f"Pilote {secteur['name']}",
            "meeting_day": "Giovedì",
            "meeting_time": "19:30"
        })
    
    await db.familles_impact.insert_many(familles)
    print(f"   ✅ Créé {len(familles)} Familles d'Impact")
    
    # ====================
    # 4. CRÉER LES UTILISATEURS DE TEST (20-25)
    # ====================
    print("\n4. CRÉATION DES UTILISATEURS DE TEST...")
    print("-" * 80)
    
    users = []
    
    # Super Admin (déjà existant normalement, mais on en crée un de test)
    users.append({
        "id": str(uuid.uuid4()),
        "username": "admin_test",
        "password": pwd_context.hash("test123"),
        "city": "Dijon",
        "role": "super_admin",
        "permissions": {}
    })
    
    # Pasteur
    users.append({
        "id": str(uuid.uuid4()),
        "username": "pasteur_test",
        "password": pwd_context.hash("test123"),
        "city": "Dijon",
        "role": "pasteur",
        "permissions": {}
    })
    
    # Superviseurs Promos (plusieurs villes)
    users.append({
        "id": str(uuid.uuid4()),
        "username": "sup_promos_dijon",
        "password": pwd_context.hash("test123"),
        "city": "Dijon",
        "role": "superviseur_promos",
        "permissions": {}
    })
    
    users.append({
        "id": str(uuid.uuid4()),
        "username": "sup_promos_chalon",
        "password": pwd_context.hash("test123"),
        "city": "Chalon-Sur-Saone",
        "role": "superviseur_promos",
        "permissions": {}
    })
    
    users.append({
        "id": str(uuid.uuid4()),
        "username": "sup_promos_milan",
        "password": pwd_context.hash("test123"),
        "city": "Milan",
        "role": "superviseur_promos",
        "permissions": {}
    })
    
    # Superviseurs FI (plusieurs villes)
    users.append({
        "id": str(uuid.uuid4()),
        "username": "sup_fi_dijon",
        "password": pwd_context.hash("test123"),
        "city": "Dijon",
        "role": "superviseur_fi",
        "permissions": {}
    })
    
    users.append({
        "id": str(uuid.uuid4()),
        "username": "sup_fi_rome",
        "password": pwd_context.hash("test123"),
        "city": "Rome",
        "role": "superviseur_fi",
        "permissions": {}
    })
    
    # Responsables de Secteur (assignés aux secteurs créés)
    users.append({
        "id": str(uuid.uuid4()),
        "username": "resp_sect_dijon1",
        "password": pwd_context.hash("test123"),
        "city": "Dijon",
        "role": "responsable_secteur",
        "assigned_secteur_id": secteurs_dijon[0]['id'],
        "permissions": {}
    })
    
    users.append({
        "id": str(uuid.uuid4()),
        "username": "resp_sect_dijon2",
        "password": pwd_context.hash("test123"),
        "city": "Dijon",
        "role": "responsable_secteur",
        "assigned_secteur_id": secteurs_dijon[1]['id'],
        "permissions": {}
    })
    
    users.append({
        "id": str(uuid.uuid4()),
        "username": "resp_sect_milan",
        "password": pwd_context.hash("test123"),
        "city": "Milan",
        "role": "responsable_secteur",
        "assigned_secteur_id": secteurs_milan[0]['id'],
        "permissions": {}
    })
    
    # Pilotes FI (assignés aux FI créées)
    fi_dijon = [f for f in familles if f['city'] == 'Dijon']
    fi_chalon = [f for f in familles if f['city'] == 'Chalon-Sur-Saone']
    fi_milan = [f for f in familles if f['city'] == 'Milan']
    fi_rome = [f for f in familles if f['city'] == 'Rome']
    
    users.append({
        "id": str(uuid.uuid4()),
        "username": "pilote_dijon1",
        "password": pwd_context.hash("test123"),
        "city": "Dijon",
        "role": "pilote_fi",
        "assigned_fi_id": fi_dijon[0]['id'],
        "assigned_secteur_id": fi_dijon[0]['secteur_id'],
        "permissions": {}
    })
    
    users.append({
        "id": str(uuid.uuid4()),
        "username": "pilote_dijon2",
        "password": pwd_context.hash("test123"),
        "city": "Dijon",
        "role": "pilote_fi",
        "assigned_fi_id": fi_dijon[1]['id'],
        "assigned_secteur_id": fi_dijon[1]['secteur_id'],
        "permissions": {}
    })
    
    users.append({
        "id": str(uuid.uuid4()),
        "username": "pilote_chalon",
        "password": pwd_context.hash("test123"),
        "city": "Chalon-Sur-Saone",
        "role": "pilote_fi",
        "assigned_fi_id": fi_chalon[0]['id'],
        "assigned_secteur_id": fi_chalon[0]['secteur_id'],
        "permissions": {}
    })
    
    users.append({
        "id": str(uuid.uuid4()),
        "username": "pilote_milan",
        "password": pwd_context.hash("test123"),
        "city": "Milan",
        "role": "pilote_fi",
        "assigned_fi_id": fi_milan[0]['id'],
        "assigned_secteur_id": fi_milan[0]['secteur_id'],
        "permissions": {}
    })
    
    # Responsables Promos / Referents (assignés à des mois différents)
    months = ["2024-10", "2024-11", "2024-12", "2025-01", "2025-02", "2025-03"]
    
    users.append({
        "id": str(uuid.uuid4()),
        "username": "referent_dijon_oct",
        "password": pwd_context.hash("test123"),
        "city": "Dijon",
        "role": "referent",
        "assigned_month": "2024-10",
        "permissions": {}
    })
    
    users.append({
        "id": str(uuid.uuid4()),
        "username": "referent_dijon_nov",
        "password": pwd_context.hash("test123"),
        "city": "Dijon",
        "role": "referent",
        "assigned_month": "2024-11",
        "permissions": {}
    })
    
    users.append({
        "id": str(uuid.uuid4()),
        "username": "referent_dijon_dec",
        "password": pwd_context.hash("test123"),
        "city": "Dijon",
        "role": "referent",
        "assigned_month": "2024-12",
        "permissions": {}
    })
    
    users.append({
        "id": str(uuid.uuid4()),
        "username": "referent_chalon_jan",
        "password": pwd_context.hash("test123"),
        "city": "Chalon-Sur-Saone",
        "role": "referent",
        "assigned_month": "2025-01",
        "permissions": {}
    })
    
    users.append({
        "id": str(uuid.uuid4()),
        "username": "referent_milan_feb",
        "password": pwd_context.hash("test123"),
        "city": "Milan",
        "role": "referent",
        "assigned_month": "2025-02",
        "permissions": {}
    })
    
    # Accueil (plusieurs villes)
    users.append({
        "id": str(uuid.uuid4()),
        "username": "accueil_dijon",
        "password": pwd_context.hash("test123"),
        "city": "Dijon",
        "role": "accueil",
        "permissions": {}
    })
    
    users.append({
        "id": str(uuid.uuid4()),
        "username": "accueil_rome",
        "password": pwd_context.hash("test123"),
        "city": "Rome",
        "role": "accueil",
        "permissions": {}
    })
    
    # Promotions (plusieurs villes)
    users.append({
        "id": str(uuid.uuid4()),
        "username": "promos_dijon",
        "password": pwd_context.hash("test123"),
        "city": "Dijon",
        "role": "promotions",
        "permissions": {}
    })
    
    users.append({
        "id": str(uuid.uuid4()),
        "username": "promos_chalon",
        "password": pwd_context.hash("test123"),
        "city": "Chalon-Sur-Saone",
        "role": "promotions",
        "permissions": {}
    })
    
    users.append({
        "id": str(uuid.uuid4()),
        "username": "promos_milan",
        "password": pwd_context.hash("test123"),
        "city": "Milan",
        "role": "promotions",
        "permissions": {}
    })
    
    await db.users.insert_many(users)
    print(f"   ✅ Créé {len(users)} utilisateurs de test")
    print(f"   🔑 Mot de passe pour tous: test123")
    
    # ====================
    # 5. CRÉER DES VISITEURS DE TEST
    # ====================
    print("\n5. CRÉATION DES VISITEURS DE TEST...")
    print("-" * 80)
    
    visitors = []
    
    # Visiteurs pour Dijon (différents mois)
    first_names = ["Thomas", "Marie", "Pierre", "Sophie", "Jean", "Claire", "Luc", "Isabelle", "Marc", "Julie"]
    last_names = ["Dupont", "Martin", "Bernard", "Dubois", "Laurent", "Simon", "Michel", "Lefebvre", "Leroy", "Moreau"]
    
    # Visiteurs Oct 2024
    for i in range(5):
        visitors.append({
            "id": str(uuid.uuid4()),
            "firstname": random.choice(first_names),
            "lastname": random.choice(last_names),
            "email": f"visiteur_oct_{i}@test.com",
            "phone": f"0612345{i:03d}",
            "city": "Dijon",
            "visit_date": f"2024-10-{random.randint(1, 28):02d}",
            "assigned_month": "2024-10",
            "arrival_channel": random.choice(["Réseaux sociaux", "Bouche à oreille", "Site web"]),
            "status": "nouveau"
        })
    
    # Visiteurs Nov 2024
    for i in range(6):
        visitors.append({
            "id": str(uuid.uuid4()),
            "firstname": random.choice(first_names),
            "lastname": random.choice(last_names),
            "email": f"visiteur_nov_{i}@test.com",
            "phone": f"0612346{i:03d}",
            "city": "Dijon",
            "visit_date": f"2024-11-{random.randint(1, 28):02d}",
            "assigned_month": "2024-11",
            "arrival_channel": random.choice(["Réseaux sociaux", "Bouche à oreille", "Site web"]),
            "status": "nouveau"
        })
    
    # Visiteurs Dec 2024
    for i in range(7):
        visitors.append({
            "id": str(uuid.uuid4()),
            "firstname": random.choice(first_names),
            "lastname": random.choice(last_names),
            "email": f"visiteur_dec_{i}@test.com",
            "phone": f"0612347{i:03d}",
            "city": "Dijon",
            "visit_date": f"2024-12-{random.randint(1, 28):02d}",
            "assigned_month": "2024-12",
            "arrival_channel": random.choice(["Réseaux sociaux", "Bouche à oreille", "Site web"]),
            "status": "nouveau"
        })
    
    # Visiteurs Jan 2025 (Dijon et Chalon)
    for i in range(5):
        visitors.append({
            "id": str(uuid.uuid4()),
            "firstname": random.choice(first_names),
            "lastname": random.choice(last_names),
            "email": f"visiteur_jan_dijon_{i}@test.com",
            "phone": f"0612348{i:03d}",
            "city": "Dijon",
            "visit_date": f"2025-01-{random.randint(1, 28):02d}",
            "assigned_month": "2025-01",
            "arrival_channel": random.choice(["Réseaux sociaux", "Bouche à oreille", "Site web"]),
            "status": "nouveau"
        })
    
    for i in range(4):
        visitors.append({
            "id": str(uuid.uuid4()),
            "firstname": random.choice(first_names),
            "lastname": random.choice(last_names),
            "email": f"visiteur_jan_chalon_{i}@test.com",
            "phone": f"0612349{i:03d}",
            "city": "Chalon-Sur-Saone",
            "visit_date": f"2025-01-{random.randint(1, 28):02d}",
            "assigned_month": "2025-01",
            "arrival_channel": random.choice(["Réseaux sociaux", "Bouche à oreille", "Site web"]),
            "status": "nouveau"
        })
    
    # Visiteurs Feb 2025 (Milan)
    for i in range(5):
        visitors.append({
            "id": str(uuid.uuid4()),
            "firstname": random.choice(["Marco", "Giulia", "Andrea", "Sofia", "Luca"]),
            "lastname": random.choice(["Rossi", "Bianchi", "Ferrari", "Romano", "Colombo"]),
            "email": f"visiteur_milan_{i}@test.com",
            "phone": f"+39334123{i:03d}",
            "city": "Milan",
            "visit_date": f"2025-02-{random.randint(1, 28):02d}",
            "assigned_month": "2025-02",
            "arrival_channel": random.choice(["Social media", "Passaparola", "Sito web"]),
            "status": "nuovo"
        })
    
    await db.visitors.insert_many(visitors)
    print(f"   ✅ Créé {len(visitors)} visiteurs de test")
    
    # ====================
    # 6. AFFECTER DES VISITEURS AUX FI ET CRÉER DES MEMBRES
    # ====================
    print("\n6. AFFECTATION DE VISITEURS AUX FAMILLES D'IMPACT...")
    print("-" * 80)
    
    membres = []
    
    # Affecter quelques visiteurs de Dijon aux FI
    dijon_visitors = [v for v in visitors if v['city'] == 'Dijon'][:10]
    
    for i, visitor in enumerate(dijon_visitors):
        fi = fi_dijon[i % len(fi_dijon)]
        membres.append({
            "id": str(uuid.uuid4()),
            "fi_id": fi['id'],
            "visitor_id": visitor['id'],
            "firstname": visitor['firstname'],
            "lastname": visitor['lastname'],
            "phone": visitor['phone'],
            "city": "Dijon",
            "date_joined": visitor['visit_date']
        })
    
    # Affecter quelques visiteurs de Milan aux FI
    milan_visitors = [v for v in visitors if v['city'] == 'Milan'][:3]
    
    for visitor in milan_visitors:
        fi = random.choice(fi_milan)
        membres.append({
            "id": str(uuid.uuid4()),
            "fi_id": fi['id'],
            "visitor_id": visitor['id'],
            "firstname": visitor['firstname'],
            "lastname": visitor['lastname'],
            "phone": visitor['phone'],
            "city": "Milan",
            "date_joined": visitor['visit_date']
        })
    
    if membres:
        await db.membres_fi.insert_many(membres)
        print(f"   ✅ Créé {len(membres)} membres dans les FI")
    
    # ====================
    # 7. CRÉER DES PRÉSENCES POUR TESTER LA FIDÉLISATION
    # ====================
    print("\n7. CRÉATION DES PRÉSENCES POUR FIDÉLISATION...")
    print("-" * 80)
    
    presences = []
    
    # Créer des présences pour les membres sur les 4 dernières semaines
    today = datetime.now()
    
    for membre in membres:
        # Chaque membre a entre 1 et 4 présences sur les 4 dernières jeudis
        num_presences = random.randint(1, 4)
        
        for week in range(num_presences):
            date = today - timedelta(weeks=week)
            # Trouver le jeudi précédent
            days_since_thursday = (date.weekday() - 3) % 7
            thursday = date - timedelta(days=days_since_thursday)
            
            presences.append({
                "id": str(uuid.uuid4()),
                "fi_id": membre['fi_id'],
                "membre_id": membre['id'],
                "date": thursday.strftime("%Y-%m-%d"),
                "present": random.choice([True, True, True, False])  # 75% de présence
            })
    
    if presences:
        await db.presences_fi.insert_many(presences)
        print(f"   ✅ Créé {len(presences)} présences")
    
    # ====================
    # RÉSUMÉ
    # ====================
    print("\n" + "=" * 80)
    print("DONNÉES DE TEST CRÉÉES AVEC SUCCÈS! ✅")
    print("=" * 80)
    
    print(f"\n📊 RÉSUMÉ:")
    print(f"   - {len(secteurs)} secteurs")
    print(f"   - {len(familles)} Familles d'Impact")
    print(f"   - {len(users)} utilisateurs de test")
    print(f"   - {len(visitors)} visiteurs")
    print(f"   - {len(membres)} membres dans les FI")
    print(f"   - {len(presences)} présences enregistrées")
    
    print(f"\n🔑 TOUS LES MOTS DE PASSE: test123")
    
    print(f"\n🏙️  DONNÉES RÉPARTIES SUR:")
    print(f"   - Dijon (majoritaire)")
    print(f"   - Chalon-Sur-Saone")
    print(f"   - Milan")
    print(f"   - Rome")
    
    print(f"\n📅 PÉRIODES DE TEST:")
    print(f"   - Oct 2024 → {len([v for v in visitors if v['assigned_month'] == '2024-10'])} visiteurs")
    print(f"   - Nov 2024 → {len([v for v in visitors if v['assigned_month'] == '2024-11'])} visiteurs")
    print(f"   - Dec 2024 → {len([v for v in visitors if v['assigned_month'] == '2024-12'])} visiteurs")
    print(f"   - Jan 2025 → {len([v for v in visitors if v['assigned_month'] == '2025-01'])} visiteurs")
    print(f"   - Feb 2025 → {len([v for v in visitors if v['assigned_month'] == '2025-02'])} visiteurs")
    
    print("\n✅ Vous pouvez maintenant tester toutes les fonctionnalités!")
    print("")

if __name__ == "__main__":
    asyncio.run(create_test_data())
