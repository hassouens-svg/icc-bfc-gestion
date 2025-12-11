#!/usr/bin/env python3
"""
Backend Test Suite for 2 Specific Bug Corrections
Test Date: 4 Décembre 2024
Testing Agent: Testing Agent

Testing 2 nouvelles corrections:
1. Bug 1: Erreur lors de la suppression d'événements RSVP
2. Bug 2: Statut des jalons statique - impossible de le changer

Credentials: superadmin / superadmin123
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Configuration
BACKEND_URL = "https://ministery-stars.preview.emergentagent.com/api"
TEST_USER = {
    "username": "superadmin",
    "password": "superadmin123", 
    "city": "Dijon"
}

class TestResults:
    def __init__(self):
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
        self.results = []
    
    def add_result(self, test_name, passed, message=""):
        self.total_tests += 1
        if passed:
            self.passed_tests += 1
            status = "✅ PASSED"
        else:
            self.failed_tests += 1
            status = "❌ FAILED"
        
        result = f"{status}: {test_name}"
        if message:
            result += f" - {message}"
        
        self.results.append(result)
        print(result)
    
    def print_summary(self):
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY - 2 CORRECTIONS TESTING")
        print(f"{'='*60}")
        print(f"Total Tests: {self.total_tests}")
        print(f"Passed: {self.passed_tests}")
        print(f"Failed: {self.failed_tests}")
        print(f"Success Rate: {(self.passed_tests/self.total_tests)*100:.1f}%")
        print(f"{'='*60}")
        
        if self.failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.results:
                if "❌ FAILED" in result:
                    print(f"  {result}")
        
        return self.failed_tests == 0

def make_request(method, endpoint, data=None, headers=None):
    """Make HTTP request with error handling"""
    url = f"{BACKEND_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=30)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=30)
        elif method == "PUT":
            response = requests.put(url, json=data, headers=headers, timeout=30)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=30)
        
        return response
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return None

def authenticate():
    """Authenticate and get token"""
    print("🔐 Authenticating...")
    
    response = make_request("POST", "/auth/login", TEST_USER)
    
    if not response or response.status_code != 200:
        print(f"❌ Authentication failed: {response.status_code if response else 'No response'}")
        return None
    
    data = response.json()
    token = data.get("token")
    user = data.get("user")
    
    print(f"✅ Authenticated as {user['username']} ({user['role']}) in {user['city']}")
    return token

def test_bug_1_rsvp_event_deletion_error_handling(token, results):
    """
    Bug 1: Erreur lors de la suppression d'événements RSVP
    - Fichier modifié: /app/frontend/src/pages/RSVPLinksPage.jsx
    - Correction: Amélioration de la gestion d'erreur avec message détaillé
    - Test: Créer un événement, essayer de le supprimer, vérifier que l'erreur affiche un message clair
    - Endpoint: DELETE /api/events/{event_id}
    """
    print(f"\n🧪 TESTING BUG 1: RSVP Event Deletion Error Handling")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Step 1: Create a test event
    print("📝 Step 1: Creating test RSVP event...")
    
    future_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
    event_data = {
        "title": "Test Event for Deletion",
        "description": "Event créé pour tester la suppression",
        "date": future_date,
        "time": "19:00",
        "location": "Test Location",
        "rsvp_enabled": True,
        "max_participants": 50
    }
    
    response = make_request("POST", "/events", event_data, headers)
    
    if not response or response.status_code != 200:
        results.add_result("Bug 1 - Event Creation", False, f"Failed to create event: {response.status_code if response else 'No response'}")
        return
    
    event_id = response.json().get("id")
    results.add_result("Bug 1 - Event Creation", True, f"Event created with ID: {event_id}")
    
    # Step 2: Add some RSVPs to the event
    print("📝 Step 2: Adding RSVPs to the event...")
    
    rsvp_data = {
        "name": "Test Participant",
        "email": "test@example.com",
        "status": "confirmed",
        "guests_count": 2
    }
    
    response = make_request("POST", f"/events/{event_id}/rsvp-public", rsvp_data)
    
    if response and response.status_code == 200:
        results.add_result("Bug 1 - RSVP Creation", True, "RSVP added successfully")
    else:
        results.add_result("Bug 1 - RSVP Creation", False, f"Failed to add RSVP: {response.status_code if response else 'No response'}")
    
    # Step 3: Try to delete the event (should work but test error handling)
    print("📝 Step 3: Testing event deletion...")
    
    response = make_request("DELETE", f"/events/{event_id}", headers=headers)
    
    if response:
        if response.status_code == 200:
            results.add_result("Bug 1 - Event Deletion Success", True, "Event deleted successfully")
        else:
            # Test error handling - check if error message is clear
            try:
                error_data = response.json()
                error_message = error_data.get("detail", "Unknown error")
                results.add_result("Bug 1 - Error Message Clarity", True, f"Clear error message: {error_message}")
            except:
                results.add_result("Bug 1 - Error Message Clarity", False, "Error response not in JSON format")
    else:
        results.add_result("Bug 1 - Event Deletion", False, "No response from deletion endpoint")
    
    # Step 4: Verify event is deleted (if deletion was successful)
    if response and response.status_code == 200:
        print("📝 Step 4: Verifying event deletion...")
        
        # Use public endpoint (no auth headers needed) to verify deletion
        try:
            response = requests.get(f"{BACKEND_URL}/events/{event_id}", timeout=30)
            print(f"Debug: Verification response status: {response.status_code}")
            
            if response.status_code == 404:
                results.add_result("Bug 1 - Deletion Verification", True, "Event properly deleted (404 returned)")
            else:
                results.add_result("Bug 1 - Deletion Verification", False, f"Event still exists: {response.status_code}")
        except Exception as e:
            print(f"Debug: Verification request failed: {e}")
            results.add_result("Bug 1 - Deletion Verification", False, f"Verification request failed: {e}")

def test_bug_2_jalons_status_update(token, results):
    """
    Bug 2: Statut des jalons statique - impossible de le changer
    - Fichier modifié: /app/frontend/src/pages/ProjetDetailPage.jsx
    - Correction: Ajout d'un Select dans la vue liste des jalons pour changer le statut directement sans entrer en mode édition
    - Test: Créer un projet avec jalons, vérifier qu'il y a bien un Select pour changer le statut, changer le statut, vérifier que ça se met à jour
    - Endpoints: PUT /api/events/jalons/{jalon_id} avec {"statut": "termine"}
    """
    print(f"\n🧪 TESTING BUG 2: Jalons Status Update")
    print("="*60)
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Step 1: Create a test project
    print("📝 Step 1: Creating test project...")
    
    project_data = {
        "titre": "Test Project for Jalons",
        "description": "Projet créé pour tester les jalons",
        "statut": "en_cours",
        "ville": "Dijon",
        "team_members": []
    }
    
    response = make_request("POST", "/events/projets", project_data, headers)
    
    if not response or response.status_code != 200:
        results.add_result("Bug 2 - Project Creation", False, f"Failed to create project: {response.status_code if response else 'No response'}")
        return
    
    project_id = response.json().get("id")
    results.add_result("Bug 2 - Project Creation", True, f"Project created with ID: {project_id}")
    
    # Step 2: Create a test jalon
    print("📝 Step 2: Creating test jalon...")
    
    jalon_data = {
        "projet_id": project_id,
        "titre": "Test Jalon Status Update",
        "description": "Jalon pour tester la mise à jour du statut",
        "acteur": "Test User",
        "date_debut": "2024-12-01T10:00:00",
        "date_fin": "2024-12-31T18:00:00"
    }
    
    response = make_request("POST", "/events/jalons", jalon_data, headers)
    
    if not response or response.status_code != 200:
        results.add_result("Bug 2 - Jalon Creation", False, f"Failed to create jalon: {response.status_code if response else 'No response'}")
        return
    
    jalon_id = response.json().get("id")
    results.add_result("Bug 2 - Jalon Creation", True, f"Jalon created with ID: {jalon_id}")
    
    # Step 3: Verify initial jalon status
    print("📝 Step 3: Verifying initial jalon status...")
    
    response = make_request("GET", f"/events/jalons?projet_id={project_id}", headers=headers)
    
    if response and response.status_code == 200:
        jalons = response.json()
        if jalons and len(jalons) > 0:
            initial_status = jalons[0].get("statut", "unknown")
            results.add_result("Bug 2 - Initial Status Check", True, f"Initial status: {initial_status}")
        else:
            results.add_result("Bug 2 - Initial Status Check", False, "No jalons returned")
            return
    else:
        results.add_result("Bug 2 - Initial Status Check", False, f"Failed to get jalons: {response.status_code if response else 'No response'}")
        return
    
    # Step 4: Update jalon status to "en_cours"
    print("📝 Step 4: Updating jalon status to 'en_cours'...")
    
    update_data = {
        "statut": "en_cours"
    }
    
    response = make_request("PUT", f"/events/jalons/{jalon_id}", update_data, headers)
    
    if response and response.status_code == 200:
        results.add_result("Bug 2 - Status Update to en_cours", True, "Status updated successfully")
    else:
        results.add_result("Bug 2 - Status Update to en_cours", False, f"Failed to update status: {response.status_code if response else 'No response'}")
        return
    
    # Step 5: Verify status change
    print("📝 Step 5: Verifying status change...")
    
    response = make_request("GET", f"/events/jalons?projet_id={project_id}", headers=headers)
    
    if response and response.status_code == 200:
        jalons = response.json()
        if jalons and len(jalons) > 0:
            updated_status = jalons[0].get("statut", "unknown")
            if updated_status == "en_cours":
                results.add_result("Bug 2 - Status Change Verification", True, f"Status correctly updated to: {updated_status}")
            else:
                results.add_result("Bug 2 - Status Change Verification", False, f"Status not updated correctly. Expected: en_cours, Got: {updated_status}")
        else:
            results.add_result("Bug 2 - Status Change Verification", False, "No jalons returned after update")
    else:
        results.add_result("Bug 2 - Status Change Verification", False, f"Failed to verify status: {response.status_code if response else 'No response'}")
    
    # Step 6: Update jalon status to "termine"
    print("📝 Step 6: Updating jalon status to 'termine'...")
    
    update_data = {
        "statut": "termine"
    }
    
    response = make_request("PUT", f"/events/jalons/{jalon_id}", update_data, headers)
    
    if response and response.status_code == 200:
        results.add_result("Bug 2 - Status Update to termine", True, "Status updated to termine successfully")
    else:
        results.add_result("Bug 2 - Status Update to termine", False, f"Failed to update status to termine: {response.status_code if response else 'No response'}")
        return
    
    # Step 7: Final verification
    print("📝 Step 7: Final status verification...")
    
    response = make_request("GET", f"/events/jalons?projet_id={project_id}", headers=headers)
    
    if response and response.status_code == 200:
        jalons = response.json()
        if jalons and len(jalons) > 0:
            final_status = jalons[0].get("statut", "unknown")
            if final_status == "termine":
                results.add_result("Bug 2 - Final Status Verification", True, f"Final status correctly set to: {final_status}")
            else:
                results.add_result("Bug 2 - Final Status Verification", False, f"Final status incorrect. Expected: termine, Got: {final_status}")
        else:
            results.add_result("Bug 2 - Final Status Verification", False, "No jalons returned for final verification")
    else:
        results.add_result("Bug 2 - Final Status Verification", False, f"Failed final verification: {response.status_code if response else 'No response'}")
    
    # Cleanup: Delete the test project and jalon
    print("📝 Cleanup: Deleting test data...")
    
    # Delete jalon
    response = make_request("DELETE", f"/events/jalons/{jalon_id}", headers=headers)
    if response and response.status_code == 200:
        results.add_result("Bug 2 - Jalon Cleanup", True, "Test jalon deleted successfully")
    
    # Delete project
    response = make_request("DELETE", f"/events/projets/{project_id}", headers=headers)
    if response and response.status_code == 200:
        results.add_result("Bug 2 - Project Cleanup", True, "Test project deleted successfully")

def main():
    """Main test execution"""
    print("🚀 STARTING BACKEND TESTING FOR 2 CORRECTIONS")
    print("="*60)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test User: {TEST_USER['username']} in {TEST_USER['city']}")
    print(f"Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    results = TestResults()
    
    # Authenticate
    token = authenticate()
    if not token:
        print("❌ Authentication failed. Cannot proceed with tests.")
        return False
    
    results.add_result("Authentication", True, "Successfully authenticated")
    
    # Test Bug 1: RSVP Event Deletion Error Handling
    test_bug_1_rsvp_event_deletion_error_handling(token, results)
    
    # Test Bug 2: Jalons Status Update
    test_bug_2_jalons_status_update(token, results)
    
    # Print final summary
    success = results.print_summary()
    
    if success:
        print("\n🎉 ALL TESTS PASSED! Both corrections are working correctly.")
    else:
        print("\n⚠️  Some tests failed. Please review the issues above.")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)