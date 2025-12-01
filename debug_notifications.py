#!/usr/bin/env python3
"""
Debug notifications in detail
"""

import requests
import json
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')
BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://cityview-dashboard.preview.emergentagent.com')
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

def debug_notifications_detailed():
    """Debug notifications in detail"""
    log("=== DETAILED NOTIFICATIONS DEBUG ===")
    
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
    user_info = login_response.json()['user']
    log(f"Logged in as: {user_info['username']} (ID: {user_info['id']}, Role: {user_info['role']})")
    
    # Check existing notifications first
    log("Checking existing notifications...")
    existing_response = make_request('GET', '/notifications', token=token)
    if existing_response:
        existing_notifications = existing_response.json()
        log(f"Existing notifications: {len(existing_notifications)}")
        for notif in existing_notifications:
            log(f"  - ID: {notif['id']}, User: {notif['user_id']}, Type: {notif['type']}")
    
    # Generate notifications
    log("Generating new notifications...")
    gen_response = make_request('POST', '/notifications/generate', token=token)
    if gen_response:
        gen_result = gen_response.json()
        log(f"Generate response: {gen_result}")
    
    # Check notifications again
    log("Checking notifications after generation...")
    after_response = make_request('GET', '/notifications', token=token)
    if after_response:
        after_notifications = after_response.json()
        log(f"Notifications after generation: {len(after_notifications)}")
        for notif in after_notifications:
            log(f"  - ID: {notif['id']}, User: {notif['user_id']}, Type: {notif['type']}, Read: {notif.get('read', False)}")
    
    # Check if there are any users that might receive notifications
    log("Checking users that might receive notifications...")
    
    # Check for pilote_fi users
    users_response = make_request('GET', '/users/referents', token=token)
    if users_response:
        users = users_response.json()
        pilotes = [u for u in users if u.get('role') == 'pilote_fi']
        log(f"Found {len(pilotes)} pilote_fi users")
        
        superviseurs = [u for u in users if u.get('role') in ['superviseur_fi', 'superviseur_promos']]
        log(f"Found {len(superviseurs)} superviseur users")
        
        # Try to get notifications for a different user if available
        if pilotes:
            log(f"Trying to login as pilote: {pilotes[0]['username']}")
            pilote_login = make_request('POST', '/auth/login', json={
                "username": pilotes[0]['username'],
                "password": "pilote123",  # Assuming default password
                "city": pilotes[0]['city']
            })
            if pilote_login and pilote_login.status_code == 200:
                pilote_token = pilote_login.json()['token']
                pilote_notifs = make_request('GET', '/notifications', token=pilote_token)
                if pilote_notifs:
                    pilote_notifications = pilote_notifs.json()
                    log(f"Pilote notifications: {len(pilote_notifications)}")
                    for notif in pilote_notifications:
                        log(f"  - ID: {notif['id']}, Type: {notif['type']}, Message: {notif['message']}")

if __name__ == "__main__":
    debug_notifications_detailed()