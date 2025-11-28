#!/usr/bin/env python3
"""
Backend API Testing for Church Visitor Management System
Tests nouvelles fonctionnalités as requested in French review
"""

import requests
import json
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')
BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://church-event-hub.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

class NouvelleFonctionnalitesTester:
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

    def test_1_kpis_formations(self):
        """Test 1: KPIs Formations - Login avec superadmin et vérifier GET /api/analytics/stats"""
        self.log("\n=== TEST 1: KPIs Formations ===")
        
        # Login avec superadmin / superadmin123
        login_data = {
            "username": "superadmin",
            "password": "superadmin123",
            "city": "Dijon"
        }
        
        login_response = self.make_request('POST', '/auth/login', json=login_data)
        if not login_response or login_response.status_code != 200:
            self.log("❌ Failed to login as superadmin", "ERROR")
            return False
        
        token = login_response.json()['token']
        self.tokens['superadmin'] = token
        self.log("✅ Logged in as superadmin")
        
        # GET /api/analytics/stats
        stats_response = self.make_request('GET', '/analytics/stats', token=token)
        
        if not stats_response or stats_response.status_code != 200:
            self.log(f"❌ Failed to get analytics stats - Status: {stats_response.status_code if stats_response else 'None'}", "ERROR")
            if stats_response:
                self.log(f"   Error: {stats_response.text}")
            return False
        
        stats = stats_response.json()
        self.log("✅ Analytics stats retrieved successfully")
        
        # Vérifier que la réponse contient les KPIs formations
        required_fields = ['formation_pcnc', 'formation_au_coeur_bible', 'formation_star']
        missing_fields = []
        
        for field in required_fields:
            if field not in stats:
                missing_fields.append(field)
            else:
                value = stats[field]
                if isinstance(value, (int, float)):
                    self.log(f"✅ {field}: {value}")
                else:
                    self.log(f"❌ {field}: {value} (not a number)", "ERROR")
                    missing_fields.append(field)
        
        if not missing_fields:
            self.log("✅ All formation KPIs present and are numbers")
            return True
        else:
            self.log(f"❌ Missing or invalid formation KPIs: {missing_fields}", "ERROR")
            return False

    def test_2_update_visitor_formations(self):
        """Test 2: Update Visitor avec formations - Login promotions et tester PUT /api/visitors/{visitor_id}"""
        self.log("\n=== TEST 2: Update Visitor avec formations ===")
        
        # Login avec promotions / test123
        login_data = {
            "username": "promotions",
            "password": "test123",
            "city": "Dijon"
        }
        
        login_response = self.make_request('POST', '/auth/login', json=login_data)
        if not login_response or login_response.status_code != 200:
            self.log("❌ Failed to login as promotions", "ERROR")
            return False
        
        token = login_response.json()['token']
        self.tokens['promotions'] = token
        self.log("✅ Logged in as promotions")
        
        # Récupérer un visiteur existant
        visitors_response = self.make_request('GET', '/visitors', token=token)
        if not visitors_response or visitors_response.status_code != 200:
            self.log("❌ Failed to get visitors", "ERROR")
            return False
        
        visitors = visitors_response.json()
        if not visitors:
            # Créer un visiteur de test si aucun n'existe
            visitor_data = {
                "firstname": "Test",
                "lastname": "Formation",
                "city": "Dijon",
                "types": ["Nouveau Arrivant"],
                "phone": "+33123456789",
                "email": "test.formation@example.com",
                "arrival_channel": "Test",
                "visit_date": "2025-01-15"
            }
            
            create_response = self.make_request('POST', '/visitors', token=token, json=visitor_data)
            if not create_response or create_response.status_code != 200:
                self.log("❌ Failed to create test visitor", "ERROR")
                return False
            
            visitor_id = create_response.json()['id']
            self.log(f"✅ Created test visitor: {visitor_id}")
        else:
            visitor_id = visitors[0]['id']
            self.log(f"✅ Using existing visitor: {visitor_id}")
        
        # PUT /api/visitors/{visitor_id} avec formations
        update_data = {
            "firstname": "Test",
            "formation_pcnc": True,
            "formation_au_coeur_bible": True,
            "formation_star": False
        }
        
        self.log("Updating visitor with formation data:")
        for key, value in update_data.items():
            self.log(f"   {key}: {value}")
        
        update_response = self.make_request('PUT', f'/visitors/{visitor_id}', token=token, json=update_data)
        
        if not update_response or update_response.status_code != 200:
            self.log(f"❌ Failed to update visitor - Status: {update_response.status_code if update_response else 'None'}", "ERROR")
            if update_response:
                self.log(f"   Error: {update_response.text}")
            return False
        
        self.log("✅ Visitor updated successfully (Status 200)")
        
        # GET /api/visitors/{visitor_id} pour confirmer
        get_response = self.make_request('GET', f'/visitors/{visitor_id}', token=token)
        
        if not get_response or get_response.status_code != 200:
            self.log("❌ Failed to retrieve updated visitor", "ERROR")
            return False
        
        updated_visitor = get_response.json()
        
        # Vérifier les formations
        formation_checks = [
            ('formation_pcnc', True),
            ('formation_au_coeur_bible', True),
            ('formation_star', False)
        ]
        
        all_correct = True
        for field, expected in formation_checks:
            actual = updated_visitor.get(field)
            if actual == expected:
                self.log(f"✅ {field}: {actual} (correct)")
            else:
                self.log(f"❌ {field}: {actual} (expected {expected})", "ERROR")
                all_correct = False
        
        if all_correct:
            self.log("✅ All formation fields correctly updated and persisted")
            self.test_data['visitor_id'] = visitor_id
            return True
        else:
            self.log("❌ Formation fields not correctly updated", "ERROR")
            return False

    def test_3_renommer_promo(self):
        """Test 3: Renommer une promo - Login promotions et tester PUT /api/users/{user_id}"""
        self.log("\n=== TEST 3: Renommer une promo ===")
        
        # Utiliser le token promotions du test précédent
        token = self.tokens.get('promotions')
        if not token:
            self.log("❌ No promotions token available", "ERROR")
            return False
        
        # Récupérer l'ID de l'utilisateur promotions
        # D'abord, obtenir les informations de l'utilisateur connecté via le token
        # On peut utiliser l'endpoint users/referents pour trouver l'utilisateur promotions
        users_response = self.make_request('GET', '/users/referents', token=token)
        if not users_response or users_response.status_code != 200:
            self.log("❌ Failed to get users list", "ERROR")
            return False
        
        users = users_response.json()
        promotions_user = None
        
        for user in users:
            if user.get('username') == 'promotions' and user.get('city') == 'Dijon':
                promotions_user = user
                break
        
        if not promotions_user:
            self.log("❌ Promotions user not found", "ERROR")
            return False
        
        user_id = promotions_user['id']
        self.log(f"✅ Found promotions user ID: {user_id}")
        
        # PUT /api/users/{user_id} avec promo_name
        update_data = {
            "promo_name": "Promo Excellence"
        }
        
        self.log("Updating user with promo_name:")
        for key, value in update_data.items():
            self.log(f"   {key}: {value}")
        
        update_response = self.make_request('PUT', f'/users/{user_id}', token=token, json=update_data)
        
        if not update_response or update_response.status_code != 200:
            self.log(f"❌ Failed to update user - Status: {update_response.status_code if update_response else 'None'}", "ERROR")
            if update_response:
                self.log(f"   Error: {update_response.text}")
            return False
        
        self.log("✅ User updated successfully (Status 200)")
        
        # GET /api/users/{user_id} pour confirmer (via users/referents)
        users_response = self.make_request('GET', '/users/referents', token=token)
        if not users_response or users_response.status_code != 200:
            self.log("❌ Failed to retrieve updated user", "ERROR")
            return False
        
        users = users_response.json()
        updated_user = None
        
        for user in users:
            if user.get('id') == user_id:
                updated_user = user
                break
        
        if not updated_user:
            self.log("❌ Updated user not found", "ERROR")
            return False
        
        # Vérifier que promo_name est "Promo Excellence"
        actual_promo_name = updated_user.get('promo_name')
        expected_promo_name = "Promo Excellence"
        
        if actual_promo_name == expected_promo_name:
            self.log(f"✅ promo_name correctly updated: {actual_promo_name}")
            self.test_data['promotions_user_id'] = user_id
            return True
        else:
            self.log(f"❌ promo_name not correctly updated. Expected: {expected_promo_name}, Got: {actual_promo_name}", "ERROR")
            return False

    def test_4_super_admin_renommer_promo(self):
        """Test 4: Super admin peut renommer n'importe quelle promo"""
        self.log("\n=== TEST 4: Super admin peut renommer n'importe quelle promo ===")
        
        # Utiliser le token superadmin du test 1
        token = self.tokens.get('superadmin')
        if not token:
            self.log("❌ No superadmin token available", "ERROR")
            return False
        
        # Trouver un autre utilisateur (pas le promotions du test précédent)
        users_response = self.make_request('GET', '/users/referents', token=token)
        if not users_response or users_response.status_code != 200:
            self.log("❌ Failed to get users list", "ERROR")
            return False
        
        users = users_response.json()
        promotions_user_id = self.test_data.get('promotions_user_id')
        
        # Trouver un autre utilisateur
        autre_user = None
        for user in users:
            if user.get('id') != promotions_user_id and user.get('role') in ['referent', 'promotions', 'accueil']:
                autre_user = user
                break
        
        if not autre_user:
            # Créer un utilisateur de test si nécessaire
            test_user_data = {
                "username": "test_referent_promo",
                "password": "test123",
                "city": "Dijon",
                "role": "referent",
                "assigned_month": "2025-02"
            }
            
            create_response = self.make_request('POST', '/users', token=token, json=test_user_data)
            if not create_response or create_response.status_code != 200:
                self.log("❌ Failed to create test user", "ERROR")
                return False
            
            autre_user_id = create_response.json()['id']
            self.log(f"✅ Created test user: {autre_user_id}")
        else:
            autre_user_id = autre_user['id']
            self.log(f"✅ Using existing user: {autre_user_id} ({autre_user.get('username')})")
        
        # PUT /api/users/{autre_user_id} avec promo_name
        update_data = {
            "promo_name": "Novembre Stars"
        }
        
        self.log("Super admin updating another user's promo_name:")
        for key, value in update_data.items():
            self.log(f"   {key}: {value}")
        
        update_response = self.make_request('PUT', f'/users/{autre_user_id}', token=token, json=update_data)
        
        if not update_response or update_response.status_code != 200:
            self.log(f"❌ Failed to update user - Status: {update_response.status_code if update_response else 'None'}", "ERROR")
            if update_response:
                self.log(f"   Error: {update_response.text}")
            return False
        
        self.log("✅ Super admin successfully updated another user's promo_name (Status 200)")
        
        # Vérifier la mise à jour
        users_response = self.make_request('GET', '/users/referents', token=token)
        if not users_response or users_response.status_code != 200:
            self.log("❌ Failed to retrieve updated users", "ERROR")
            return False
        
        users = users_response.json()
        updated_user = None
        
        for user in users:
            if user.get('id') == autre_user_id:
                updated_user = user
                break
        
        if not updated_user:
            self.log("❌ Updated user not found", "ERROR")
            return False
        
        # Vérifier que promo_name est "Novembre Stars"
        actual_promo_name = updated_user.get('promo_name')
        expected_promo_name = "Novembre Stars"
        
        if actual_promo_name == expected_promo_name:
            self.log(f"✅ Super admin successfully renamed promo: {actual_promo_name}")
            return True
        else:
            self.log(f"❌ promo_name not correctly updated. Expected: {expected_promo_name}, Got: {actual_promo_name}", "ERROR")
            return False

    def run_all_tests(self):
        """Run all nouvelles fonctionnalités tests"""
        self.log("Starting Backend API Tests for Nouvelles Fonctionnalités")
        self.log("=" * 70)
        
        # Initialize database
        init_response = self.make_request('POST', '/init')
        if init_response and init_response.status_code == 200:
            self.log("✅ Database initialized")
        
        # Run tests in order
        tests = [
            ("Test 1: KPIs Formations", self.test_1_kpis_formations),
            ("Test 2: Update Visitor avec formations", self.test_2_update_visitor_formations),
            ("Test 3: Renommer une promo", self.test_3_renommer_promo),
            ("Test 4: Super admin peut renommer n'importe quelle promo", self.test_4_super_admin_renommer_promo)
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
        self.log("TEST SUMMARY - NOUVELLES FONCTIONNALITÉS")
        self.log("=" * 70)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{status} {test_name}")
        
        self.log(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 All nouvelles fonctionnalités tests passed!")
        else:
            self.log(f"⚠️  {total - passed} test(s) failed. Issues need to be addressed.")
        
        return results

if __name__ == "__main__":
    tester = NouvelleFonctionnalitesTester()
    results = tester.run_all_tests()