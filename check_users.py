#!/usr/bin/env python3
import requests
import os
from dotenv import load_dotenv

load_dotenv('/app/frontend/.env')
BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://impact-family.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

# Liste des comptes à tester
test_accounts = [
    ("superadmin", "superadmin123", "Dijon"),
    ("pasteur", "pasteur123", "Dijon"),
    ("admin", "admin123", "Dijon"),
    ("superviseur_fi", "superviseur123", "Dijon"),
    ("referent1", "referent123", "Dijon"),
    ("pilote1", "pilote123", "Dijon"),
    ("responsable_secteur1", "resp123", "Dijon"),
    ("accueil1", "accueil123", "Dijon"),
    ("promotions1", "promo123", "Dijon"),
]

print("=" * 60)
print("VÉRIFICATION DES COMPTES EXISTANTS")
print("=" * 60)

working = []
not_working = []

for username, password, city in test_accounts:
    try:
        response = requests.post(f"{API_URL}/auth/login", json={
            "username": username,
            "password": password,
            "city": city
        })
        
        if response.status_code == 200:
            data = response.json()
            user = data.get('user', {})
            print(f"✅ {username:25} | Mot de passe: {password:20} | Rôle: {user.get('role', 'N/A'):25} | Ville: {user.get('city', 'N/A')}")
            working.append((username, password, city, user.get('role', 'N/A')))
        else:
            print(f"❌ {username:25} | {response.status_code} - {response.json().get('detail', 'Erreur')}")
            not_working.append((username, password, city))
    except Exception as e:
        print(f"❌ {username:25} | Erreur: {str(e)}")
        not_working.append((username, password, city))

print("\n" + "=" * 60)
print(f"RÉSUMÉ: {len(working)} comptes fonctionnels, {len(not_working)} non fonctionnels")
print("=" * 60)

if working:
    print("\n✅ COMPTES FONCTIONNELS:")
    for username, password, city, role in working:
        print(f"   - {username} / {password} ({role})")

if not_working:
    print("\n❌ COMPTES À CRÉER:")
    for username, password, city in not_working:
        print(f"   - {username} / {password}")

