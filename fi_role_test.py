#!/usr/bin/env python3
"""
Test role-based access for FI system with different user roles
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

class FIRoleTester:
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
        """Setup test environment with different role users"""
        self.log("Setting up test environment...")
        
        # Login as admin
        admin_login = self.make_request('POST', '/auth/login', json={
            "username": "admin",
            "password": "admin123",
            "city": "Dijon"
        })
        
        if not admin_login or admin_login.status_code != 200:
            self.log("❌ Admin login failed", "ERROR")
            return False
            
        self.tokens['admin'] = admin_login.json()['token']
        
        # Create test secteur and FI
        secteur_data = {"nom": "Test Secteur Role", "ville": "Dijon"}
        secteur_response = self.make_request('POST', '/fi/secteurs', token=self.tokens['admin'], json=secteur_data)
        if secteur_response and secteur_response.status_code == 200:
            self.test_data['secteur'] = secteur_response.json()
            
            # Create FI
            fi_data = {
                "nom": "Test FI Role",
                "secteur_id": self.test_data['secteur']['id'],
                "ville": "Dijon"
            }
            fi_response = self.make_request('POST', '/fi/familles-impact', token=self.tokens['admin'], json=fi_data)
            if fi_response and fi_response.status_code == 200:
                self.test_data['fi'] = fi_response.json()
        
        # Create users with different roles
        test_users = [
            {
                "username": "pilote_role_test",
                "password": "test123",
                "city": "Dijon",
                "role": "pilote_fi"
            },
            {
                "username": "responsable_role_test", 
                "password": "test123",
                "city": "Dijon",
                "role": "responsable_secteur"
            },
            {
                "username": "superviseur_role_test",
                "password": "test123",
                "city": "Dijon",
                "role": "superviseur_fi"
            }
        ]
        
        for user_data in test_users:
            create_response = self.make_request('POST', '/users/referent', token=self.tokens['admin'], json=user_data)
            if create_response and create_response.status_code == 200:
                # Login as this user
                login_response = self.make_request('POST', '/auth/login', json={
                    "username": user_data["username"],
                    "password": user_data["password"],
                    "city": user_data["city"]
                })
                if login_response and login_response.status_code == 200:
                    self.tokens[user_data['role']] = login_response.json()['token']
                    self.log(f"✅ Created and logged in {user_data['role']}")
        
        return True
    
    def test_pilote_fi_permissions(self):
        """Test pilote_fi role permissions"""
        self.log("\n=== TESTING PILOTE_FI PERMISSIONS ===")
        
        token = self.tokens.get('pilote_fi')
        if not token:
            self.log("❌ No pilote_fi token available", "ERROR")
            return False
        
        # Test accessing stats endpoint (should work)
        stats_response = self.make_request('GET', '/fi/stats/pilote', token=token)
        if stats_response and stats_response.status_code == 400:  # Expected - no FI assigned
            self.log("✅ Pilote stats endpoint accessible (no FI assigned error expected)")
        elif stats_response and stats_response.status_code == 200:
            self.log("✅ Pilote stats endpoint working")
        else:
            self.log("❌ Pilote stats endpoint failed", "ERROR")
            return False
        
        # Test creating secteur (should fail - not authorized)
        secteur_data = {"nom": "Unauthorized Secteur", "ville": "Dijon"}
        create_response = self.make_request('POST', '/fi/secteurs', token=token, json=secteur_data)
        if create_response and create_response.status_code == 403:
            self.log("✅ Pilote correctly denied secteur creation")
        else:
            self.log("❌ Pilote should not be able to create secteurs", "ERROR")
            return False
        
        return True
    
    def test_responsable_secteur_permissions(self):
        """Test responsable_secteur role permissions"""
        self.log("\n=== TESTING RESPONSABLE_SECTEUR PERMISSIONS ===")
        
        token = self.tokens.get('responsable_secteur')
        if not token:
            self.log("❌ No responsable_secteur token available", "ERROR")
            return False
        
        # Test accessing secteur stats (should work)
        stats_response = self.make_request('GET', '/fi/stats/secteur', token=token)
        if stats_response and stats_response.status_code == 400:  # Expected - no secteur assigned
            self.log("✅ Responsable secteur stats endpoint accessible (no secteur assigned error expected)")
        elif stats_response and stats_response.status_code == 200:
            self.log("✅ Responsable secteur stats endpoint working")
        else:
            self.log("❌ Responsable secteur stats endpoint failed", "ERROR")
            return False
        
        # Test creating FI (should work)
        if self.test_data.get('secteur'):
            fi_data = {
                "nom": "FI Created by Responsable",
                "secteur_id": self.test_data['secteur']['id'],
                "ville": "Dijon"
            }
            create_response = self.make_request('POST', '/fi/familles-impact', token=token, json=fi_data)
            if create_response and create_response.status_code == 200:
                self.log("✅ Responsable secteur can create FI")
            else:
                self.log("❌ Responsable secteur should be able to create FI", "ERROR")
                return False
        
        return True
    
    def test_superviseur_fi_permissions(self):
        """Test superviseur_fi role permissions"""
        self.log("\n=== TESTING SUPERVISEUR_FI PERMISSIONS ===")
        
        token = self.tokens.get('superviseur_fi')
        if not token:
            self.log("❌ No superviseur_fi token available", "ERROR")
            return False
        
        # Test accessing superviseur stats (should work)
        stats_response = self.make_request('GET', '/fi/stats/superviseur?ville=Dijon', token=token)
        if stats_response and stats_response.status_code == 200:
            self.log("✅ Superviseur FI stats endpoint working")
        else:
            self.log("❌ Superviseur FI stats endpoint failed", "ERROR")
            return False
        
        # Test creating secteur (should work)
        secteur_data = {"nom": "Secteur by Superviseur", "ville": "Dijon"}
        create_response = self.make_request('POST', '/fi/secteurs', token=token, json=secteur_data)
        if create_response and create_response.status_code == 200:
            self.log("✅ Superviseur FI can create secteur")
        else:
            self.log("❌ Superviseur FI should be able to create secteur", "ERROR")
            return False
        
        return True
    
    def test_cross_role_access_restrictions(self):
        """Test that roles cannot access each other's specific endpoints"""
        self.log("\n=== TESTING CROSS-ROLE ACCESS RESTRICTIONS ===")
        
        # Test pilote trying to access superviseur stats
        pilote_token = self.tokens.get('pilote_fi')
        if pilote_token:
            response = self.make_request('GET', '/fi/stats/superviseur?ville=Dijon', token=pilote_token)
            if response and response.status_code == 403:
                self.log("✅ Pilote correctly denied superviseur stats access")
            else:
                self.log("❌ Pilote should not access superviseur stats", "ERROR")
                return False
        
        # Test responsable trying to access pilote stats
        responsable_token = self.tokens.get('responsable_secteur')
        if responsable_token:
            response = self.make_request('GET', '/fi/stats/pilote', token=responsable_token)
            if response and response.status_code == 403:
                self.log("✅ Responsable secteur correctly denied pilote stats access")
            else:
                self.log("❌ Responsable secteur should not access pilote stats", "ERROR")
                return False
        
        return True
    
    def run_all_tests(self):
        """Run all role-based tests"""
        self.log("Starting FI Role-Based Access Tests")
        self.log("=" * 50)
        
        if not self.setup_test_environment():
            self.log("❌ Test environment setup failed", "ERROR")
            return False
        
        tests = [
            ("Pilote FI Permissions", self.test_pilote_fi_permissions),
            ("Responsable Secteur Permissions", self.test_responsable_secteur_permissions),
            ("Superviseur FI Permissions", self.test_superviseur_fi_permissions),
            ("Cross-Role Access Restrictions", self.test_cross_role_access_restrictions)
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
        self.log("\n" + "=" * 50)
        self.log("FI ROLE-BASED ACCESS TEST SUMMARY")
        self.log("=" * 50)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{status} {test_name}")
        
        self.log(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 All role-based access tests passed!")
        else:
            self.log(f"⚠️  {total - passed} test(s) failed.")
        
        return results

if __name__ == "__main__":
    tester = FIRoleTester()
    results = tester.run_all_tests()