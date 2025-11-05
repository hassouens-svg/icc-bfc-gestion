#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def fix_user():
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Trouver l'utilisateur
    user = await db.users.find_one({"username": "superviseur_fi", "city": "Dijon"})
    
    if user:
        print(f"Utilisateur trouvé: {user['username']}")
        print(f"Rôle actuel: {user.get('role', 'N/A')}")
        
        # Réinitialiser le mot de passe
        new_password = pwd_context.hash("superviseur123")
        await db.users.update_one(
            {"username": "superviseur_fi", "city": "Dijon"},
            {"$set": {"password": new_password, "role": "superviseur_fi"}}
        )
        print("✅ Mot de passe réinitialisé et rôle confirmé")
    else:
        print("❌ Utilisateur non trouvé")
    
    client.close()

asyncio.run(fix_user())
