#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

async def assign_fi():
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Trouver une FI de Dijon
    fi = await db.familles_impact.find_one({"ville": "Dijon"})
    
    if not fi:
        print("❌ Aucune FI trouvée pour Dijon. Création d'une FI...")
        
        # D'abord créer un secteur
        secteur = await db.secteurs.find_one({"ville": "Dijon"})
        if not secteur:
            import uuid
            secteur = {
                "id": str(uuid.uuid4()),
                "name": "Centre",
                "ville": "Dijon"
            }
            await db.secteurs.insert_one(secteur)
            print(f"✅ Secteur créé: {secteur['name']}")
        
        # Créer la FI
        import uuid
        fi = {
            "id": str(uuid.uuid4()),
            "name": "Famille République",
            "ville": "Dijon",
            "secteur_id": secteur["id"],
            "pilote_id": None
        }
        await db.familles_impact.insert_one(fi)
        print(f"✅ FI créée: {fi['name']}")
    else:
        fi_name = fi.get('name') or fi.get('nom', 'Inconnu')
        print(f"✅ FI trouvée: {fi_name}")
    
    # Trouver le pilote1
    pilote = await db.users.find_one({"username": "pilote1", "city": "Dijon"})
    if not pilote:
        print("❌ Pilote1 non trouvé")
        client.close()
        return
    
    # Assigner cette FI au pilote
    result = await db.users.update_one(
        {"username": "pilote1", "city": "Dijon"},
        {"$set": {"assigned_fi_id": fi["id"]}}
    )
    
    # Mettre à jour le pilote_id dans la FI
    await db.familles_impact.update_one(
        {"id": fi["id"]},
        {"$set": {"pilote_id": pilote["id"]}}
    )
    
    if result.modified_count > 0:
        print(f"✅ FI assignée à pilote1")
    else:
        print("⚠️  Utilisateur déjà à jour ou non trouvé")
    
    # Vérifier
    user = await db.users.find_one({"username": "pilote1"})
    if user:
        print(f"FI assignée ID: {user.get('assigned_fi_id', 'Aucune')}")
    
    client.close()

asyncio.run(assign_fi())
