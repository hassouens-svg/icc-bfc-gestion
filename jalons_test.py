#!/usr/bin/env python3
"""
🎯 TEST RAPIDE - FONCTIONNALITÉ JALONS
Test des endpoints CRUD pour les jalons après correction des bugs
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://event-rsvp-11.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

# Credentials from user request
CREDENTIALS = {
    "username": "superadmin",
    "password": "superadmin123",
    "city": "Dijon"
}

class JalonsTestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
        self.successes = []
    
    def add_success(self, test_name, message=""):
        self.passed += 1
        self.successes.append(f"✅ {test_name}: {message}")
        print(f"✅ {test_name}: {message}")
    
    def add_failure(self, test_name, error):
        self.failed += 1
        self.errors.append(f"❌ {test_name}: {error}")
        print(f"❌ {test_name}: {error}")
    
    def print_summary(self):
        print(f"\n{'='*60}")
        print(f"🎯 RÉSULTATS TESTS JALONS")
        print(f"{'='*60}")
        print(f"✅ Tests réussis: {self.passed}")
        print(f"❌ Tests échoués: {self.failed}")
        print(f"📊 Taux de réussite: {(self.passed/(self.passed+self.failed)*100):.1f}%")
        
        if self.errors:
            print(f"\n❌ ÉCHECS DÉTAILLÉS:")
            for error in self.errors:
                print(f"  {error}")
        
        print(f"\n✅ SUCCÈS:")
        for success in self.successes:
            print(f"  {success}")

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
        return None

def test_authentication(results):
    """Test authentication"""
    print(f"\n🔐 TEST AUTHENTIFICATION")
    print(f"{'='*50}")
    
    token, user_or_error = login()
    
    if token:
        results.add_success("Login superadmin", f"JWT token généré, role: {user_or_error.get('role', 'N/A')}")
        return token, user_or_error
    else:
        results.add_failure("Login superadmin", user_or_error)
        return None, None

def create_test_project(token, results):
    """Create a test project for jalons testing"""
    print(f"\n📋 CRÉATION PROJET TEST")
    print(f"{'='*50}")
    
    project_data = {
        "titre": "Test Projet Jalons",
        "description": "Projet de test pour les jalons",
        "ville": "Dijon",
        "statut": "en_cours"
    }
    
    response = make_authenticated_request("POST", "/events/projets", token, data=project_data)
    
    if response and response.status_code == 200:
        data = response.json()
        project_id = data.get("id")
        if project_id:
            results.add_success("Création projet test", f"Projet créé avec ID: {project_id}")
            return project_id
        else:
            results.add_failure("Création projet test", "Pas d'ID retourné")
            return None
    else:
        error_msg = f"Status: {response.status_code if response else 'No response'}"
        if response:
            error_msg += f", Response: {response.text[:200]}"
        results.add_failure("Création projet test", error_msg)
        return None

def test_jalon_creation(token, project_id, results):
    """Test 1: Création de Jalon"""
    print(f"\n📌 TEST 1: CRÉATION DE JALON")
    print(f"{'='*50}")
    
    jalon_data = {
        "projet_id": project_id,
        "titre": "Test Jalon 1",
        "description": "Description test",
        "acteur": "Jean Dupont",
        "deadline": "2025-12-31T23:59:00"
    }
    
    response = make_authenticated_request("POST", "/events/jalons", token, data=jalon_data)
    
    if response and response.status_code == 200:
        data = response.json()
        jalon_id = data.get("id")
        if jalon_id:
            results.add_success("Création jalon", f"Jalon créé avec ID: {jalon_id}")
            return jalon_id
        else:
            results.add_failure("Création jalon", "Pas d'ID retourné")
            return None
    else:
        error_msg = f"Status: {response.status_code if response else 'No response'}"
        if response:
            error_msg += f", Response: {response.text[:200]}"
        results.add_failure("Création jalon", error_msg)
        return None

def test_jalon_retrieval(token, project_id, results):
    """Test 2: Récupération des Jalons"""
    print(f"\n📋 TEST 2: RÉCUPÉRATION DES JALONS")
    print(f"{'='*50}")
    
    response = make_authenticated_request("GET", "/events/jalons", token, params={"projet_id": project_id})
    
    if response and response.status_code == 200:
        data = response.json()
        if isinstance(data, list) and len(data) > 0:
            jalon = data[0]
            if jalon.get("titre") == "Test Jalon 1":
                results.add_success("Récupération jalons", f"Jalon trouvé: {jalon.get('titre')}")
                return True
            else:
                results.add_failure("Récupération jalons", f"Titre incorrect: {jalon.get('titre')}")
                return False
        else:
            results.add_failure("Récupération jalons", "Aucun jalon retourné")
            return False
    else:
        error_msg = f"Status: {response.status_code if response else 'No response'}"
        if response:
            error_msg += f", Response: {response.text[:200]}"
        results.add_failure("Récupération jalons", error_msg)
        return False

def test_jalon_update(token, jalon_id, project_id, results):
    """Test 3: Mise à Jour de Jalon"""
    print(f"\n✏️ TEST 3: MISE À JOUR DE JALON")
    print(f"{'='*50}")
    
    update_data = {
        "statut": "en_cours",
        "titre": "Jalon Modifié"
    }
    
    response = make_authenticated_request("PUT", f"/events/jalons/{jalon_id}", token, data=update_data)
    
    if response and response.status_code == 200:
        results.add_success("Mise à jour jalon", "Jalon mis à jour avec succès")
        
        # Vérifier que la mise à jour a bien été appliquée en récupérant la liste
        get_response = make_authenticated_request("GET", "/events/jalons", token, params={"projet_id": project_id})
        if get_response and get_response.status_code == 200:
            jalons = get_response.json()
            updated_jalon = next((j for j in jalons if j.get("id") == jalon_id), None)
            if updated_jalon:
                if updated_jalon.get("titre") == "Jalon Modifié" and updated_jalon.get("statut") == "en_cours":
                    results.add_success("Vérification mise à jour", "Modifications confirmées")
                    return True
                else:
                    results.add_failure("Vérification mise à jour", f"Titre: {updated_jalon.get('titre')}, Statut: {updated_jalon.get('statut')}")
                    return False
            else:
                results.add_failure("Vérification mise à jour", "Jalon non trouvé dans la liste")
                return False
        else:
            results.add_failure("Vérification mise à jour", "Impossible de récupérer la liste des jalons")
            return False
    else:
        error_msg = f"Status: {response.status_code if response else 'No response'}"
        if response:
            error_msg += f", Response: {response.text[:200]}"
        results.add_failure("Mise à jour jalon", error_msg)
        return False

def test_jalon_deletion(token, jalon_id, project_id, results):
    """Test 4: Suppression de Jalon"""
    print(f"\n🗑️ TEST 4: SUPPRESSION DE JALON")
    print(f"{'='*50}")
    
    response = make_authenticated_request("DELETE", f"/events/jalons/{jalon_id}", token)
    
    if response and response.status_code == 200:
        results.add_success("Suppression jalon", "Jalon supprimé avec succès")
        
        # Vérifier que le jalon a bien été supprimé en récupérant la liste
        get_response = make_authenticated_request("GET", "/events/jalons", token, params={"projet_id": project_id})
        if get_response and get_response.status_code == 200:
            jalons = get_response.json()
            deleted_jalon = next((j for j in jalons if j.get("id") == jalon_id), None)
            if deleted_jalon is None:
                results.add_success("Vérification suppression", "Jalon introuvable dans la liste après suppression")
                return True
            else:
                results.add_failure("Vérification suppression", "Jalon encore présent dans la liste")
                return False
        else:
            results.add_failure("Vérification suppression", "Impossible de récupérer la liste des jalons")
            return False
    else:
        error_msg = f"Status: {response.status_code if response else 'No response'}"
        if response:
            error_msg += f", Response: {response.text[:200]}"
        results.add_failure("Suppression jalon", error_msg)
        return False

def cleanup_test_project(token, project_id, results):
    """Clean up test project"""
    print(f"\n🧹 NETTOYAGE")
    print(f"{'='*50}")
    
    response = make_authenticated_request("DELETE", f"/events/projets/{project_id}", token)
    
    if response and response.status_code == 200:
        results.add_success("Nettoyage projet", "Projet de test supprimé")
    else:
        results.add_failure("Nettoyage projet", f"Impossible de supprimer le projet: {response.status_code if response else 'No response'}")

def main():
    """Main test execution"""
    print(f"🎯 TEST RAPIDE - FONCTIONNALITÉ JALONS")
    print(f"Backend URL: {BASE_URL}")
    print(f"Début des tests: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = JalonsTestResults()
    
    # Test authentication
    token, user = test_authentication(results)
    
    if not token:
        print("❌ ARRÊT CRITIQUE: Authentification échouée")
        return 1
    
    # Create test project
    project_id = create_test_project(token, results)
    
    if not project_id:
        print("❌ ARRÊT CRITIQUE: Impossible de créer un projet de test")
        return 1
    
    try:
        # Test 1: Create jalon
        jalon_id = test_jalon_creation(token, project_id, results)
        
        if jalon_id:
            # Test 2: Retrieve jalons
            test_jalon_retrieval(token, project_id, results)
            
            # Test 3: Update jalon
            test_jalon_update(token, jalon_id, project_id, results)
            
            # Test 4: Delete jalon
            test_jalon_deletion(token, jalon_id, project_id, results)
        
    finally:
        # Cleanup
        cleanup_test_project(token, project_id, results)
    
    # Print results
    results.print_summary()
    
    # Success criteria
    print(f"\n🎯 OBJECTIF:")
    print(f"  ✅ Valider rapidement que les endpoints CRUD des jalons fonctionnent sans erreur")
    
    if results.failed == 0:
        print(f"\n🎉 TOUS LES TESTS JALONS SONT PASSÉS! Les endpoints fonctionnent correctement.")
        return 0
    else:
        print(f"\n⚠️  {results.failed} tests ont échoué. Vérification nécessaire.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)