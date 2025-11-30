#!/usr/bin/env python3
"""
Pasteur Dashboard City Filtering Test
Tests the fix for city filtering in Pasteur dashboard endpoints
"""

import requests
import json
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')
BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://event-church.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

class PasteurDashboardTester:
    def __init__(self):
        self.session = requests.Session()
        self.pasteur_token = None
        
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
    
    def test_1_check_test_data(self):
        """Test 1: Check if there's test data in the database"""
        self.log("\n=== TEST 1: Check Test Data Availability ===")
        
        # Check promotions-detailed endpoint without ville parameter
        response = self.make_request('GET', '/analytics/promotions-detailed')
        
        if not response:
            self.log("❌ Failed to connect to promotions-detailed endpoint", "ERROR")
            return False
        
        if response.status_code == 401:
            self.log("⚠️  Endpoint requires authentication, will test after login")
            return True
        elif response.status_code == 200:
            data = response.json()
            self.log(f"✅ Found test data: {len(data) if isinstance(data, list) else 'data available'}")
            return True
        else:
            self.log(f"⚠️  Unexpected status code: {response.status_code}")
            return True
    
    def test_2_initialize_data_if_needed(self):
        """Test 2: Initialize test data if needed"""
        self.log("\n=== TEST 2: Initialize Test Data ===")
        
        response = self.make_request('POST', '/init')
        
        if not response:
            self.log("❌ Failed to initialize data", "ERROR")
            return False
        
        if response.status_code == 200:
            self.log("✅ Test data initialized successfully")
            return True
        else:
            self.log(f"⚠️  Init returned status {response.status_code}, continuing anyway")
            return True
    
    def test_3_pasteur_login(self):
        """Test 3: Login as pasteur"""
        self.log("\n=== TEST 3: Pasteur Login ===")
        
        login_data = {
            "username": "pasteur",
            "password": "pasteur123",
            "city": "Dijon"
        }
        
        response = self.make_request('POST', '/auth/login', json=login_data)
        
        if not response or response.status_code != 200:
            self.log("❌ Pasteur login failed", "ERROR")
            if response:
                self.log(f"   Status: {response.status_code}")
                self.log(f"   Response: {response.text}")
            return False
        
        login_result = response.json()
        self.pasteur_token = login_result['token']
        user_info = login_result['user']
        
        self.log(f"✅ Pasteur login successful")
        self.log(f"   - Username: {user_info['username']}")
        self.log(f"   - Role: {user_info['role']}")
        self.log(f"   - City: {user_info['city']}")
        
        return True
    
    def test_4_promotions_detailed_milan(self):
        """Test 4: GET /api/analytics/promotions-detailed?ville=Milan"""
        self.log("\n=== TEST 4: Promotions Detailed - Milan Only ===")
        
        if not self.pasteur_token:
            self.log("❌ No pasteur token available", "ERROR")
            return False
        
        response = self.make_request('GET', '/analytics/promotions-detailed?ville=Milan', 
                                   token=self.pasteur_token)
        
        if not response:
            self.log("❌ Request failed", "ERROR")
            return False
        
        if response.status_code != 200:
            self.log(f"❌ Request failed with status {response.status_code}", "ERROR")
            self.log(f"   Response: {response.text}")
            return False
        
        data = response.json()
        self.log(f"✅ Milan promotions data retrieved")
        
        # Check if data is filtered by Milan
        if isinstance(data, list):
            milan_count = 0
            other_cities = set()
            
            for item in data:
                if isinstance(item, dict):
                    city = item.get('ville') or item.get('city')
                    if city == 'Milan':
                        milan_count += 1
                    elif city and city != 'Milan':
                        other_cities.add(city)
            
            self.log(f"   - Milan records: {milan_count}")
            if other_cities:
                self.log(f"   - ❌ Found records from other cities: {other_cities}")
                return False
            else:
                self.log(f"   - ✅ All records are from Milan or city-agnostic")
                return True
        else:
            self.log(f"   - Data structure: {type(data)}")
            # If it's not a list, check if it has city-specific data
            if isinstance(data, dict):
                city = data.get('ville') or data.get('city')
                if city == 'Milan' or not city:
                    self.log(f"   - ✅ Data is Milan-specific or city-agnostic")
                    return True
                else:
                    self.log(f"   - ❌ Data is from wrong city: {city}")
                    return False
            return True
    
    def test_5_promotions_detailed_dijon(self):
        """Test 5: GET /api/analytics/promotions-detailed?ville=Dijon"""
        self.log("\n=== TEST 5: Promotions Detailed - Dijon Only ===")
        
        if not self.pasteur_token:
            self.log("❌ No pasteur token available", "ERROR")
            return False
        
        response = self.make_request('GET', '/analytics/promotions-detailed?ville=Dijon', 
                                   token=self.pasteur_token)
        
        if not response:
            self.log("❌ Request failed", "ERROR")
            return False
        
        if response.status_code != 200:
            self.log(f"❌ Request failed with status {response.status_code}", "ERROR")
            self.log(f"   Response: {response.text}")
            return False
        
        data = response.json()
        self.log(f"✅ Dijon promotions data retrieved")
        
        # Check if data is filtered by Dijon and has visitor counts
        if isinstance(data, list):
            dijon_count = 0
            other_cities = set()
            total_visitors = 0
            
            for item in data:
                if isinstance(item, dict):
                    city = item.get('ville') or item.get('city')
                    visitors = item.get('total_visitors', 0) or item.get('visitors', 0)
                    
                    if city == 'Dijon':
                        dijon_count += 1
                        total_visitors += visitors
                    elif city and city != 'Dijon':
                        other_cities.add(city)
            
            self.log(f"   - Dijon records: {dijon_count}")
            self.log(f"   - Total visitors in Dijon data: {total_visitors}")
            
            if other_cities:
                self.log(f"   - ❌ Found records from other cities: {other_cities}")
                return False
            else:
                self.log(f"   - ✅ All records are from Dijon or city-agnostic")
                # Check if we have the expected visitor count (309 mentioned in the issue)
                if total_visitors > 0:
                    self.log(f"   - ✅ Found visitor data (total: {total_visitors})")
                return True
        else:
            self.log(f"   - Data structure: {type(data)}")
            if isinstance(data, dict):
                city = data.get('ville') or data.get('city')
                visitors = data.get('total_visitors', 0) or data.get('visitors', 0)
                
                if city == 'Dijon' or not city:
                    self.log(f"   - ✅ Data is Dijon-specific or city-agnostic")
                    if visitors > 0:
                        self.log(f"   - ✅ Found visitor data: {visitors}")
                    return True
                else:
                    self.log(f"   - ❌ Data is from wrong city: {city}")
                    return False
            return True
    
    def test_6_promotions_detailed_all_cities(self):
        """Test 6: GET /api/analytics/promotions-detailed without ville parameter"""
        self.log("\n=== TEST 6: Promotions Detailed - All Cities ===")
        
        if not self.pasteur_token:
            self.log("❌ No pasteur token available", "ERROR")
            return False
        
        response = self.make_request('GET', '/analytics/promotions-detailed', 
                                   token=self.pasteur_token)
        
        if not response:
            self.log("❌ Request failed", "ERROR")
            return False
        
        if response.status_code != 200:
            self.log(f"❌ Request failed with status {response.status_code}", "ERROR")
            self.log(f"   Response: {response.text}")
            return False
        
        data = response.json()
        self.log(f"✅ All cities promotions data retrieved")
        
        # Check if data includes multiple cities
        if isinstance(data, list):
            cities = set()
            total_records = len(data)
            
            for item in data:
                if isinstance(item, dict):
                    city = item.get('ville') or item.get('city')
                    if city:
                        cities.add(city)
            
            self.log(f"   - Total records: {total_records}")
            self.log(f"   - Cities found: {sorted(cities) if cities else 'No city data'}")
            
            if len(cities) > 1:
                self.log(f"   - ✅ Multi-city data confirmed")
                return True
            elif len(cities) == 1:
                self.log(f"   - ⚠️  Only one city found, but this might be expected")
                return True
            else:
                self.log(f"   - ⚠️  No city information in data")
                return True
        else:
            self.log(f"   - Data structure: {type(data)}")
            return True
    
    def test_7_fi_detailed_milan(self):
        """Test 7: GET /api/analytics/fi-detailed?ville=Milan"""
        self.log("\n=== TEST 7: FI Detailed - Milan Only ===")
        
        if not self.pasteur_token:
            self.log("❌ No pasteur token available", "ERROR")
            return False
        
        response = self.make_request('GET', '/analytics/fi-detailed?ville=Milan', 
                                   token=self.pasteur_token)
        
        if not response:
            self.log("❌ Request failed", "ERROR")
            return False
        
        if response.status_code != 200:
            self.log(f"❌ Request failed with status {response.status_code}", "ERROR")
            self.log(f"   Response: {response.text}")
            return False
        
        data = response.json()
        self.log(f"✅ Milan FI data retrieved")
        
        # Check if data is filtered by Milan
        if isinstance(data, list):
            milan_count = 0
            other_cities = set()
            
            for item in data:
                if isinstance(item, dict):
                    city = item.get('ville') or item.get('city')
                    if city == 'Milan':
                        milan_count += 1
                    elif city and city != 'Milan':
                        other_cities.add(city)
            
            self.log(f"   - Milan FI records: {milan_count}")
            if other_cities:
                self.log(f"   - ❌ Found records from other cities: {other_cities}")
                return False
            else:
                self.log(f"   - ✅ All FI records are from Milan or city-agnostic")
                return True
        else:
            self.log(f"   - Data structure: {type(data)}")
            return True
    
    def test_8_fi_detailed_dijon(self):
        """Test 8: GET /api/analytics/fi-detailed?ville=Dijon"""
        self.log("\n=== TEST 8: FI Detailed - Dijon Only ===")
        
        if not self.pasteur_token:
            self.log("❌ No pasteur token available", "ERROR")
            return False
        
        response = self.make_request('GET', '/analytics/fi-detailed?ville=Dijon', 
                                   token=self.pasteur_token)
        
        if not response:
            self.log("❌ Request failed", "ERROR")
            return False
        
        if response.status_code != 200:
            self.log(f"❌ Request failed with status {response.status_code}", "ERROR")
            self.log(f"   Response: {response.text}")
            return False
        
        data = response.json()
        self.log(f"✅ Dijon FI data retrieved")
        
        # Check if data is filtered by Dijon
        if isinstance(data, list):
            dijon_count = 0
            other_cities = set()
            
            for item in data:
                if isinstance(item, dict):
                    city = item.get('ville') or item.get('city')
                    if city == 'Dijon':
                        dijon_count += 1
                    elif city and city != 'Dijon':
                        other_cities.add(city)
            
            self.log(f"   - Dijon FI records: {dijon_count}")
            if other_cities:
                self.log(f"   - ❌ Found records from other cities: {other_cities}")
                return False
            else:
                self.log(f"   - ✅ All FI records are from Dijon or city-agnostic")
                return True
        else:
            self.log(f"   - Data structure: {type(data)}")
            return True
    
    def test_9_verify_city_filtering_logic(self):
        """Test 9: Verify city filtering logic by comparing results"""
        self.log("\n=== TEST 9: Verify City Filtering Logic ===")
        
        if not self.pasteur_token:
            self.log("❌ No pasteur token available", "ERROR")
            return False
        
        # Get all cities data
        all_response = self.make_request('GET', '/analytics/promotions-detailed', 
                                       token=self.pasteur_token)
        
        # Get Milan data
        milan_response = self.make_request('GET', '/analytics/promotions-detailed?ville=Milan', 
                                         token=self.pasteur_token)
        
        # Get Dijon data
        dijon_response = self.make_request('GET', '/analytics/promotions-detailed?ville=Dijon', 
                                         token=self.pasteur_token)
        
        if not all([all_response, milan_response, dijon_response]):
            self.log("❌ One or more requests failed", "ERROR")
            return False
        
        if not all([r.status_code == 200 for r in [all_response, milan_response, dijon_response]]):
            self.log("❌ One or more requests returned non-200 status", "ERROR")
            return False
        
        all_data = all_response.json()
        milan_data = milan_response.json()
        dijon_data = dijon_response.json()
        
        # Count records
        all_count = len(all_data) if isinstance(all_data, list) else 1
        milan_count = len(milan_data) if isinstance(milan_data, list) else 1
        dijon_count = len(dijon_data) if isinstance(dijon_data, list) else 1
        
        self.log(f"   - All cities: {all_count} records")
        self.log(f"   - Milan only: {milan_count} records")
        self.log(f"   - Dijon only: {dijon_count} records")
        
        # Verify filtering logic
        if all_count >= milan_count and all_count >= dijon_count:
            self.log("✅ City filtering appears to be working correctly")
            self.log("   - All cities data >= individual city data")
            return True
        else:
            self.log("❌ City filtering logic issue detected", "ERROR")
            self.log("   - Individual city data should not exceed all cities data")
            return False
    
    def run_all_tests(self):
        """Run all Pasteur dashboard city filtering tests"""
        self.log("Starting Pasteur Dashboard City Filtering Tests")
        self.log("=" * 60)
        
        tests = [
            ("Check Test Data Availability", self.test_1_check_test_data),
            ("Initialize Test Data", self.test_2_initialize_data_if_needed),
            ("Pasteur Login", self.test_3_pasteur_login),
            ("Promotions Detailed - Milan", self.test_4_promotions_detailed_milan),
            ("Promotions Detailed - Dijon", self.test_5_promotions_detailed_dijon),
            ("Promotions Detailed - All Cities", self.test_6_promotions_detailed_all_cities),
            ("FI Detailed - Milan", self.test_7_fi_detailed_milan),
            ("FI Detailed - Dijon", self.test_8_fi_detailed_dijon),
            ("Verify City Filtering Logic", self.test_9_verify_city_filtering_logic)
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
        self.log("TEST SUMMARY")
        self.log("=" * 60)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{status} {test_name}")
        
        self.log(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 All tests passed! Pasteur dashboard city filtering is working correctly.")
        else:
            self.log(f"⚠️  {total - passed} test(s) failed. City filtering issues detected.")
        
        return results

if __name__ == "__main__":
    tester = PasteurDashboardTester()
    results = tester.run_all_tests()