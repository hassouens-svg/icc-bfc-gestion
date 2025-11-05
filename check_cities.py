#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

async def check_cities():
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Récupérer toutes les villes
    cities = await db.cities.find({}, {"_id": 0}).to_list(length=None)
    
    print("=" * 60)
    print(f"VILLES DANS LA BASE DE DONNÉES ({len(cities)})")
    print("=" * 60)
    
    # Compter les doublons
    city_names = {}
    for city in cities:
        name = city.get('name', 'Unknown')
        if name in city_names:
            city_names[name].append(city)
        else:
            city_names[name] = [city]
    
    # Afficher toutes les villes
    for name, cities_list in sorted(city_names.items()):
        if len(cities_list) > 1:
            print(f"⚠️  {name} - {len(cities_list)} DOUBLONS !")
            for city in cities_list:
                print(f"    ID: {city.get('id', 'N/A')}")
        else:
            print(f"✅ {name}")
    
    print("\n" + "=" * 60)
    print(f"Total: {len(city_names)} villes uniques, {len(cities)} entrées")
    print("=" * 60)
    
    # Si doublons, proposer de les supprimer
    doublons = {name: cities for name, cities in city_names.items() if len(cities) > 1}
    if doublons:
        print(f"\n⚠️  {len(doublons)} ville(s) en double détectée(s)!")
        for name, cities_list in doublons.items():
            print(f"\nVille '{name}' a {len(cities_list)} entrées:")
            for i, city in enumerate(cities_list, 1):
                print(f"  {i}. ID: {city.get('id')}")
    
    client.close()
    return doublons

asyncio.run(check_cities())
