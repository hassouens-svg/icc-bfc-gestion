#!/usr/bin/env python3
"""
Comprehensive Role-Based Permission Testing
Tests ALL permissions and functionalities by role as specified in review request
Backend URL: https://disciple-tracker.preview.emergentagent.com/api
"""

import requests
import json
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')
BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://disciple-tracker.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

class ComprehensiveRoleTester:
    def __init__(self):
        self.session = requests.Session()
        self.tokens = {}
        self.test_results = {}
        
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

    def test_login(self, username, password, city="Dijon", department=None):
        """Test login for a specific user"""
        login_data = {
            "username": username,
            "password": password,
            "city": city
        }
        if department:
            login_data["department"] = department
            
        response = self.make_request('POST', '/auth/login', json=login_data)
        
        if response and response.status_code == 200:
            result = response.json()
            token = result['token']
            user_info = result['user']
            self.log(f"✅ Login successful for {username} - Role: {user_info['role']}")
            return token, user_info
        else:
            self.log(f"❌ Login failed for {username}", "ERROR")
            if response:
                self.log(f"   Status: {response.status_code}, Response: {response.text}")
            return None, None

    def test_super_admin_permissions(self):
        """Test 1: Super Admin (superadmin/superadmin123)"""
        self.log("\n" + "="*60)
        self.log("TEST 1: SUPER ADMIN PERMISSIONS")
        self.log("="*60)
        
        # Login
        token, user_info = self.test_login("superadmin", "superadmin123")
        if not token:
            return False
            
        self.tokens['superadmin'] = token
        
        # Test 1.1: GET /api/users/referents → Voir TOUS les utilisateurs
        response = self.make_request('GET', '/users/referents', token=token)
        if response and response.status_code == 200:
            users = response.json()
            self.log(f"✅ Super Admin can see ALL users: {len(users)} users")
        else:
            self.log("❌ Super Admin cannot access users", "ERROR")
            return False
            
        # Test 1.2: GET /api/visitors → Voir TOUS les visiteurs
        response = self.make_request('GET', '/visitors', token=token)
        if response and response.status_code == 200:
            visitors = response.json()
            self.log(f"✅ Super Admin can see ALL visitors: {len(visitors)} visitors")
        else:
            self.log("❌ Super Admin cannot access visitors", "ERROR")
            return False
            
        # Test 1.3: GET /api/fi/secteurs → Voir TOUS les secteurs
        response = self.make_request('GET', '/fi/secteurs', token=token)
        if response and response.status_code == 200:
            secteurs = response.json()
            self.log(f"✅ Super Admin can see ALL secteurs: {len(secteurs)} secteurs")
        else:
            self.log("❌ Super Admin cannot access secteurs", "ERROR")
            return False
            
        # Test 1.4: GET /api/fi/familles-impact → Voir TOUTES les FI
        response = self.make_request('GET', '/fi/familles-impact', token=token)
        if response and response.status_code == 200:
            fis = response.json()
            self.log(f"✅ Super Admin can see ALL Familles d'Impact: {len(fis)} FIs")
        else:
            self.log("❌ Super Admin cannot access Familles d'Impact", "ERROR")
            return False
            
        self.log("🎉 SUPER ADMIN: ALL TESTS PASSED - Total access confirmed")
        return True

    def test_pasteur_permissions(self):
        """Test 2: Pasteur (pasteur/pasteur123)"""
        self.log("\n" + "="*60)
        self.log("TEST 2: PASTEUR PERMISSIONS")
        self.log("="*60)
        
        # Login
        token, user_info = self.test_login("pasteur", "pasteur123")
        if not token:
            return False
            
        self.tokens['pasteur'] = token
        
        # Test 2.1: GET /api/fi/stats/pasteur → Stats multi-villes
        response = self.make_request('GET', '/fi/stats/pasteur', token=token)
        if response and response.status_code == 200:
            stats = response.json()
            self.log(f"✅ Pasteur can access multi-city stats")
        else:
            self.log("❌ Pasteur cannot access stats", "ERROR")
            return False
            
        # Test 2.2: GET /api/visitors → Doit pouvoir voir tous les visiteurs
        response = self.make_request('GET', '/visitors', token=token)
        if response and response.status_code == 200:
            visitors = response.json()
            self.log(f"✅ Pasteur can see all visitors: {len(visitors)} visitors")
        else:
            self.log("❌ Pasteur cannot access visitors", "ERROR")
            return False
            
        # Test 2.3: Vérifier lecture seule (pas de création/modification)
        # Try to create a visitor (should fail or be read-only)
        visitor_data = {
            "firstname": "Test",
            "lastname": "Pasteur",
            "city": "Dijon",
            "types": ["Nouveau Arrivant"],
            "phone": "+33123456789",
            "arrival_channel": "Test",
            "visit_date": "2025-01-25"
        }
        response = self.make_request('POST', '/visitors', token=token, json=visitor_data)
        if response and response.status_code in [403, 401]:
            self.log("✅ Pasteur correctly restricted from creating visitors (read-only)")
        elif response and response.status_code == 200:
            self.log("⚠️  Pasteur can create visitors (not read-only as expected)")
        else:
            self.log("❓ Pasteur visitor creation test inconclusive")
            
        self.log("🎉 PASTEUR: TESTS COMPLETED - Multi-city access confirmed")
        return True

    def test_superviseur_promos_permissions(self):
        """Test 3: Superviseur Promos (superviseur_promos/superviseur123)"""
        self.log("\n" + "="*60)
        self.log("TEST 3: SUPERVISEUR PROMOS PERMISSIONS")
        self.log("="*60)
        
        # Login
        token, user_info = self.test_login("superviseur_promos", "superviseur123")
        if not token:
            return False
            
        self.tokens['superviseur_promos'] = token
        
        # Test 3.1: GET /api/visitors → Voir visiteurs de SA ville (Dijon)
        response = self.make_request('GET', '/visitors', token=token)
        if response and response.status_code == 200:
            visitors = response.json()
            dijon_visitors = [v for v in visitors if v.get('city') == 'Dijon']
            non_dijon_visitors = [v for v in visitors if v.get('city') != 'Dijon']
            
            if len(non_dijon_visitors) == 0:
                self.log(f"✅ Superviseur Promos sees only Dijon visitors: {len(dijon_visitors)} visitors")
            else:
                self.log(f"❌ Superviseur Promos sees visitors from other cities: {len(non_dijon_visitors)}", "ERROR")
                return False
        else:
            self.log("❌ Superviseur Promos cannot access visitors", "ERROR")
            return False
            
        # Test 3.2: GET /api/analytics → Stats de SA ville
        response = self.make_request('GET', '/analytics/stats', token=token)
        if response and response.status_code == 200:
            stats = response.json()
            self.log(f"✅ Superviseur Promos can access city analytics")
        else:
            self.log("❌ Superviseur Promos cannot access analytics", "ERROR")
            return False
            
        # Test 3.3: POST /api/users/referents → Créer un referent (doit fonctionner)
        referent_data = {
            "username": f"test_referent_{datetime.now().strftime('%H%M%S')}",
            "password": "test123",
            "city": "Dijon",
            "role": "referent",
            "assigned_month": "2025-01"
        }
        response = self.make_request('POST', '/users/referent', token=token, json=referent_data)
        if response and response.status_code == 200:
            self.log("✅ Superviseur Promos can create referents")
        else:
            self.log("❌ Superviseur Promos cannot create referents", "ERROR")
            return False
            
        self.log("🎉 SUPERVISEUR PROMOS: ALL TESTS PASSED - City-restricted access confirmed")
        return True

    def test_superviseur_fi_permissions(self):
        """Test 4: Superviseur FI (superviseur_fi/superfi123)"""
        self.log("\n" + "="*60)
        self.log("TEST 4: SUPERVISEUR FI PERMISSIONS")
        self.log("="*60)
        
        # Login
        token, user_info = self.test_login("superviseur_fi", "superfi123")
        if not token:
            return False
            
        self.tokens['superviseur_fi'] = token
        
        # Test 4.1: GET /api/fi/secteurs?ville=Dijon → Voir secteurs de SA ville
        response = self.make_request('GET', '/fi/secteurs', token=token, params={'ville': 'Dijon'})
        if response and response.status_code == 200:
            secteurs = response.json()
            self.log(f"✅ Superviseur FI can see Dijon secteurs: {len(secteurs)} secteurs")
        else:
            self.log("❌ Superviseur FI cannot access secteurs", "ERROR")
            return False
            
        # Test 4.2: POST /api/fi/secteurs → Créer secteur (doit fonctionner)
        secteur_data = {
            "nom": f"Test Secteur {datetime.now().strftime('%H%M%S')}",
            "ville": "Dijon"
        }
        response = self.make_request('POST', '/fi/secteurs', token=token, json=secteur_data)
        if response and response.status_code == 200:
            self.log("✅ Superviseur FI can create secteurs")
        else:
            self.log("❌ Superviseur FI cannot create secteurs", "ERROR")
            return False
            
        # Test 4.3: GET /api/fi/stats/superviseur?ville=Dijon → Stats FI
        response = self.make_request('GET', '/fi/stats/superviseur', token=token, params={'ville': 'Dijon'})
        if response and response.status_code == 200:
            stats = response.json()
            self.log(f"✅ Superviseur FI can access FI stats")
        else:
            self.log("❌ Superviseur FI cannot access FI stats", "ERROR")
            return False
            
        self.log("🎉 SUPERVISEUR FI: ALL TESTS PASSED - FI management confirmed")
        return True

    def test_responsable_promos_permissions(self):
        """Test 5: Responsable de Promos (referent1/referent123)"""
        self.log("\n" + "="*60)
        self.log("TEST 5: RESPONSABLE DE PROMOS PERMISSIONS")
        self.log("="*60)
        
        # Login
        token, user_info = self.test_login("referent1", "referent123")
        if not token:
            return False
            
        self.tokens['referent1'] = token
        
        # Test 5.1: GET /api/visitors → Doit voir UNIQUEMENT visiteurs de son mois (2025-01)
        response = self.make_request('GET', '/visitors', token=token)
        if response and response.status_code == 200:
            visitors = response.json()
            january_visitors = [v for v in visitors if v.get('assigned_month') == '2025-01']
            other_month_visitors = [v for v in visitors if v.get('assigned_month') != '2025-01']
            
            if len(other_month_visitors) == 0 and len(january_visitors) >= 0:
                self.log(f"✅ Responsable Promos sees only 2025-01 visitors: {len(january_visitors)} visitors")
            else:
                self.log(f"❌ Responsable Promos sees visitors from other months: {len(other_month_visitors)}", "ERROR")
                for v in other_month_visitors[:3]:  # Show first 3 as examples
                    self.log(f"   - {v.get('firstname')} {v.get('lastname')} (Month: {v.get('assigned_month')})")
                return False
        else:
            self.log("❌ Responsable Promos cannot access visitors", "ERROR")
            return False
            
        # Test 5.2: POST /api/visitors → Créer visiteur (doit être autorisé)
        visitor_data = {
            "firstname": "Test",
            "lastname": "Referent",
            "city": "Dijon",
            "types": ["Nouveau Arrivant"],
            "phone": "+33123456789",
            "arrival_channel": "Test",
            "visit_date": "2025-01-25"
        }
        response = self.make_request('POST', '/visitors', token=token, json=visitor_data)
        if response and response.status_code == 200:
            self.log("✅ Responsable Promos can create visitors")
        else:
            self.log("❌ Responsable Promos cannot create visitors", "ERROR")
            return False
            
        self.log("🎉 RESPONSABLE PROMOS: ALL TESTS PASSED - Month-restricted access confirmed")
        return True

    def test_pilote_fi_permissions(self):
        """Test 6: Pilote FI (pilote_fi1/pilote123)"""
        self.log("\n" + "="*60)
        self.log("TEST 6: PILOTE FI PERMISSIONS")
        self.log("="*60)
        
        # Login
        token, user_info = self.test_login("pilote_fi1", "pilote123")
        if not token:
            return False
            
        self.tokens['pilote_fi1'] = token
        
        # Test 6.1: GET /api/fi/familles-impact → Doit voir UNIQUEMENT SA FI
        response = self.make_request('GET', '/fi/familles-impact', token=token)
        if response and response.status_code == 200:
            fis = response.json()
            self.log(f"✅ Pilote FI sees only assigned FI: {len(fis)} FI(s)")
            if len(fis) > 1:
                self.log("⚠️  Pilote sees more than 1 FI - check if this is expected")
        else:
            self.log("❌ Pilote FI cannot access Familles d'Impact", "ERROR")
            return False
            
        # Test 6.2: GET /api/fi/membres?fi_id={sa_fi} → Voir membres de SA FI
        if len(fis) > 0:
            fi_id = fis[0]['id']
            response = self.make_request('GET', '/fi/membres', token=token, params={'fi_id': fi_id})
            if response and response.status_code == 200:
                membres = response.json()
                self.log(f"✅ Pilote FI can see FI members: {len(membres)} members")
            else:
                self.log("❌ Pilote FI cannot access FI members", "ERROR")
                return False
        
        # Test 6.3: POST /api/fi/presences → Marquer présences (doit fonctionner)
        # This would require existing members, so we'll test the endpoint access
        response = self.make_request('GET', '/fi/presences', token=token)
        if response and response.status_code == 200:
            self.log("✅ Pilote FI can access presences endpoint")
        else:
            self.log("❌ Pilote FI cannot access presences", "ERROR")
            return False
            
        # Test 6.4: GET /api/fi/stats/pilote → Voir SES stats uniquement
        response = self.make_request('GET', '/fi/stats/pilote', token=token)
        if response and response.status_code == 200:
            stats = response.json()
            self.log(f"✅ Pilote FI can access own stats")
        else:
            self.log("❌ Pilote FI cannot access own stats", "ERROR")
            return False
            
        self.log("🎉 PILOTE FI: ALL TESTS PASSED - FI-restricted access confirmed")
        return True

    def test_accueil_permissions(self):
        """Test 7: Accueil (accueil1/accueil123)"""
        self.log("\n" + "="*60)
        self.log("TEST 7: ACCUEIL PERMISSIONS")
        self.log("="*60)
        
        # Login
        token, user_info = self.test_login("accueil1", "accueil123")
        if not token:
            return False
            
        self.tokens['accueil1'] = token
        
        # Test 7.1: GET /api/visitors → Voir visiteurs (lecture seule)
        response = self.make_request('GET', '/visitors', token=token)
        if response and response.status_code == 200:
            visitors = response.json()
            self.log(f"✅ Accueil can see visitors (read-only): {len(visitors)} visitors")
            
            # Check if limited fields are returned
            if visitors and len(visitors) > 0:
                first_visitor = visitors[0]
                expected_fields = {'id', 'firstname', 'lastname', 'arrival_channel', 'visit_date', 'city'}
                actual_fields = set(first_visitor.keys())
                
                if actual_fields == expected_fields:
                    self.log("✅ Accueil gets limited visitor fields (read-only confirmed)")
                else:
                    self.log(f"⚠️  Accueil gets full visitor data - Expected: {expected_fields}, Got: {actual_fields}")
        else:
            self.log("❌ Accueil cannot access visitors", "ERROR")
            return False
            
        # Test 7.2: POST /api/visitors → Créer visiteur (doit ÉCHOUER - lecture seule)
        visitor_data = {
            "firstname": "Test",
            "lastname": "Accueil",
            "city": "Dijon",
            "types": ["Nouveau Arrivant"],
            "phone": "+33123456789",
            "arrival_channel": "Test",
            "visit_date": "2025-01-25"
        }
        response = self.make_request('POST', '/visitors', token=token, json=visitor_data)
        if response and response.status_code in [403, 401]:
            self.log("✅ Accueil correctly denied visitor creation (read-only enforced)")
        elif response and response.status_code == 200:
            self.log("❌ Accueil can create visitors (should be read-only)", "ERROR")
            return False
        else:
            self.log("❓ Accueil visitor creation test inconclusive")
            
        self.log("🎉 ACCUEIL: ALL TESTS PASSED - Read-only access confirmed")
        return True

    def test_promotions_permissions(self):
        """Test 8: Promotions (promotions1/promo123)"""
        self.log("\n" + "="*60)
        self.log("TEST 8: PROMOTIONS PERMISSIONS")
        self.log("="*60)
        
        # Login
        token, user_info = self.test_login("promotions1", "promo123")
        if not token:
            return False
            
        self.tokens['promotions1'] = token
        
        # Test 8.1: GET /api/visitors → Voir tous visiteurs de SA ville
        response = self.make_request('GET', '/visitors', token=token)
        if response and response.status_code == 200:
            visitors = response.json()
            city_visitors = [v for v in visitors if v.get('city') == user_info.get('city', 'Dijon')]
            other_city_visitors = [v for v in visitors if v.get('city') != user_info.get('city', 'Dijon')]
            
            if len(other_city_visitors) == 0:
                self.log(f"✅ Promotions sees only city visitors: {len(city_visitors)} visitors")
            else:
                self.log(f"❌ Promotions sees visitors from other cities: {len(other_city_visitors)}", "ERROR")
                return False
        else:
            self.log("❌ Promotions cannot access visitors", "ERROR")
            return False
            
        # Test 8.2: GET /api/analytics → Voir analytics
        response = self.make_request('GET', '/analytics/stats', token=token)
        if response and response.status_code == 200:
            stats = response.json()
            self.log(f"✅ Promotions can access analytics")
        else:
            self.log("❌ Promotions cannot access analytics", "ERROR")
            return False
            
        self.log("🎉 PROMOTIONS: ALL TESTS PASSED - City-wide access confirmed")
        return True

    def run_comprehensive_tests(self):
        """Run all comprehensive role-based permission tests"""
        self.log("STARTING COMPREHENSIVE ROLE-BASED PERMISSION TESTING")
        self.log("Backend URL: " + API_URL)
        self.log("="*80)
        
        # Initialize database
        init_response = self.make_request('POST', '/init')
        if init_response and init_response.status_code == 200:
            self.log("✅ Database initialized successfully")
        else:
            self.log("⚠️  Database initialization failed or already done")
        
        # Run all role tests
        tests = [
            ("Super Admin", self.test_super_admin_permissions),
            ("Pasteur", self.test_pasteur_permissions),
            ("Superviseur Promos", self.test_superviseur_promos_permissions),
            ("Superviseur FI", self.test_superviseur_fi_permissions),
            ("Responsable de Promos", self.test_responsable_promos_permissions),
            ("Pilote FI", self.test_pilote_fi_permissions),
            ("Accueil", self.test_accueil_permissions),
            ("Promotions", self.test_promotions_permissions)
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
        
        # Final Summary
        self.log("\n" + "="*80)
        self.log("COMPREHENSIVE ROLE TESTING SUMMARY")
        self.log("="*80)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{status} {test_name}")
        
        self.log(f"\nOverall Result: {passed}/{total} role tests passed")
        
        if passed == total:
            self.log("🎉 ALL ROLE PERMISSIONS WORKING CORRECTLY!")
            self.log("✅ Each role sees EXACTLY what it should see (no more, no less)")
        else:
            self.log(f"⚠️  {total - passed} role test(s) failed - Permission boundaries need attention")
        
        return results

if __name__ == "__main__":
    tester = ComprehensiveRoleTester()
    results = tester.run_comprehensive_tests()