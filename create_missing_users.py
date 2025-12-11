#!/usr/bin/env python3
import requests
import os
from dotenv import load_dotenv

load_dotenv('/app/frontend/.env')
BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://ministery-stars.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

# Login as superadmin
response = requests.post(f"{API_URL}/auth/login", json={
    "username": "superadmin",
    "password": "superadmin123",
    "city": "Dijon"
})

if response.status_code != 200:
    print("❌ Impossible de se connecter en tant que superadmin")
    exit(1)

token = response.json()['token']
headers = {"Authorization": f"Bearer {token}"}

# Comptes à créer
missing_users = [
    {
        "username": "superviseur_fi",
        "password": "superviseur123",
        "city": "Dijon",
        "role": "superviseur_fi"
    },
    {
        "username": "pilote1",
        "password": "pilote123",
        "city": "Dijon",
        "role": "pilote_fi"
    },
    {
        "username": "responsable_secteur1",
        "password": "resp123",
        "city": "Dijon",
        "role": "responsable_secteur"
    }
]

print("Création des utilisateurs manquants...")
print("=" * 60)

for user_data in missing_users:
    response = requests.post(f"{API_URL}/users/referent", json=user_data, headers=headers)
    
    if response.status_code == 200:
        print(f"✅ Créé: {user_data['username']} ({user_data['role']}) - Mot de passe: {user_data['password']}")
    else:
        print(f"❌ Erreur pour {user_data['username']}: {response.json().get('detail', 'Erreur inconnue')}")

print("=" * 60)
print("Vérification des nouveaux comptes...")
print("=" * 60)

# Vérifier que les comptes fonctionnent
for user_data in missing_users:
    response = requests.post(f"{API_URL}/auth/login", json={
        "username": user_data['username'],
        "password": user_data['password'],
        "city": user_data['city']
    })
    
    if response.status_code == 200:
        print(f"✅ {user_data['username']:25} | Connexion OK | Rôle: {user_data['role']}")
    else:
        print(f"❌ {user_data['username']:25} | Connexion échouée")

