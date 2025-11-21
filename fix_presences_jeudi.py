#!/usr/bin/env python3
"""
Script pour migrer les présences jeudi mal enregistrées dans presences_dimanche
vers presences_jeudi
"""
from pymongo import MongoClient
import os
from datetime import datetime

# Connexion MongoDB
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'test_database')
client = MongoClient(mongo_url)
db = client[db_name]

print("=" * 60)
print("MIGRATION DES PRÉSENCES JEUDI")
print("=" * 60)

# Trouver tous les visiteurs avec des présences
visitors = db.visitors.find({'presences_dimanche': {'$ne': []}})

migrated_count = 0
visitors_updated = 0

for visitor in visitors:
    presences_dim = visitor.get('presences_dimanche', [])
    presences_jeu = visitor.get('presences_jeudi', [])
    
    # Séparer les vraies présences dimanche des présences jeudi
    real_dimanche = []
    real_jeudi = list(presences_jeu)  # Garder les présences jeudi existantes
    
    for presence in presences_dim:
        date_str = presence.get('date')
        if date_str:
            try:
                # Parser la date
                date_obj = datetime.strptime(date_str, '%Y-%m-%d')
                day_of_week = date_obj.weekday()  # 0=Lundi, 3=Jeudi, 6=Dimanche
                
                if day_of_week == 3:  # Jeudi
                    # Migrer vers presences_jeudi
                    real_jeudi.append(presence)
                    migrated_count += 1
                elif day_of_week == 6:  # Dimanche
                    # Garder dans presences_dimanche
                    real_dimanche.append(presence)
                else:
                    # Ni dimanche ni jeudi, garder dans dimanche par défaut
                    real_dimanche.append(presence)
                    print(f"⚠️ {visitor.get('firstname')} {visitor.get('lastname')}: Date {date_str} n'est ni jeudi ni dimanche (jour {day_of_week})")
            except Exception as e:
                print(f"❌ Erreur parsing date {date_str}: {e}")
                real_dimanche.append(presence)
        else:
            real_dimanche.append(presence)
    
    # Mettre à jour le visiteur si des changements ont été faits
    if len(real_dimanche) != len(presences_dim) or len(real_jeudi) != len(presences_jeu):
        db.visitors.update_one(
            {'id': visitor['id']},
            {
                '$set': {
                    'presences_dimanche': real_dimanche,
                    'presences_jeudi': real_jeudi
                }
            }
        )
        visitors_updated += 1
        print(f"✅ {visitor.get('firstname')} {visitor.get('lastname')}: {len(real_dimanche)} dim, {len(real_jeudi)} jeu")

print("\n" + "=" * 60)
print(f"✅ Migration terminée !")
print(f"   Présences migrées: {migrated_count}")
print(f"   Visiteurs mis à jour: {visitors_updated}")
print("=" * 60)
