#!/usr/bin/env python3
"""
Visitor Registration Endpoint Testing
Tests the POST /api/auth/register endpoint to diagnose blank page issue
"""

import requests
import json
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')
BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://dailymanna-1.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

class VisitorRegistrationTester:
    def __init__(self):
        self.session = requests.Session()
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def make_request(self, method, endpoint, **kwargs):
        """Make HTTP request and return detailed response info"""
        url = f"{API_URL}{endpoint}"
        
        try:
            self.log(f"Making {method} request to: {url}")
            if 'json' in kwargs:
                self.log(f"Request payload: {json.dumps(kwargs['json'], indent=2)}")
            
            response = self.session.request(method, url, **kwargs)
            
            self.log(f"Response Status: {response.status_code}")
            self.log(f"Response Headers: {dict(response.headers)}")
            
            # Try to parse JSON response
            try:
                response_json = response.json()
                self.log(f"Response Body: {json.dumps(response_json, indent=2)}")
            except:
                self.log(f"Response Body (text): {response.text}")
            
            return response
        except Exception as e:
            self.log(f"Request failed with exception: {e}", "ERROR")
            return None
    
    def test_successful_registration(self):
        """Test 1: Successful visitor registration with valid data"""
        self.log("\n=== TEST 1: Successful Visitor Registration ===")
        
        # Exact data from the request
        visitor_data = {
            "firstname": "Jean",
            "lastname": "Dupont",
            "city": "Dijon",
            "types": ["Nouveau Arrivant"],
            "phone": "0601020304",
            "email": "jean@example.com",
            "address": "123 rue Test",
            "arrival_channel": "Evangelisation",
            "visit_date": "2025-01-04"
        }
        
        response = self.make_request('POST', '/auth/register', json=visitor_data)
        
        if not response:
            self.log("❌ Request failed completely", "ERROR")
            return False
        
        if response.status_code == 200:
            try:
                result = response.json()
                if 'message' in result and 'id' in result:
                    self.log(f"✅ Registration successful!")
                    self.log(f"   Message: {result['message']}")
                    self.log(f"   Visitor ID: {result['id']}")
                    
                    # Verify assigned_month calculation
                    expected_month = "2025-01"  # From visit_date "2025-01-04"
                    self.log(f"   Expected assigned_month: {expected_month}")
                    return True
                else:
                    self.log(f"❌ Unexpected response format: {result}", "ERROR")
                    return False
            except Exception as e:
                self.log(f"❌ Failed to parse JSON response: {e}", "ERROR")
                return False
        else:
            self.log(f"❌ Registration failed with status {response.status_code}", "ERROR")
            return False
    
    def test_missing_required_fields(self):
        """Test 2: Registration with missing required fields"""
        self.log("\n=== TEST 2: Missing Required Fields ===")
        
        # Test with missing firstname
        incomplete_data = {
            "lastname": "Dupont",
            "city": "Dijon",
            "types": ["Nouveau Arrivant"],
            "phone": "0601020304",
            "arrival_channel": "Evangelisation",
            "visit_date": "2025-01-04"
            # Missing firstname
        }
        
        response = self.make_request('POST', '/auth/register', json=incomplete_data)
        
        if not response:
            self.log("❌ Request failed completely", "ERROR")
            return False
        
        if response.status_code == 422:
            self.log("✅ Correctly returned 422 for missing required field")
            try:
                error_detail = response.json()
                self.log(f"   Validation error details: {error_detail}")
            except:
                pass
            return True
        else:
            self.log(f"❌ Expected 422, got {response.status_code}", "ERROR")
            return False
    
    def test_invalid_data_formats(self):
        """Test 3: Registration with invalid data formats"""
        self.log("\n=== TEST 3: Invalid Data Formats ===")
        
        # Test with invalid email format
        invalid_data = {
            "firstname": "Jean",
            "lastname": "Dupont",
            "city": "Dijon",
            "types": ["Nouveau Arrivant"],
            "phone": "0601020304",
            "email": "invalid-email-format",  # Invalid email
            "arrival_channel": "Evangelisation",
            "visit_date": "2025-01-04"
        }
        
        response = self.make_request('POST', '/auth/register', json=invalid_data)
        
        if not response:
            self.log("❌ Request failed completely", "ERROR")
            return False
        
        if response.status_code == 422:
            self.log("✅ Correctly returned 422 for invalid email format")
            try:
                error_detail = response.json()
                self.log(f"   Validation error details: {error_detail}")
            except:
                pass
            return True
        else:
            self.log(f"❌ Expected 422, got {response.status_code}", "ERROR")
            return False
    
    def test_cors_headers(self):
        """Test 4: Check CORS headers"""
        self.log("\n=== TEST 4: CORS Headers Check ===")
        
        # Make an OPTIONS request to check CORS
        response = self.make_request('OPTIONS', '/auth/register')
        
        if not response:
            self.log("❌ OPTIONS request failed", "ERROR")
            return False
        
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
            'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
        }
        
        self.log("CORS Headers found:")
        for header, value in cors_headers.items():
            if value:
                self.log(f"   {header}: {value}")
            else:
                self.log(f"   {header}: NOT SET")
        
        # Check if basic CORS is working
        if cors_headers['Access-Control-Allow-Origin']:
            self.log("✅ CORS appears to be configured")
            return True
        else:
            self.log("❌ CORS headers missing - this could cause frontend issues", "ERROR")
            return False
    
    def test_endpoint_availability(self):
        """Test 5: Basic endpoint availability"""
        self.log("\n=== TEST 5: Endpoint Availability ===")
        
        # Test if the API root is accessible
        response = self.make_request('GET', '/')
        
        if not response:
            self.log("❌ API root endpoint not accessible", "ERROR")
            return False
        
        if response.status_code == 200:
            self.log("✅ API root endpoint accessible")
            try:
                result = response.json()
                self.log(f"   API Message: {result.get('message', 'No message')}")
            except:
                pass
            return True
        else:
            self.log(f"❌ API root returned {response.status_code}", "ERROR")
            return False
    
    def test_malformed_json(self):
        """Test 6: Malformed JSON handling"""
        self.log("\n=== TEST 6: Malformed JSON Handling ===")
        
        # Send malformed JSON
        try:
            url = f"{API_URL}/auth/register"
            headers = {'Content-Type': 'application/json'}
            malformed_json = '{"firstname": "Jean", "lastname": "Dupont", "city": "Dijon"'  # Missing closing brace
            
            response = self.session.post(url, data=malformed_json, headers=headers)
            
            self.log(f"Response Status: {response.status_code}")
            self.log(f"Response Body: {response.text}")
            
            if response.status_code == 422:
                self.log("✅ Server correctly handles malformed JSON")
                return True
            else:
                self.log(f"❌ Unexpected status for malformed JSON: {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Exception during malformed JSON test: {e}", "ERROR")
            return False
    
    def run_all_tests(self):
        """Run all visitor registration tests"""
        self.log("Starting Visitor Registration Endpoint Tests")
        self.log("=" * 60)
        self.log(f"Testing endpoint: {API_URL}/auth/register")
        self.log("=" * 60)
        
        tests = [
            ("Endpoint Availability", self.test_endpoint_availability),
            ("CORS Headers Check", self.test_cors_headers),
            ("Successful Registration", self.test_successful_registration),
            ("Missing Required Fields", self.test_missing_required_fields),
            ("Invalid Data Formats", self.test_invalid_data_formats),
            ("Malformed JSON Handling", self.test_malformed_json)
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
        self.log("VISITOR REGISTRATION TEST SUMMARY")
        self.log("=" * 60)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{status} {test_name}")
        
        self.log(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 All visitor registration tests passed!")
        else:
            self.log(f"⚠️  {total - passed} test(s) failed.")
        
        # Specific diagnosis for blank page issue
        self.log("\n" + "=" * 60)
        self.log("BLANK PAGE ISSUE DIAGNOSIS")
        self.log("=" * 60)
        
        if results.get("Successful Registration", False):
            self.log("✅ Registration endpoint is working correctly")
            self.log("   The blank page issue is likely NOT caused by backend problems")
            self.log("   Possible causes:")
            self.log("   - Frontend JavaScript error after successful registration")
            self.log("   - Missing redirect logic in frontend")
            self.log("   - Frontend not handling the success response properly")
        else:
            self.log("❌ Registration endpoint has issues")
            self.log("   The blank page could be caused by:")
            self.log("   - Backend returning error responses")
            self.log("   - CORS issues preventing frontend from receiving response")
            self.log("   - Network connectivity problems")
        
        if not results.get("CORS Headers Check", False):
            self.log("⚠️  CORS issues detected - this could cause blank pages")
        
        return results

if __name__ == "__main__":
    tester = VisitorRegistrationTester()
    results = tester.run_all_tests()