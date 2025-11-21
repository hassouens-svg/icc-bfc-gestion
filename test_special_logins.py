#!/usr/bin/env python3
import requests
import os
from dotenv import load_dotenv

load_dotenv('/app/frontend/.env')
BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://church-data-sync.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

# Test pasteur et superadmin sans ville (ils ne devraient pas en avoir besoin)
test_accounts = [
    ("superadmin", "superadmin123", None),
    ("superadmin", "superadmin123", "Dijon"),
    ("pasteur", "pasteur123", None),
    ("pasteur", "pasteur123", "Dijon"),
]

print("=" * 60)
print("TEST DES LOGINS SPÉCIAUX")
print("=" * 60)

for username, password, city in test_accounts:
    payload = {
        "username": username,
        "password": password
    }
    if city:
        payload["city"] = city
    
    print(f"\nTest: {username} avec city={city}")
    
    try:
        response = requests.post(f"{API_URL}/auth/login", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            user = data.get('user', {})
            print(f"✅ SUCCÈS - Rôle: {user.get('role')} | Ville: {user.get('city')}")
        else:
            print(f"❌ ÉCHEC - {response.status_code}: {response.json().get('detail', 'Erreur')}")
    except Exception as e:
        print(f"❌ ERREUR: {str(e)}")

