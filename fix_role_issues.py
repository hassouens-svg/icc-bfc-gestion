#!/usr/bin/env python3
"""
Fix identified role permission issues
"""

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')
BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://churchflow-5.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

def fix_pilote_fi_assignment():
    """Fix pilote_fi1 user to have assigned_fi_id"""
    
    # Login as superviseur_promos to update user
    login_response = requests.post(f'{API_URL}/auth/login', 
                                  json={'username': 'superviseur_promos', 'password': 'superviseur123', 'city': 'Dijon'})
    
    if login_response.status_code != 200:
        print("Failed to login as superviseur_promos")
        return
    
    token = login_response.json()['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Get available FIs
    fi_response = requests.get(f'{API_URL}/fi/familles-impact', headers=headers)
    if fi_response.status_code == 200:
        fis = fi_response.json()
        if fis:
            fi_id = fis[0]['id']  # Use first available FI
            print(f"Found FI to assign: {fi_id}")
            
            # We need to update the user directly in database since the API doesn't support assigned_fi_id
            # This is a limitation that should be noted
            print("⚠️  Cannot update assigned_fi_id via API - this field is not supported in UserUpdate model")
            print(f"   Pilote FI would need to be assigned to FI: {fi_id}")
            return fi_id
    
    return None

def test_accueil_restriction():
    """Test if accueil role should be restricted from creating visitors"""
    
    # Login as accueil
    login_response = requests.post(f'{API_URL}/auth/login', 
                                  json={'username': 'accueil1', 'password': 'accueil123', 'city': 'Dijon'})
    
    if login_response.status_code != 200:
        print("Failed to login as accueil")
        return
    
    token = login_response.json()['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Try to create visitor
    visitor_data = {
        "firstname": "Test",
        "lastname": "Accueil",
        "city": "Dijon",
        "types": ["Nouveau Arrivant"],
        "phone": "+33123456789",
        "arrival_channel": "Test",
        "visit_date": "2025-01-25"
    }
    
    response = requests.post(f'{API_URL}/visitors', json=visitor_data, headers=headers)
    
    if response.status_code == 200:
        print("❌ ISSUE CONFIRMED: Accueil role can create visitors (should be read-only)")
        print("   The POST /visitors endpoint lacks role-based restrictions")
        return True
    else:
        print("✅ Accueil role correctly restricted from creating visitors")
        return False

if __name__ == "__main__":
    print("Investigating role permission issues...")
    
    # Fix 1: Pilote FI assignment
    fi_id = fix_pilote_fi_assignment()
    
    # Fix 2: Test accueil restriction
    accueil_issue = test_accueil_restriction()
    
    print("\nSUMMARY:")
    print("1. Pilote FI assigned_fi_id: API limitation - field not supported in UserUpdate")
    print("2. Accueil visitor creation:", "❌ ISSUE FOUND" if accueil_issue else "✅ OK")