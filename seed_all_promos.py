#!/usr/bin/env python3
"""
Script pour créer des données de test pour TOUS les responsables de promo
Chaque mois aura 3 visiteurs avec des présences pour calculer la fidélisation
"""

import os
import sys
from datetime import datetime, timedelta
from pymongo import MongoClient
from uuid import uuid4

# Connect to MongoDB
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/churchmanagement')
client = MongoClient(mongo_url)
db = client.churchmanagement

def create_presences_for_month(year, month):
    """Créer des dates de présences pour un mois donné"""
    presences_dimanche = []
    presences_jeudi = []
    
    # Créer 2 dimanches et 2 jeudis pour ce mois
    start_date = datetime(year, month, 1)
    
    # Trouver le premier dimanche du mois
    days_until_sunday = (6 - start_date.weekday()) % 7
    first_sunday = start_date + timedelta(days=days_until_sunday)
    
    # Trouver le premier jeudi du mois
    days_until_thursday = (3 - start_date.weekday()) % 7
    first_thursday = start_date + timedelta(days=days_until_thursday)
    
    # Créer 2 dimanches
    for i in range(2):
        date = first_sunday + timedelta(weeks=i)
        if date.month == month:
            presences_dimanche.append({
                "date": date.strftime("%Y-%m-%d"),
                "present": True,
                "commentaire": "Présent"
            })
    
    # Créer 2 jeudis
    for i in range(2):
        date = first_thursday + timedelta(weeks=i)
        if date.month == month:
            presences_jeudi.append({
                "date": date.strftime("%Y-%m-%d"),
                "present": True,
                "commentaire": "Présent"
            })
    
    return presences_dimanche, presences_jeudi

def seed_promo_month(year, month):
    """Créer 3 visiteurs pour un mois donné"""
    assigned_month = f"{year}-{month:02d}"
    
    # Vérifier combien de visiteurs existent déjà pour ce mois
    existing = db.visitors.count_documents({"assigned_month": assigned_month})
    
    if existing >= 3:
        print(f"  ✓ {assigned_month} a déjà {existing} visiteurs - skip")
        return 0
    
    created = 0
    presences_dim, presences_jeu = create_presences_for_month(year, month)
    
    for i in range(3 - existing):
        visitor = {
            "id": str(uuid4()),
            "firstname": f"Visiteur{i+1}",
            "lastname": f"Promo{month:02d}",
            "phone": f"+33600{month:02d}{i+1:02d}00",
            "email": None,
            "city": "Dijon",
            "types": ["Nouveau Arrivant"],
            "arrival_channel": "Evangelisation",
            "assigned_month": assigned_month,
            "visit_date": f"{year}-{month:02d}-15",
            "tracking_stopped": False,
            "presences_dimanche": presences_dim if i < 2 else [],  # Les 2 premiers ont des présences
            "presences_jeudi": presences_jeu if i < 2 else [],
            "formation_pcnc": False,
            "formation_au_coeur_bible": False,
            "formation_star": False
        }
        
        db.visitors.insert_one(visitor)
        created += 1
    
    print(f"  ✓ {assigned_month}: créé {created} visiteurs avec présences")
    return created

def main():
    print("=== Seed data pour TOUS les responsables de promo ===\n")
    
    # Créer des visiteurs pour tous les mois de 2024
    total_created = 0
    for month in range(1, 13):
        total_created += seed_promo_month(2024, month)
    
    # Créer pour les premiers mois de 2025
    for month in range(1, 7):
        total_created += seed_promo_month(2025, month)
    
    print(f"\n✅ Total: {total_created} visiteurs créés")
    print("\nMaintenant TOUS les responsables de promo auront des données de fidélisation!")

if __name__ == "__main__":
    main()
