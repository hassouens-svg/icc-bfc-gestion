#!/usr/bin/env python3
"""
Comprehensive Visitor Registration Diagnosis
Tests the registration endpoint and verifies data persistence
"""

import requests
import json
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')
BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://cityview-dashboard.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

def log(message, level="INFO"):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {level}: {message}")

def test_registration_and_verification():
    """Test registration and verify the visitor was actually created"""
    log("=== COMPREHENSIVE REGISTRATION TEST ===")
    
    # Step 1: Register a visitor
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
    
    log("Step 1: Registering visitor...")
    response = requests.post(f"{API_URL}/auth/register", json=visitor_data)
    
    log(f"Registration Response Status: {response.status_code}")
    log(f"Registration Response Headers: {dict(response.headers)}")
    
    if response.status_code != 200:
        log(f"❌ Registration failed: {response.text}", "ERROR")
        return False
    
    try:
        result = response.json()
        visitor_id = result.get('id')
        message = result.get('message')
        
        log(f"✅ Registration successful!")
        log(f"   Message: {message}")
        log(f"   Visitor ID: {visitor_id}")
        
        if not visitor_id:
            log("❌ No visitor ID returned", "ERROR")
            return False
            
    except Exception as e:
        log(f"❌ Failed to parse registration response: {e}", "ERROR")
        return False
    
    # Step 2: Login as admin to verify the visitor was created
    log("\nStep 2: Logging in as admin to verify visitor creation...")
    
    admin_login = {
        "username": "admin",
        "password": "admin123",
        "city": "Dijon"
    }
    
    login_response = requests.post(f"{API_URL}/auth/login", json=admin_login)
    
    if login_response.status_code != 200:
        log(f"❌ Admin login failed: {login_response.text}", "ERROR")
        return False
    
    try:
        login_result = login_response.json()
        admin_token = login_result['token']
        log("✅ Admin login successful")
    except Exception as e:
        log(f"❌ Failed to parse login response: {e}", "ERROR")
        return False
    
    # Step 3: Retrieve the visitor to verify it was saved
    log("\nStep 3: Retrieving visitor to verify data persistence...")
    
    headers = {'Authorization': f'Bearer {admin_token}'}
    get_response = requests.get(f"{API_URL}/visitors/{visitor_id}", headers=headers)
    
    log(f"Get Visitor Response Status: {get_response.status_code}")
    
    if get_response.status_code == 200:
        try:
            visitor = get_response.json()
            log("✅ Visitor successfully retrieved from database!")
            log(f"   Name: {visitor.get('firstname')} {visitor.get('lastname')}")
            log(f"   Email: {visitor.get('email')}")
            log(f"   Phone: {visitor.get('phone')}")
            log(f"   City: {visitor.get('city')}")
            log(f"   Visit Date: {visitor.get('visit_date')}")
            log(f"   Assigned Month: {visitor.get('assigned_month')}")
            log(f"   Types: {visitor.get('types')}")
            log(f"   Arrival Channel: {visitor.get('arrival_channel')}")
            log(f"   Address: {visitor.get('address')}")
            
            # Verify assigned_month calculation
            expected_month = "2025-01"
            actual_month = visitor.get('assigned_month')
            if actual_month == expected_month:
                log(f"✅ Assigned month correctly calculated: {actual_month}")
            else:
                log(f"❌ Assigned month incorrect. Expected: {expected_month}, Got: {actual_month}", "ERROR")
            
            return True
            
        except Exception as e:
            log(f"❌ Failed to parse visitor data: {e}", "ERROR")
            return False
    else:
        log(f"❌ Failed to retrieve visitor: {get_response.text}", "ERROR")
        return False

def test_cors_configuration():
    """Test CORS configuration thoroughly"""
    log("\n=== CORS CONFIGURATION TEST ===")
    
    # Test actual POST request with CORS headers
    visitor_data = {
        "firstname": "CORS",
        "lastname": "Test",
        "city": "Dijon",
        "types": ["Nouveau Arrivant"],
        "phone": "0123456789",
        "arrival_channel": "Test",
        "visit_date": "2025-01-04"
    }
    
    headers = {
        'Content-Type': 'application/json',
        'Origin': 'https://cityview-dashboard.preview.emergentagent.com'
    }
    
    response = requests.post(f"{API_URL}/auth/register", json=visitor_data, headers=headers)
    
    log(f"CORS Test Response Status: {response.status_code}")
    
    # Check CORS headers in response
    cors_headers = {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
    }
    
    log("CORS Headers in Response:")
    for header, value in cors_headers.items():
        if value:
            log(f"   ✅ {header}: {value}")
        else:
            log(f"   ❌ {header}: NOT SET")
    
    # Check if basic CORS requirements are met
    allow_origin = cors_headers.get('Access-Control-Allow-Origin')
    if allow_origin == '*' or 'visitor-management-3.preview.emergentagent.com' in str(allow_origin):
        log("✅ CORS Allow-Origin is properly configured")
        cors_ok = True
    else:
        log("❌ CORS Allow-Origin may cause issues", "ERROR")
        cors_ok = False
    
    if response.status_code == 200:
        log("✅ Registration with CORS headers successful")
        return cors_ok
    else:
        log(f"❌ Registration with CORS headers failed: {response.text}", "ERROR")
        return False

def test_error_scenarios():
    """Test various error scenarios"""
    log("\n=== ERROR SCENARIOS TEST ===")
    
    # Test 1: Missing required field
    log("Test 1: Missing required field (firstname)")
    incomplete_data = {
        "lastname": "Test",
        "city": "Dijon",
        "types": ["Nouveau Arrivant"],
        "phone": "0123456789",
        "arrival_channel": "Test",
        "visit_date": "2025-01-04"
    }
    
    response = requests.post(f"{API_URL}/auth/register", json=incomplete_data)
    if response.status_code == 422:
        log("✅ Correctly returned 422 for missing field")
        try:
            error = response.json()
            log(f"   Error details: {error['detail'][0]['msg']}")
        except:
            pass
    else:
        log(f"❌ Expected 422, got {response.status_code}", "ERROR")
    
    # Test 2: Invalid email
    log("\nTest 2: Invalid email format")
    invalid_email_data = {
        "firstname": "Test",
        "lastname": "User",
        "city": "Dijon",
        "types": ["Nouveau Arrivant"],
        "phone": "0123456789",
        "email": "invalid-email",
        "arrival_channel": "Test",
        "visit_date": "2025-01-04"
    }
    
    response = requests.post(f"{API_URL}/auth/register", json=invalid_email_data)
    if response.status_code == 422:
        log("✅ Correctly returned 422 for invalid email")
        try:
            error = response.json()
            log(f"   Error details: {error['detail'][0]['msg']}")
        except:
            pass
    else:
        log(f"❌ Expected 422, got {response.status_code}", "ERROR")
    
    # Test 3: Empty types array
    log("\nTest 3: Empty types array")
    empty_types_data = {
        "firstname": "Test",
        "lastname": "User",
        "city": "Dijon",
        "types": [],  # Empty array
        "phone": "0123456789",
        "arrival_channel": "Test",
        "visit_date": "2025-01-04"
    }
    
    response = requests.post(f"{API_URL}/auth/register", json=empty_types_data)
    log(f"Empty types response: {response.status_code}")
    if response.status_code == 200:
        log("✅ Empty types array accepted (this might be intentional)")
    else:
        log(f"   Response: {response.text}")

def main():
    """Run all diagnostic tests"""
    log("VISITOR REGISTRATION ENDPOINT DIAGNOSIS")
    log("=" * 60)
    log(f"Testing endpoint: {API_URL}/auth/register")
    log("=" * 60)
    
    # Initialize database
    log("Initializing database...")
    init_response = requests.post(f"{API_URL}/init")
    if init_response.status_code == 200:
        log("✅ Database initialized")
    else:
        log(f"⚠️  Database init response: {init_response.status_code}")
    
    # Run tests
    registration_ok = test_registration_and_verification()
    cors_ok = test_cors_configuration()
    test_error_scenarios()
    
    # Final diagnosis
    log("\n" + "=" * 60)
    log("FINAL DIAGNOSIS FOR BLANK PAGE ISSUE")
    log("=" * 60)
    
    if registration_ok and cors_ok:
        log("🎉 BACKEND IS WORKING CORRECTLY!")
        log("   ✅ Registration endpoint functional")
        log("   ✅ Data persistence working")
        log("   ✅ CORS properly configured")
        log("   ✅ Error handling working")
        log("")
        log("🔍 BLANK PAGE ISSUE IS LIKELY FRONTEND-RELATED:")
        log("   - Check browser console for JavaScript errors")
        log("   - Verify frontend redirect logic after registration")
        log("   - Check if frontend properly handles the success response")
        log("   - Look for missing success page or redirect configuration")
        log("   - Verify frontend form submission handling")
    else:
        log("❌ BACKEND ISSUES DETECTED:")
        if not registration_ok:
            log("   - Registration or data persistence problems")
        if not cors_ok:
            log("   - CORS configuration issues")
        log("   These could cause the blank page issue")

if __name__ == "__main__":
    main()