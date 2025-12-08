#!/usr/bin/env python3
"""
🎯 TEST UTILISATEUR - JALONS AVEC DONNÉES SPÉCIFIQUES
Test avec les données exactes fournies par l'utilisateur
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://event-dashboard-25.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

# Credentials from user request
CREDENTIALS = {
    "username": "superadmin",
    "password": "superadmin123",
    "city": "Dijon"
}

def login():
    """Login and return JWT token"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json=CREDENTIALS,
            headers=HEADERS,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return data.get("token")
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return None

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
        print(f"❌ Request error: {str(e)}")
        return None

def main():
    """Test with user's exact data"""
    print(f"🎯 TEST UTILISATEUR - JALONS AVEC DONNÉES SPÉCIFIQUES")
    print(f"Backend URL: {BASE_URL}")
    print(f"Début des tests: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Login
    print(f"\n🔐 AUTHENTIFICATION")
    token = login()
    if not token:
        return 1
    print(f"✅ Authentification réussie")
    
    # Create test project first
    print(f"\n📋 CRÉATION PROJET TEST")
    project_data = {
        "titre": "test-project-1",
        "description": "Projet de test pour jalons utilisateur",
        "ville": "Dijon",
        "statut": "en_cours"
    }
    
    response = make_authenticated_request("POST", "/events/projets", token, data=project_data)
    if not response or response.status_code != 200:
        print(f"❌ Impossible de créer le projet: {response.status_code if response else 'No response'}")
        return 1
    
    project_data_response = response.json()
    project_id = project_data_response.get("id")
    print(f"✅ Projet créé avec ID: {project_id}")
    
    try:
        # Test 1: Création de Jalon (données utilisateur exactes)
        print(f"\n📌 TEST 1: CRÉATION DE JALON")
        jalon_data = {
            "projet_id": project_id,  # Using our created project ID instead of "test-project-1"
            "titre": "Test Jalon 1",
            "description": "Description test",
            "acteur": "Jean Dupont",
            "deadline": "2025-12-31T23:59:00"
        }
        
        response = make_authenticated_request("POST", "/events/jalons", token, data=jalon_data)
        
        if response and response.status_code == 200:
            data = response.json()
            jalon_id = data.get("id")
            print(f"✅ Status 200, jalon créé avec ID: {jalon_id}")
        else:
            print(f"❌ Échec création: Status {response.status_code if response else 'No response'}")
            if response:
                print(f"   Response: {response.text[:200]}")
            return 1
        
        # Test 2: Récupération des Jalons
        print(f"\n📋 TEST 2: RÉCUPÉRATION DES JALONS")
        response = make_authenticated_request("GET", "/events/jalons", token, params={"projet_id": project_id})
        
        if response and response.status_code == 200:
            jalons = response.json()
            if len(jalons) > 0 and jalons[0].get("titre") == "Test Jalon 1":
                print(f"✅ Le jalon créé est retourné: {jalons[0].get('titre')}")
            else:
                print(f"❌ Jalon non trouvé dans la réponse: {jalons}")
                return 1
        else:
            print(f"❌ Échec récupération: Status {response.status_code if response else 'No response'}")
            return 1
        
        # Test 3: Mise à Jour
        print(f"\n✏️ TEST 3: MISE À JOUR")
        update_data = {
            "statut": "en_cours",
            "titre": "Jalon Modifié"
        }
        
        response = make_authenticated_request("PUT", f"/events/jalons/{jalon_id}", token, data=update_data)
        
        if response and response.status_code == 200:
            print(f"✅ Mise à jour réussie")
            
            # Vérifier la mise à jour
            response = make_authenticated_request("GET", "/events/jalons", token, params={"projet_id": project_id})
            if response and response.status_code == 200:
                jalons = response.json()
                updated_jalon = next((j for j in jalons if j.get("id") == jalon_id), None)
                if updated_jalon and updated_jalon.get("titre") == "Jalon Modifié" and updated_jalon.get("statut") == "en_cours":
                    print(f"✅ Modifications confirmées: titre='{updated_jalon.get('titre')}', statut='{updated_jalon.get('statut')}'")
                else:
                    print(f"❌ Modifications non appliquées: {updated_jalon}")
                    return 1
        else:
            print(f"❌ Échec mise à jour: Status {response.status_code if response else 'No response'}")
            return 1
        
        # Test 4: Suppression
        print(f"\n🗑️ TEST 4: SUPPRESSION")
        response = make_authenticated_request("DELETE", f"/events/jalons/{jalon_id}", token)
        
        if response and response.status_code == 200:
            print(f"✅ Suppression réussie")
            
            # Vérifier la suppression
            response = make_authenticated_request("GET", "/events/jalons", token, params={"projet_id": project_id})
            if response and response.status_code == 200:
                jalons = response.json()
                deleted_jalon = next((j for j in jalons if j.get("id") == jalon_id), None)
                if deleted_jalon is None:
                    print(f"✅ Jalon supprimé confirmé (plus dans la liste)")
                else:
                    print(f"❌ Jalon encore présent après suppression")
                    return 1
        else:
            print(f"❌ Échec suppression: Status {response.status_code if response else 'No response'}")
            return 1
        
    finally:
        # Cleanup
        print(f"\n🧹 NETTOYAGE")
        response = make_authenticated_request("DELETE", f"/events/projets/{project_id}", token)
        if response and response.status_code == 200:
            print(f"✅ Projet de test supprimé")
        else:
            print(f"⚠️ Impossible de supprimer le projet de test")
    
    print(f"\n🎉 TOUS LES TESTS UTILISATEUR SONT PASSÉS!")
    print(f"✅ Les endpoints CRUD des jalons fonctionnent sans erreur")
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)