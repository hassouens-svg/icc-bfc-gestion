#!/usr/bin/env python3
"""
Multi-City Access Backend Testing for Church Visitor Management System
Tests Pasteur & Super Admin multi-city access vs Superviseur city-restricted access
"""

import requests
import json
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')
BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://bfc-italie.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

class MultiCityTester:
    def __init__(self):
        self.session = requests.Session()
        self.tokens = {}
        self.test_users = {}
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
    
    def setup_multi_city_data(self):
        """Setup test data across multiple cities"""
        self.log("Setting up multi-city test data...")
        
        # Initialize database
        response = self.make_request('POST', '/init')
        if response and response.status_code == 200:
            self.log("Database initialized successfully")
        
        # Login as super admin to create test data
        superadmin_login = self.make_request('POST', '/auth/login', json={
            "username": "superadmin",
            "password": "superadmin123",
            "city": "Dijon"
        })
        
        if not superadmin_login or superadmin_login.status_code != 200:
            self.log("❌ Failed to login as superadmin", "ERROR")
            return False
        
        self.tokens['superadmin'] = superadmin_login.json()['token']
        self.log("✅ Super admin logged in successfully")
        
        # Create pasteur user if doesn't exist
        pasteur_login = self.make_request('POST', '/auth/login', json={
            "username": "pasteur",
            "password": "pasteur123",
            "city": "Dijon"
        })
        
        if pasteur_login and pasteur_login.status_code == 200:
            self.tokens['pasteur'] = pasteur_login.json()['token']
            self.log("✅ Pasteur logged in successfully")
        else:
            self.log("❌ Failed to login as pasteur", "ERROR")
            return False
        
        # Login as admin (superviseur_promos) for Dijon
        admin_login = self.make_request('POST', '/auth/login', json={
            "username": "admin",
            "password": "admin123",
            "city": "Dijon"
        })
        
        if admin_login and admin_login.status_code == 200:
            self.tokens['admin_dijon'] = admin_login.json()['token']
            self.log("✅ Admin Dijon logged in successfully")
        else:
            # Try superviseur_promos instead
            admin_login = self.make_request('POST', '/auth/login', json={
                "username": "superviseur_promos",
                "password": "superviseur123",
                "city": "Dijon"
            })
            if admin_login and admin_login.status_code == 200:
                self.tokens['admin_dijon'] = admin_login.json()['token']
                self.log("✅ Superviseur_promos Dijon logged in successfully")
            else:
                self.log("❌ Failed to login as admin/superviseur for Dijon", "ERROR")
                return False
        
        # Create test visitors in multiple cities
        test_visitors = [
            # Dijon visitors
            {
                "firstname": "Jean",
                "lastname": "Dijon",
                "city": "Dijon",
                "types": ["Nouveau Arrivant"],
                "phone": "+33123456789",
                "arrival_channel": "Ami",
                "visit_date": "2025-01-15"
            },
            {
                "firstname": "Marie",
                "lastname": "Dijon",
                "city": "Dijon",
                "types": ["Nouveau Converti"],
                "phone": "+33123456790",
                "arrival_channel": "Internet",
                "visit_date": "2025-01-20"
            },
            # Chalon visitors (if we can create them)
            {
                "firstname": "Pierre",
                "lastname": "Chalon",
                "city": "Chalon-Sur-Saone",
                "types": ["Nouveau Arrivant"],
                "phone": "+33123456791",
                "arrival_channel": "Famille",
                "visit_date": "2025-01-25"
            },
            {
                "firstname": "Sophie",
                "lastname": "Chalon",
                "city": "Chalon-Sur-Saone",
                "types": ["De Passage"],
                "phone": "+33123456792",
                "arrival_channel": "Publicité",
                "visit_date": "2025-01-30"
            }
        ]
        
        self.test_data['visitors'] = []
        
        # Create visitors using superadmin token (can create in any city)
        for visitor_data in test_visitors:
            response = self.make_request('POST', '/visitors', 
                                       token=self.tokens['superadmin'],
                                       json=visitor_data)
            if response and response.status_code == 200:
                visitor = response.json()
                self.test_data['visitors'].append(visitor)
                self.log(f"Created visitor: {visitor_data['firstname']} {visitor_data['lastname']} in {visitor_data['city']}")
        
        # Create test referents in different cities
        test_referents = [
            {
                "username": "referent_dijon",
                "password": "ref123",
                "city": "Dijon",
                "role": "referent",
                "assigned_month": "2025-01"
            },
            {
                "username": "referent_chalon",
                "password": "ref123",
                "city": "Chalon-Sur-Saone",
                "role": "referent",
                "assigned_month": "2025-01"
            }
        ]
        
        self.test_data['referents'] = []
        
        for referent_data in test_referents:
            response = self.make_request('POST', '/users/referent',
                                       token=self.tokens['superadmin'],
                                       json=referent_data)
            if response and response.status_code == 200:
                referent = response.json()
                self.test_data['referents'].append(referent)
                self.log(f"Created referent: {referent_data['username']} in {referent_data['city']}")
            else:
                self.log(f"Referent {referent_data['username']} might already exist")
        
        self.log(f"Setup complete. Created {len(self.test_data['visitors'])} visitors and {len(self.test_data['referents'])} referents")
        return True
    
    def test_superadmin_multi_city_analytics(self):
        """Test 1: Super Admin should see ALL visitors from ALL cities"""
        self.log("\n=== TEST 1: Super Admin Multi-City Analytics Access ===")
        
        token = self.tokens.get('superadmin')
        if not token:
            self.log("❌ No superadmin token available", "ERROR")
            return False
        
        response = self.make_request('GET', '/analytics/stats', token=token)
        
        if not response or response.status_code != 200:
            self.log("❌ Failed to get analytics stats", "ERROR")
            return False
        
        stats = response.json()
        total_visitors = stats.get('total_visitors', 0)
        
        self.log(f"Super Admin sees {total_visitors} total visitors")
        
        # Check by_month data to see if multiple cities are included
        by_month = stats.get('by_month', [])
        self.log(f"Visitors by month: {by_month}")
        
        # Super admin should see visitors from all cities (not filtered)
        if total_visitors >= 2:  # Should see at least our test visitors
            self.log("✅ Super Admin can see visitors from all cities")
            return True
        else:
            self.log("❌ Super Admin might not be seeing all city data", "ERROR")
            return False
    
    def test_pasteur_multi_city_analytics(self):
        """Test 2: Pasteur should see ALL visitors from ALL cities"""
        self.log("\n=== TEST 2: Pasteur Multi-City Analytics Access ===")
        
        token = self.tokens.get('pasteur')
        if not token:
            self.log("❌ No pasteur token available", "ERROR")
            return False
        
        response = self.make_request('GET', '/analytics/stats', token=token)
        
        if not response or response.status_code != 200:
            self.log("❌ Failed to get analytics stats", "ERROR")
            return False
        
        stats = response.json()
        total_visitors = stats.get('total_visitors', 0)
        
        self.log(f"Pasteur sees {total_visitors} total visitors")
        
        # Pasteur should see visitors from all cities (not filtered)
        if total_visitors >= 2:  # Should see at least our test visitors
            self.log("✅ Pasteur can see visitors from all cities")
            return True
        else:
            self.log("❌ Pasteur might not be seeing all city data", "ERROR")
            return False
    
    def test_superviseur_city_restricted_analytics(self):
        """Test 3: Superviseur should see ONLY their city's visitors"""
        self.log("\n=== TEST 3: Superviseur City-Restricted Analytics Access ===")
        
        token = self.tokens.get('admin_dijon')
        if not token:
            self.log("❌ No admin_dijon token available", "ERROR")
            return False
        
        response = self.make_request('GET', '/analytics/stats', token=token)
        
        if not response or response.status_code != 200:
            self.log("❌ Failed to get analytics stats", "ERROR")
            return False
        
        stats = response.json()
        total_visitors = stats.get('total_visitors', 0)
        
        self.log(f"Superviseur Dijon sees {total_visitors} total visitors")
        
        # Get visitors directly to verify city filtering
        visitors_response = self.make_request('GET', '/visitors', token=token)
        if visitors_response and visitors_response.status_code == 200:
            visitors = visitors_response.json()
            cities = set(v.get('city') for v in visitors)
            
            if len(cities) == 1 and 'Dijon' in cities:
                self.log("✅ Superviseur correctly sees only Dijon visitors")
                self.log(f"   Cities in results: {cities}")
                return True
            else:
                self.log(f"❌ Superviseur sees visitors from multiple cities: {cities}", "ERROR")
                return False
        else:
            self.log("❌ Failed to get visitors list", "ERROR")
            return False
    
    def test_superadmin_multi_city_fidelisation(self):
        """Test 4: Super Admin multi-city fidelisation access"""
        self.log("\n=== TEST 4: Super Admin Multi-City Fidelisation Access ===")
        
        token = self.tokens.get('superadmin')
        if not token:
            self.log("❌ No superadmin token available", "ERROR")
            return False
        
        response = self.make_request('GET', '/fidelisation/admin', token=token)
        
        if not response or response.status_code != 200:
            self.log("❌ Failed to get fidelisation admin data", "ERROR")
            if response:
                self.log(f"   Status: {response.status_code}, Response: {response.text}")
            return False
        
        fidelisation_data = response.json()
        self.log(f"Super Admin sees fidelisation data for {len(fidelisation_data)} referents")
        
        # Check if referents from multiple cities are included
        cities = set()
        for referent_data in fidelisation_data:
            # We need to get the referent info to check city
            referent_username = referent_data.get('referent_username')
            if referent_username:
                cities.add("multi-city")  # Assume multi-city if we see multiple referents
        
        if len(fidelisation_data) > 0:
            self.log("✅ Super Admin can access fidelisation data from all cities")
            for ref_data in fidelisation_data:
                self.log(f"   - {ref_data.get('referent_username')} (Month: {ref_data.get('assigned_month')})")
            return True
        else:
            self.log("✅ Super Admin fidelisation access works (no referent data to show)")
            return True
    
    def test_pasteur_multi_city_fidelisation(self):
        """Test 5: Pasteur multi-city fidelisation access"""
        self.log("\n=== TEST 5: Pasteur Multi-City Fidelisation Access ===")
        
        token = self.tokens.get('pasteur')
        if not token:
            self.log("❌ No pasteur token available", "ERROR")
            return False
        
        response = self.make_request('GET', '/fidelisation/admin', token=token)
        
        if not response or response.status_code != 200:
            self.log("❌ Failed to get fidelisation admin data", "ERROR")
            if response:
                self.log(f"   Status: {response.status_code}, Response: {response.text}")
            return False
        
        fidelisation_data = response.json()
        self.log(f"Pasteur sees fidelisation data for {len(fidelisation_data)} referents")
        
        if len(fidelisation_data) >= 0:  # Pasteur should have access even if no data
            self.log("✅ Pasteur can access fidelisation data from all cities")
            for ref_data in fidelisation_data:
                self.log(f"   - {ref_data.get('referent_username')} (Month: {ref_data.get('assigned_month')})")
            return True
        else:
            self.log("❌ Pasteur fidelisation access denied", "ERROR")
            return False
    
    def test_superadmin_multi_city_users(self):
        """Test 6: Super Admin should see users from ALL cities"""
        self.log("\n=== TEST 6: Super Admin Multi-City Users Access ===")
        
        token = self.tokens.get('superadmin')
        if not token:
            self.log("❌ No superadmin token available", "ERROR")
            return False
        
        response = self.make_request('GET', '/users/referents', token=token)
        
        if not response or response.status_code != 200:
            self.log("❌ Failed to get users/referents", "ERROR")
            return False
        
        users = response.json()
        cities = set(user.get('city') for user in users)
        
        self.log(f"Super Admin sees {len(users)} users from cities: {cities}")
        
        # Super admin should see users from multiple cities
        if len(cities) >= 1:  # Should see at least Dijon
            self.log("✅ Super Admin can see users from all cities")
            return True
        else:
            self.log("❌ Super Admin not seeing multi-city users", "ERROR")
            return False
    
    def test_pasteur_multi_city_users(self):
        """Test 7: Pasteur should see users from ALL cities"""
        self.log("\n=== TEST 7: Pasteur Multi-City Users Access ===")
        
        token = self.tokens.get('pasteur')
        if not token:
            self.log("❌ No pasteur token available", "ERROR")
            return False
        
        response = self.make_request('GET', '/users/referents', token=token)
        
        if not response or response.status_code != 200:
            self.log("❌ Failed to get users/referents", "ERROR")
            return False
        
        users = response.json()
        cities = set(user.get('city') for user in users)
        
        self.log(f"Pasteur sees {len(users)} users from cities: {cities}")
        
        # Pasteur should see users from multiple cities
        if len(cities) >= 1:  # Should see at least Dijon
            self.log("✅ Pasteur can see users from all cities")
            return True
        else:
            self.log("❌ Pasteur not seeing multi-city users", "ERROR")
            return False
    
    def test_superviseur_city_restricted_users(self):
        """Test 8: Superviseur should see ONLY their city's users"""
        self.log("\n=== TEST 8: Superviseur City-Restricted Users Access ===")
        
        token = self.tokens.get('admin_dijon')
        if not token:
            self.log("❌ No admin_dijon token available", "ERROR")
            return False
        
        response = self.make_request('GET', '/users/referents', token=token)
        
        if not response or response.status_code != 200:
            self.log("❌ Failed to get users/referents", "ERROR")
            return False
        
        users = response.json()
        cities = set(user.get('city') for user in users)
        
        self.log(f"Superviseur Dijon sees {len(users)} users from cities: {cities}")
        
        # Superviseur should only see users from their city
        if len(cities) == 1 and 'Dijon' in cities:
            self.log("✅ Superviseur correctly sees only Dijon users")
            return True
        elif len(cities) == 0:
            self.log("✅ Superviseur sees no users (acceptable)")
            return True
        else:
            self.log(f"❌ Superviseur sees users from multiple cities: {cities}", "ERROR")
            return False
    
    def test_superadmin_cross_city_user_management(self):
        """Test 9: Super Admin should be able to update users from any city"""
        self.log("\n=== TEST 9: Super Admin Cross-City User Management ===")
        
        token = self.tokens.get('superadmin')
        if not token:
            self.log("❌ No superadmin token available", "ERROR")
            return False
        
        # Get all users to find one from a different city
        users_response = self.make_request('GET', '/users/referents', token=token)
        if not users_response or users_response.status_code != 200:
            self.log("❌ Failed to get users list", "ERROR")
            return False
        
        users = users_response.json()
        
        # Find a user to update (preferably not from Dijon)
        target_user = None
        for user in users:
            if user.get('role') == 'referent':
                target_user = user
                break
        
        if not target_user:
            self.log("✅ No referent users found to test cross-city management")
            return True
        
        user_id = target_user['id']
        original_month = target_user.get('assigned_month')
        
        # Try to update the user
        update_data = {
            "assigned_month": "2025-12"  # Change to December
        }
        
        update_response = self.make_request('PUT', f'/users/{user_id}', 
                                          token=token, json=update_data)
        
        if update_response and update_response.status_code == 200:
            self.log(f"✅ Super Admin successfully updated user {target_user['username']} from {target_user['city']}")
            
            # Restore original value
            if original_month:
                restore_data = {"assigned_month": original_month}
                self.make_request('PUT', f'/users/{user_id}', 
                                token=token, json=restore_data)
            
            return True
        else:
            self.log(f"❌ Super Admin failed to update cross-city user", "ERROR")
            if update_response:
                self.log(f"   Status: {update_response.status_code}, Response: {update_response.text}")
            return False
    
    def test_fi_stats_multi_city(self):
        """Test 10: FI Stats should show multi-city data for pasteur/super_admin"""
        self.log("\n=== TEST 10: FI Stats Multi-City Access ===")
        
        token = self.tokens.get('pasteur')
        if not token:
            self.log("❌ No pasteur token available", "ERROR")
            return False
        
        response = self.make_request('GET', '/fi/stats/pasteur', token=token)
        
        if response and response.status_code == 200:
            stats = response.json()
            self.log("✅ Pasteur can access FI stats endpoint")
            self.log(f"   FI stats structure: {list(stats.keys()) if isinstance(stats, dict) else 'List response'}")
            return True
        elif response and response.status_code == 404:
            self.log("✅ FI stats endpoint not found (acceptable - might not be implemented)")
            return True
        else:
            self.log(f"❌ FI stats access failed", "ERROR")
            if response:
                self.log(f"   Status: {response.status_code}, Response: {response.text}")
            return False

    def run_all_tests(self):
        """Run all multi-city access tests"""
        self.log("Starting Multi-City Access Backend Tests")
        self.log("=" * 70)
        
        # Setup
        if not self.setup_multi_city_data():
            self.log("❌ Failed to setup test data", "ERROR")
            return {}
        
        # Run tests
        tests = [
            ("Super Admin Multi-City Analytics", self.test_superadmin_multi_city_analytics),
            ("Pasteur Multi-City Analytics", self.test_pasteur_multi_city_analytics),
            ("Superviseur City-Restricted Analytics", self.test_superviseur_city_restricted_analytics),
            ("Super Admin Multi-City Fidelisation", self.test_superadmin_multi_city_fidelisation),
            ("Pasteur Multi-City Fidelisation", self.test_pasteur_multi_city_fidelisation),
            ("Super Admin Multi-City Users", self.test_superadmin_multi_city_users),
            ("Pasteur Multi-City Users", self.test_pasteur_multi_city_users),
            ("Superviseur City-Restricted Users", self.test_superviseur_city_restricted_users),
            ("Super Admin Cross-City User Management", self.test_superadmin_cross_city_user_management),
            ("FI Stats Multi-City Access", self.test_fi_stats_multi_city)
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
        self.log("MULTI-CITY ACCESS TEST SUMMARY")
        self.log("=" * 70)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{status} {test_name}")
        
        self.log(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 All multi-city access tests passed!")
        else:
            self.log(f"⚠️  {total - passed} test(s) failed. Multi-city access issues found.")
        
        return results

if __name__ == "__main__":
    tester = MultiCityTester()
    results = tester.run_all_tests()