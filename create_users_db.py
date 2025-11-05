#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import os
import uuid
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_users():
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    users_to_create = [
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
            "username": "pilote1",
            "password": pwd_context.hash("pilote123"),
            "city": "Dijon",
            "role": "pilote_fi",
            "assigned_fi_id": None,
            "permissions": {}
        },
        {
            "id": str(uuid.uuid4()),
            "username": "responsable_secteur1",
            "password": pwd_context.hash("resp123"),
            "city": "Dijon",
            "role": "responsable_secteur",
            "assigned_secteur_id": None,
            "permissions": {}
        }
    ]
    
    print("Création des utilisateurs dans MongoDB...")
    print("=" * 60)
    
    for user_data in users_to_create:
        # Vérifier si l'utilisateur existe déjà
        existing = await db.users.find_one({"username": user_data["username"], "city": user_data["city"]})
        
        if existing:
            print(f"⚠️  {user_data['username']} existe déjà")
        else:
            await db.users.insert_one(user_data)
            print(f"✅ Créé: {user_data['username']} ({user_data['role']})")
    
    print("=" * 60)
    print("Terminé!")
    
    client.close()

asyncio.run(create_users())
