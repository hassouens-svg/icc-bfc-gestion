#!/usr/bin/env python3
"""
SCRIPT D'INITIALISATION DE LA BASE DE DONNÉES PRODUCTION
À lancer IMMÉDIATEMENT après le déploiement

Usage: python3 INIT_DATABASE_PRODUCTION.py
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import os
import uuid
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def init_production_database():
    print("=" * 80)
    print("INITIALISATION DE LA BASE DE DONNÉES PRODUCTION")
    print("=" * 80)
    
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # ====================
    # 1. NETTOYER TOUT
    # ====================
    print("\n1. NETTOYAGE COMPLET DE LA BASE...")
    print("-" * 80)
    
    # Supprimer TOUTES les villes (pour éliminer les doublons)
    result = await db.cities.delete_many({})
    print(f"   🗑️  Supprimé {result.deleted_count} villes existantes")
    
    # Supprimer TOUS les utilisateurs (pour recréer proprement)
    result = await db.users.delete_many({})
    print(f"   🗑️  Supprimé {result.deleted_count} utilisateurs existants")
    
    # ====================
    # 2. CRÉER LES VILLES (8 UNIQUES)
    # ====================
    print("\n2. CRÉATION DES VILLES...")
    print("-" * 80)
    
    cities = [
        {"id": str(uuid.uuid4()), "name": "Dijon"},
        {"id": str(uuid.uuid4()), "name": "Chalon-Sur-Saone"},
        {"id": str(uuid.uuid4()), "name": "Besançon"},
        {"id": str(uuid.uuid4()), "name": "Dole"},
        {"id": str(uuid.uuid4()), "name": "Sens"},
        {"id": str(uuid.uuid4()), "name": "Milan"},
        {"id": str(uuid.uuid4()), "name": "Perugia"},
        {"id": str(uuid.uuid4()), "name": "Rome"},
    ]
    
    await db.cities.insert_many(cities)
    print(f"   ✅ Créé {len(cities)} villes uniques")
    for city in cities:
        print(f"      - {city['name']}")
    
    # ====================
    # 3. CRÉER LES UTILISATEURS (9 COMPTES PAR DÉFAUT)
    # ====================
    print("\n3. CRÉATION DES UTILISATEURS...")
    print("-" * 80)
    
    users = [
        {
            "id": str(uuid.uuid4()),
            "username": "superadmin",
            "password": pwd_context.hash("superadmin123"),
            "city": "Dijon",
            "role": "super_admin",
            "permissions": {}
        },
        {
            "id": str(uuid.uuid4()),
            "username": "pasteur",
            "password": pwd_context.hash("pasteur123"),
            "city": "Dijon",
            "role": "pasteur",
            "permissions": {}
        },
        {
            "id": str(uuid.uuid4()),
            "username": "admin",
            "password": pwd_context.hash("admin123"),
            "city": "Dijon",
            "role": "superviseur_promos",
            "permissions": {}
        },
        {
            "id": str(uuid.uuid4()),
            "username": "superviseur_fi",
            "password": pwd_context.hash("superviseur123"),
            "city": "Dijon",
            "role": "superviseur_fi",
            "permissions": {}
        },
        {
            "id": str(uuid.uuid4()),
            "username": "referent1",
            "password": pwd_context.hash("referent123"),
            "city": "Dijon",
            "role": "referent",
            "assigned_month": "2025-01",
            "permissions": {}
        },
        {
            "id": str(uuid.uuid4()),
            "username": "pilote1",
            "password": pwd_context.hash("pilote123"),
            "city": "Dijon",
            "role": "pilote_fi",
            "permissions": {}
        },
        {
            "id": str(uuid.uuid4()),
            "username": "responsable_secteur1",
            "password": pwd_context.hash("resp123"),
            "city": "Dijon",
            "role": "responsable_secteur",
            "permissions": {}
        },
        {
            "id": str(uuid.uuid4()),
            "username": "accueil1",
            "password": pwd_context.hash("accueil123"),
            "city": "Dijon",
            "role": "accueil",
            "permissions": {}
        },
        {
            "id": str(uuid.uuid4()),
            "username": "promotions1",
            "password": pwd_context.hash("promo123"),
            "city": "Dijon",
            "role": "promotions",
            "permissions": {}
        },
    ]
    
    await db.users.insert_many(users)
    print(f"   ✅ Créé {len(users)} utilisateurs")
    for user in users:
        print(f"      - {user['username']:20} ({user['role']})")
    
    # ====================
    # 4. VÉRIFICATION FINALE
    # ====================
    print("\n4. VÉRIFICATION FINALE...")
    print("-" * 80)
    
    # Compter les villes
    city_count = await db.cities.count_documents({})
    print(f"   ✅ Villes dans la base: {city_count}")
    
    # Vérifier les doublons de villes
    all_cities = await db.cities.find({}, {"_id": 0, "name": 1}).to_list(length=None)
    city_names = [c['name'] for c in all_cities]
    duplicates = [name for name in city_names if city_names.count(name) > 1]
    
    if duplicates:
        print(f"   ❌ ATTENTION: Doublons détectés: {set(duplicates)}")
    else:
        print(f"   ✅ Aucun doublon de ville")
    
    # Compter les utilisateurs
    user_count = await db.users.count_documents({})
    print(f"   ✅ Utilisateurs dans la base: {user_count}")
    
    # Tester les mots de passe
    print("\n5. TEST DES MOTS DE PASSE...")
    print("-" * 80)
    
    for user_data in [
        ("superadmin", "superadmin123"),
        ("pasteur", "pasteur123"),
        ("admin", "admin123"),
        ("superviseur_fi", "superviseur123"),
        ("referent1", "referent123"),
        ("pilote1", "pilote123"),
        ("responsable_secteur1", "resp123"),
        ("accueil1", "accueil123"),
        ("promotions1", "promo123"),
    ]:
        username, password = user_data
        user = await db.users.find_one({"username": username})
        
        if user:
            password_ok = pwd_context.verify(password, user["password"])
            if password_ok:
                print(f"   ✅ {username:20} / {password:20} - OK")
            else:
                print(f"   ❌ {username:20} / {password:20} - MOT DE PASSE INCORRECT!")
        else:
            print(f"   ❌ {username:20} - UTILISATEUR NON TROUVÉ!")
    
    print("\n" + "=" * 80)
    print("INITIALISATION TERMINÉE AVEC SUCCÈS ✅")
    print("=" * 80)
    print("\nVous pouvez maintenant vous connecter avec:")
    print("  - superadmin / superadmin123 (/acces-specifiques)")
    print("  - pasteur / pasteur123 (/acces-specifiques)")
    print("  - admin / admin123 (/login → Dijon)")
    print("  - Etc. (voir IDENTIFIANTS_COMPLETS.md)")
    print("")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(init_production_database())
