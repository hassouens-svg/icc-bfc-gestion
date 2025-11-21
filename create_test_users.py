#!/usr/bin/env python3
"""
Create test users for comprehensive role testing
"""

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')
BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://presence-tracker-65.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

def create_test_users():
    # Login as superviseur_promos (can create users)
    login_response = requests.post(f'{API_URL}/auth/login', 
                                  json={'username': 'superviseur_promos', 'password': 'superviseur123', 'city': 'Dijon'})
    
    if login_response.status_code != 200:
        print("Failed to login as superviseur_promos")
        return
    
    token = login_response.json()['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Users to create
    test_users = [
        {
            "username": "superviseur_fi",
            "password": "superfi123",
            "city": "Dijon",
            "role": "superviseur_fi"
        },
        {
            "username": "referent1",
            "password": "referent123",
            "city": "Dijon",
            "role": "referent",
            "assigned_month": "2025-01"
        },
        {
            "username": "pilote_fi1",
            "password": "pilote123",
            "city": "Dijon",
            "role": "pilote_fi",
            "assigned_fi_id": "test_fi_id"  # We'll need to create an FI first
        },
        {
            "username": "accueil1",
            "password": "accueil123",
            "city": "Dijon",
            "role": "accueil"
        },
        {
            "username": "promotions1",
            "password": "promo123",
            "city": "Dijon",
            "role": "promotions"
        }
    ]
    
    # First, create a secteur and FI for the pilote
    secteur_data = {
        "nom": "Test Secteur",
        "ville": "Dijon"
    }
    
    secteur_response = requests.post(f'{API_URL}/fi/secteurs', 
                                   json=secteur_data, headers=headers)
    
    if secteur_response.status_code == 200:
        secteur_id = secteur_response.json()['id']
        print(f"Created test secteur: {secteur_id}")
        
        # Create FI
        fi_data = {
            "nom": "Test FI",
            "secteur_id": secteur_id,
            "ville": "Dijon"
        }
        
        fi_response = requests.post(f'{API_URL}/fi/familles-impact', 
                                  json=fi_data, headers=headers)
        
        if fi_response.status_code == 200:
            fi_id = fi_response.json()['id']
            print(f"Created test FI: {fi_id}")
            
            # Update pilote user with correct FI ID
            for user in test_users:
                if user['username'] == 'pilote_fi1':
                    user['assigned_fi_id'] = fi_id
    
    # Create users
    for user_data in test_users:
        # Try to create user
        response = requests.post(f'{API_URL}/users/referent', 
                               json=user_data, headers=headers)
        
        if response.status_code == 200:
            print(f"✅ Created user: {user_data['username']} (Role: {user_data['role']})")
        elif response.status_code == 400 and "already exists" in response.text:
            print(f"⚠️  User {user_data['username']} already exists")
        else:
            print(f"❌ Failed to create user {user_data['username']}: {response.status_code} - {response.text}")

if __name__ == "__main__":
    create_test_users()