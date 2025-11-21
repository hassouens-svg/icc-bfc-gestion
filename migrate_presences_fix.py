#!/usr/bin/env python3
"""
Script de migration pour corriger l'attribution des présences jeudi/dimanche
Déplace les présences jeudi mal placées dans presences_dimanche vers presences_jeudi
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime

async def migrate_presences():
    """Migrate wrongly assigned presences"""
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL', 'mongodb://localhost:27017'))
    db = client.churchmanagement
    
    print("🔄 Début de la migration des présences...")
    print("="*70)
    
    # Get all visitors
    visitors = await db.visitors.find({}, {"_id": 0}).to_list(10000)
    
    total_visitors = len(visitors)
    visitors_updated = 0
    presences_moved = 0
    
    for visitor in visitors:
        visitor_id = visitor.get("id")
        presences_dim = visitor.get("presences_dimanche", [])
        presences_jeu = visitor.get("presences_jeudi", [])
        
        if not presences_dim:
            continue
        
        # Séparer les présences dimanche et jeudi
        real_dimanche = []
        real_jeudi = []
        
        for presence in presences_dim:
            date_str = presence.get("date", "")
            if not date_str:
                real_dimanche.append(presence)
                continue
            
            try:
                year, month, day = date_str.split('-')
                date_obj = datetime(int(year), int(month), int(day))
                day_of_week = date_obj.weekday()  # 0=Monday, 6=Sunday
                
                if day_of_week == 6:  # Sunday
                    real_dimanche.append(presence)
                elif day_of_week == 3:  # Thursday
                    real_jeudi.append(presence)
                    presences_moved += 1
                else:
                    # Autres jours → jeudi (selon la règle)
                    real_jeudi.append(presence)
                    presences_moved += 1
            except Exception as e:
                print(f"⚠️  Erreur parsing date {date_str}: {e}")
                real_dimanche.append(presence)
        
        # Si des présences doivent être déplacées
        if real_jeudi:
            visitors_updated += 1
            
            # Fusionner avec les présences jeudi existantes (éviter les doublons)
            existing_jeudi_dates = {p.get("date") for p in presences_jeu}
            for p in real_jeudi:
                if p.get("date") not in existing_jeudi_dates:
                    presences_jeu.append(p)
            
            # Update visitor
            await db.visitors.update_one(
                {"id": visitor_id},
                {
                    "$set": {
                        "presences_dimanche": real_dimanche,
                        "presences_jeudi": presences_jeu
                    }
                }
            )
            
            visitor_name = f"{visitor.get('firstname', '')} {visitor.get('lastname', '')}"
            print(f"✅ {visitor_name}: {len(real_jeudi)} présences déplacées vers jeudi")
    
    print("\n" + "="*70)
    print(f"📊 RÉSULTATS DE LA MIGRATION")
    print(f"{'='*70}")
    print(f"Total visiteurs: {total_visitors}")
    print(f"Visiteurs mis à jour: {visitors_updated}")
    print(f"Présences déplacées: {presences_moved}")
    print(f"\n✅ Migration terminée avec succès!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(migrate_presences())
