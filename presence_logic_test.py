#!/usr/bin/env python3
"""
🎯 TEST SPÉCIFIQUE - LOGIQUE DES PRÉSENCES JEUDI/DIMANCHE
Test pour vérifier la correction du Bug #1: Présences Jeudi mal attribuées
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://ministry-app-7.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

def login_user(username, password, city):
    """Login and return JWT token"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"username": username, "password": password, "city": city},
            headers=HEADERS,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return data.get("token"), data.get("user")
        else:
            return None, f"Login failed: {response.status_code} - {response.text}"
    except Exception as e:
        return None, f"Login error: {str(e)}"

def make_authenticated_request(method, endpoint, token, data=None, params=None):
    """Make authenticated API request"""
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    try:
        if method.upper() == "GET":
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, params=params, timeout=10)
        elif method.upper() == "POST":
            response = requests.post(f"{BASE_URL}{endpoint}", headers=headers, json=data, timeout=10)
        elif method.upper() == "PUT":
            response = requests.put(f"{BASE_URL}{endpoint}", headers=headers, json=data, timeout=10)
        elif method.upper() == "DELETE":
            response = requests.delete(f"{BASE_URL}{endpoint}", headers=headers, timeout=10)
        
        return response
    except Exception as e:
        print(f"Request error: {str(e)}")
        return None

def get_day_name(date_str):
    """Get day name from date string"""
    try:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d")
        return date_obj.strftime("%A")  # Full day name
    except:
        return "Unknown"

def test_presence_logic():
    """Test the presence logic for different days"""
    print(f"🎯 TEST LOGIQUE DES PRÉSENCES JEUDI/DIMANCHE")
    print(f"Backend URL: {BASE_URL}")
    print(f"{'='*80}")
    
    # Login as superadmin for full access
    token, user = login_user("superadmin", "superadmin123", "Dijon")
    
    if not token:
        print(f"❌ Échec de connexion: {user}")
        return False
    
    print(f"✅ Connecté comme: {user.get('username')} (role: {user.get('role')})")
    
    # Create a test visitor
    test_visitor = {
        "firstname": "TestPresence",
        "lastname": "LogicTest",
        "city": "Dijon",
        "types": ["Nouveau Arrivant"],
        "phone": "+33987654321",
        "email": "test.presence@example.com",
        "arrival_channel": "Evangelisation",
        "visit_date": "2025-01-15"
    }
    
    response = make_authenticated_request("POST", "/visitors", token, data=test_visitor)
    
    if not response or response.status_code != 200:
        print(f"❌ Échec création visiteur: {response.status_code if response else 'No response'}")
        return False
    
    visitor_data = response.json()
    visitor_id = visitor_data.get("id")
    print(f"✅ Visiteur créé avec ID: {visitor_id}")
    
    try:
        # Test different dates and their expected behavior
        test_cases = [
            ("2025-01-16", "jeudi", "Thursday"),    # Jeudi
            ("2025-01-19", "dimanche", "Sunday"),   # Dimanche  
            ("2025-01-20", "jeudi", "Monday"),      # Lundi → doit aller dans jeudi
            ("2025-01-21", "jeudi", "Tuesday"),     # Mardi → doit aller dans jeudi
            ("2025-01-22", "jeudi", "Wednesday"),   # Mercredi → doit aller dans jeudi
            ("2025-01-23", "jeudi", "Thursday"),    # Jeudi
            ("2025-01-24", "jeudi", "Friday"),      # Vendredi → doit aller dans jeudi
            ("2025-01-25", "jeudi", "Saturday"),    # Samedi → doit aller dans jeudi
        ]
        
        for date_str, expected_type, day_name in test_cases:
            presence_data = {
                "date": date_str,
                "present": True,
                "type": expected_type,
                "commentaire": f"Test {day_name} → {expected_type}"
            }
            
            response = make_authenticated_request("POST", f"/visitors/{visitor_id}/presence", token, data=presence_data)
            
            if response and response.status_code == 200:
                print(f"✅ Présence marquée: {date_str} ({day_name}) → type: {expected_type}")
            else:
                print(f"❌ Échec présence: {date_str} ({day_name}) → {response.status_code if response else 'No response'}")
        
        # Retrieve visitor to check presence distribution
        response = make_authenticated_request("GET", f"/visitors/{visitor_id}", token)
        
        if response and response.status_code == 200:
            visitor = response.json()
            presences_jeudi = visitor.get("presences_jeudi", [])
            presences_dimanche = visitor.get("presences_dimanche", [])
            
            print(f"\n📊 RÉSULTATS DES PRÉSENCES:")
            print(f"{'='*50}")
            print(f"Présences JEUDI: {len(presences_jeudi)}")
            for p in presences_jeudi:
                day_name = get_day_name(p.get("date"))
                print(f"  - {p.get('date')} ({day_name}): Present={p.get('present')}, Comment={p.get('commentaire', '')}")
            
            print(f"\nPrésences DIMANCHE: {len(presences_dimanche)}")
            for p in presences_dimanche:
                day_name = get_day_name(p.get("date"))
                print(f"  - {p.get('date')} ({day_name}): Present={p.get('present')}, Comment={p.get('commentaire', '')}")
            
            # Verify the logic
            print(f"\n🔍 VÉRIFICATION DE LA LOGIQUE:")
            print(f"{'='*50}")
            
            # Check that only Sunday goes to presences_dimanche
            dimanche_dates = [p.get("date") for p in presences_dimanche]
            expected_dimanche = ["2025-01-19"]  # Only Sunday
            
            if set(dimanche_dates) == set(expected_dimanche):
                print(f"✅ CORRECT: Seuls les dimanches sont dans presences_dimanche: {dimanche_dates}")
            else:
                print(f"❌ ERREUR: presences_dimanche contient: {dimanche_dates}, attendu: {expected_dimanche}")
            
            # Check that all other days go to presences_jeudi
            jeudi_dates = [p.get("date") for p in presences_jeudi]
            expected_jeudi = ["2025-01-16", "2025-01-20", "2025-01-21", "2025-01-22", "2025-01-23", "2025-01-24", "2025-01-25"]
            
            if set(jeudi_dates) == set(expected_jeudi):
                print(f"✅ CORRECT: Tous les autres jours sont dans presences_jeudi: {len(jeudi_dates)} dates")
            else:
                print(f"❌ ERREUR: presences_jeudi contient: {jeudi_dates}")
                print(f"         Attendu: {expected_jeudi}")
            
            # Summary
            total_presences = len(presences_jeudi) + len(presences_dimanche)
            print(f"\n📈 RÉSUMÉ:")
            print(f"Total présences: {total_presences}")
            print(f"Répartition: {len(presences_jeudi)} jeudi, {len(presences_dimanche)} dimanche")
            
            if len(presences_dimanche) == 1 and len(presences_jeudi) == 7:
                print(f"✅ BUG #1 CORRIGÉ: La logique des présences fonctionne correctement!")
                success = True
            else:
                print(f"❌ BUG #1 PERSISTE: Répartition incorrecte des présences")
                success = False
        
        else:
            print(f"❌ Échec récupération visiteur: {response.status_code if response else 'No response'}")
            success = False
    
    finally:
        # Clean up - delete test visitor
        delete_response = make_authenticated_request("DELETE", f"/visitors/{visitor_id}", token)
        if delete_response and delete_response.status_code == 200:
            print(f"✅ Visiteur de test supprimé")
        else:
            print(f"⚠️  Échec suppression visiteur de test")
    
    return success

if __name__ == "__main__":
    success = test_presence_logic()
    if success:
        print(f"\n🎉 TEST RÉUSSI: Le Bug #1 est corrigé!")
        sys.exit(0)
    else:
        print(f"\n❌ TEST ÉCHOUÉ: Le Bug #1 nécessite une vérification")
        sys.exit(1)