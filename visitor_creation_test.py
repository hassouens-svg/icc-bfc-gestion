#!/usr/bin/env python3
"""
Focused test for visitor creation bug reported by user
Tests the exact scenario: Responsable de Promos creates visitor via POST /api/visitors
"""

import requests
import json
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')
BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://faith-hub-23.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

def log(message, level="INFO"):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {level}: {message}")

def make_request(method, endpoint, token=None, **kwargs):
    """Make HTTP request with optional authentication"""
    url = f"{API_URL}{endpoint}"
    headers = kwargs.get('headers', {})
    
    if token:
        headers['Authorization'] = f'Bearer {token}'
        
    kwargs['headers'] = headers
    
    try:
        response = requests.request(method, url, **kwargs)
        log(f"{method} {endpoint} -> {response.status_code}")
        return response
    except Exception as e:
        log(f"Request failed: {e}", "ERROR")
        return None

def main():
    log("=== VISITOR CREATION BUG INVESTIGATION ===")
    log(f"Testing against: {BASE_URL}")
    
    # Step 1: Initialize database
    log("\n1. Initializing database...")
    init_response = make_request('POST', '/init')
    if init_response and init_response.status_code == 200:
        log("✅ Database initialized")
    else:
        log("⚠️  Database initialization failed or already done")
    
    # Step 2: Try login with credentials from review request
    log("\n2. Testing login credentials from review request...")
    
    credentials_to_test = [
        {"username": "promotions", "password": "test123", "city": "Dijon", "description": "Direct promotions user"},
        {"username": "referent", "password": "test123", "city": "Dijon", "description": "Generic referent"},
        {"username": "referent_dijon_oct", "password": "test123", "city": "Dijon", "description": "Specific referent from init data"},
        {"username": "superviseur_promos", "password": "superviseur123", "city": "Dijon", "description": "Superviseur (should work)"},
        {"username": "superadmin", "password": "superadmin123", "city": "Dijon", "description": "Super admin (should work)"}
    ]
    
    successful_logins = []
    
    for cred in credentials_to_test:
        log(f"\nTrying: {cred['username']} ({cred['description']})")
        
        login_data = {
            "username": cred["username"],
            "password": cred["password"],
            "city": cred["city"]
        }
        
        response = make_request('POST', '/auth/login', json=login_data)
        
        if response and response.status_code == 200:
            user_info = response.json()['user']
            token = response.json()['token']
            log(f"✅ SUCCESS: Role={user_info['role']}, City={user_info['city']}")
            successful_logins.append({
                'credentials': cred,
                'token': token,
                'user_info': user_info
            })
        else:
            error_msg = response.text if response else "No response"
            log(f"❌ FAILED: {response.status_code if response else 'No response'} - {error_msg[:100]}")
    
    if not successful_logins:
        log("\n❌ CRITICAL: No successful logins found!", "ERROR")
        return
    
    # Step 3: Test visitor creation with each successful login
    log(f"\n3. Testing visitor creation with {len(successful_logins)} successful logins...")
    
    # Exact visitor data from review request
    visitor_data = {
        "firstname": "Jean",
        "lastname": "Test",
        "city": "Dijon",
        "types": ["Nouveau Arrivant"],
        "phone": "+33612345678",
        "email": "jean.test@example.com",
        "address": "123 Rue Test",
        "arrival_channel": "Evangelisation",
        "visit_date": "2025-01-15"
    }
    
    log("Using visitor data:")
    for key, value in visitor_data.items():
        log(f"   {key}: {value}")
    
    creation_results = []
    
    for login_info in successful_logins:
        user = login_info['user_info']
        token = login_info['token']
        cred = login_info['credentials']
        
        log(f"\n--- Testing with {user['username']} (Role: {user['role']}) ---")
        
        # Test POST /api/visitors
        create_response = make_request('POST', '/visitors', token=token, json=visitor_data)
        
        if not create_response:
            log("❌ Request completely failed", "ERROR")
            creation_results.append({
                'user': user['username'],
                'role': user['role'],
                'status': 'NETWORK_ERROR',
                'details': 'Request failed'
            })
            continue
        
        log(f"Response Status: {create_response.status_code}")
        
        if create_response.status_code in [200, 201]:
            try:
                result = create_response.json()
                visitor_id = result.get('id')
                
                if visitor_id:
                    log(f"✅ SUCCESS: Visitor created with ID {visitor_id}")
                    
                    # Verify it exists
                    verify_response = make_request('GET', '/visitors', token=token)
                    if verify_response and verify_response.status_code == 200:
                        visitors = verify_response.json()
                        found = any(v.get('id') == visitor_id for v in visitors)
                        if found:
                            log("✅ VERIFIED: Visitor found in list")
                            creation_results.append({
                                'user': user['username'],
                                'role': user['role'],
                                'status': 'SUCCESS',
                                'visitor_id': visitor_id
                            })
                        else:
                            log("⚠️  Created but not found in list")
                            creation_results.append({
                                'user': user['username'],
                                'role': user['role'],
                                'status': 'CREATED_NOT_LISTED',
                                'visitor_id': visitor_id
                            })
                    else:
                        log("⚠️  Could not verify (list failed)")
                        creation_results.append({
                            'user': user['username'],
                            'role': user['role'],
                            'status': 'CREATED_VERIFY_FAILED',
                            'visitor_id': visitor_id
                        })
                else:
                    log("❌ No visitor ID in response")
                    log(f"Response: {create_response.text}")
                    creation_results.append({
                        'user': user['username'],
                        'role': user['role'],
                        'status': 'NO_ID_RETURNED',
                        'details': create_response.text[:200]
                    })
                    
            except Exception as e:
                log(f"❌ JSON parse error: {e}")
                log(f"Raw response: {create_response.text}")
                creation_results.append({
                    'user': user['username'],
                    'role': user['role'],
                    'status': 'JSON_ERROR',
                    'details': str(e)
                })
                
        elif create_response.status_code == 403:
            log("❌ FORBIDDEN: Permission denied")
            try:
                error = create_response.json()
                log(f"Error: {error}")
            except:
                log(f"Raw error: {create_response.text}")
            creation_results.append({
                'user': user['username'],
                'role': user['role'],
                'status': 'FORBIDDEN',
                'details': create_response.text[:200]
            })
            
        elif create_response.status_code == 422:
            log("❌ VALIDATION ERROR: Bad request data")
            try:
                error = create_response.json()
                log(f"Validation errors: {error}")
            except:
                log(f"Raw error: {create_response.text}")
            creation_results.append({
                'user': user['username'],
                'role': user['role'],
                'status': 'VALIDATION_ERROR',
                'details': create_response.text[:200]
            })
            
        elif create_response.status_code == 500:
            log("❌ INTERNAL SERVER ERROR: This could cause blank page!")
            log(f"Server error: {create_response.text}")
            creation_results.append({
                'user': user['username'],
                'role': user['role'],
                'status': 'SERVER_ERROR',
                'details': create_response.text[:200]
            })
            
        else:
            log(f"❌ UNEXPECTED STATUS: {create_response.status_code}")
            log(f"Response: {create_response.text}")
            creation_results.append({
                'user': user['username'],
                'role': user['role'],
                'status': f'HTTP_{create_response.status_code}',
                'details': create_response.text[:200]
            })
    
    # Step 4: Summary
    log("\n" + "="*60)
    log("FINAL SUMMARY")
    log("="*60)
    
    log(f"\nSuccessful Logins: {len(successful_logins)}")
    for login_info in successful_logins:
        user = login_info['user_info']
        log(f"  - {user['username']} (Role: {user['role']})")
    
    log(f"\nVisitor Creation Results:")
    success_count = 0
    for result in creation_results:
        status_emoji = "✅" if result['status'] == 'SUCCESS' else "❌"
        log(f"  {status_emoji} {result['user']} ({result['role']}): {result['status']}")
        if result['status'] == 'SUCCESS':
            success_count += 1
        elif 'details' in result:
            log(f"      Details: {result['details']}")
    
    log(f"\nOverall Result: {success_count}/{len(creation_results)} successful creations")
    
    if success_count > 0:
        log("\n✅ CONCLUSION: Backend visitor creation endpoint is WORKING")
        log("   The blank page issue is likely FRONTEND-related:")
        log("   - Check frontend JavaScript console for errors")
        log("   - Verify frontend form submission and response handling")
        log("   - Check if frontend properly redirects after successful creation")
    else:
        log("\n❌ CONCLUSION: Backend visitor creation endpoint has ISSUES")
        log("   This could explain the blank page problem")

if __name__ == "__main__":
    main()