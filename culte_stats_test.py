#!/usr/bin/env python3
"""
Culte Statistics Testing - URGENT
Tests for culte stats creation, retrieval, and persistence issues
Based on French review request: "Vérifier enregistrement et récupération des statistiques culte"
"""

import requests
import json
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')
BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://egliseconnect-1.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

class CulteStatsTester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.created_stats = []
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def make_request(self, method, endpoint, **kwargs):
        """Make HTTP request with authentication"""
        url = f"{API_URL}{endpoint}"
        headers = kwargs.get('headers', {})
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
            
        kwargs['headers'] = headers
        
        try:
            response = self.session.request(method, url, **kwargs)
            self.log(f"{method} {endpoint} -> {response.status_code}")
            return response
        except Exception as e:
            self.log(f"Request failed: {e}", "ERROR")
            return None
    
    def setup_authentication(self):
        """Login with superadmin credentials for Dijon"""
        self.log("=== SETUP: Authentication ===")
        
        # Initialize database first
        init_response = self.make_request('POST', '/init')
        if init_response and init_response.status_code == 200:
            self.log("✅ Database initialized")
        
        # Login as superadmin for Dijon
        login_data = {
            "username": "superadmin",
            "password": "superadmin123",
            "city": "Dijon"
        }
        
        login_response = self.make_request('POST', '/auth/login', json=login_data)
        
        if not login_response or login_response.status_code != 200:
            self.log("❌ CRITICAL: Failed to login as superadmin", "ERROR")
            if login_response:
                self.log(f"   Error: {login_response.text}")
            return False
        
        login_result = login_response.json()
        self.token = login_result['token']
        user_info = login_result['user']
        
        self.log(f"✅ Successfully logged in as: {user_info['username']} (Role: {user_info['role']}, City: {user_info['city']})")
        return True
    
    def test_1_create_culte_stat(self):
        """Test 1: Créer une statistique culte"""
        self.log("\n=== TEST 1: Créer une statistique culte ===")
        
        culte_data = {
            "date": "2025-01-19",
            "ville": "Dijon",
            "type_culte": "Culte 1",
            "nombre_fideles": 50,
            "nombre_adultes": 35,
            "nombre_enfants": 15,
            "nombre_stars": 5,
            "commentaire": "Test commentaire"
        }
        
        self.log("Creating culte stat with data:")
        for key, value in culte_data.items():
            self.log(f"   {key}: {value}")
        
        response = self.make_request('POST', '/culte-stats', json=culte_data)
        
        if not response:
            self.log("❌ CRITICAL: Request failed completely", "ERROR")
            return False
        
        self.log(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                result = response.json()
                stat_id = result.get('id')
                
                if stat_id:
                    self.log(f"✅ SUCCESS: Culte stat created with ID: {stat_id}")
                    self.log(f"   Message: {result.get('message', 'No message')}")
                    self.created_stats.append({
                        'id': stat_id,
                        'data': culte_data
                    })
                    return True
                else:
                    self.log("❌ ISSUE: No ID returned in response", "ERROR")
                    self.log(f"   Response: {response.text}")
                    return False
                    
            except Exception as e:
                self.log(f"❌ ISSUE: Failed to parse JSON response: {e}", "ERROR")
                self.log(f"   Response text: {response.text}")
                return False
        
        elif response.status_code == 500:
            self.log("❌ CRITICAL: Internal Server Error - Backend issue", "ERROR")
            self.log(f"   This indicates a backend problem with data storage")
            try:
                error_detail = response.json()
                self.log(f"   Error details: {error_detail}")
            except:
                self.log(f"   Raw response: {response.text}")
            return False
        
        else:
            self.log(f"❌ UNEXPECTED STATUS: {response.status_code}", "ERROR")
            self.log(f"   Response: {response.text}")
            return False
    
    def test_2_retrieve_stats_immediately(self):
        """Test 2: Récupérer les statistiques immédiatement après création"""
        self.log("\n=== TEST 2: Récupérer les statistiques ===")
        
        response = self.make_request('GET', '/culte-stats')
        
        if not response:
            self.log("❌ CRITICAL: Request failed completely", "ERROR")
            return False
        
        if response.status_code != 200:
            self.log(f"❌ Failed to retrieve stats - Status: {response.status_code}", "ERROR")
            self.log(f"   Response: {response.text}")
            return False
        
        try:
            stats = response.json()
            self.log(f"✅ Retrieved {len(stats)} culte stats")
            
            # Check if the stat created in Test 1 is present
            if not self.created_stats:
                self.log("⚠️  No stats were created in Test 1 to verify")
                return len(stats) > 0
            
            created_stat = self.created_stats[0]
            found_stat = None
            
            for stat in stats:
                if (stat.get('date') == created_stat['data']['date'] and 
                    stat.get('type_culte') == created_stat['data']['type_culte'] and
                    stat.get('ville') == created_stat['data']['ville']):
                    found_stat = stat
                    break
            
            if found_stat:
                self.log("✅ SUCCESS: Created stat found in retrieved data")
                self.log(f"   Date: {found_stat['date']}")
                self.log(f"   Type: {found_stat['type_culte']}")
                self.log(f"   Fidèles: {found_stat['nombre_fideles']}")
                self.log(f"   Commentaire: {found_stat.get('commentaire', 'N/A')}")
                
                # Verify commentaire is present
                if found_stat.get('commentaire') == created_stat['data']['commentaire']:
                    self.log("✅ Commentaire correctly persisted")
                else:
                    self.log("❌ Commentaire not correctly persisted", "ERROR")
                    return False
                
                return True
            else:
                self.log("❌ CRITICAL: Created stat NOT found in retrieved data", "ERROR")
                self.log("   This indicates data is not being stored or retrieved correctly")
                return False
                
        except Exception as e:
            self.log(f"❌ Failed to parse response: {e}", "ERROR")
            self.log(f"   Response text: {response.text}")
            return False
    
    def test_3_create_multiple_stats_same_date(self):
        """Test 3: Créer plusieurs stats pour même date"""
        self.log("\n=== TEST 3: Créer plusieurs stats pour même date ===")
        
        additional_stats = [
            {
                "date": "2025-01-19",
                "ville": "Dijon", 
                "type_culte": "Culte 2",
                "nombre_fideles": 30,
                "nombre_adultes": 20,
                "nombre_enfants": 10,
                "nombre_stars": 3,
                "commentaire": "Culte 2 test"
            },
            {
                "date": "2025-01-19",
                "ville": "Dijon",
                "type_culte": "EJP", 
                "nombre_fideles": 25,
                "nombre_adultes": 15,
                "nombre_enfants": 10,
                "nombre_stars": 2,
                "commentaire": "EJP test"
            },
            {
                "date": "2025-01-19",
                "ville": "Dijon",
                "type_culte": "Événements spéciaux",
                "nombre_fideles": 40,
                "nombre_adultes": 30,
                "nombre_enfants": 10,
                "nombre_stars": 4,
                "commentaire": "Événement spécial test"
            }
        ]
        
        success_count = 0
        
        for i, stat_data in enumerate(additional_stats, 2):
            self.log(f"Creating stat {i}: {stat_data['type_culte']}")
            
            response = self.make_request('POST', '/culte-stats', json=stat_data)
            
            if response and response.status_code == 200:
                try:
                    result = response.json()
                    stat_id = result.get('id')
                    if stat_id:
                        self.log(f"✅ Created {stat_data['type_culte']} with ID: {stat_id}")
                        self.created_stats.append({
                            'id': stat_id,
                            'data': stat_data
                        })
                        success_count += 1
                    else:
                        self.log(f"❌ No ID returned for {stat_data['type_culte']}", "ERROR")
                except Exception as e:
                    self.log(f"❌ Failed to parse response for {stat_data['type_culte']}: {e}", "ERROR")
            else:
                self.log(f"❌ Failed to create {stat_data['type_culte']} - Status: {response.status_code if response else 'None'}", "ERROR")
                if response:
                    self.log(f"   Error: {response.text}")
        
        if success_count == len(additional_stats):
            self.log(f"✅ SUCCESS: All {success_count} additional stats created")
            return True
        else:
            self.log(f"❌ Only {success_count}/{len(additional_stats)} stats created successfully", "ERROR")
            return False
    
    def test_4_retrieve_all_stats_for_date(self):
        """Test 4: Récupérer toutes les stats de la date"""
        self.log("\n=== TEST 4: Récupérer toutes les stats de la date ===")
        
        response = self.make_request('GET', '/culte-stats')
        
        if not response or response.status_code != 200:
            self.log(f"❌ Failed to retrieve stats - Status: {response.status_code if response else 'None'}", "ERROR")
            return False
        
        try:
            all_stats = response.json()
            self.log(f"✅ Retrieved {len(all_stats)} total stats")
            
            # Filter stats for our test date (2025-01-19)
            test_date_stats = [stat for stat in all_stats if stat.get('date') == '2025-01-19']
            
            self.log(f"Found {len(test_date_stats)} stats for date 2025-01-19:")
            
            expected_types = ["Culte 1", "Culte 2", "EJP", "Événements spéciaux"]
            found_types = []
            
            for stat in test_date_stats:
                type_culte = stat.get('type_culte')
                found_types.append(type_culte)
                self.log(f"   - {type_culte}: {stat.get('nombre_fideles')} fidèles, {stat.get('nombre_stars')} STARS")
                
                # Verify data persistence
                if stat.get('commentaire'):
                    self.log(f"     Commentaire: {stat['commentaire']}")
            
            # Check if all 4 types are present
            missing_types = [t for t in expected_types if t not in found_types]
            
            if len(missing_types) == 0:
                self.log("✅ SUCCESS: All 4 culte types are present")
                self.log("✅ Data persistence verified - all stats correctly stored")
                return True
            else:
                self.log(f"❌ MISSING TYPES: {missing_types}", "ERROR")
                self.log("   This indicates some stats were not properly stored")
                return False
                
        except Exception as e:
            self.log(f"❌ Failed to parse response: {e}", "ERROR")
            return False
    
    def test_5_modify_statistic(self):
        """Test 5: Modifier une statistique"""
        self.log("\n=== TEST 5: Modifier une statistique ===")
        
        if not self.created_stats:
            self.log("❌ No stats available to modify", "ERROR")
            return False
        
        # Use the first created stat
        stat_to_modify = self.created_stats[0]
        stat_id = stat_to_modify['id']
        
        self.log(f"Modifying stat ID: {stat_id}")
        
        # Update data
        update_data = {
            "nombre_fideles": 60,  # Changed from 50 to 60
            "nombre_adultes": 40,  # Changed from 35 to 40
            "nombre_enfants": 20,  # Changed from 15 to 20
            "nombre_stars": 8,     # Changed from 5 to 8
            "commentaire": "Test commentaire modifié"  # Updated comment
        }
        
        self.log("Updating with data:")
        for key, value in update_data.items():
            self.log(f"   {key}: {value}")
        
        response = self.make_request('PUT', f'/culte-stats/{stat_id}', json=update_data)
        
        if not response:
            self.log("❌ CRITICAL: Request failed completely", "ERROR")
            return False
        
        if response.status_code != 200:
            self.log(f"❌ Failed to update stat - Status: {response.status_code}", "ERROR")
            self.log(f"   Response: {response.text}")
            return False
        
        self.log("✅ Update request successful")
        
        # Verify the modification by retrieving the stat
        verify_response = self.make_request('GET', '/culte-stats')
        
        if not verify_response or verify_response.status_code != 200:
            self.log("❌ Failed to verify modification", "ERROR")
            return False
        
        try:
            all_stats = verify_response.json()
            
            # Find the modified stat
            modified_stat = None
            for stat in all_stats:
                if stat.get('id') == stat_id:
                    modified_stat = stat
                    break
            
            if not modified_stat:
                self.log("❌ CRITICAL: Modified stat not found in retrieved data", "ERROR")
                return False
            
            # Verify changes
            verification_passed = True
            for key, expected_value in update_data.items():
                actual_value = modified_stat.get(key)
                if actual_value == expected_value:
                    self.log(f"✅ {key}: {actual_value} (correctly updated)")
                else:
                    self.log(f"❌ {key}: Expected {expected_value}, got {actual_value}", "ERROR")
                    verification_passed = False
            
            if verification_passed:
                self.log("✅ SUCCESS: All modifications correctly persisted")
                return True
            else:
                self.log("❌ Some modifications were not correctly persisted", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Failed to verify modifications: {e}", "ERROR")
            return False
    
    def run_all_tests(self):
        """Run all culte stats tests"""
        self.log("CULTE STATISTICS TESTING - URGENT")
        self.log("Vérifier enregistrement et récupération des statistiques culte")
        self.log("=" * 70)
        
        # Setup authentication
        if not self.setup_authentication():
            self.log("❌ CRITICAL: Authentication failed - cannot proceed with tests", "ERROR")
            return False
        
        # Define tests
        tests = [
            ("Test 1: Créer une statistique culte", self.test_1_create_culte_stat),
            ("Test 2: Récupérer les statistiques", self.test_2_retrieve_stats_immediately),
            ("Test 3: Créer plusieurs stats pour même date", self.test_3_create_multiple_stats_same_date),
            ("Test 4: Récupérer toutes les stats de la date", self.test_4_retrieve_all_stats_for_date),
            ("Test 5: Modifier une statistique", self.test_5_modify_statistic)
        ]
        
        results = {}
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            self.log(f"\n{'='*50}")
            try:
                result = test_func()
                results[test_name] = result
                if result:
                    passed += 1
                    self.log(f"✅ {test_name}: PASSED")
                else:
                    self.log(f"❌ {test_name}: FAILED")
            except Exception as e:
                self.log(f"❌ {test_name}: CRASHED - {e}", "ERROR")
                results[test_name] = False
        
        # Final summary
        self.log("\n" + "=" * 70)
        self.log("CULTE STATISTICS TEST SUMMARY")
        self.log("=" * 70)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{status} {test_name}")
        
        self.log(f"\nOverall Result: {passed}/{total} tests passed")
        
        # Diagnostic conclusion
        self.log("\n" + "=" * 70)
        self.log("DIAGNOSTIC CONCLUSION")
        self.log("=" * 70)
        
        if passed == total:
            self.log("🎉 ALL TESTS PASSED!")
            self.log("✅ Backend stores culte stats correctly")
            self.log("✅ Backend returns culte stats correctly") 
            self.log("✅ Data persists properly")
            self.log("✅ No data overwriting issues")
            self.log("\n➡️  If users still report issues, the problem is FRONTEND-RELATED")
        elif passed >= 3:
            self.log("⚠️  PARTIAL SUCCESS - Some functionality working")
            if not results.get("Test 1: Créer une statistique culte"):
                self.log("❌ ISSUE: Backend not storing data properly")
            if not results.get("Test 2: Récupérer les statistiques"):
                self.log("❌ ISSUE: Backend not returning stored data")
            if not results.get("Test 4: Récupérer toutes les stats de la date"):
                self.log("❌ ISSUE: Data being overwritten or lost")
        else:
            self.log("❌ CRITICAL ISSUES FOUND")
            self.log("❌ Backend has serious problems with culte stats functionality")
            self.log("❌ Data storage and/or retrieval is broken")
        
        return results

if __name__ == "__main__":
    tester = CulteStatsTester()
    results = tester.run_all_tests()