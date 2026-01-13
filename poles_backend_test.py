#!/usr/bin/env python3
"""
Backend Test Suite for Poles Management in Projects (Gestion des Pôles dans les Projets)
Testing all new endpoints for poles functionality in My Events Church application.

Test Scenarios:
1. Create a test project
2. Create 3 poles (Communication, Logistique, Finance)
3. Retrieve poles with statistics
4. Create tasks in poles with different completion statuses
5. Verify pole statistics calculations
6. Modify a pole
7. Move tasks between poles
8. Test pole deletion protection
9. Delete empty pole
10. Verify global project completion percentage

Credentials: superadmin / superadmin123 / Dijon
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://ministry-app-7.preview.emergentagent.com/api"
USERNAME = "superadmin"
PASSWORD = "superadmin123"
CITY = "Dijon"

class PolesBackendTester:
    def __init__(self):
        self.token = None
        self.user_info = None
        self.test_project_id = None
        self.pole_communication_id = None
        self.pole_logistique_id = None
        self.pole_finance_id = None
        self.task_ids = []
        self.session = requests.Session()
        
    def log(self, message, level="INFO"):
        """Log messages with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def authenticate(self):
        """Authenticate with the backend"""
        self.log("🔐 Authenticating user...")
        
        login_data = {
            "username": USERNAME,
            "password": PASSWORD,
            "city": CITY
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.token = data["token"]
                self.user_info = data["user"]
                self.session.headers.update({"Authorization": f"Bearer {self.token}"})
                self.log(f"✅ Authentication successful - User: {self.user_info['username']}, Role: {self.user_info['role']}")
                return True
            else:
                self.log(f"❌ Authentication failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Authentication error: {str(e)}", "ERROR")
            return False
    
    def test_1_create_project(self):
        """Test 1: Create a test project for poles testing"""
        self.log("📋 Test 1: Creating test project...")
        
        project_data = {
            "titre": "Test Projet Pôles",
            "description": "Projet de test pour les pôles",
            "ville": "Dijon",
            "statut": "en_cours"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/events/projets", json=project_data)
            
            if response.status_code == 200:
                data = response.json()
                self.test_project_id = data["id"]
                self.log(f"✅ Test project created successfully - ID: {self.test_project_id}")
                return True
            else:
                self.log(f"❌ Project creation failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Project creation error: {str(e)}", "ERROR")
            return False
    
    def test_2_create_poles(self):
        """Test 2: Create 3 different poles"""
        self.log("🏗️ Test 2: Creating poles...")
        
        poles_data = [
            {
                "projet_id": self.test_project_id,
                "nom": "Communication",
                "description": "Pôle communication et marketing",
                "responsable": "Jean Dupont"
            },
            {
                "projet_id": self.test_project_id,
                "nom": "Logistique",
                "description": "Pôle logistique et organisation",
                "responsable": "Marie Martin"
            },
            {
                "projet_id": self.test_project_id,
                "nom": "Finance",
                "description": "Pôle finance et budget",
                "responsable": None  # No responsable
            }
        ]
        
        created_poles = []
        
        for i, pole_data in enumerate(poles_data):
            try:
                response = self.session.post(f"{BASE_URL}/events/poles", json=pole_data)
                
                if response.status_code == 200:
                    data = response.json()
                    pole_id = data["id"]
                    created_poles.append(pole_id)
                    
                    # Store pole IDs for later tests
                    if pole_data["nom"] == "Communication":
                        self.pole_communication_id = pole_id
                    elif pole_data["nom"] == "Logistique":
                        self.pole_logistique_id = pole_id
                    elif pole_data["nom"] == "Finance":
                        self.pole_finance_id = pole_id
                    
                    self.log(f"✅ Pole '{pole_data['nom']}' created - ID: {pole_id}")
                else:
                    self.log(f"❌ Pole '{pole_data['nom']}' creation failed: {response.status_code} - {response.text}", "ERROR")
                    return False
                    
            except Exception as e:
                self.log(f"❌ Pole creation error: {str(e)}", "ERROR")
                return False
        
        if len(created_poles) == 3:
            self.log("✅ All 3 poles created successfully")
            return True
        else:
            self.log(f"❌ Only {len(created_poles)}/3 poles created", "ERROR")
            return False
    
    def test_3_get_poles_empty(self):
        """Test 3: Retrieve poles with empty statistics"""
        self.log("📊 Test 3: Retrieving poles (should have empty statistics)...")
        
        try:
            response = self.session.get(f"{BASE_URL}/events/poles?projet_id={self.test_project_id}")
            
            if response.status_code == 200:
                poles = response.json()
                
                if len(poles) == 3:
                    self.log("✅ Retrieved 3 poles successfully")
                    
                    # Verify each pole has required fields and empty statistics
                    for pole in poles:
                        required_fields = ["id", "nom", "description", "responsable", "nb_taches", "nb_taches_terminees", "completion_percent"]
                        
                        for field in required_fields:
                            if field not in pole:
                                self.log(f"❌ Missing field '{field}' in pole '{pole.get('nom', 'Unknown')}'", "ERROR")
                                return False
                        
                        # Verify empty statistics
                        if pole["nb_taches"] != 0 or pole["nb_taches_terminees"] != 0 or pole["completion_percent"] != 0:
                            self.log(f"❌ Pole '{pole['nom']}' should have empty statistics but has: {pole['nb_taches']} tasks, {pole['nb_taches_terminees']} completed, {pole['completion_percent']}%", "ERROR")
                            return False
                        
                        self.log(f"✅ Pole '{pole['nom']}': {pole['nb_taches']} tasks, {pole['completion_percent']}% completion")
                    
                    return True
                else:
                    self.log(f"❌ Expected 3 poles, got {len(poles)}", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to retrieve poles: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Poles retrieval error: {str(e)}", "ERROR")
            return False
    
    def test_4_create_tasks_in_poles(self):
        """Test 4: Create tasks in poles with different completion statuses"""
        self.log("📝 Test 4: Creating tasks in poles...")
        
        # Tasks for Communication pole (5 tasks: 2 completed, 3 in progress)
        communication_tasks = [
            {"titre": "Créer affiche événement", "statut": "termine"},
            {"titre": "Rédiger communiqué presse", "statut": "termine"},
            {"titre": "Gérer réseaux sociaux", "statut": "en_cours"},
            {"titre": "Contacter médias locaux", "statut": "a_faire"},
            {"titre": "Préparer newsletter", "statut": "en_cours"}
        ]
        
        # Tasks for Logistique pole (10 tasks: 7 completed, 3 to do)
        logistique_tasks = [
            {"titre": "Réserver salle", "statut": "termine"},
            {"titre": "Commander matériel son", "statut": "termine"},
            {"titre": "Organiser transport", "statut": "termine"},
            {"titre": "Préparer signalétique", "statut": "termine"},
            {"titre": "Gérer accueil", "statut": "termine"},
            {"titre": "Installer équipements", "statut": "termine"},
            {"titre": "Coordonner bénévoles", "statut": "termine"},
            {"titre": "Vérifier sécurité", "statut": "a_faire"},
            {"titre": "Nettoyer après événement", "statut": "a_faire"},
            {"titre": "Ranger matériel", "statut": "a_faire"}
        ]
        
        # General tasks (no pole_id) - 3 tasks
        general_tasks = [
            {"titre": "Supervision générale", "statut": "en_cours"},
            {"titre": "Coordination équipes", "statut": "a_faire"},
            {"titre": "Rapport final", "statut": "a_faire"}
        ]
        
        all_tasks = [
            (communication_tasks, self.pole_communication_id, "Communication"),
            (logistique_tasks, self.pole_logistique_id, "Logistique"),
            (general_tasks, None, "Général")
        ]
        
        total_created = 0
        
        for tasks, pole_id, pole_name in all_tasks:
            for task in tasks:
                task_data = {
                    "projet_id": self.test_project_id,
                    "titre": task["titre"],
                    "description": f"Tâche du pôle {pole_name}",
                    "statut": task["statut"]
                }
                
                if pole_id:
                    task_data["pole_id"] = pole_id
                
                try:
                    response = self.session.post(f"{BASE_URL}/events/taches", json=task_data)
                    
                    if response.status_code == 200:
                        data = response.json()
                        self.task_ids.append(data["id"])
                        total_created += 1
                        self.log(f"✅ Task '{task['titre']}' created in {pole_name} - Status: {task['statut']}")
                    else:
                        self.log(f"❌ Task '{task['titre']}' creation failed: {response.status_code} - {response.text}", "ERROR")
                        return False
                        
                except Exception as e:
                    self.log(f"❌ Task creation error: {str(e)}", "ERROR")
                    return False
        
        expected_total = len(communication_tasks) + len(logistique_tasks) + len(general_tasks)
        if total_created == expected_total:
            self.log(f"✅ All {total_created} tasks created successfully")
            return True
        else:
            self.log(f"❌ Only {total_created}/{expected_total} tasks created", "ERROR")
            return False
    
    def test_5_verify_pole_statistics(self):
        """Test 5: Verify pole statistics calculations"""
        self.log("📊 Test 5: Verifying pole statistics...")
        
        try:
            response = self.session.get(f"{BASE_URL}/events/poles?projet_id={self.test_project_id}")
            
            if response.status_code == 200:
                poles = response.json()
                
                # Expected statistics
                expected_stats = {
                    "Communication": {"nb_taches": 5, "nb_taches_terminees": 2, "completion_percent": 40.0},
                    "Logistique": {"nb_taches": 10, "nb_taches_terminees": 7, "completion_percent": 70.0},
                    "Finance": {"nb_taches": 0, "nb_taches_terminees": 0, "completion_percent": 0.0}
                }
                
                for pole in poles:
                    pole_name = pole["nom"]
                    if pole_name in expected_stats:
                        expected = expected_stats[pole_name]
                        
                        # Check each statistic
                        if pole["nb_taches"] != expected["nb_taches"]:
                            self.log(f"❌ Pole '{pole_name}': Expected {expected['nb_taches']} tasks, got {pole['nb_taches']}", "ERROR")
                            return False
                        
                        if pole["nb_taches_terminees"] != expected["nb_taches_terminees"]:
                            self.log(f"❌ Pole '{pole_name}': Expected {expected['nb_taches_terminees']} completed tasks, got {pole['nb_taches_terminees']}", "ERROR")
                            return False
                        
                        if abs(pole["completion_percent"] - expected["completion_percent"]) > 0.1:
                            self.log(f"❌ Pole '{pole_name}': Expected {expected['completion_percent']}% completion, got {pole['completion_percent']}%", "ERROR")
                            return False
                        
                        self.log(f"✅ Pole '{pole_name}': {pole['nb_taches']} tasks, {pole['nb_taches_terminees']} completed, {pole['completion_percent']}% completion")
                    else:
                        self.log(f"❌ Unexpected pole: {pole_name}", "ERROR")
                        return False
                
                self.log("✅ All pole statistics are correct")
                return True
            else:
                self.log(f"❌ Failed to retrieve poles: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Statistics verification error: {str(e)}", "ERROR")
            return False
    
    def test_6_modify_pole(self):
        """Test 6: Modify a pole"""
        self.log("✏️ Test 6: Modifying a pole...")
        
        update_data = {
            "nom": "Communication & Marketing",
            "description": "Pôle communication, marketing et relations publiques",
            "responsable": "Marie Martin"
        }
        
        try:
            response = self.session.put(f"{BASE_URL}/events/poles/{self.pole_communication_id}", json=update_data)
            
            if response.status_code == 200:
                self.log("✅ Pole modified successfully")
                
                # Verify the modification
                poles_response = self.session.get(f"{BASE_URL}/events/poles?projet_id={self.test_project_id}")
                if poles_response.status_code == 200:
                    poles = poles_response.json()
                    
                    for pole in poles:
                        if pole["id"] == self.pole_communication_id:
                            if (pole["nom"] == update_data["nom"] and 
                                pole["description"] == update_data["description"] and 
                                pole["responsable"] == update_data["responsable"]):
                                self.log("✅ Pole modification verified")
                                return True
                            else:
                                self.log(f"❌ Pole modification not applied correctly", "ERROR")
                                return False
                    
                    self.log(f"❌ Modified pole not found", "ERROR")
                    return False
                else:
                    self.log(f"❌ Failed to verify pole modification", "ERROR")
                    return False
            else:
                self.log(f"❌ Pole modification failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Pole modification error: {str(e)}", "ERROR")
            return False
    
    def test_7_move_task_between_poles(self):
        """Test 7: Move a task between poles"""
        self.log("🔄 Test 7: Moving task between poles...")
        
        # Find a task from Communication pole to move to Logistique
        if not self.task_ids:
            self.log("❌ No task IDs available for moving", "ERROR")
            return False
        
        # Get the first task (should be from Communication pole)
        task_id_to_move = self.task_ids[0]
        
        update_data = {
            "pole_id": self.pole_logistique_id
        }
        
        try:
            response = self.session.put(f"{BASE_URL}/events/taches/{task_id_to_move}", json=update_data)
            
            if response.status_code == 200:
                self.log("✅ Task moved between poles successfully")
                
                # Verify statistics have been updated
                poles_response = self.session.get(f"{BASE_URL}/events/poles?projet_id={self.test_project_id}")
                if poles_response.status_code == 200:
                    poles = poles_response.json()
                    
                    # Communication should now have 4 tasks (was 5)
                    # Logistique should now have 11 tasks (was 10)
                    
                    for pole in poles:
                        if pole["nom"] == "Communication & Marketing":  # Updated name
                            if pole["nb_taches"] == 4:
                                self.log(f"✅ Communication pole now has {pole['nb_taches']} tasks (decreased by 1)")
                            else:
                                self.log(f"❌ Communication pole should have 4 tasks, has {pole['nb_taches']}", "ERROR")
                                return False
                        elif pole["nom"] == "Logistique":
                            if pole["nb_taches"] == 11:
                                self.log(f"✅ Logistique pole now has {pole['nb_taches']} tasks (increased by 1)")
                            else:
                                self.log(f"❌ Logistique pole should have 11 tasks, has {pole['nb_taches']}", "ERROR")
                                return False
                    
                    return True
                else:
                    self.log(f"❌ Failed to verify task movement", "ERROR")
                    return False
            else:
                self.log(f"❌ Task movement failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Task movement error: {str(e)}", "ERROR")
            return False
    
    def test_8_delete_pole_with_tasks(self):
        """Test 8: Attempt to delete a pole with tasks (should fail)"""
        self.log("🚫 Test 8: Attempting to delete pole with tasks (should fail)...")
        
        try:
            response = self.session.delete(f"{BASE_URL}/events/poles/{self.pole_communication_id}")
            
            if response.status_code == 400:
                self.log("✅ Pole deletion correctly blocked (pole has tasks)")
                return True
            elif response.status_code == 200:
                self.log("❌ Pole deletion should have been blocked but succeeded", "ERROR")
                return False
            else:
                self.log(f"❌ Unexpected response for pole deletion: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Pole deletion test error: {str(e)}", "ERROR")
            return False
    
    def test_9_delete_empty_pole(self):
        """Test 9: Delete an empty pole (should succeed)"""
        self.log("🗑️ Test 9: Deleting empty pole (should succeed)...")
        
        try:
            response = self.session.delete(f"{BASE_URL}/events/poles/{self.pole_finance_id}")
            
            if response.status_code == 200:
                self.log("✅ Empty pole deleted successfully")
                
                # Verify pole is no longer in the list
                poles_response = self.session.get(f"{BASE_URL}/events/poles?projet_id={self.test_project_id}")
                if poles_response.status_code == 200:
                    poles = poles_response.json()
                    
                    for pole in poles:
                        if pole["id"] == self.pole_finance_id:
                            self.log("❌ Deleted pole still appears in list", "ERROR")
                            return False
                    
                    if len(poles) == 2:
                        self.log("✅ Pole deletion verified (2 poles remaining)")
                        return True
                    else:
                        self.log(f"❌ Expected 2 poles after deletion, got {len(poles)}", "ERROR")
                        return False
                else:
                    self.log(f"❌ Failed to verify pole deletion", "ERROR")
                    return False
            else:
                self.log(f"❌ Empty pole deletion failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Empty pole deletion error: {str(e)}", "ERROR")
            return False
    
    def test_10_verify_global_project_completion(self):
        """Test 10: Verify global project completion percentage"""
        self.log("🎯 Test 10: Verifying global project completion percentage...")
        
        try:
            # Get project details to check global completion
            response = self.session.get(f"{BASE_URL}/events/projets/{self.test_project_id}")
            
            if response.status_code == 200:
                project = response.json()
                
                # Calculate expected global completion
                # Communication: 4 tasks, 2 completed (after moving 1 task)
                # Logistique: 11 tasks, 7 completed (after receiving 1 task)
                # General: 3 tasks, 0 completed
                # Total: 18 tasks, 9 completed = 50%
                
                expected_completion = 50.0
                
                if "taux_achevement" in project:
                    actual_completion = project["taux_achevement"]
                    
                    if abs(actual_completion - expected_completion) <= 1.0:  # Allow 1% tolerance
                        self.log(f"✅ Global project completion: {actual_completion}% (expected ~{expected_completion}%)")
                        return True
                    else:
                        self.log(f"❌ Global project completion: {actual_completion}%, expected ~{expected_completion}%", "ERROR")
                        return False
                else:
                    self.log("❌ Project completion percentage not found in response", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to get project details: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Global completion verification error: {str(e)}", "ERROR")
            return False
    
    def cleanup(self):
        """Clean up test data"""
        self.log("🧹 Cleaning up test data...")
        
        try:
            # Delete all created tasks
            for task_id in self.task_ids:
                self.session.delete(f"{BASE_URL}/events/taches/{task_id}")
            
            # Delete remaining poles
            if self.pole_communication_id:
                self.session.delete(f"{BASE_URL}/events/poles/{self.pole_communication_id}")
            if self.pole_logistique_id:
                self.session.delete(f"{BASE_URL}/events/poles/{self.pole_logistique_id}")
            
            # Delete test project
            if self.test_project_id:
                self.session.delete(f"{BASE_URL}/events/projets/{self.test_project_id}")
            
            self.log("✅ Cleanup completed")
            
        except Exception as e:
            self.log(f"⚠️ Cleanup error (non-critical): {str(e)}", "WARNING")
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        self.log("🚀 Starting Poles Backend Test Suite...")
        self.log(f"Backend URL: {BASE_URL}")
        self.log(f"Test User: {USERNAME} / {CITY}")
        
        tests = [
            ("Authentication", self.authenticate),
            ("Create Test Project", self.test_1_create_project),
            ("Create Poles", self.test_2_create_poles),
            ("Get Poles (Empty Stats)", self.test_3_get_poles_empty),
            ("Create Tasks in Poles", self.test_4_create_tasks_in_poles),
            ("Verify Pole Statistics", self.test_5_verify_pole_statistics),
            ("Modify Pole", self.test_6_modify_pole),
            ("Move Task Between Poles", self.test_7_move_task_between_poles),
            ("Delete Pole with Tasks", self.test_8_delete_pole_with_tasks),
            ("Delete Empty Pole", self.test_9_delete_empty_pole),
            ("Verify Global Completion", self.test_10_verify_global_project_completion)
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            self.log(f"\n{'='*60}")
            self.log(f"Running: {test_name}")
            self.log(f"{'='*60}")
            
            try:
                if test_func():
                    passed += 1
                    self.log(f"✅ {test_name} - PASSED")
                else:
                    failed += 1
                    self.log(f"❌ {test_name} - FAILED")
                    
                    # Continue with other tests even if one fails
                    
            except Exception as e:
                failed += 1
                self.log(f"❌ {test_name} - ERROR: {str(e)}")
        
        # Cleanup regardless of test results
        self.cleanup()
        
        # Final results
        self.log(f"\n{'='*60}")
        self.log("🏁 POLES BACKEND TEST RESULTS")
        self.log(f"{'='*60}")
        self.log(f"✅ Passed: {passed}")
        self.log(f"❌ Failed: {failed}")
        self.log(f"📊 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        if failed == 0:
            self.log("🎉 ALL TESTS PASSED! Poles functionality is working correctly.")
            return True
        else:
            self.log(f"⚠️ {failed} test(s) failed. Please review the errors above.")
            return False

if __name__ == "__main__":
    tester = PolesBackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)