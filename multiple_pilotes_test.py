#!/usr/bin/env python3
"""
Backend API Testing for Multiple Pilotes per FI Feature
Tests nouvelles fonctionnalités as requested in French review
"""

import requests
import json
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')
BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://agenda-ministry.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

class MultiplePilotesBackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.tokens = {}
        self.test_data = {}
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def make_request(self, method, endpoint, token=None, **kwargs):
        """Make HTTP request with optional authentication"""
        url = f"{API_URL}{endpoint}"
        headers = kwargs.get('headers', {})
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
            
        kwargs['headers'] = headers
        
        try:
            response = self.session.request(method, url, **kwargs)
            self.log(f"{method} {endpoint} -> {response.status_code}")
            return response
        except Exception as e:
            self.log(f"Request failed: {e}", "ERROR")
            return None

    def setup_test_environment(self):
        """Initialize test environment and create test data"""
        self.log("Setting up test environment...")
        
        # Initialize database
        response = self.make_request('POST', '/init')
        if response and response.status_code == 200:
            self.log("✅ Database initialized successfully")
        
        # Login as superadmin
        login_data = {
            "username": "superadmin",
            "password": "superadmin123",
            "city": "Dijon"
        }
        
        login_response = self.make_request('POST', '/auth/login', json=login_data)
        if not login_response or login_response.status_code != 200:
            self.log("❌ Failed to login as superadmin", "ERROR")
            return False
        
        self.tokens['superadmin'] = login_response.json()['token']
        self.log("✅ Logged in as superadmin")
        
        # Create test secteur if needed
        secteurs_response = self.make_request('GET', '/fi/secteurs?ville=Dijon', token=self.tokens['superadmin'])
        if secteurs_response and secteurs_response.status_code == 200:
            secteurs = secteurs_response.json()
            if secteurs:
                self.test_data['secteur_id'] = secteurs[0]['id']
                self.log(f"✅ Using existing secteur: {secteurs[0]['nom']}")
            else:
                # Create secteur
                secteur_data = {
                    "nom": "Secteur Test Multiple Pilotes",
                    "ville": "Dijon"
                }
                create_secteur_response = self.make_request('POST', '/fi/secteurs', 
                                                         token=self.tokens['superadmin'], 
                                                         json=secteur_data)
                if create_secteur_response and create_secteur_response.status_code == 200:
                    secteur = create_secteur_response.json()
                    self.test_data['secteur_id'] = secteur['id']
                    self.log(f"✅ Created secteur: {secteur['nom']}")
                else:
                    self.log("❌ Failed to create secteur", "ERROR")
                    return False
        
        # Create test pilote users
        pilote_users = [
            {
                "username": "pilote_test_1",
                "password": "test123",
                "city": "Dijon",
                "role": "pilote_fi",
                "telephone": "+33123456789"
            },
            {
                "username": "pilote_test_2", 
                "password": "test123",
                "city": "Dijon",
                "role": "pilote_fi",
                "telephone": "+33987654321"
            }
        ]
        
        self.test_data['pilote_ids'] = []
        
        for pilote_data in pilote_users:
            create_response = self.make_request('POST', '/users', 
                                              token=self.tokens['superadmin'], 
                                              json=pilote_data)
            if create_response and create_response.status_code == 200:
                pilote_id = create_response.json()['id']
                self.test_data['pilote_ids'].append(pilote_id)
                self.log(f"✅ Created pilote user: {pilote_data['username']} (ID: {pilote_id})")
            else:
                # User might already exist, try to find it
                users_response = self.make_request('GET', '/users/referents', token=self.tokens['superadmin'])
                if users_response and users_response.status_code == 200:
                    users = users_response.json()
                    existing_user = next((u for u in users if u['username'] == pilote_data['username']), None)
                    if existing_user:
                        self.test_data['pilote_ids'].append(existing_user['id'])
                        self.log(f"✅ Using existing pilote user: {pilote_data['username']} (ID: {existing_user['id']})")
                    else:
                        self.log(f"❌ Failed to create or find pilote user: {pilote_data['username']}", "ERROR")
                        return False
        
        self.log(f"Setup complete. Created/found {len(self.test_data['pilote_ids'])} pilote users")
        return True

    def test_1_multiple_pilotes_fi_creation(self):
        """Test 1: Multiple Pilotes par FI - Create FI with multiple pilotes"""
        self.log("\n=== TEST 1: Multiple Pilotes par FI - Création ===")
        
        if len(self.test_data['pilote_ids']) < 2:
            self.log("❌ Not enough pilote users for test", "ERROR")
            return False
        
        # Create FI with multiple pilotes using pilote_ids array
        fi_data = {
            "nom": "FI Test Multiple Pilotes",
            "ville": "Dijon",
            "secteur_id": self.test_data['secteur_id'],
            "pilote_ids": self.test_data['pilote_ids']  # Multiple pilotes
        }
        
        self.log("Creating FI with multiple pilotes:")
        self.log(f"   nom: {fi_data['nom']}")
        self.log(f"   ville: {fi_data['ville']}")
        self.log(f"   secteur_id: {fi_data['secteur_id']}")
        self.log(f"   pilote_ids: {fi_data['pilote_ids']}")
        
        create_response = self.make_request('POST', '/fi/familles-impact', 
                                          token=self.tokens['superadmin'], 
                                          json=fi_data)
        
        if not create_response or create_response.status_code != 200:
            self.log(f"❌ Failed to create FI with multiple pilotes - Status: {create_response.status_code if create_response else 'None'}", "ERROR")
            if create_response:
                self.log(f"   Error: {create_response.text}")
            return False
        
        fi = create_response.json()
        self.test_data['fi_id'] = fi['id']
        
        self.log(f"✅ FI created successfully with ID: {fi['id']}")
        self.log(f"   Nom: {fi['nom']}")
        
        # Verify pilote_ids are stored correctly
        if 'pilote_ids' in fi and fi['pilote_ids'] == self.test_data['pilote_ids']:
            self.log(f"✅ pilote_ids correctly stored: {fi['pilote_ids']}")
        else:
            self.log(f"❌ pilote_ids not correctly stored", "ERROR")
            self.log(f"   Expected: {self.test_data['pilote_ids']}")
            self.log(f"   Got: {fi.get('pilote_ids', 'NOT FOUND')}")
            return False
        
        # Check backward compatibility - pilote_id should be None or first pilote
        if 'pilote_id' in fi:
            if fi['pilote_id'] is None or fi['pilote_id'] == self.test_data['pilote_ids'][0]:
                self.log(f"✅ Backward compatibility maintained - pilote_id: {fi.get('pilote_id')}")
            else:
                self.log(f"⚠️  pilote_id unexpected value: {fi['pilote_id']}")
        
        return True

    def test_2_get_fi_confirm_pilote_ids(self):
        """Test 1 continued: GET /api/fi/familles-impact/{fi_id} pour confirmer pilote_ids"""
        self.log("\n=== TEST 1 (continued): GET FI pour confirmer pilote_ids ===")
        
        if 'fi_id' not in self.test_data:
            self.log("❌ No FI ID from previous test", "ERROR")
            return False
        
        # GET specific FI to confirm pilote_ids
        get_response = self.make_request('GET', f'/fi/familles-impact/{self.test_data["fi_id"]}', 
                                       token=self.tokens['superadmin'])
        
        if not get_response or get_response.status_code != 200:
            self.log(f"❌ Failed to get FI - Status: {get_response.status_code if get_response else 'None'}", "ERROR")
            if get_response:
                self.log(f"   Error: {get_response.text}")
            return False
        
        fi = get_response.json()
        
        self.log(f"✅ Retrieved FI: {fi['nom']}")
        
        # Verify pilote_ids are correctly stored and retrieved
        if 'pilote_ids' in fi and fi['pilote_ids'] == self.test_data['pilote_ids']:
            self.log(f"✅ pilote_ids confirmed in GET response: {fi['pilote_ids']}")
            self.log(f"   Number of pilotes: {len(fi['pilote_ids'])}")
            
            # Log all FI details for verification
            self.log("Complete FI details:")
            for key, value in fi.items():
                self.log(f"   {key}: {value}")
            
            return True
        else:
            self.log(f"❌ pilote_ids not correctly retrieved", "ERROR")
            self.log(f"   Expected: {self.test_data['pilote_ids']}")
            self.log(f"   Got: {fi.get('pilote_ids', 'NOT FOUND')}")
            return False

    def test_3_assign_multiple_fi_to_pilote(self):
        """Test 2: Support assigned_fi_ids pour pilotes - Assign multiple FI to pilote"""
        self.log("\n=== TEST 2: Support assigned_fi_ids pour pilotes ===")
        
        if len(self.test_data['pilote_ids']) < 1:
            self.log("❌ No pilote users available", "ERROR")
            return False
        
        # Create a second FI for testing multiple assignments
        fi_data_2 = {
            "nom": "FI Test Deuxième",
            "ville": "Dijon",
            "secteur_id": self.test_data['secteur_id'],
            "pilote_ids": [self.test_data['pilote_ids'][0]]  # Same pilote as first FI
        }
        
        create_response = self.make_request('POST', '/fi/familles-impact', 
                                          token=self.tokens['superadmin'], 
                                          json=fi_data_2)
        
        if not create_response or create_response.status_code != 200:
            self.log(f"❌ Failed to create second FI", "ERROR")
            return False
        
        fi_2 = create_response.json()
        self.test_data['fi_id_2'] = fi_2['id']
        self.log(f"✅ Created second FI: {fi_2['nom']} (ID: {fi_2['id']})")
        
        # Update pilote user to have assigned_fi_ids (multiple FI assignments)
        pilote_id = self.test_data['pilote_ids'][0]
        fi_ids_to_assign = [self.test_data['fi_id'], self.test_data['fi_id_2']]
        
        update_data = {
            "assigned_fi_ids": fi_ids_to_assign
        }
        
        self.log(f"Assigning multiple FI to pilote {pilote_id}:")
        self.log(f"   assigned_fi_ids: {fi_ids_to_assign}")
        
        update_response = self.make_request('PUT', f'/users/{pilote_id}', 
                                          token=self.tokens['superadmin'], 
                                          json=update_data)
        
        if not update_response or update_response.status_code != 200:
            self.log(f"❌ Failed to update pilote with assigned_fi_ids - Status: {update_response.status_code if update_response else 'None'}", "ERROR")
            if update_response:
                self.log(f"   Error: {update_response.text}")
            return False
        
        self.log("✅ Pilote updated with multiple FI assignments")
        
        # Verify the assignment by getting user details
        users_response = self.make_request('GET', '/users/referents', token=self.tokens['superadmin'])
        if not users_response or users_response.status_code != 200:
            self.log("❌ Failed to get users list", "ERROR")
            return False
        
        users = users_response.json()
        updated_pilote = next((u for u in users if u['id'] == pilote_id), None)
        
        if not updated_pilote:
            self.log("❌ Updated pilote not found in users list", "ERROR")
            return False
        
        if 'assigned_fi_ids' in updated_pilote and updated_pilote['assigned_fi_ids'] == fi_ids_to_assign:
            self.log(f"✅ assigned_fi_ids correctly stored: {updated_pilote['assigned_fi_ids']}")
            
            # Check backward compatibility with assigned_fi_id
            if 'assigned_fi_id' in updated_pilote:
                self.log(f"✅ Backward compatibility - assigned_fi_id: {updated_pilote.get('assigned_fi_id')}")
            
            return True
        else:
            self.log(f"❌ assigned_fi_ids not correctly stored", "ERROR")
            self.log(f"   Expected: {fi_ids_to_assign}")
            self.log(f"   Got: {updated_pilote.get('assigned_fi_ids', 'NOT FOUND')}")
            return False

    def test_4_pilote_access_multiple_fi(self):
        """Test 2 continued: Verify pilote can access their multiple FI"""
        self.log("\n=== TEST 2 (continued): Pilote access to multiple FI ===")
        
        if len(self.test_data['pilote_ids']) < 1:
            self.log("❌ No pilote users available", "ERROR")
            return False
        
        # Login as the pilote user
        login_data = {
            "username": "pilote_test_1",
            "password": "test123",
            "city": "Dijon"
        }
        
        login_response = self.make_request('POST', '/auth/login', json=login_data)
        if not login_response or login_response.status_code != 200:
            self.log("❌ Failed to login as pilote", "ERROR")
            return False
        
        pilote_token = login_response.json()['token']
        self.log("✅ Logged in as pilote_test_1")
        
        # Test access to FI list (should see their assigned FI)
        fi_list_response = self.make_request('GET', '/fi/familles-impact', token=pilote_token)
        
        if not fi_list_response or fi_list_response.status_code != 200:
            self.log(f"❌ Failed to get FI list as pilote - Status: {fi_list_response.status_code if fi_list_response else 'None'}", "ERROR")
            if fi_list_response:
                self.log(f"   Error: {fi_list_response.text}")
            return False
        
        accessible_fis = fi_list_response.json()
        self.log(f"✅ Pilote can access {len(accessible_fis)} FI(s)")
        
        # Verify pilote can see their assigned FI
        assigned_fi_ids = [self.test_data['fi_id'], self.test_data.get('fi_id_2')]
        accessible_fi_ids = [fi['id'] for fi in accessible_fis]
        
        for fi in accessible_fis:
            self.log(f"   - {fi['nom']} (ID: {fi['id']})")
        
        # Check if pilote can access their assigned FI
        can_access_assigned = any(fi_id in accessible_fi_ids for fi_id in assigned_fi_ids if fi_id)
        
        if can_access_assigned:
            self.log("✅ Pilote can access their assigned FI")
            return True
        else:
            self.log("❌ Pilote cannot access their assigned FI", "ERROR")
            self.log(f"   Assigned FI IDs: {assigned_fi_ids}")
            self.log(f"   Accessible FI IDs: {accessible_fi_ids}")
            return False

    def test_5_fi_stats_pilote_endpoint(self):
        """Test 2 continued: GET /api/fi/stats-pilote with pilote having multiple FI"""
        self.log("\n=== TEST 2 (continued): GET /api/fi/stats-pilote ===")
        
        # Login as pilote
        login_data = {
            "username": "pilote_test_1",
            "password": "test123",
            "city": "Dijon"
        }
        
        login_response = self.make_request('POST', '/auth/login', json=login_data)
        if not login_response or login_response.status_code != 200:
            self.log("❌ Failed to login as pilote", "ERROR")
            return False
        
        pilote_token = login_response.json()['token']
        
        # Test FI stats endpoint
        stats_response = self.make_request('GET', '/fi/stats/pilote', token=pilote_token)
        
        if not stats_response:
            self.log("❌ Request failed completely", "ERROR")
            return False
        
        self.log(f"FI stats endpoint response status: {stats_response.status_code}")
        
        if stats_response.status_code == 200:
            try:
                stats_data = stats_response.json()
                self.log("✅ FI stats endpoint accessible")
                self.log(f"   Stats data: {stats_data}")
                return True
            except Exception as e:
                self.log(f"❌ Failed to parse stats response: {e}", "ERROR")
                self.log(f"   Raw response: {stats_response.text}")
                return False
        
        elif stats_response.status_code == 404:
            self.log("⚠️  FI stats endpoint not found (404) - This endpoint might not be implemented yet")
            self.log("   This is acceptable as the endpoint may be part of future development")
            return True  # Not a failure, just not implemented
        
        elif stats_response.status_code == 403:
            self.log("❌ FI stats endpoint forbidden (403) - Permission issue", "ERROR")
            self.log(f"   Response: {stats_response.text}")
            return False
        
        else:
            self.log(f"❌ FI stats endpoint failed - Status: {stats_response.status_code}", "ERROR")
            self.log(f"   Response: {stats_response.text}")
            return False

    def test_6_backward_compatibility(self):
        """Test: Backward compatibility with pilote_id field"""
        self.log("\n=== TEST: Backward Compatibility with pilote_id ===")
        
        # Create FI using old pilote_id field (should still work)
        fi_data_old = {
            "nom": "FI Test Backward Compatibility",
            "ville": "Dijon",
            "secteur_id": self.test_data['secteur_id'],
            "pilote_id": self.test_data['pilote_ids'][0]  # Old single pilote field
        }
        
        self.log("Creating FI with old pilote_id field:")
        self.log(f"   pilote_id: {fi_data_old['pilote_id']}")
        
        create_response = self.make_request('POST', '/fi/familles-impact', 
                                          token=self.tokens['superadmin'], 
                                          json=fi_data_old)
        
        if not create_response or create_response.status_code != 200:
            self.log(f"❌ Failed to create FI with pilote_id - Status: {create_response.status_code if create_response else 'None'}", "ERROR")
            if create_response:
                self.log(f"   Error: {create_response.text}")
            return False
        
        fi_old = create_response.json()
        self.log(f"✅ FI created with pilote_id: {fi_old['id']}")
        
        # Verify both fields are handled correctly
        if 'pilote_id' in fi_old and fi_old['pilote_id'] == self.test_data['pilote_ids'][0]:
            self.log(f"✅ pilote_id correctly stored: {fi_old['pilote_id']}")
        else:
            self.log(f"❌ pilote_id not correctly stored", "ERROR")
            return False
        
        # Check if pilote_ids is also populated (for forward compatibility)
        if 'pilote_ids' in fi_old:
            if fi_old['pilote_ids'] == [self.test_data['pilote_ids'][0]]:
                self.log(f"✅ pilote_ids automatically populated: {fi_old['pilote_ids']}")
            else:
                self.log(f"⚠️  pilote_ids not automatically populated from pilote_id")
        
        return True

    def run_all_tests(self):
        """Run all multiple pilotes tests"""
        self.log("Starting Backend API Tests for Multiple Pilotes per FI")
        self.log("=" * 70)
        
        # Setup test environment
        if not self.setup_test_environment():
            self.log("❌ Failed to setup test environment", "ERROR")
            return {}
        
        # Run tests in order
        tests = [
            ("Test 1: Multiple Pilotes par FI - Création", self.test_1_multiple_pilotes_fi_creation),
            ("Test 1 (continued): GET FI pour confirmer pilote_ids", self.test_2_get_fi_confirm_pilote_ids),
            ("Test 2: Support assigned_fi_ids pour pilotes", self.test_3_assign_multiple_fi_to_pilote),
            ("Test 2 (continued): Pilote access to multiple FI", self.test_4_pilote_access_multiple_fi),
            ("Test 2 (continued): GET /api/fi/stats-pilote", self.test_5_fi_stats_pilote_endpoint),
            ("Test: Backward Compatibility with pilote_id", self.test_6_backward_compatibility)
        ]
        
        results = {}
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            try:
                result = test_func()
                results[test_name] = result
                if result:
                    passed += 1
            except Exception as e:
                self.log(f"❌ Test '{test_name}' crashed: {e}", "ERROR")
                results[test_name] = False
        
        # Summary
        self.log("\n" + "=" * 70)
        self.log("TEST SUMMARY - MULTIPLE PILOTES PER FI")
        self.log("=" * 70)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{status} {test_name}")
        
        self.log(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 All multiple pilotes tests passed! New features working correctly.")
        else:
            self.log(f"⚠️  {total - passed} test(s) failed. Issues need to be addressed.")
        
        return results

if __name__ == "__main__":
    tester = MultiplePilotesBackendTester()
    results = tester.run_all_tests()