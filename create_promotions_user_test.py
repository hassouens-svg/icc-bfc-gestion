#!/usr/bin/env python3
"""
Create a promotions user and test visitor creation
"""

import requests
import json
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')
BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://church-connect-67.preview.emergentagent.com')
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
    log("=== CREATING PROMOTIONS USER AND TESTING ===")
    
    # Step 1: Login as admin to create users
    log("\n1. Logging in as admin...")
    admin_login = make_request('POST', '/auth/login', json={
        "username": "superviseur_promos",
        "password": "superviseur123",
        "city": "Dijon"
    })
    
    if not admin_login or admin_login.status_code != 200:
        log("❌ Failed to login as admin", "ERROR")
        return
    
    admin_token = admin_login.json()['token']
    log("✅ Admin login successful")
    
    # Step 2: Create a promotions user
    log("\n2. Creating promotions user...")
    promotions_user_data = {
        "username": "promotions",
        "password": "test123",
        "city": "Dijon",
        "role": "promotions"
    }
    
    create_response = make_request('POST', '/users', token=admin_token, json=promotions_user_data)
    if create_response and create_response.status_code == 200:
        log("✅ Promotions user created successfully")
    else:
        log("⚠️  Promotions user creation failed (might already exist)")
        if create_response:
            log(f"   Response: {create_response.text}")
    
    # Step 3: Create a referent user
    log("\n3. Creating referent user...")
    referent_user_data = {
        "username": "referent_dijon_oct",
        "password": "test123",
        "city": "Dijon",
        "role": "referent",
        "assigned_month": "2024-10"
    }
    
    create_response = make_request('POST', '/users', token=admin_token, json=referent_user_data)
    if create_response and create_response.status_code == 200:
        log("✅ Referent user created successfully")
    else:
        log("⚠️  Referent user creation failed (might already exist)")
        if create_response:
            log(f"   Response: {create_response.text}")
    
    # Step 4: Test login with promotions user
    log("\n4. Testing login with promotions user...")
    promotions_login = make_request('POST', '/auth/login', json={
        "username": "promotions",
        "password": "test123",
        "city": "Dijon"
    })
    
    if promotions_login and promotions_login.status_code == 200:
        promotions_token = promotions_login.json()['token']
        user_info = promotions_login.json()['user']
        log(f"✅ Promotions login successful: Role={user_info['role']}")
        
        # Test visitor creation
        log("\n5. Testing visitor creation with promotions user...")
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
        
        create_visitor_response = make_request('POST', '/visitors', token=promotions_token, json=visitor_data)
        
        if create_visitor_response and create_visitor_response.status_code == 200:
            visitor = create_visitor_response.json()
            log(f"✅ SUCCESS: Visitor created by promotions user with ID {visitor['id']}")
        else:
            log("❌ FAILED: Visitor creation failed")
            if create_visitor_response:
                log(f"   Status: {create_visitor_response.status_code}")
                log(f"   Response: {create_visitor_response.text}")
    else:
        log("❌ Promotions login failed")
        if promotions_login:
            log(f"   Status: {promotions_login.status_code}")
            log(f"   Response: {promotions_login.text}")
    
    # Step 5: Test referent with promotions department
    log("\n6. Testing referent with promotions department...")
    referent_promotions_login = make_request('POST', '/auth/login', json={
        "username": "referent_dijon_oct",
        "password": "test123",
        "city": "Dijon",
        "department": "promotions"
    })
    
    if referent_promotions_login and referent_promotions_login.status_code == 200:
        referent_token = referent_promotions_login.json()['token']
        user_info = referent_promotions_login.json()['user']
        log(f"✅ Referent with promotions department login successful: Role={user_info['role']}")
        
        # Test visitor creation
        log("\n7. Testing visitor creation with referent (promotions department)...")
        visitor_data = {
            "firstname": "Marie",
            "lastname": "Promotions",
            "city": "Dijon",
            "types": ["Nouveau Arrivant"],
            "phone": "+33612345679",
            "email": "marie.promotions@example.com",
            "address": "456 Rue Promotions",
            "arrival_channel": "Evangelisation",
            "visit_date": "2025-01-16"
        }
        
        create_visitor_response = make_request('POST', '/visitors', token=referent_token, json=visitor_data)
        
        if create_visitor_response and create_visitor_response.status_code == 200:
            visitor = create_visitor_response.json()
            log(f"✅ SUCCESS: Visitor created by referent (promotions dept) with ID {visitor['id']}")
        else:
            log("❌ FAILED: Visitor creation failed")
            if create_visitor_response:
                log(f"   Status: {create_visitor_response.status_code}")
                log(f"   Response: {create_visitor_response.text}")
    else:
        log("❌ Referent with promotions department login failed")
        if referent_promotions_login:
            log(f"   Status: {referent_promotions_login.status_code}")
            log(f"   Response: {referent_promotions_login.text}")

if __name__ == "__main__":
    main()