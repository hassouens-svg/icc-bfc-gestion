#!/usr/bin/env python3
import requests
import os
from dotenv import load_dotenv

load_dotenv('/app/frontend/.env')
BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://cityview-dashboard.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

# TOUS les comptes à tester
test_accounts = [
    ("superadmin", "superadmin123", "Dijon", "Accès Spécifiques"),
    ("pasteur", "pasteur123", "Dijon", "Accès Spécifiques"),
    ("admin", "admin123", "Dijon", "Login Normal"),
    ("superviseur_fi", "superviseur123", "Dijon", "Login Normal"),
    ("referent1", "referent123", "Dijon", "Login Normal"),
    ("pilote1", "pilote123", "Dijon", "Login Normal"),
    ("responsable_secteur1", "resp123", "Dijon", "Login Normal"),
    ("accueil1", "accueil123", "Dijon", "Login Normal"),
    ("promotions1", "promo123", "Dijon", "Login Normal"),
]

print("=" * 80)
print("TEST COMPLET DE TOUS LES IDENTIFIANTS")
print("=" * 80)

working = []
not_working = []

for username, password, city, page in test_accounts:
    payload = {"username": username, "password": password, "city": city}
    
    try:
        response = requests.post(f"{API_URL}/auth/login", json=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            user = data.get('user', {})
            print(f"✅ {username:25} | {password:20} | {user.get('role', 'N/A'):25} | {page}")
            working.append((username, password, user.get('role', 'N/A'), page))
        else:
            print(f"❌ {username:25} | {password:20} | ERREUR: {response.status_code} - {response.json().get('detail', 'Unknown')}")
            not_working.append((username, password, page, response.json().get('detail', 'Unknown')))
    except Exception as e:
        print(f"❌ {username:25} | {password:20} | EXCEPTION: {str(e)}")
        not_working.append((username, password, page, str(e)))

print("\n" + "=" * 80)
print(f"RÉSUMÉ: {len(working)}/{len(test_accounts)} comptes fonctionnent")
print("=" * 80)

if not_working:
    print("\n❌ COMPTES NON FONCTIONNELS:")
    for username, password, page, error in not_working:
        print(f"   - {username} / {password} ({page})")
        print(f"     Erreur: {error}")

print("\n✅ COMPTES FONCTIONNELS:")
for username, password, role, page in working:
    print(f"   - {username:20} / {password:20} | {role:25} | {page}")

