#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def fix_everything():
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("=" * 80)
    print("NETTOYAGE ET CORRECTION COMPLÈTE")
    print("=" * 80)
    
    # 1. VÉRIFIER ET SUPPRIMER DOUBLONS VILLES
    print("\n1. Vérification des villes...")
    cities = await db.cities.find({}, {"_id": 0}).to_list(length=None)
    
    # Grouper par nom
    city_groups = {}
    for city in cities:
        name = city.get('name', '').strip()
        if name not in city_groups:
            city_groups[name] = []
        city_groups[name].append(city)
    
    # Supprimer les doublons (garder le premier, supprimer les autres)
    for name, group in city_groups.items():
        if len(group) > 1:
            print(f"\n⚠️  '{name}' a {len(group)} entrées - NETTOYAGE...")
            # Garder le premier
            to_keep = group[0]
            print(f"   ✅ Garder: {to_keep['id']}")
            
            # Supprimer les autres
            for city in group[1:]:
                result = await db.cities.delete_one({"id": city['id']})
                print(f"   🗑️  Supprimé: {city['id']}")
        else:
            print(f"   ✅ {name} - OK (1 entrée)")
    
    # 2. VÉRIFIER ET RECRÉER TOUS LES COMPTES UTILISATEURS
    print("\n2. Vérification et correction des comptes utilisateurs...")
    
    users_to_ensure = [
        {
            "username": "superadmin",
            "password": "superadmin123",
            "city": "Dijon",
            "role": "super_admin"
        },
        {
            "username": "pasteur",
            "password": "pasteur123",
            "city": "Dijon",
            "role": "pasteur"
        },
        {
            "username": "admin",
            "password": "admin123",
            "city": "Dijon",
            "role": "superviseur_promos"
        },
        {
            "username": "superviseur_fi",
            "password": "superviseur123",
            "city": "Dijon",
            "role": "superviseur_fi"
        },
        {
            "username": "referent1",
            "password": "referent123",
            "city": "Dijon",
            "role": "referent",
            "assigned_month": "2025-01"
        },
        {
            "username": "pilote1",
            "password": "pilote123",
            "city": "Dijon",
            "role": "pilote_fi"
        },
        {
            "username": "responsable_secteur1",
            "password": "resp123",
            "city": "Dijon",
            "role": "responsable_secteur"
        },
        {
            "username": "accueil1",
            "password": "accueil123",
            "city": "Dijon",
            "role": "accueil"
        },
        {
            "username": "promotions1",
            "password": "promo123",
            "city": "Dijon",
            "role": "promotions"
        }
    ]
    
    for user_data in users_to_ensure:
        # Vérifier si existe
        existing = await db.users.find_one({
            "username": user_data["username"],
            "city": user_data["city"]
        })
        
        if existing:
            # Mettre à jour le mot de passe
            hashed_password = pwd_context.hash(user_data["password"])
            update_data = {
                "password": hashed_password,
                "role": user_data["role"]
            }
            if "assigned_month" in user_data:
                update_data["assigned_month"] = user_data["assigned_month"]
            
            await db.users.update_one(
                {"username": user_data["username"], "city": user_data["city"]},
                {"$set": update_data}
            )
            print(f"   ✅ Mis à jour: {user_data['username']} ({user_data['role']})")
        else:
            # Créer
            import uuid
            new_user = {
                "id": str(uuid.uuid4()),
                "username": user_data["username"],
                "password": pwd_context.hash(user_data["password"]),
                "city": user_data["city"],
                "role": user_data["role"],
                "permissions": {}
            }
            if "assigned_month" in user_data:
                new_user["assigned_month"] = user_data["assigned_month"]
            
            await db.users.insert_one(new_user)
            print(f"   ✅ Créé: {user_data['username']} ({user_data['role']})")
    
    # 3. VÉRIFIER LES VILLES FINALES
    print("\n3. Vérification finale des villes...")
    final_cities = await db.cities.find({}, {"_id": 0, "name": 1, "id": 1}).to_list(length=None)
    print(f"   Total: {len(final_cities)} villes")
    for city in sorted(final_cities, key=lambda x: x['name']):
        print(f"   - {city['name']}")
    
    # 4. TESTER TOUS LES COMPTES
    print("\n4. Test de tous les comptes...")
    from passlib.context import CryptContext
    pwd_context_test = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    for user_data in users_to_ensure:
        user = await db.users.find_one({
            "username": user_data["username"],
            "city": user_data["city"]
        })
        
        if user:
            # Vérifier le mot de passe
            password_ok = pwd_context_test.verify(user_data["password"], user["password"])
            if password_ok:
                print(f"   ✅ {user_data['username']:20} / {user_data['password']:20} - OK")
            else:
                print(f"   ❌ {user_data['username']:20} / {user_data['password']:20} - MDP INCORRECT!")
        else:
            print(f"   ❌ {user_data['username']:20} - UTILISATEUR NON TROUVÉ!")
    
    print("\n" + "=" * 80)
    print("NETTOYAGE TERMINÉ")
    print("=" * 80)
    
    client.close()

asyncio.run(fix_everything())
