#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

async def assign_secteur():
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Trouver un secteur de Dijon
    secteur = await db.secteurs.find_one({"ville": "Dijon"})
    
    if not secteur:
        print("❌ Aucun secteur trouvé pour Dijon. Création d'un secteur...")
        import uuid
        secteur = {
            "id": str(uuid.uuid4()),
            "name": "Centre",
            "ville": "Dijon"
        }
        await db.secteurs.insert_one(secteur)
        print(f"✅ Secteur créé: {secteur['name']}")
    else:
        secteur_name = secteur.get('name') or secteur.get('nom', 'Inconnu')
        print(f"✅ Secteur trouvé: {secteur_name}")
    
    # Assigner ce secteur au responsable_secteur1
    result = await db.users.update_one(
        {"username": "responsable_secteur1", "city": "Dijon"},
        {"$set": {"assigned_secteur_id": secteur["id"]}}
    )
    
    if result.modified_count > 0:
        print(f"✅ Secteur assigné à responsable_secteur1")
    else:
        print("⚠️  Utilisateur déjà à jour ou non trouvé")
    
    # Vérifier
    user = await db.users.find_one({"username": "responsable_secteur1"})
    if user:
        print(f"Secteur assigné ID: {user.get('assigned_secteur_id', 'Aucun')}")
    
    client.close()

asyncio.run(assign_secteur())
