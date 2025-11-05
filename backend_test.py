#!/usr/bin/env python3
"""
Backend API Testing for Church Visitor Management System
Tests JWT role authentication fixes and fidelisation endpoints
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

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.tokens = {}
        self.test_users = {}
        self.test_visitors = []
        
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
            
    def setup_test_data(self):
        """Initialize test data and users"""
        self.log("Setting up test data...")
        
        # Initialize database
        response = self.make_request('POST', '/init')
        if response and response.status_code == 200:
            self.log("Database initialized successfully")
        
        # Create test referent user with assigned month
        test_referent_data = {
            "username": "test_referent_jan",
            "password": "test123",
            "city": "Dijon",
            "role": "referent",
            "assigned_month": "2025-01"
        }
        
        # Login as admin first to create referent
        admin_login = self.make_request('POST', '/auth/login', json={
            "username": "admin",
            "password": "admin123",
            "city": "Dijon"
        })
        
        if admin_login and admin_login.status_code == 200:
            admin_token = admin_login.json()['token']
            self.tokens['admin'] = admin_token
            
            # Create test referent
            create_referent = self.make_request('POST', '/users/referent', 
                                              token=admin_token, 
                                              json=test_referent_data)
            if create_referent and create_referent.status_code == 200:
                self.log("Test referent created successfully")
            else:
                self.log("Referent might already exist or creation failed")
        
        # Create test visitors for different months
        test_visitors = [
            {
                "firstname": "Jean",
                "lastname": "Dupont", 
                "city": "Dijon",
                "types": ["Nouveau Arrivant"],
                "arrival_channel": "Ami",
                "visit_date": "2025-01-15"  # January 2025
            },
            {
                "firstname": "Marie",
                "lastname": "Martin",
                "city": "Dijon", 
                "types": ["Nouveau Converti"],
                "arrival_channel": "Internet",
                "visit_date": "2025-02-10"  # February 2025
            },
            {
                "firstname": "Pierre",
                "lastname": "Bernard",
                "city": "Dijon",
                "types": ["De Passage"],
                "arrival_channel": "Famille",
                "visit_date": "2025-01-20"  # January 2025
            }
        ]
        
        for visitor_data in test_visitors:
            response = self.make_request('POST', '/visitors', 
                                       token=self.tokens.get('admin'),
                                       json=visitor_data)
            if response and response.status_code == 200:
                visitor = response.json()
                self.test_visitors.append(visitor)
                self.log(f"Created test visitor: {visitor_data['firstname']} {visitor_data['lastname']}")
        
        self.log(f"Setup complete. Created {len(self.test_visitors)} test visitors")
        
    def test_referent_login_without_department(self):
        """Test 1: Referent login without department selection"""
        self.log("\n=== TEST 1: Referent Login Without Department ===")
        
        login_data = {
            "username": "test_referent_jan",
            "password": "test123", 
            "city": "Dijon"
            # No department specified
        }
        
        response = self.make_request('POST', '/auth/login', json=login_data)
        
        if not response or response.status_code != 200:
            self.log("❌ Referent login failed", "ERROR")
            return False
            
        login_result = response.json()
        token = login_result['token']
        user_info = login_result['user']
        
        self.tokens['referent_no_dept'] = token
        
        # Verify user info
        expected_role = "referent"
        actual_role = user_info['role']
        
        if actual_role == expected_role:
            self.log(f"✅ Login successful - Role: {actual_role}, Assigned Month: {user_info.get('assigned_month')}")
            return True
        else:
            self.log(f"❌ Wrong role returned. Expected: {expected_role}, Got: {actual_role}", "ERROR")
            return False
            
    def test_referent_login_with_promotions_department(self):
        """Test 2: Referent login with promotions department"""
        self.log("\n=== TEST 2: Referent Login With Promotions Department ===")
        
        login_data = {
            "username": "test_referent_jan",
            "password": "test123",
            "city": "Dijon", 
            "department": "promotions"
        }
        
        response = self.make_request('POST', '/auth/login', json=login_data)
        
        if not response or response.status_code != 200:
            self.log("❌ Referent login with promotions failed", "ERROR")
            return False
            
        login_result = response.json()
        token = login_result['token']
        user_info = login_result['user']
        
        self.tokens['referent_promotions'] = token
        
        # Verify role is now promotions
        expected_role = "promotions"
        actual_role = user_info['role']
        
        if actual_role == expected_role:
            self.log(f"✅ Login successful - Role changed to: {actual_role}")
            return True
        else:
            self.log(f"❌ Role not changed. Expected: {expected_role}, Got: {actual_role}", "ERROR")
            return False
            
    def test_visitor_filtering_referent_role(self):
        """Test 3: Visitor filtering for referent role (should only see assigned month)"""
        self.log("\n=== TEST 3: Visitor Filtering - Referent Role ===")
        
        token = self.tokens.get('referent_no_dept')
        if not token:
            self.log("❌ No referent token available", "ERROR")
            return False
            
        response = self.make_request('GET', '/visitors', token=token)
        
        if not response or response.status_code != 200:
            self.log("❌ Failed to get visitors", "ERROR")
            return False
            
        visitors = response.json()
        self.log(f"Referent sees {len(visitors)} visitors")
        
        # Check that all visitors are from assigned month (2025-01)
        january_visitors = [v for v in visitors if v.get('assigned_month') == '2025-01']
        non_january_visitors = [v for v in visitors if v.get('assigned_month') != '2025-01']
        
        if len(non_january_visitors) == 0 and len(january_visitors) > 0:
            self.log(f"✅ Filtering works correctly - Only January visitors shown: {len(january_visitors)}")
            for visitor in january_visitors:
                self.log(f"   - {visitor['firstname']} {visitor['lastname']} (Month: {visitor['assigned_month']})")
            return True
        else:
            self.log(f"❌ Filtering failed - Found {len(non_january_visitors)} visitors from other months", "ERROR")
            for visitor in non_january_visitors:
                self.log(f"   - {visitor['firstname']} {visitor['lastname']} (Month: {visitor['assigned_month']})")
            return False
            
    def test_visitor_filtering_promotions_role(self):
        """Test 4: Visitor filtering for promotions role (should see all visitors)"""
        self.log("\n=== TEST 4: Visitor Filtering - Promotions Role ===")
        
        token = self.tokens.get('referent_promotions')
        if not token:
            self.log("❌ No promotions token available", "ERROR")
            return False
            
        response = self.make_request('GET', '/visitors', token=token)
        
        if not response or response.status_code != 200:
            self.log("❌ Failed to get visitors", "ERROR")
            return False
            
        visitors = response.json()
        self.log(f"Promotions role sees {len(visitors)} visitors")
        
        # Should see visitors from all months
        months = set(v.get('assigned_month') for v in visitors)
        
        if len(months) > 1 or (len(months) == 1 and len(visitors) >= 2):
            self.log(f"✅ Promotions can see all visitors - Months: {sorted(months)}")
            for visitor in visitors:
                self.log(f"   - {visitor['firstname']} {visitor['lastname']} (Month: {visitor['assigned_month']})")
            return True
        else:
            self.log(f"❌ Promotions role still filtered - Only seeing months: {months}", "ERROR")
            return False
            
    def test_fidelisation_referent_endpoint(self):
        """Test 5: Fidelisation referent endpoint"""
        self.log("\n=== TEST 5: Fidelisation Referent Endpoint ===")
        
        token = self.tokens.get('referent_no_dept')
        if not token:
            self.log("❌ No referent token available", "ERROR")
            return False
            
        response = self.make_request('GET', '/fidelisation/referent', token=token)
        
        if not response:
            self.log("❌ Request failed", "ERROR")
            return False
            
        if response.status_code == 200:
            data = response.json()
            self.log(f"✅ Fidelisation referent endpoint accessible")
            self.log(f"   - Total visitors: {data.get('total_visitors', 0)}")
            self.log(f"   - Weekly rates: {len(data.get('weekly_rates', []))} weeks")
            self.log(f"   - Monthly average: {data.get('monthly_average', 0)}%")
            return True
        else:
            self.log(f"❌ Fidelisation referent endpoint failed - Status: {response.status_code}", "ERROR")
            if response.text:
                self.log(f"   Error: {response.text}")
            return False
            
    def test_fidelisation_admin_endpoint(self):
        """Test 6: Fidelisation admin endpoint with promotions role"""
        self.log("\n=== TEST 6: Fidelisation Admin Endpoint ===")
        
        token = self.tokens.get('referent_promotions')
        if not token:
            self.log("❌ No promotions token available", "ERROR")
            return False
            
        response = self.make_request('GET', '/fidelisation/admin', token=token)
        
        if not response:
            self.log("❌ Request failed", "ERROR")
            return False
            
        if response.status_code == 200:
            data = response.json()
            self.log(f"✅ Fidelisation admin endpoint accessible")
            self.log(f"   - Found data for {len(data)} referents")
            for referent_data in data:
                self.log(f"   - Referent: {referent_data.get('referent_username')} (Month: {referent_data.get('assigned_month')})")
            return True
        else:
            self.log(f"❌ Fidelisation admin endpoint failed - Status: {response.status_code}", "ERROR")
            if response.text:
                self.log(f"   Error: {response.text}")
            return False
            
    def test_permission_boundaries(self):
        """Test 7: Permission boundaries - referent trying to access admin endpoint"""
        self.log("\n=== TEST 7: Permission Boundaries ===")
        
        token = self.tokens.get('referent_no_dept')
        if not token:
            self.log("❌ No referent token available", "ERROR")
            return False
            
        # Referent should NOT be able to access admin fidelisation endpoint
        try:
            url = f"{API_URL}/fidelisation/admin"
            headers = {'Authorization': f'Bearer {token}'}
            response = self.session.get(url, headers=headers)
            self.log(f"GET /fidelisation/admin -> {response.status_code}")
            
            if response.status_code == 403:
                self.log("✅ Permission boundary works - Referent correctly denied access to admin endpoint")
                return True
            else:
                self.log(f"❌ Permission boundary failed - Status: {response.status_code} (expected 403)", "ERROR")
                if response.text:
                    self.log(f"   Response: {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ Request failed with exception: {e}", "ERROR")
            return False
            
    def test_accueil_role_limited_view(self):
        """Test 8: Accueil role limited view"""
        self.log("\n=== TEST 8: Accueil Role Limited View ===")
        
        # Login as referent with accueil department
        login_data = {
            "username": "test_referent_jan",
            "password": "test123",
            "city": "Dijon",
            "department": "accueil"
        }
        
        response = self.make_request('POST', '/auth/login', json=login_data)
        
        if not response or response.status_code != 200:
            self.log("❌ Accueil login failed", "ERROR")
            return False
            
        token = response.json()['token']
        
        # Test visitors endpoint with accueil role
        visitors_response = self.make_request('GET', '/visitors', token=token)
        
        if not visitors_response or visitors_response.status_code != 200:
            self.log("❌ Failed to get visitors with accueil role", "ERROR")
            return False
            
        visitors = visitors_response.json()
        
        # Check if response contains only limited fields
        if visitors and len(visitors) > 0:
            first_visitor = visitors[0]
            expected_fields = {'id', 'firstname', 'lastname', 'arrival_channel', 'visit_date', 'city'}
            actual_fields = set(first_visitor.keys())
            
            # Should only have limited fields
            if actual_fields == expected_fields:
                self.log("✅ Accueil role correctly returns limited view")
                self.log(f"   - Fields returned: {sorted(actual_fields)}")
                return True
            else:
                self.log(f"❌ Accueil role returns too many fields", "ERROR")
                self.log(f"   - Expected: {sorted(expected_fields)}")
                self.log(f"   - Got: {sorted(actual_fields)}")
                return False
        else:
            self.log("✅ Accueil role works (no visitors to check field limitation)")
            return True
            
    def test_visitor_crud_operations(self):
        """Test 9: Visitor CRUD operations"""
        self.log("\n=== TEST 9: Visitor CRUD Operations ===")
        
        token = self.tokens.get('admin')
        if not token:
            self.log("❌ No admin token available", "ERROR")
            return False
        
        # Create a new visitor
        visitor_data = {
            "firstname": "Test",
            "lastname": "Visitor",
            "city": "Dijon",
            "types": ["Nouveau Arrivant"],
            "phone": "+33123456789",
            "email": "test@example.com",
            "arrival_channel": "Test Channel",
            "visit_date": "2025-01-25"
        }
        
        # POST /api/visitors
        create_response = self.make_request('POST', '/visitors', token=token, json=visitor_data)
        if not create_response or create_response.status_code != 200:
            self.log("❌ Failed to create visitor", "ERROR")
            return False
        
        visitor = create_response.json()
        visitor_id = visitor['id']
        self.log(f"✅ Created visitor: {visitor_id}")
        
        # GET /api/visitors/{visitor_id}
        get_response = self.make_request('GET', f'/visitors/{visitor_id}', token=token)
        if not get_response or get_response.status_code != 200:
            self.log("❌ Failed to retrieve visitor", "ERROR")
            return False
        
        retrieved_visitor = get_response.json()
        if retrieved_visitor['id'] == visitor_id:
            self.log("✅ Retrieved visitor successfully")
        else:
            self.log("❌ Retrieved visitor ID mismatch", "ERROR")
            return False
        
        # PUT /api/visitors/{visitor_id}
        update_data = {
            "phone": "+33987654321",
            "email": "updated@example.com"
        }
        update_response = self.make_request('PUT', f'/visitors/{visitor_id}', token=token, json=update_data)
        if not update_response or update_response.status_code != 200:
            self.log("❌ Failed to update visitor", "ERROR")
            return False
        
        self.log("✅ Updated visitor successfully")
        
        # DELETE /api/visitors/{visitor_id}
        delete_response = self.make_request('DELETE', f'/visitors/{visitor_id}', token=token)
        if not delete_response or delete_response.status_code != 200:
            self.log("❌ Failed to delete visitor", "ERROR")
            return False
        
        self.log("✅ Deleted visitor successfully")
        return True
    
    def test_user_management_endpoints(self):
        """Test 10: User management endpoints"""
        self.log("\n=== TEST 10: User Management Endpoints ===")
        
        token = self.tokens.get('admin')
        if not token:
            self.log("❌ No admin token available", "ERROR")
            return False
        
        # GET /api/users/referents
        referents_response = self.make_request('GET', '/users/referents', token=token)
        if not referents_response or referents_response.status_code != 200:
            self.log("❌ Failed to get referents list", "ERROR")
            return False
        
        referents = referents_response.json()
        self.log(f"✅ Retrieved {len(referents)} referents")
        
        # Create a new referent for testing
        new_referent_data = {
            "username": "test_referent_crud",
            "password": "test123",
            "city": "Dijon",
            "role": "referent",
            "assigned_month": "2025-03"
        }
        
        create_referent_response = self.make_request('POST', '/users/referent', token=token, json=new_referent_data)
        if create_referent_response and create_referent_response.status_code == 200:
            referent_id = create_referent_response.json()['id']
            self.log(f"✅ Created test referent: {referent_id}")
            
            # Update referent
            update_data = {
                "assigned_month": "2025-04",
                "permissions": {
                    "can_view_all_months": True,
                    "can_edit_visitors": True
                }
            }
            update_response = self.make_request('PUT', f'/users/{referent_id}', token=token, json=update_data)
            if update_response and update_response.status_code == 200:
                self.log("✅ Updated referent successfully")
            else:
                self.log("❌ Failed to update referent", "ERROR")
                return False
            
            # Delete referent
            delete_response = self.make_request('DELETE', f'/users/{referent_id}', token=token)
            if delete_response and delete_response.status_code == 200:
                self.log("✅ Deleted referent successfully")
            else:
                self.log("❌ Failed to delete referent", "ERROR")
                return False
        else:
            self.log("✅ Referent creation skipped (might already exist)")
        
        return True
    
    def test_city_management_endpoints(self):
        """Test 11: City management endpoints"""
        self.log("\n=== TEST 11: City Management Endpoints ===")
        
        token = self.tokens.get('admin')
        if not token:
            self.log("❌ No admin token available", "ERROR")
            return False
        
        # GET /api/cities
        cities_response = self.make_request('GET', '/cities', token=token)
        if not cities_response or cities_response.status_code != 200:
            self.log("❌ Failed to get cities list", "ERROR")
            return False
        
        cities = cities_response.json()
        self.log(f"✅ Retrieved {len(cities)} cities")
        
        # Create a test city
        test_city_data = {"name": "Test City CRUD"}
        create_city_response = self.make_request('POST', '/cities', token=token, json=test_city_data)
        
        if create_city_response and create_city_response.status_code == 200:
            city = create_city_response.json()
            city_id = city['id']
            self.log(f"✅ Created test city: {city_id}")
            
            # Update city
            update_city_data = {"name": "Updated Test City"}
            update_response = self.make_request('PUT', f'/cities/{city_id}', token=token, json=update_city_data)
            if update_response and update_response.status_code == 200:
                self.log("✅ Updated city successfully")
            else:
                self.log("❌ Failed to update city", "ERROR")
                return False
            
            # Delete city
            delete_response = self.make_request('DELETE', f'/cities/{city_id}', token=token)
            if delete_response and delete_response.status_code == 200:
                self.log("✅ Deleted city successfully")
            else:
                self.log("❌ Failed to delete city", "ERROR")
                return False
        else:
            self.log("✅ City creation skipped (might already exist)")
        
        return True

    def run_all_tests(self):
        """Run all backend tests"""
        self.log("Starting Backend API Tests for JWT Role Authentication Fix")
        self.log("=" * 60)
        
        # Setup
        self.setup_test_data()
        
        # Run tests
        tests = [
            ("Referent Login Without Department", self.test_referent_login_without_department),
            ("Referent Login With Promotions Department", self.test_referent_login_with_promotions_department),
            ("Visitor Filtering - Referent Role", self.test_visitor_filtering_referent_role),
            ("Visitor Filtering - Promotions Role", self.test_visitor_filtering_promotions_role),
            ("Fidelisation Referent Endpoint", self.test_fidelisation_referent_endpoint),
            ("Fidelisation Admin Endpoint", self.test_fidelisation_admin_endpoint),
            ("Permission Boundaries", self.test_permission_boundaries),
            ("Accueil Role Limited View", self.test_accueil_role_limited_view),
            ("Visitor CRUD Operations", self.test_visitor_crud_operations),
            ("User Management Endpoints", self.test_user_management_endpoints),
            ("City Management Endpoints", self.test_city_management_endpoints)
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
            self.log("🎉 All tests passed! JWT role authentication fix is working correctly.")
        else:
            self.log(f"⚠️  {total - passed} test(s) failed. Issues need to be addressed.")
        
        return results

if __name__ == "__main__":
    tester = BackendTester()
    results = tester.run_all_tests()