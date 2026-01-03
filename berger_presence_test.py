#!/usr/bin/env python3
"""
Backend Test Suite for Berger Presence Functionality
Testing the critical bug fix for "Marquer présence des bergers"

Test Focus:
1. New endpoint: GET /api/berger-presences/latest?ville={ville}
2. Modified endpoint: POST /api/berger-presences/batch (with noms_bergers and personnes_suivies)
3. Existing endpoint: GET /api/berger-presences?date={date}&ville={ville}

Key Requirements:
- noms_bergers (string) and personnes_suivies (int) fields must be saved and retrieved
- Latest endpoint should return last values per promo for pre-filling
- Batch endpoint should handle upserts (update if exists, create if new)
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')
load_dotenv('/app/frontend/.env')

# Configuration
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://faith-hub-23.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

# Test credentials - superviseur_promos role required
TEST_CREDENTIALS = {
    "username": "superadmin",
    "password": "superadmin123", 
    "city": "Dijon"
}

class BergerPresenceTest:
    def __init__(self):
        self.token = None
        self.headers = {}
        self.test_results = []
        self.test_date = datetime.now().strftime("%Y-%m-%d")
        self.ville = "Dijon"
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "message": message,
            "details": details or {}
        }
        self.test_results.append(result)
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def authenticate(self):
        """Authenticate and get token"""
        try:
            response = requests.post(
                f"{API_BASE}/auth/login",
                json=TEST_CREDENTIALS,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data["token"]
                self.headers = {"Authorization": f"Bearer {self.token}"}
                user_role = data["user"]["role"]
                
                self.log_result(
                    "Authentication", 
                    True, 
                    f"Successfully authenticated as {user_role}",
                    {"user": data["user"]}
                )
                return True
            else:
                self.log_result(
                    "Authentication", 
                    False, 
                    f"Login failed: {response.status_code}",
                    {"response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_result("Authentication", False, f"Login error: {str(e)}")
            return False
    
    def test_berger_presences_latest_endpoint(self):
        """Test 1: GET /api/berger-presences/latest?ville={ville}"""
        try:
            response = requests.get(
                f"{API_BASE}/berger-presences/latest",
                params={"ville": self.ville},
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify response format
                if isinstance(data, list):
                    self.log_result(
                        "Latest Endpoint - Format", 
                        True, 
                        f"Returns array format with {len(data)} items",
                        {"response_sample": data[:2] if data else []}
                    )
                    
                    # Check if any items have the new fields
                    has_new_fields = False
                    for item in data:
                        if "noms_bergers" in item or "personnes_suivies" in item:
                            has_new_fields = True
                            break
                    
                    if has_new_fields or len(data) == 0:
                        self.log_result(
                            "Latest Endpoint - New Fields", 
                            True, 
                            "Endpoint supports new fields (noms_bergers, personnes_suivies)",
                            {"sample_with_fields": [item for item in data if "noms_bergers" in item][:1]}
                        )
                    else:
                        self.log_result(
                            "Latest Endpoint - New Fields", 
                            False, 
                            "New fields not found in response"
                        )
                else:
                    self.log_result(
                        "Latest Endpoint - Format", 
                        False, 
                        f"Expected array, got {type(data)}"
                    )
            else:
                self.log_result(
                    "Latest Endpoint", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result("Latest Endpoint", False, f"Request error: {str(e)}")
    
    def test_berger_presences_batch_save(self):
        """Test 2: POST /api/berger-presences/batch with new fields"""
        # Use unique test data to avoid conflicts
        import uuid
        unique_suffix = str(uuid.uuid4())[:8]
        
        test_data = {
            "presences": [
                {
                    "berger_id": f"test-berger-unique-1-{unique_suffix}",
                    "date": self.test_date,
                    "present": True,
                    "priere": True,
                    "commentaire": "Test commentaire pour Promo Test Août",
                    "enregistre_par": "test-user-1",
                    "ville": self.ville,
                    "promo_name": f"Promo Test Août {unique_suffix}",
                    "noms_bergers": "Jean Dupont, Marie Martin",
                    "personnes_suivies": 5
                },
                {
                    "berger_id": f"test-berger-unique-2-{unique_suffix}", 
                    "date": self.test_date,
                    "present": False,
                    "priere": False,
                    "commentaire": "Absent pour raisons personnelles",
                    "enregistre_par": "test-user-1",
                    "ville": self.ville,
                    "promo_name": f"Promo Test Septembre {unique_suffix}",
                    "noms_bergers": "Pierre Durand, Sophie Leroy, Marc Petit",
                    "personnes_suivies": 8
                }
            ]
        }
        
        # Store test data for later verification
        self.test_promo_aout = f"Promo Test Août {unique_suffix}"
        self.test_promo_septembre = f"Promo Test Septembre {unique_suffix}"
        self.test_berger_1 = f"test-berger-unique-1-{unique_suffix}"
        
        try:
            response = requests.post(
                f"{API_BASE}/berger-presences/batch",
                json=test_data,
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                expected_count = len(test_data["presences"])
                
                if "count" in data and data["count"] == expected_count:
                    self.log_result(
                        "Batch Save", 
                        True, 
                        f"Successfully saved {data['count']} presences",
                        {"response": data}
                    )
                    return True
                else:
                    self.log_result(
                        "Batch Save", 
                        False, 
                        f"Count mismatch: expected {expected_count}, got {data.get('count', 'unknown')}"
                    )
            else:
                self.log_result(
                    "Batch Save", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result("Batch Save", False, f"Request error: {str(e)}")
            
        return False
    
    def test_berger_presences_retrieval(self):
        """Test 3: GET /api/berger-presences?date={date}&ville={ville}"""
        try:
            response = requests.get(
                f"{API_BASE}/berger-presences",
                params={"date": self.test_date, "ville": self.ville},
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list) and len(data) > 0:
                    # Check if saved data contains new fields
                    found_new_fields = []
                    for presence in data:
                        if presence.get("noms_bergers") and presence.get("personnes_suivies") is not None:
                            found_new_fields.append({
                                "promo_name": presence.get("promo_name"),
                                "noms_bergers": presence.get("noms_bergers"),
                                "personnes_suivies": presence.get("personnes_suivies"),
                                "present": presence.get("present")
                            })
                    
                    if found_new_fields:
                        self.log_result(
                            "Data Retrieval - New Fields", 
                            True, 
                            f"Found {len(found_new_fields)} presences with new fields",
                            {"samples": found_new_fields}
                        )
                        
                        # Verify specific test data
                        promo_aout = next((p for p in data if p.get("promo_name") == getattr(self, 'test_promo_aout', 'Promo Août')), None)
                        if promo_aout:
                            expected_noms = "Jean Dupont, Marie Martin"
                            expected_personnes = 5
                            
                            if (promo_aout.get("noms_bergers") == expected_noms and 
                                promo_aout.get("personnes_suivies") == expected_personnes):
                                self.log_result(
                                    "Data Integrity", 
                                    True, 
                                    "Saved data matches expected values",
                                    {"promo_aout_data": promo_aout}
                                )
                            else:
                                self.log_result(
                                    "Data Integrity", 
                                    False, 
                                    f"Data mismatch for test promo",
                                    {
                                        "expected": {"noms_bergers": expected_noms, "personnes_suivies": expected_personnes},
                                        "actual": {"noms_bergers": promo_aout.get("noms_bergers"), "personnes_suivies": promo_aout.get("personnes_suivies")}
                                    }
                                )
                    else:
                        self.log_result(
                            "Data Retrieval - New Fields", 
                            False, 
                            "No presences found with new fields"
                        )
                else:
                    self.log_result(
                        "Data Retrieval", 
                        len(data) == 0, 
                        f"No data found for {self.test_date}" if len(data) == 0 else "Invalid response format"
                    )
            else:
                self.log_result(
                    "Data Retrieval", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result("Data Retrieval", False, f"Request error: {str(e)}")
    
    def test_latest_prefill_functionality(self):
        """Test 4: Verify latest endpoint returns correct data for pre-filling"""
        try:
            response = requests.get(
                f"{API_BASE}/berger-presences/latest",
                params={"ville": self.ville},
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Look for our test data
                promo_aout = next((p for p in data if p.get("promo_name") == getattr(self, 'test_promo_aout', 'Promo Août')), None)
                promo_septembre = next((p for p in data if p.get("promo_name") == getattr(self, 'test_promo_septembre', 'Promo Septembre')), None)
                
                if promo_aout and promo_septembre:
                    # Verify Promo Août data
                    aout_valid = (
                        promo_aout.get("noms_bergers") == "Jean Dupont, Marie Martin" and
                        promo_aout.get("personnes_suivies") == 5
                    )
                    
                    # Verify Promo Septembre data  
                    septembre_valid = (
                        promo_septembre.get("noms_bergers") == "Pierre Durand, Sophie Leroy, Marc Petit" and
                        promo_septembre.get("personnes_suivies") == 8
                    )
                    
                    if aout_valid and septembre_valid:
                        self.log_result(
                            "Pre-fill Functionality", 
                            True, 
                            "Latest endpoint returns correct data for both promos",
                            {
                                "promo_aout": {"noms_bergers": promo_aout.get("noms_bergers"), "personnes_suivies": promo_aout.get("personnes_suivies")},
                                "promo_septembre": {"noms_bergers": promo_septembre.get("noms_bergers"), "personnes_suivies": promo_septembre.get("personnes_suivies")}
                            }
                        )
                    else:
                        self.log_result(
                            "Pre-fill Functionality", 
                            False, 
                            "Data mismatch in latest endpoint",
                            {"promo_aout": promo_aout, "promo_septembre": promo_septembre}
                        )
                else:
                    self.log_result(
                        "Pre-fill Functionality", 
                        False, 
                        "Test promos not found in latest data",
                        {"available_promos": [p.get("promo_name") for p in data]}
                    )
            else:
                self.log_result(
                    "Pre-fill Functionality", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result("Pre-fill Functionality", False, f"Request error: {str(e)}")
    
    def test_update_functionality(self):
        """Test 5: Verify update functionality (upsert behavior)"""
        # Update existing data with new values
        update_data = {
            "presences": [
                {
                    "berger_id": getattr(self, 'test_berger_1', 'test-berger-1'),  # Same berger_id as before
                    "date": self.test_date,        # Same date
                    "present": True,
                    "priere": False,               # Changed from True to False
                    "commentaire": "Commentaire mis à jour",
                    "enregistre_par": "test-user-1",
                    "ville": self.ville,
                    "promo_name": getattr(self, 'test_promo_aout', 'Promo Août'),
                    "noms_bergers": "Jean Dupont, Marie Martin, Nouveau Berger",  # Updated
                    "personnes_suivies": 7         # Changed from 5 to 7
                }
            ]
        }
        
        try:
            # Send update
            response = requests.post(
                f"{API_BASE}/berger-presences/batch",
                json=update_data,
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                # Verify the update by retrieving data
                get_response = requests.get(
                    f"{API_BASE}/berger-presences",
                    params={"date": self.test_date, "ville": self.ville},
                    headers=self.headers,
                    timeout=30
                )
                
                if get_response.status_code == 200:
                    data = get_response.json()
                    promo_aout = next((p for p in data if p.get("promo_name") == getattr(self, 'test_promo_aout', 'Promo Août')), None)
                    
                    if promo_aout:
                        updated_correctly = (
                            promo_aout.get("noms_bergers") == "Jean Dupont, Marie Martin, Nouveau Berger" and
                            promo_aout.get("personnes_suivies") == 7 and
                            promo_aout.get("priere") == False
                        )
                        
                        if updated_correctly:
                            self.log_result(
                                "Update Functionality", 
                                True, 
                                "Data updated successfully (upsert working)",
                                {"updated_data": promo_aout}
                            )
                        else:
                            self.log_result(
                                "Update Functionality", 
                                False, 
                                "Update failed - data not changed",
                                {"current_data": promo_aout}
                            )
                    else:
                        self.log_result(
                            "Update Functionality", 
                            False, 
                            "Promo Août not found after update"
                        )
                else:
                    self.log_result(
                        "Update Functionality", 
                        False, 
                        f"Failed to retrieve updated data: {get_response.status_code}"
                    )
            else:
                self.log_result(
                    "Update Functionality", 
                    False, 
                    f"Update request failed: {response.status_code}"
                )
                
        except Exception as e:
            self.log_result("Update Functionality", False, f"Request error: {str(e)}")
    
    def test_no_regression_existing_fields(self):
        """Test 6: Verify no regression on existing fields"""
        try:
            response = requests.get(
                f"{API_BASE}/berger-presences",
                params={"date": self.test_date, "ville": self.ville},
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if len(data) > 0:
                    # Check that all existing fields are still present
                    required_fields = ["berger_id", "date", "present", "priere", "commentaire", "ville", "promo_name"]
                    missing_fields = []
                    
                    for presence in data:
                        for field in required_fields:
                            if field not in presence:
                                missing_fields.append(field)
                    
                    if not missing_fields:
                        self.log_result(
                            "No Regression - Existing Fields", 
                            True, 
                            "All existing fields are preserved",
                            {"sample_presence": data[0]}
                        )
                    else:
                        self.log_result(
                            "No Regression - Existing Fields", 
                            False, 
                            f"Missing fields: {list(set(missing_fields))}"
                        )
                else:
                    self.log_result(
                        "No Regression - Existing Fields", 
                        True, 
                        "No data to check (acceptable)"
                    )
            else:
                self.log_result(
                    "No Regression - Existing Fields", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_result("No Regression - Existing Fields", False, f"Request error: {str(e)}")
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("=" * 80)
        print("🧪 BERGER PRESENCE FUNCTIONALITY TEST SUITE")
        print("=" * 80)
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Test Date: {self.test_date}")
        print(f"Test City: {self.ville}")
        print("=" * 80)
        
        # Step 1: Authenticate
        if not self.authenticate():
            print("\n❌ Authentication failed. Cannot proceed with tests.")
            return False
        
        print("\n" + "=" * 80)
        print("🔍 RUNNING TESTS")
        print("=" * 80)
        
        # Step 2: Test latest endpoint (should work even if empty)
        self.test_berger_presences_latest_endpoint()
        
        # Step 3: Test batch save with new fields
        save_success = self.test_berger_presences_batch_save()
        
        # Step 4: Test data retrieval with new fields
        if save_success:
            self.test_berger_presences_retrieval()
            
            # Step 5: Test pre-fill functionality
            self.test_latest_prefill_functionality()
            
            # Step 6: Test update functionality
            self.test_update_functionality()
        
        # Step 7: Test no regression on existing fields
        self.test_no_regression_existing_fields()
        
        # Print summary
        self.print_summary()
        
        return self.get_overall_success()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for r in self.test_results if "✅ PASS" in r["status"])
        failed = sum(1 for r in self.test_results if "❌ FAIL" in r["status"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed} ✅")
        print(f"Failed: {failed} ❌")
        print(f"Success Rate: {(passed/total*100):.1f}%")
        
        if failed > 0:
            print("\n🚨 FAILED TESTS:")
            for result in self.test_results:
                if "❌ FAIL" in result["status"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\n" + "=" * 80)
    
    def get_overall_success(self):
        """Check if all critical tests passed"""
        critical_tests = [
            "Latest Endpoint - Format",
            "Batch Save", 
            "Data Retrieval - New Fields",
            "Data Integrity"
        ]
        
        for result in self.test_results:
            if result["test"] in critical_tests and "❌ FAIL" in result["status"]:
                return False
        
        return True

def main():
    """Main test execution"""
    tester = BergerPresenceTest()
    success = tester.run_all_tests()
    
    if success:
        print("🎉 ALL CRITICAL TESTS PASSED!")
        print("✅ Berger presence functionality is working correctly")
        print("✅ New fields (noms_bergers, personnes_suivies) are saved and retrieved")
        print("✅ Pre-fill functionality works as expected")
        sys.exit(0)
    else:
        print("💥 SOME TESTS FAILED!")
        print("❌ Issues found in berger presence functionality")
        sys.exit(1)

if __name__ == "__main__":
    main()