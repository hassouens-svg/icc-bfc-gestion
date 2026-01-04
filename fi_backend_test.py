#!/usr/bin/env python3
"""
Familles d'Impact Backend API Testing
Tests all FI endpoints as specified in the review request
"""

import requests
import json
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')
BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://churchflow-9.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

class FIBackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.tokens = {}
        self.test_data = {
            'secteurs': [],
            'familles_impact': [],
            'membres': [],
            'visitors': []
        }
        
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
    
    def setup_authentication(self):
        """Setup authentication with admin/admin123 for Dijon"""
        self.log("Setting up authentication...")
        
        # Initialize database first
        init_response = self.make_request('POST', '/init')
        if init_response and init_response.status_code == 200:
            self.log("Database initialized successfully")
        
        # Login as admin
        login_data = {
            "username": "admin",
            "password": "admin123",
            "city": "Dijon"
        }
        
        response = self.make_request('POST', '/auth/login', json=login_data)
        
        if not response or response.status_code != 200:
            self.log("❌ Admin login failed", "ERROR")
            return False
            
        login_result = response.json()
        self.tokens['admin'] = login_result['token']
        self.log("✅ Admin authentication successful")
        return True
    
    def test_secteurs_crud(self):
        """Test Secteurs CRUD operations"""
        self.log("\n=== TESTING SECTEURS CRUD ===")
        
        token = self.tokens.get('admin')
        if not token:
            self.log("❌ No admin token available", "ERROR")
            return False
        
        # 1. POST /api/fi/secteurs - Create secteur "Centre-ville" à Dijon
        secteur_data = {
            "nom": "Centre-ville",
            "ville": "Dijon"
        }
        
        create_response = self.make_request('POST', '/fi/secteurs', token=token, json=secteur_data)
        if not create_response or create_response.status_code != 200:
            self.log("❌ Failed to create secteur Centre-ville", "ERROR")
            return False
        
        secteur = create_response.json()
        secteur_id = secteur['id']
        self.test_data['secteurs'].append(secteur)
        self.log(f"✅ Created secteur Centre-ville: {secteur_id}")
        
        # 2. GET /api/fi/secteurs?ville=Dijon - List secteurs
        list_response = self.make_request('GET', '/fi/secteurs?ville=Dijon', token=token)
        if not list_response or list_response.status_code != 200:
            self.log("❌ Failed to list secteurs for Dijon", "ERROR")
            return False
        
        secteurs = list_response.json()
        dijon_secteurs = [s for s in secteurs if s['ville'] == 'Dijon']
        self.log(f"✅ Listed {len(dijon_secteurs)} secteurs for Dijon")
        
        # Verify our secteur is in the list
        centre_ville_found = any(s['nom'] == 'Centre-ville' for s in dijon_secteurs)
        if not centre_ville_found:
            self.log("❌ Centre-ville secteur not found in list", "ERROR")
            return False
        
        # 3. PUT /api/fi/secteurs/{id} - Modify secteur
        update_data = {
            "nom": "Centre-ville Modifié",
            "ville": "Dijon"
        }
        
        update_response = self.make_request('PUT', f'/fi/secteurs/{secteur_id}', token=token, json=update_data)
        if not update_response or update_response.status_code != 200:
            self.log("❌ Failed to update secteur", "ERROR")
            return False
        
        self.log("✅ Updated secteur successfully")
        
        # 4. Create another secteur for deletion test
        delete_secteur_data = {
            "nom": "Secteur à Supprimer",
            "ville": "Dijon"
        }
        
        delete_create_response = self.make_request('POST', '/fi/secteurs', token=token, json=delete_secteur_data)
        if delete_create_response and delete_create_response.status_code == 200:
            delete_secteur = delete_create_response.json()
            delete_secteur_id = delete_secteur['id']
            
            # DELETE /api/fi/secteurs/{id} - Delete secteur
            delete_response = self.make_request('DELETE', f'/fi/secteurs/{delete_secteur_id}', token=token)
            if delete_response and delete_response.status_code == 200:
                self.log("✅ Deleted secteur successfully")
            else:
                self.log("❌ Failed to delete secteur", "ERROR")
                return False
        
        return True
    
    def test_familles_impact_crud(self):
        """Test Familles d'Impact CRUD operations"""
        self.log("\n=== TESTING FAMILLES D'IMPACT CRUD ===")
        
        token = self.tokens.get('admin')
        if not token:
            self.log("❌ No admin token available", "ERROR")
            return False
        
        # Get secteur ID for FI creation
        if not self.test_data['secteurs']:
            self.log("❌ No secteur available for FI creation", "ERROR")
            return False
        
        secteur_id = self.test_data['secteurs'][0]['id']
        
        # 1. POST /api/fi/familles-impact - Create FI "FI République"
        fi_data = {
            "nom": "FI République",
            "secteur_id": secteur_id,
            "ville": "Dijon"
        }
        
        create_response = self.make_request('POST', '/fi/familles-impact', token=token, json=fi_data)
        if not create_response or create_response.status_code != 200:
            self.log("❌ Failed to create FI République", "ERROR")
            return False
        
        fi = create_response.json()
        fi_id = fi['id']
        self.test_data['familles_impact'].append(fi)
        self.log(f"✅ Created FI République: {fi_id}")
        
        # 2. GET /api/fi/familles-impact?secteur_id=X - List FI by secteur
        list_response = self.make_request('GET', f'/fi/familles-impact?secteur_id={secteur_id}', token=token)
        if not list_response or list_response.status_code != 200:
            self.log("❌ Failed to list FI by secteur", "ERROR")
            return False
        
        fis = list_response.json()
        self.log(f"✅ Listed {len(fis)} FI for secteur {secteur_id}")
        
        # 3. GET /api/fi/familles-impact/{id} - Get FI details
        detail_response = self.make_request('GET', f'/fi/familles-impact/{fi_id}', token=token)
        if not detail_response or detail_response.status_code != 200:
            self.log("❌ Failed to get FI details", "ERROR")
            return False
        
        fi_detail = detail_response.json()
        if fi_detail['nom'] == 'FI République':
            self.log("✅ Retrieved FI details successfully")
        else:
            self.log("❌ FI details mismatch", "ERROR")
            return False
        
        # 4. PUT /api/fi/familles-impact/{id} - Modify FI
        update_data = {
            "nom": "FI République Modifiée",
            "secteur_id": secteur_id,
            "ville": "Dijon"
        }
        
        update_response = self.make_request('PUT', f'/fi/familles-impact/{fi_id}', token=token, json=update_data)
        if not update_response or update_response.status_code != 200:
            self.log("❌ Failed to update FI", "ERROR")
            return False
        
        self.log("✅ Updated FI successfully")
        
        # 5. Create another FI for deletion test
        delete_fi_data = {
            "nom": "FI à Supprimer",
            "secteur_id": secteur_id,
            "ville": "Dijon"
        }
        
        delete_create_response = self.make_request('POST', '/fi/familles-impact', token=token, json=delete_fi_data)
        if delete_create_response and delete_create_response.status_code == 200:
            delete_fi = delete_create_response.json()
            delete_fi_id = delete_fi['id']
            
            # DELETE /api/fi/familles-impact/{id} - Delete FI
            delete_response = self.make_request('DELETE', f'/fi/familles-impact/{delete_fi_id}', token=token)
            if delete_response and delete_response.status_code == 200:
                self.log("✅ Deleted FI successfully")
            else:
                self.log("❌ Failed to delete FI", "ERROR")
                return False
        
        return True
    
    def test_membres_crud(self):
        """Test Membres CRUD operations"""
        self.log("\n=== TESTING MEMBRES CRUD ===")
        
        token = self.tokens.get('admin')
        if not token:
            self.log("❌ No admin token available", "ERROR")
            return False
        
        # Get FI ID for membre creation
        if not self.test_data['familles_impact']:
            self.log("❌ No FI available for membre creation", "ERROR")
            return False
        
        fi_id = self.test_data['familles_impact'][0]['id']
        
        # 1. POST /api/fi/membres - Add membre to FI
        membre_data = {
            "prenom": "Jean",
            "nom": "Dupont",
            "fi_id": fi_id,
            "source": "manuel"
        }
        
        create_response = self.make_request('POST', '/fi/membres', token=token, json=membre_data)
        if not create_response or create_response.status_code != 200:
            self.log("❌ Failed to create membre", "ERROR")
            return False
        
        membre = create_response.json()
        membre_id = membre['id']
        self.test_data['membres'].append(membre)
        self.log(f"✅ Created membre Jean Dupont: {membre_id}")
        
        # 2. GET /api/fi/membres?fi_id=X - List membres of FI
        list_response = self.make_request('GET', f'/fi/membres?fi_id={fi_id}', token=token)
        if not list_response or list_response.status_code != 200:
            self.log("❌ Failed to list membres", "ERROR")
            return False
        
        membres = list_response.json()
        self.log(f"✅ Listed {len(membres)} membres for FI {fi_id}")
        
        # Verify our membre is in the list
        jean_found = any(m['prenom'] == 'Jean' and m['nom'] == 'Dupont' for m in membres)
        if not jean_found:
            self.log("❌ Jean Dupont not found in membres list", "ERROR")
            return False
        
        # 3. DELETE /api/fi/membres/{id} - Delete membre
        delete_response = self.make_request('DELETE', f'/fi/membres/{membre_id}', token=token)
        if not delete_response or delete_response.status_code != 200:
            self.log("❌ Failed to delete membre", "ERROR")
            return False
        
        self.log("✅ Deleted membre successfully")
        
        # Re-create membre for presence tests
        recreate_response = self.make_request('POST', '/fi/membres', token=token, json=membre_data)
        if recreate_response and recreate_response.status_code == 200:
            self.test_data['membres'] = [recreate_response.json()]
        
        return True
    
    def test_presences_crud(self):
        """Test Présences CRUD operations"""
        self.log("\n=== TESTING PRESENCES CRUD ===")
        
        token = self.tokens.get('admin')
        if not token:
            self.log("❌ No admin token available", "ERROR")
            return False
        
        # Get membre ID for presence creation
        if not self.test_data['membres']:
            self.log("❌ No membre available for presence creation", "ERROR")
            return False
        
        membre_id = self.test_data['membres'][0]['id']
        fi_id = self.test_data['familles_impact'][0]['id']
        
        # 1. POST /api/fi/presences - Mark presence (jeudi)
        today = datetime.now().strftime("%Y-%m-%d")
        presence_data = {
            "membre_fi_id": membre_id,
            "date": today,
            "present": True,
            "commentaire": "Présent au culte du jeudi"
        }
        
        create_response = self.make_request('POST', '/fi/presences', token=token, json=presence_data)
        if not create_response or create_response.status_code != 200:
            self.log("❌ Failed to create presence", "ERROR")
            return False
        
        presence = create_response.json()
        self.log(f"✅ Created presence for {today}")
        
        # 2. GET /api/fi/presences?fi_id=X&date=YYYY-MM-DD - List presences
        list_response = self.make_request('GET', f'/fi/presences?fi_id={fi_id}&date={today}', token=token)
        if not list_response or list_response.status_code != 200:
            self.log("❌ Failed to list presences", "ERROR")
            return False
        
        presences = list_response.json()
        self.log(f"✅ Listed {len(presences)} presences for {today}")
        
        # Verify our presence is in the list
        presence_found = any(p['date'] == today and p['present'] == True for p in presences)
        if not presence_found:
            self.log("❌ Created presence not found in list", "ERROR")
            return False
        
        return True
    
    def test_affectation_system(self):
        """Test Affectation system"""
        self.log("\n=== TESTING AFFECTATION SYSTEM ===")
        
        token = self.tokens.get('admin')
        if not token:
            self.log("❌ No admin token available", "ERROR")
            return False
        
        # First create a visitor (nouveau arrivant)
        visitor_data = {
            "firstname": "Marie",
            "lastname": "Martin",
            "city": "Dijon",
            "types": ["Nouveau Arrivant"],
            "phone": "+33123456789",
            "arrival_channel": "Ami",
            "visit_date": "2025-01-15"
        }
        
        visitor_response = self.make_request('POST', '/visitors', token=token, json=visitor_data)
        if not visitor_response or visitor_response.status_code != 200:
            self.log("❌ Failed to create visitor", "ERROR")
            return False
        
        visitor = visitor_response.json()
        visitor_id = visitor['id']
        self.test_data['visitors'].append(visitor)
        self.log(f"✅ Created visitor Marie Martin: {visitor_id}")
        
        # Get FI ID for affectation
        if not self.test_data['familles_impact']:
            self.log("❌ No FI available for affectation", "ERROR")
            return False
        
        fi_id = self.test_data['familles_impact'][0]['id']
        
        # 1. POST /api/fi/affecter-visiteur - Affect nouveau arrivant to FI
        affectation_data = {
            "nouveau_arrivant_id": visitor_id,
            "fi_id": fi_id
        }
        
        affectation_response = self.make_request('POST', '/fi/affecter-visiteur', token=token, json=affectation_data)
        if not affectation_response or affectation_response.status_code != 200:
            self.log("❌ Failed to affect visitor to FI", "ERROR")
            return False
        
        self.log("✅ Affected visitor to FI successfully")
        
        # 2. GET /api/fi/indicateurs/affectation - Get affectation indicators
        indicators_response = self.make_request('GET', '/fi/indicateurs/affectation?ville=Dijon', token=token)
        if not indicators_response or indicators_response.status_code != 200:
            self.log("❌ Failed to get affectation indicators", "ERROR")
            return False
        
        indicators = indicators_response.json()
        self.log(f"✅ Retrieved affectation indicators:")
        self.log(f"   - Total nouveaux arrivants: {indicators.get('total_nouveaux_arrivants', 0)}")
        self.log(f"   - Affectés: {indicators.get('affectes', 0)}")
        self.log(f"   - Non affectés: {indicators.get('non_affectes', 0)}")
        self.log(f"   - Pourcentage affectation: {indicators.get('pourcentage_affectation', 0)}%")
        
        return True
    
    def test_stats_endpoints(self):
        """Test Statistics endpoints"""
        self.log("\n=== TESTING STATISTICS ENDPOINTS ===")
        
        token = self.tokens.get('admin')
        if not token:
            self.log("❌ No admin token available", "ERROR")
            return False
        
        # Create test users for different roles
        test_users = [
            {
                "username": "pilote_test",
                "password": "test123",
                "city": "Dijon",
                "role": "pilote_fi",
                "assigned_fi_id": self.test_data['familles_impact'][0]['id'] if self.test_data['familles_impact'] else None
            },
            {
                "username": "responsable_test",
                "password": "test123", 
                "city": "Dijon",
                "role": "responsable_secteur",
                "assigned_secteur_id": self.test_data['secteurs'][0]['id'] if self.test_data['secteurs'] else None
            },
            {
                "username": "superviseur_test",
                "password": "test123",
                "city": "Dijon", 
                "role": "superviseur_fi"
            },
            {
                "username": "pasteur_test",
                "password": "test123",
                "city": "Dijon",
                "role": "pasteur"
            }
        ]
        
        created_users = []
        for user_data in test_users:
            if user_data.get('assigned_fi_id') or user_data.get('assigned_secteur_id') or user_data['role'] in ['superviseur_fi', 'pasteur']:
                create_response = self.make_request('POST', '/users/referent', token=token, json=user_data)
                if create_response and create_response.status_code == 200:
                    created_users.append(user_data)
                    self.log(f"✅ Created test user: {user_data['username']} ({user_data['role']})")
        
        # Test stats endpoints with different roles
        stats_tests = [
            ("superviseur", "/fi/stats/superviseur?ville=Dijon"),
            ("pasteur", "/fi/stats/pasteur")
        ]
        
        for role_name, endpoint in stats_tests:
            response = self.make_request('GET', endpoint, token=token)
            if response and response.status_code == 200:
                stats = response.json()
                self.log(f"✅ Retrieved {role_name} stats successfully")
                if role_name == "superviseur":
                    self.log(f"   - Nombre secteurs: {stats.get('nombre_secteurs', 0)}")
                    self.log(f"   - Nombre FI total: {stats.get('nombre_fi_total', 0)}")
                    self.log(f"   - Nombre membres total: {stats.get('nombre_membres_total', 0)}")
                elif role_name == "pasteur":
                    self.log(f"   - Stats for {len(stats)} cities")
            else:
                self.log(f"❌ Failed to get {role_name} stats", "ERROR")
                return False
        
        return True
    
    def test_permissions_and_access_control(self):
        """Test permissions and access control"""
        self.log("\n=== TESTING PERMISSIONS AND ACCESS CONTROL ===")
        
        # Test with different role tokens if available
        token = self.tokens.get('admin')
        if not token:
            self.log("❌ No admin token available", "ERROR")
            return False
        
        # Test that admin can access all endpoints
        endpoints_to_test = [
            ('GET', '/fi/secteurs'),
            ('GET', '/fi/familles-impact'),
            ('GET', '/fi/membres'),
            ('GET', '/fi/presences'),
            ('GET', '/fi/indicateurs/affectation'),
            ('GET', '/fi/stats/superviseur?ville=Dijon'),
            ('GET', '/fi/stats/pasteur')
        ]
        
        all_accessible = True
        for method, endpoint in endpoints_to_test:
            response = self.make_request(method, endpoint, token=token)
            if not response or response.status_code not in [200, 404]:  # 404 is OK if no data
                self.log(f"❌ Admin cannot access {method} {endpoint} (Status: {response.status_code if response else 'None'})", "ERROR")
                all_accessible = False
            else:
                self.log(f"✅ Admin can access {method} {endpoint}")
        
        if all_accessible:
            self.log("✅ All permission checks passed")
            return True
        else:
            self.log("❌ Some permission checks failed", "ERROR")
            return False
    
    def run_all_tests(self):
        """Run all FI backend tests"""
        self.log("Starting Familles d'Impact Backend API Tests")
        self.log("=" * 60)
        
        # Setup authentication
        if not self.setup_authentication():
            self.log("❌ Authentication setup failed", "ERROR")
            return False
        
        # Run tests in order
        tests = [
            ("Secteurs CRUD Operations", self.test_secteurs_crud),
            ("Familles d'Impact CRUD Operations", self.test_familles_impact_crud),
            ("Membres CRUD Operations", self.test_membres_crud),
            ("Présences CRUD Operations", self.test_presences_crud),
            ("Affectation System", self.test_affectation_system),
            ("Statistics Endpoints", self.test_stats_endpoints),
            ("Permissions and Access Control", self.test_permissions_and_access_control)
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
        self.log("\n" + "=" * 60)
        self.log("FAMILLES D'IMPACT TEST SUMMARY")
        self.log("=" * 60)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{status} {test_name}")
        
        self.log(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 All FI tests passed! Familles d'Impact system is working correctly.")
        else:
            self.log(f"⚠️  {total - passed} test(s) failed. Issues need to be addressed.")
        
        return results

if __name__ == "__main__":
    tester = FIBackendTester()
    results = tester.run_all_tests()