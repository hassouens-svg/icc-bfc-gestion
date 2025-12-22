#!/usr/bin/env python3
"""
Debug specific test failures
"""

import requests
import json
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')
BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://videosum-2.preview.emergentagent.com')
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
        if response.status_code >= 400:
            log(f"Error response: {response.text}")
        return response
    except Exception as e:
        log(f"Request failed: {e}", "ERROR")
        return None

def debug_notifications():
    """Debug notifications issues"""
    log("=== DEBUGGING NOTIFICATIONS ===")
    
    # Login as super admin
    login_response = make_request('POST', '/auth/login', json={
        "username": "superadmin",
        "password": "superadmin123",
        "city": "Dijon"
    })
    
    if not login_response or login_response.status_code != 200:
        log("Failed to login as superadmin", "ERROR")
        return
        
    token = login_response.json()['token']
    
    # Generate notifications
    log("Generating notifications...")
    gen_response = make_request('POST', '/notifications/generate', token=token)
    if gen_response:
        log(f"Generate response: {gen_response.json()}")
    
    # Get notifications
    log("Getting notifications...")
    get_response = make_request('GET', '/notifications', token=token)
    if get_response:
        notifications = get_response.json()
        log(f"Found {len(notifications)} notifications")
        for notif in notifications:
            log(f"  - ID: {notif['id']}, Type: {notif['type']}, Read: {notif.get('read', False)}")
            
        # Try to mark first notification as read
        if notifications:
            first_notif = notifications[0]
            log(f"Marking notification {first_notif['id']} as read...")
            mark_response = make_request('PUT', f'/notifications/{first_notif["id"]}/read', token=token)
            if mark_response:
                log(f"Mark read response: {mark_response.json()}")

def debug_password_reset():
    """Debug password reset permission issue"""
    log("=== DEBUGGING PASSWORD RESET ===")
    
    # Login as regular admin
    admin_login = make_request('POST', '/auth/login', json={
        "username": "admin",
        "password": "admin123",
        "city": "Dijon"
    })
    
    if not admin_login or admin_login.status_code != 200:
        log("Failed to login as admin", "ERROR")
        return
        
    admin_token = admin_login.json()['token']
    
    # Try password reset (should fail)
    log("Trying password reset with admin token (should fail)...")
    reset_response = make_request('PUT', '/users/dummy-id/reset-password', 
                                token=admin_token, 
                                json={"new_password": "test123"})
    
    if reset_response:
        log(f"Status: {reset_response.status_code}")
        log(f"Response: {reset_response.text}")

def debug_user_update():
    """Debug user update with assignments"""
    log("=== DEBUGGING USER UPDATE ===")
    
    # Login as super admin
    login_response = make_request('POST', '/auth/login', json={
        "username": "superadmin",
        "password": "superadmin123",
        "city": "Dijon"
    })
    
    if not login_response or login_response.status_code != 200:
        log("Failed to login as superadmin", "ERROR")
        return
        
    token = login_response.json()['token']
    
    # Get users
    users_response = make_request('GET', '/users/referents', token=token)
    if not users_response or users_response.status_code != 200:
        log("Failed to get users", "ERROR")
        return
        
    users = users_response.json()
    if not users:
        log("No users found", "ERROR")
        return
        
    test_user = users[0]
    user_id = test_user['id']
    
    log(f"Testing user update for user: {test_user.get('username')} (ID: {user_id})")
    
    # Try to update with assignments
    update_data = {
        "assigned_fi_id": "test-fi-123",
        "assigned_secteur_id": "test-secteur-456"
    }
    
    update_response = make_request('PUT', f'/users/{user_id}', token=token, json=update_data)
    if update_response:
        log(f"Update status: {update_response.status_code}")
        log(f"Update response: {update_response.text}")

def debug_visitor_restrictions():
    """Debug visitor creation restrictions"""
    log("=== DEBUGGING VISITOR RESTRICTIONS ===")
    
    # Login as admin with accueil department
    login_response = make_request('POST', '/auth/login', json={
        "username": "admin",
        "password": "admin123",
        "city": "Dijon",
        "department": "accueil"
    })
    
    if not login_response or login_response.status_code != 200:
        log("Failed to login with accueil department", "ERROR")
        return
        
    token = login_response.json()['token']
    user_info = login_response.json()['user']
    
    log(f"Logged in with role: {user_info['role']}")
    
    # Try to create visitor (should fail)
    visitor_data = {
        "firstname": "Test",
        "lastname": "Visitor",
        "city": "Dijon",
        "types": ["Nouveau Arrivant"],
        "phone": "+33123456789",
        "arrival_channel": "Test",
        "visit_date": "2025-01-25"
    }
    
    create_response = make_request('POST', '/visitors', token=token, json=visitor_data)
    if create_response:
        log(f"Create visitor status: {create_response.status_code}")
        log(f"Create visitor response: {create_response.text}")

if __name__ == "__main__":
    debug_notifications()
    debug_password_reset()
    debug_user_update()
    debug_visitor_restrictions()