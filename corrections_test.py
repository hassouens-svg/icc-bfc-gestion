#!/usr/bin/env python3
"""
🎯 TEST DES 2 CORRECTIONS SPÉCIFIQUES - 4 Décembre 2024
Backend API Testing Suite for specific bug fixes

This test suite verifies the two specific corrections:
1. Modification des visiteurs par superadmin et responsable_promo
2. Email de confirmation RSVP avec la clé API Brevo originale
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://disciple-tracker.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

# Test credentials
TEST_CREDENTIALS = {
    "username": "superadmin",
    "password": "superadmin123",
    "city": "Dijon"
}

class TestResults:
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
        print(f"🎯 TEST DES 2 CORRECTIONS - RÉSULTATS FINAUX")
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

def login_user():
    """Login and return JWT token"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json=TEST_CREDENTIALS,
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
    """Test 1: AUTHENTIFICATION"""
    print(f"\n🔐 TEST 1: AUTHENTIFICATION")
    print(f"{'='*50}")
    
    token, user_or_error = login_user()
    
    if token:
        results.add_success("Login superadmin", f"JWT token généré, role: {user_or_error.get('role', 'N/A')}")
        return token, user_or_error
    else:
        results.add_failure("Login superadmin", user_or_error)
        return None, None

def test_visitor_modification(results, token):
    """Test 2: MODIFICATION DES VISITEURS PAR SUPERADMIN"""
    print(f"\n👥 TEST 2: MODIFICATION DES VISITEURS PAR SUPERADMIN")
    print(f"{'='*50}")
    
    # Step 1: Get list of visitors to find a "nouveau arrivant"
    response = make_authenticated_request("GET", "/visitors", token)
    
    if not response or response.status_code != 200:
        results.add_failure("Récupération visiteurs", f"Impossible de récupérer la liste des visiteurs: {response.status_code if response else 'No response'}")
        return
    
    visitors = response.json()
    
    # Find a visitor with "Nouveau Arrivant" type
    nouveau_arrivant = None
    for visitor in visitors:
        if "Nouveau Arrivant" in visitor.get("types", []):
            nouveau_arrivant = visitor
            break
    
    if not nouveau_arrivant:
        results.add_failure("Trouver nouveau arrivant", "Aucun visiteur 'Nouveau Arrivant' trouvé pour le test")
        return
    
    visitor_id = nouveau_arrivant["id"]
    original_firstname = nouveau_arrivant.get("firstname", "")
    
    results.add_success("Trouver nouveau arrivant", f"Visiteur trouvé: {original_firstname} (ID: {visitor_id})")
    
    # Step 2: Try to modify the visitor
    modification_data = {
        "firstname": f"Modified_{original_firstname}",
        "phone": "+33987654321",
        "email": "modified.test@example.com"
    }
    
    response = make_authenticated_request("PUT", f"/visitors/{visitor_id}", token, data=modification_data)
    
    if response and response.status_code == 200:
        results.add_success("Modification visiteur", "Modification réussie sans erreur de permissions")
        
        # Step 3: Verify the modification was applied
        response = make_authenticated_request("GET", f"/visitors/{visitor_id}", token)
        
        if response and response.status_code == 200:
            updated_visitor = response.json()
            
            if updated_visitor.get("firstname") == modification_data["firstname"]:
                results.add_success("Vérification modification", "Les modifications ont été correctement appliquées")
            else:
                results.add_failure("Vérification modification", f"Prénom non modifié: {updated_visitor.get('firstname')} != {modification_data['firstname']}")
            
            # Step 4: Restore original data
            restore_data = {
                "firstname": original_firstname,
                "phone": nouveau_arrivant.get("phone", ""),
                "email": nouveau_arrivant.get("email", "")
            }
            
            restore_response = make_authenticated_request("PUT", f"/visitors/{visitor_id}", token, data=restore_data)
            
            if restore_response and restore_response.status_code == 200:
                results.add_success("Restauration visiteur", "Données originales restaurées")
            else:
                results.add_failure("Restauration visiteur", f"Échec de la restauration: {restore_response.status_code if restore_response else 'No response'}")
        else:
            results.add_failure("Vérification modification", f"Impossible de récupérer le visiteur modifié: {response.status_code if response else 'No response'}")
    else:
        results.add_failure("Modification visiteur", f"Échec de la modification: {response.status_code if response else 'No response'} - {response.text if response else 'No response'}")

def test_rsvp_email_confirmation(results, token):
    """Test 3: EMAIL DE CONFIRMATION RSVP AVEC CLÉ API BREVO"""
    print(f"\n📧 TEST 3: EMAIL DE CONFIRMATION RSVP AVEC CLÉ API BREVO")
    print(f"{'='*50}")
    
    # Step 1: Create an event with email confirmation enabled
    event_data = {
        "title": "Test Event Email Confirmation",
        "description": "Test event pour vérifier l'envoi d'emails de confirmation RSVP",
        "date": "2025-01-20",
        "time": "19:00",
        "location": "Test Location",
        "rsvp_enabled": True,
        "require_email_contact": True,
        "confirmation_message": "Merci pour votre confirmation! Nous avons hâte de vous voir à l'événement."
    }
    
    response = make_authenticated_request("POST", "/events", token, data=event_data)
    
    if not response or response.status_code != 200:
        results.add_failure("Création événement", f"Impossible de créer l'événement: {response.status_code if response else 'No response'}")
        return
    
    event_response = response.json()
    event_id = event_response.get("id")
    
    if not event_id:
        results.add_failure("Création événement", "Pas d'ID d'événement retourné")
        return
    
    results.add_success("Création événement", f"Événement créé avec ID: {event_id}")
    
    # Step 2: Submit an RSVP with email
    rsvp_data = {
        "name": "Test User Email",
        "email": "test.email.confirmation@example.com",
        "phone": "+33123456789",
        "status": "confirmed",
        "guests_count": 1,
        "message": "Test de confirmation par email"
    }
    
    response = make_authenticated_request("POST", f"/events/{event_id}/rsvp-public", token, data=rsvp_data)
    
    if response and response.status_code == 200:
        rsvp_response = response.json()
        
        # Step 3: Check if email_sent is true
        email_sent = rsvp_response.get("email_sent", False)
        
        if email_sent:
            results.add_success("Email RSVP envoyé", "email_sent: true retourné - Email de confirmation envoyé avec succès")
        else:
            results.add_failure("Email RSVP envoyé", f"email_sent: {email_sent} - Email de confirmation non envoyé")
        
        # Step 4: Verify RSVP was created
        rsvp_id = rsvp_response.get("id")
        if rsvp_id:
            results.add_success("RSVP créé", f"RSVP créé avec ID: {rsvp_id}")
        else:
            results.add_failure("RSVP créé", "Pas d'ID de RSVP retourné")
    else:
        results.add_failure("Soumission RSVP", f"Échec de la soumission RSVP: {response.status_code if response else 'No response'} - {response.text if response else 'No response'}")
    
    # Step 5: Clean up - Delete the test event
    delete_response = make_authenticated_request("DELETE", f"/events/{event_id}", token)
    
    if delete_response and delete_response.status_code == 200:
        results.add_success("Nettoyage événement", "Événement de test supprimé")
    else:
        results.add_failure("Nettoyage événement", f"Échec de la suppression: {delete_response.status_code if delete_response else 'No response'}")

def check_backend_logs(results):
    """Test 4: VÉRIFICATION DES LOGS BACKEND"""
    print(f"\n📋 TEST 4: VÉRIFICATION DES LOGS BACKEND")
    print(f"{'='*50}")
    
    try:
        # Check supervisor backend logs for any errors
        import subprocess
        
        # Get the last 50 lines of backend logs
        result = subprocess.run(
            ["tail", "-n", "50", "/var/log/supervisor/backend.err.log"],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0:
            log_content = result.stdout
            
            # Check for critical errors
            error_keywords = ["ERROR", "CRITICAL", "Exception", "Traceback", "Failed"]
            recent_errors = []
            
            for line in log_content.split('\n'):
                if any(keyword in line for keyword in error_keywords):
                    recent_errors.append(line.strip())
            
            if recent_errors:
                results.add_failure("Logs backend", f"Erreurs trouvées dans les logs: {len(recent_errors)} erreurs")
                for error in recent_errors[-3:]:  # Show last 3 errors
                    print(f"  🔍 {error}")
            else:
                results.add_success("Logs backend", "Aucune erreur critique trouvée dans les logs récents")
        else:
            results.add_failure("Logs backend", f"Impossible de lire les logs: {result.stderr}")
    
    except Exception as e:
        results.add_failure("Logs backend", f"Erreur lors de la vérification des logs: {str(e)}")

def main():
    """Main test execution"""
    print(f"🎯 TEST DES 2 CORRECTIONS SPÉCIFIQUES")
    print(f"Backend URL: {BASE_URL}")
    print(f"Début des tests: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Clé API Brevo utilisée: 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")
    
    results = TestResults()
    
    # Test 1: Authentication
    token, user = test_authentication(results)
    
    if not token:
        print("❌ ARRÊT CRITIQUE: Authentification échouée")
        results.print_summary()
        return 1
    
    # Test 2: Visitor modification by superadmin
    test_visitor_modification(results, token)
    
    # Test 3: RSVP email confirmation with Brevo API
    test_rsvp_email_confirmation(results, token)
    
    # Test 4: Check backend logs
    check_backend_logs(results)
    
    # Final results
    results.print_summary()
    
    # Success criteria
    print(f"\n🎯 CRITÈRES DE SUCCÈS:")
    success_criteria = [
        "✅ Superadmin peut se connecter",
        "✅ Superadmin peut modifier les visiteurs (nouveau arrivant) sans erreur de permissions",
        "✅ Les événements RSVP avec require_email_contact=true envoient des emails de confirmation",
        "✅ email_sent: true est retourné lors de la soumission RSVP avec email",
        "✅ Aucune erreur critique dans les logs backend"
    ]
    
    for criteria in success_criteria:
        print(f"  {criteria}")
    
    if results.failed == 0:
        print(f"\n🎉 TOUTES LES CORRECTIONS SONT VALIDÉES! Les 2 problèmes sont résolus.")
        return 0
    else:
        print(f"\n⚠️  {results.failed} tests ont échoué. Vérification nécessaire.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)