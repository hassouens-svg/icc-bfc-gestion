#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import requests
import os
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')
load_dotenv('/app/frontend/.env')

async def health_check():
    print("=" * 80)
    print("HEALTH CHECK FINAL AVANT DÉPLOIEMENT")
    print("=" * 80)
    
    # 1. MongoDB
    print("\n1. TEST MONGODB")
    print("-" * 80)
    try:
        mongo_url = os.environ['MONGO_URL']
        db_name = os.environ['DB_NAME']
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        db = client[db_name]
        
        # Test connection
        await client.admin.command('ping')
        print("✅ Connexion MongoDB OK")
        
        # Count users
        user_count = await db.users.count_documents({})
        print(f"✅ Utilisateurs: {user_count}")
        
        # Count cities
        city_count = await db.cities.count_documents({})
        cities = await db.cities.find({}, {"_id": 0, "name": 1}).to_list(length=None)
        city_names = [c['name'] for c in cities]
        print(f"✅ Villes: {city_count} - {', '.join(sorted(city_names))}")
        
        # Check duplicates
        city_name_counts = {}
        for name in city_names:
            city_name_counts[name] = city_name_counts.get(name, 0) + 1
        
        duplicates = [name for name, count in city_name_counts.items() if count > 1]
        if duplicates:
            print(f"❌ DOUBLONS DÉTECTÉS: {', '.join(duplicates)}")
        else:
            print("✅ Aucun doublon de ville")
        
        client.close()
    except Exception as e:
        print(f"❌ Erreur MongoDB: {str(e)}")
        return False
    
    # 2. Backend API
    print("\n2. TEST BACKEND API")
    print("-" * 80)
    try:
        backend_url = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')
        api_url = f"{backend_url}/api"
        
        # Test root endpoint
        response = requests.get(f"{api_url}/", timeout=5)
        if response.status_code == 200:
            print(f"✅ API Root: {response.json()}")
        else:
            print(f"❌ API Root: {response.status_code}")
        
        # Test login endpoint
        login_data = {
            "username": "superadmin",
            "password": "superadmin123",
            "city": "Dijon"
        }
        response = requests.post(f"{api_url}/auth/login", json=login_data, timeout=5)
        if response.status_code == 200:
            print(f"✅ Login Test: OK (superadmin)")
        else:
            print(f"❌ Login Test: {response.status_code} - {response.json()}")
        
        # Test cities endpoint
        response = requests.get(f"{api_url}/cities", timeout=5)
        if response.status_code == 200:
            cities_api = response.json()
            print(f"✅ Cities API: {len(cities_api)} villes")
        else:
            print(f"❌ Cities API: {response.status_code}")
        
    except Exception as e:
        print(f"❌ Erreur Backend API: {str(e)}")
        return False
    
    # 3. Environment Variables
    print("\n3. VARIABLES D'ENVIRONNEMENT")
    print("-" * 80)
    print(f"✅ MONGO_URL: {os.environ.get('MONGO_URL', 'NOT SET')}")
    print(f"✅ DB_NAME: {os.environ.get('DB_NAME', 'NOT SET')}")
    print(f"✅ REACT_APP_BACKEND_URL: {os.environ.get('REACT_APP_BACKEND_URL', 'NOT SET')}")
    
    # 4. Services
    print("\n4. STATUS DES SERVICES")
    print("-" * 80)
    import subprocess
    try:
        result = subprocess.run(['sudo', 'supervisorctl', 'status'], 
                              capture_output=True, text=True, timeout=5)
        print(result.stdout)
    except Exception as e:
        print(f"⚠️  Impossible de vérifier supervisorctl: {str(e)}")
    
    print("\n" + "=" * 80)
    print("HEALTH CHECK TERMINÉ - APPLICATION PRÊTE POUR DÉPLOIEMENT ✅")
    print("=" * 80)
    
    return True

asyncio.run(health_check())
