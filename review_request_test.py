#!/usr/bin/env python3
"""
Test exact scenario from review request:
1. Login avec promotions/test123, city: Dijon
2. Créer un visiteur avec POST /api/visitors avec données exactes
3. Vérifier que la réponse contient bien {"message": "...", "id": "..."}
4. Confirmer que le visiteur est dans GET /api/visitors
"""

import requests
import json
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')
BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://cityview-dashboard.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

def log(message, level="INFO"):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {level}: {message}")

def make_request(method, endpoint, token=None, **kwargs):
    """Make HTTP request with optional authentication"""
    url = f"{API_URL}{endpoint}"
    headers = kwargs.get('headers', {})
    
    if token:
        headers['Authorization'] = f'Bearer {token}'
        
    kwargs['headers'] = headers
    
    try:
        response = requests.request(method, url, **kwargs)
        log(f"{method} {endpoint} -> {response.status_code}")
        return response
    except Exception as e:
        log(f"Request failed: {e}", "ERROR")
        return None

def main():
    log("=== TEST RAPIDE CRÉATION VISITEUR APRÈS FIX ===")
    log(f"Backend URL: {BASE_URL}")
    
    # 1. Login avec promotions/test123, city: Dijon
    log("\n1. Login avec promotions/test123, city: Dijon")
    
    login_data = {
        "username": "promotions",
        "password": "test123",
        "city": "Dijon"
    }
    
    login_response = make_request('POST', '/auth/login', json=login_data)
    
    if not login_response or login_response.status_code != 200:
        log("❌ ÉCHEC LOGIN", "ERROR")
        if login_response:
            log(f"   Status: {login_response.status_code}")
            log(f"   Response: {login_response.text}")
        return False
    
    login_result = login_response.json()
    token = login_result['token']
    user_info = login_result['user']
    
    log(f"✅ LOGIN RÉUSSI")
    log(f"   Username: {user_info['username']}")
    log(f"   Role: {user_info['role']}")
    log(f"   City: {user_info['city']}")
    
    # 2. Créer un visiteur avec POST /api/visitors (données exactes du review request)
    log("\n2. Créer un visiteur avec POST /api/visitors")
    
    visitor_data = {
        "firstname": "Test",
        "lastname": "Fix",
        "city": "Dijon",
        "types": ["Nouveau Arrivant"],
        "phone": "+33699999999",
        "email": "test.fix@example.com",
        "arrival_channel": "Evangelisation",
        "visit_date": "2025-01-20"
    }
    
    log("   Données du visiteur:")
    for key, value in visitor_data.items():
        log(f"     {key}: {value}")
    
    create_response = make_request('POST', '/visitors', token=token, json=visitor_data)
    
    if not create_response:
        log("❌ ÉCHEC REQUÊTE", "ERROR")
        return False
    
    log(f"   Status de réponse: {create_response.status_code}")
    
    if create_response.status_code not in [200, 201]:
        log(f"❌ CRÉATION VISITEUR ÉCHOUÉE", "ERROR")
        log(f"   Status: {create_response.status_code}")
        try:
            error_detail = create_response.json()
            log(f"   Erreur: {error_detail}")
        except:
            log(f"   Réponse brute: {create_response.text}")
        return False
    
    # 3. Vérifier que la réponse contient bien {"message": "...", "id": "..."}
    log("\n3. Vérifier le format de réponse")
    
    try:
        response_data = create_response.json()
        log(f"   Réponse JSON: {response_data}")
        
        # Vérifier les champs requis
        has_message = 'message' in response_data
        has_id = 'id' in response_data
        
        if has_message and has_id:
            log("✅ FORMAT CORRECT - contient 'message' et 'id'")
            log(f"   Message: {response_data['message']}")
            log(f"   ID: {response_data['id']}")
            visitor_id = response_data['id']
        else:
            log("❌ FORMAT INCORRECT", "ERROR")
            log(f"   A message: {has_message}")
            log(f"   A id: {has_id}")
            log(f"   Clés actuelles: {list(response_data.keys())}")
            return False
            
    except Exception as e:
        log(f"❌ Échec parsing JSON: {e}", "ERROR")
        log(f"   Réponse brute: {create_response.text}")
        return False
    
    # 4. Confirmer que le visiteur est dans GET /api/visitors
    log("\n4. Confirmer que le visiteur est dans GET /api/visitors")
    
    get_response = make_request('GET', '/visitors', token=token)
    
    if not get_response or get_response.status_code != 200:
        log("❌ Échec récupération liste visiteurs", "ERROR")
        if get_response:
            log(f"   Status: {get_response.status_code}")
            log(f"   Response: {get_response.text}")
        return False
    
    try:
        visitors = get_response.json()
        log(f"   Total visiteurs dans la liste: {len(visitors)}")
        
        # Trouver notre visiteur créé
        created_visitor = None
        for visitor in visitors:
            if visitor.get('id') == visitor_id:
                created_visitor = visitor
                break
        
        if created_visitor:
            log("✅ VISITEUR TROUVÉ dans la liste")
            log(f"   Nom: {created_visitor['firstname']} {created_visitor['lastname']}")
            log(f"   Téléphone: {created_visitor.get('phone')}")
            log(f"   Email: {created_visitor.get('email')}")
            log(f"   Mois assigné: {created_visitor.get('assigned_month')}")
            log(f"   Date de visite: {created_visitor.get('visit_date')}")
        else:
            log("❌ VISITEUR NON TROUVÉ dans la liste", "ERROR")
            log(f"   Recherche ID: {visitor_id}")
            log(f"   IDs disponibles: {[v.get('id') for v in visitors[:3]]}")  # Show first 3 IDs
            return False
            
    except Exception as e:
        log(f"❌ Échec parsing liste visiteurs: {e}", "ERROR")
        log(f"   Réponse brute: {get_response.text}")
        return False
    
    # RÉSULTAT FINAL
    log("\n" + "="*60)
    log("🎉 TOUS LES TESTS RÉUSSIS!")
    log("="*60)
    log("✅ Login avec promotions/test123 réussi")
    log("✅ Création visiteur retourne format correct avec message et id")
    log("✅ Visiteur apparaît dans la liste des visiteurs")
    log("✅ Persistance des données confirmée")
    log("")
    log("🔧 FIX DU FORMAT DE RÉPONSE VÉRIFIÉ!")
    log("   Le backend retourne maintenant le bon format JSON.")
    log("   Si l'utilisateur voit encore une page blanche,")
    log("   le problème est côté FRONTEND (JavaScript, redirection).")
    
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        log("\n❌ ÉCHEC DU TEST - Le fix n'est pas encore complet")
        exit(1)