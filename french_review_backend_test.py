#!/usr/bin/env python3
"""
Backend API Testing for French Review Request
Tests nouvelles fonctionnalités implémentées:
1. Multiple FI Assignment for Pilote
2. Visitor Update Permission - Promotions Role  
3. Visitor Update Permission - Accueil Role
4. Dashboard Superviseur FI Data
5. Unauthorized Visitor Edit
"""

import requests
import json
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')
BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://church-data-sync.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

class FrenchReviewTester:
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

    def setup_test_accounts(self):
        """Setup required test accounts"""
        self.log("Setting up test accounts...")
        
        # Initialize database
        init_response = self.make_request('POST', '/init')
        if init_response and init_response.status_code == 200:
            self.log("✅ Database initialized")
        
        # Login as superadmin to create accounts
        superadmin_login = self.make_request('POST', '/auth/login', json={
            "username": "superadmin",
            "password": "superadmin123",
            "city": "Dijon"
        })
        
        if not superadmin_login or superadmin_login.status_code != 200:
            self.log("❌ Failed to login as superadmin", "ERROR")
            return False
            
        superadmin_token = superadmin_login.json()['token']
        self.tokens['superadmin'] = superadmin_token
        
        # Create test accounts if they don't exist
        test_accounts = [
            {
                "username": "promotions",
                "password": "test123",
                "city": "Dijon",
                "role": "promotions"
            },
            {
                "username": "accueil_dijon",
                "password": "test123", 
                "city": "Dijon",
                "role": "accueil"
            },
            {
                "username": "pilote_fi",
                "password": "test123",
                "city": "Dijon", 
                "role": "pilote_fi"
            }
        ]
        
        for account in test_accounts:
            # Try to create account (might already exist)
            create_response = self.make_request('POST', '/users', 
                                              token=superadmin_token, 
                                              json=account)
            if create_response and create_response.status_code == 200:
                self.log(f"✅ Created account: {account['username']}")
            else:
                self.log(f"⚠️  Account {account['username']} might already exist")
        
        return True

    def setup_test_data(self):
        """Setup test visitors and FI data"""
        self.log("Setting up test data...")
        
        superadmin_token = self.tokens.get('superadmin')
        if not superadmin_token:
            self.log("❌ No superadmin token", "ERROR")
            return False
        
        # Create test visitor
        visitor_data = {
            "firstname": "Jean",
            "lastname": "Dupont",
            "city": "Dijon",
            "types": ["Nouveau Arrivant"],
            "phone": "+33699887766",
            "email": "jean.dupont@test.com",
            "arrival_channel": "Evangelisation",
            "visit_date": "2025-01-15"
        }
        
        create_visitor_response = self.make_request('POST', '/visitors', 
                                                  token=superadmin_token, 
                                                  json=visitor_data)
        if create_visitor_response and create_visitor_response.status_code == 200:
            visitor = create_visitor_response.json()
            self.test_data['visitor_id'] = visitor['id']
            self.log(f"✅ Created test visitor: {visitor['id']}")
        else:
            self.log("❌ Failed to create test visitor", "ERROR")
            return False
        
        # Create test secteur and FI for multiple assignment test
        secteur_data = {
            "nom": "Test Secteur",
            "ville": "Dijon"
        }
        
        create_secteur_response = self.make_request('POST', '/fi/secteurs',
                                                   token=superadmin_token,
                                                   json=secteur_data)
        if create_secteur_response and create_secteur_response.status_code == 200:
            secteur = create_secteur_response.json()
            secteur_id = secteur['id']
            self.log(f"✅ Created test secteur: {secteur_id}")
            
            # Create multiple FIs
            fi_names = ["FI Test 1", "FI Test 2", "FI Test 3"]
            fi_ids = []
            
            for fi_name in fi_names:
                fi_data = {
                    "nom": fi_name,
                    "ville": "Dijon",
                    "secteur_id": secteur_id,
                    "adresse": f"Adresse {fi_name}"
                }
                
                create_fi_response = self.make_request('POST', '/fi/familles-impact',
                                                     token=superadmin_token,
                                                     json=fi_data)
                if create_fi_response and create_fi_response.status_code == 200:
                    fi = create_fi_response.json()
                    fi_ids.append(fi['id'])
                    self.log(f"✅ Created FI: {fi_name}")
            
            self.test_data['fi_ids'] = fi_ids
        
        return True

    def test_1_multiple_fi_assignment(self):
        """Test 1: Multiple FI Assignment for Pilote"""
        self.log("\n=== TEST 1: Multiple FI Assignment for Pilote ===")
        
        # Login as superadmin
        superadmin_token = self.tokens.get('superadmin')
        if not superadmin_token:
            self.log("❌ No superadmin token", "ERROR")
            return False
        
        # Get or create pilote_fi user
        users_response = self.make_request('GET', '/users/referents', token=superadmin_token)
        if not users_response or users_response.status_code != 200:
            self.log("❌ Failed to get users", "ERROR")
            return False
        
        users = users_response.json()
        pilote_user = next((u for u in users if u.get('role') == 'pilote_fi'), None)
        
        if not pilote_user:
            self.log("❌ No pilote_fi user found", "ERROR")
            return False
        
        pilote_user_id = pilote_user['id']
        fi_ids = self.test_data.get('fi_ids', [])
        
        if len(fi_ids) < 3:
            self.log("❌ Not enough FI IDs for test", "ERROR")
            return False
        
        # Test multiple FI assignment
        update_data = {
            "assigned_fi_ids": fi_ids
        }
        
        self.log(f"Assigning multiple FIs to pilote user {pilote_user_id}")
        self.log(f"FI IDs: {fi_ids}")
        
        update_response = self.make_request('PUT', f'/users/{pilote_user_id}',
                                          token=superadmin_token,
                                          json=update_data)
        
        if not update_response or update_response.status_code != 200:
            self.log(f"❌ Failed to update user - Status: {update_response.status_code if update_response else 'None'}", "ERROR")
            if update_response:
                self.log(f"   Error: {update_response.text}")
            return False
        
        self.log("✅ Multiple FI assignment successful")
        
        # Verify assignment by getting user
        get_user_response = self.make_request('GET', '/users/referents', token=superadmin_token)
        if get_user_response and get_user_response.status_code == 200:
            users = get_user_response.json()
            updated_pilote = next((u for u in users if u.get('id') == pilote_user_id), None)
            
            if updated_pilote and updated_pilote.get('assigned_fi_ids') == fi_ids:
                self.log("✅ Multiple FI assignment verified")
                self.log(f"   Assigned FI IDs: {updated_pilote.get('assigned_fi_ids')}")
                return True
            else:
                self.log("❌ Multiple FI assignment not verified", "ERROR")
                return False
        
        return False

    def test_2_visitor_update_promotions_role(self):
        """Test 2: Visitor Update Permission - Promotions Role"""
        self.log("\n=== TEST 2: Visitor Update Permission - Promotions Role ===")
        
        # Login as promotions user
        login_data = {
            "username": "promotions",
            "password": "test123",
            "city": "Dijon"
        }
        
        login_response = self.make_request('POST', '/auth/login', json=login_data)
        if not login_response or login_response.status_code != 200:
            self.log("❌ Failed to login as promotions user", "ERROR")
            return False
        
        promotions_token = login_response.json()['token']
        self.log("✅ Logged in as promotions user")
        
        # Get visitor ID
        visitor_id = self.test_data.get('visitor_id')
        if not visitor_id:
            self.log("❌ No visitor ID available", "ERROR")
            return False
        
        # Test visitor update
        update_data = {
            "firstname": "Jean Updated",
            "phone": "+33699887766"
        }
        
        self.log(f"Updating visitor {visitor_id} with promotions role")
        self.log(f"Update data: {update_data}")
        
        update_response = self.make_request('PUT', f'/visitors/{visitor_id}',
                                          token=promotions_token,
                                          json=update_data)
        
        if not update_response:
            self.log("❌ Request failed", "ERROR")
            return False
        
        if update_response.status_code == 200:
            response_data = update_response.json()
            if response_data.get('message') == 'Visitor updated successfully':
                self.log("✅ Promotions role can update visitors")
                
                # Verify update
                get_response = self.make_request('GET', f'/visitors/{visitor_id}', token=promotions_token)
                if get_response and get_response.status_code == 200:
                    visitor = get_response.json()
                    if visitor.get('firstname') == 'Jean Updated':
                        self.log("✅ Visitor update verified")
                        return True
                    else:
                        self.log("❌ Visitor update not persisted", "ERROR")
                        return False
                
                return True
            else:
                self.log(f"❌ Unexpected response message: {response_data}", "ERROR")
                return False
        else:
            self.log(f"❌ Update failed - Status: {update_response.status_code}", "ERROR")
            self.log(f"   Error: {update_response.text}")
            return False

    def test_3_visitor_update_accueil_role(self):
        """Test 3: Visitor Update Permission - Accueil Role"""
        self.log("\n=== TEST 3: Visitor Update Permission - Accueil Role ===")
        
        # Login as accueil user
        login_data = {
            "username": "accueil_dijon",
            "password": "test123",
            "city": "Dijon"
        }
        
        login_response = self.make_request('POST', '/auth/login', json=login_data)
        if not login_response or login_response.status_code != 200:
            self.log("❌ Failed to login as accueil user", "ERROR")
            return False
        
        accueil_token = login_response.json()['token']
        self.log("✅ Logged in as accueil user")
        
        # Get visitor ID
        visitor_id = self.test_data.get('visitor_id')
        if not visitor_id:
            self.log("❌ No visitor ID available", "ERROR")
            return False
        
        # Test visitor update
        update_data = {
            "lastname": "Dupont Modified",
            "email": "updated@test.com"
        }
        
        self.log(f"Updating visitor {visitor_id} with accueil role")
        self.log(f"Update data: {update_data}")
        
        update_response = self.make_request('PUT', f'/visitors/{visitor_id}',
                                          token=accueil_token,
                                          json=update_data)
        
        if not update_response:
            self.log("❌ Request failed", "ERROR")
            return False
        
        if update_response.status_code == 200:
            response_data = update_response.json()
            if response_data.get('message') == 'Visitor updated successfully':
                self.log("✅ Accueil role can update visitors")
                
                # Verify update with superadmin (accueil can't get visitor details)
                superadmin_token = self.tokens.get('superadmin')
                get_response = self.make_request('GET', f'/visitors/{visitor_id}', token=superadmin_token)
                if get_response and get_response.status_code == 200:
                    visitor = get_response.json()
                    if visitor.get('lastname') == 'Dupont Modified' and visitor.get('email') == 'updated@test.com':
                        self.log("✅ Accueil visitor update verified")
                        return True
                    else:
                        self.log("❌ Accueil visitor update not persisted", "ERROR")
                        return False
                
                return True
            else:
                self.log(f"❌ Unexpected response message: {response_data}", "ERROR")
                return False
        else:
            self.log(f"❌ Update failed - Status: {update_response.status_code}", "ERROR")
            self.log(f"   Error: {update_response.text}")
            return False

    def test_4_dashboard_superviseur_fi_data(self):
        """Test 4: Dashboard Superviseur FI Data"""
        self.log("\n=== TEST 4: Dashboard Superviseur FI Data ===")
        
        # Login as superadmin (has superviseur permissions)
        superadmin_token = self.tokens.get('superadmin')
        if not superadmin_token:
            self.log("❌ No superadmin token", "ERROR")
            return False
        
        # Test GET /api/fi/secteurs?ville=Dijon
        self.log("Testing GET /api/fi/secteurs?ville=Dijon")
        secteurs_response = self.make_request('GET', '/fi/secteurs?ville=Dijon', token=superadmin_token)
        
        if not secteurs_response or secteurs_response.status_code != 200:
            self.log(f"❌ Failed to get secteurs - Status: {secteurs_response.status_code if secteurs_response else 'None'}", "ERROR")
            return False
        
        secteurs = secteurs_response.json()
        if len(secteurs) >= 1:
            self.log(f"✅ Secteurs endpoint working - Found {len(secteurs)} secteurs")
            for secteur in secteurs:
                self.log(f"   - {secteur.get('nom')} (ID: {secteur.get('id')})")
        else:
            self.log("❌ No secteurs found for Dijon", "ERROR")
            return False
        
        # Test GET /api/fi/familles-impact?ville=Dijon
        self.log("Testing GET /api/fi/familles-impact?ville=Dijon")
        fi_response = self.make_request('GET', '/fi/familles-impact?ville=Dijon', token=superadmin_token)
        
        if not fi_response or fi_response.status_code != 200:
            self.log(f"❌ Failed to get FI - Status: {fi_response.status_code if fi_response else 'None'}", "ERROR")
            return False
        
        fis = fi_response.json()
        if len(fis) >= 1:
            self.log(f"✅ FI endpoint working - Found {len(fis)} Familles d'Impact")
            for fi in fis:
                self.log(f"   - {fi.get('nom')} (ID: {fi.get('id')}, Adresse: {fi.get('adresse', 'N/A')})")
                if fi.get('pilote_id'):
                    self.log(f"     Pilote ID: {fi.get('pilote_id')}")
            return True
        else:
            self.log("❌ No FI found for Dijon", "ERROR")
            return False

    def test_5_unauthorized_visitor_edit(self):
        """Test 5: Unauthorized Visitor Edit"""
        self.log("\n=== TEST 5: Unauthorized Visitor Edit ===")
        
        # Login as pilote_fi (should not be able to edit visitors)
        login_data = {
            "username": "pilote_fi",
            "password": "test123",
            "city": "Dijon"
        }
        
        login_response = self.make_request('POST', '/auth/login', json=login_data)
        if not login_response or login_response.status_code != 200:
            self.log("❌ Failed to login as pilote_fi", "ERROR")
            return False
        
        pilote_token = login_response.json()['token']
        self.log("✅ Logged in as pilote_fi")
        
        # Get visitor ID
        visitor_id = self.test_data.get('visitor_id')
        if not visitor_id:
            self.log("❌ No visitor ID available", "ERROR")
            return False
        
        # Try to update visitor (should be denied)
        update_data = {
            "firstname": "Unauthorized Update",
            "phone": "+33000000000"
        }
        
        self.log(f"Attempting unauthorized visitor update with pilote_fi role")
        
        update_response = self.make_request('PUT', f'/visitors/{visitor_id}',
                                          token=pilote_token,
                                          json=update_data)
        
        if update_response is None:
            self.log("❌ Request failed completely (network error)", "ERROR")
            return False
        
        self.log(f"Response status: {update_response.status_code}")
        
        if update_response.status_code == 403:
            self.log("✅ Unauthorized access correctly denied (403)")
            try:
                error_data = update_response.json()
                self.log(f"   Error message: {error_data.get('detail', 'Permission denied')}")
            except:
                self.log(f"   Raw response: {update_response.text}")
            return True
        elif update_response.status_code == 200:
            self.log("❌ Pilote_fi was allowed to update visitor (should be denied)", "ERROR")
            return False
        else:
            self.log(f"❌ Unexpected status code: {update_response.status_code}", "ERROR")
            try:
                response_data = update_response.json()
                self.log(f"   Response data: {response_data}")
            except:
                self.log(f"   Raw response: {update_response.text}")
            return False

    def run_all_tests(self):
        """Run all French review tests"""
        self.log("Starting Backend API Tests for French Review Request")
        self.log("=" * 70)
        
        # Setup
        if not self.setup_test_accounts():
            self.log("❌ Failed to setup test accounts", "ERROR")
            return {}
        
        if not self.setup_test_data():
            self.log("❌ Failed to setup test data", "ERROR")
            return {}
        
        # Run tests
        tests = [
            ("Test 1: Multiple FI Assignment for Pilote", self.test_1_multiple_fi_assignment),
            ("Test 2: Visitor Update Permission - Promotions Role", self.test_2_visitor_update_promotions_role),
            ("Test 3: Visitor Update Permission - Accueil Role", self.test_3_visitor_update_accueil_role),
            ("Test 4: Dashboard Superviseur FI Data", self.test_4_dashboard_superviseur_fi_data),
            ("Test 5: Unauthorized Visitor Edit", self.test_5_unauthorized_visitor_edit)
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
        self.log("TEST SUMMARY - FRENCH REVIEW REQUEST")
        self.log("=" * 70)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{status} {test_name}")
        
        self.log(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 All French review tests passed! New features are working correctly.")
        else:
            self.log(f"⚠️  {total - passed} test(s) failed. Issues need to be addressed.")
        
        return results

if __name__ == "__main__":
    tester = FrenchReviewTester()
    results = tester.run_all_tests()