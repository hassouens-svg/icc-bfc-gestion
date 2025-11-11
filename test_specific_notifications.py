#!/usr/bin/env python3
"""
Test notifications for specific users
"""

import requests
import json
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')
BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://multi-city-faith.preview.emergentagent.com')
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

def test_notifications_for_superviseur():
    """Test notifications for superviseur users"""
    log("=== TESTING NOTIFICATIONS FOR SUPERVISEUR ===")
    
    # Try to login as superviseur_fi
    login_response = make_request('POST', '/auth/login', json={
        "username": "superviseur_fi",
        "password": "superviseur123",  # Try default password
        "city": "Dijon"
    })
    
    if login_response and login_response.status_code == 200:
        token = login_response.json()['token']
        user_info = login_response.json()['user']
        log(f"Logged in as: {user_info['username']} (ID: {user_info['id']}, Role: {user_info['role']})")
        
        # Get notifications
        notifs_response = make_request('GET', '/notifications', token=token)
        if notifs_response:
            notifications = notifs_response.json()
            log(f"Found {len(notifications)} notifications for superviseur_fi")
            for notif in notifications:
                log(f"  - Type: {notif['type']}, Message: {notif['message'][:50]}...")
                
            # Test marking one as read if available
            if notifications:
                first_notif = notifications[0]
                mark_response = make_request('PUT', f'/notifications/{first_notif["id"]}/read', token=token)
                if mark_response and mark_response.status_code == 200:
                    log("✅ Successfully marked notification as read")
                    return True
                else:
                    log("❌ Failed to mark notification as read")
                    return False
            else:
                log("No notifications to test mark as read")
                return True
    else:
        log("Failed to login as superviseur_fi, trying admin...")
        
        # Try admin
        admin_login = make_request('POST', '/auth/login', json={
            "username": "admin",
            "password": "admin123",
            "city": "Dijon"
        })
        
        if admin_login and admin_login.status_code == 200:
            token = admin_login.json()['token']
            user_info = admin_login.json()['user']
            log(f"Logged in as admin: {user_info['username']} (ID: {user_info['id']}, Role: {user_info['role']})")
            
            # Get notifications
            notifs_response = make_request('GET', '/notifications', token=token)
            if notifs_response:
                notifications = notifs_response.json()
                log(f"Found {len(notifications)} notifications for admin")
                for notif in notifications:
                    log(f"  - Type: {notif['type']}, Message: {notif['message'][:50]}...")
                    
                # Test marking one as read if available
                if notifications:
                    first_notif = notifications[0]
                    mark_response = make_request('PUT', f'/notifications/{first_notif["id"]}/read', token=token)
                    if mark_response and mark_response.status_code == 200:
                        log("✅ Successfully marked notification as read")
                        return True
                    else:
                        log("❌ Failed to mark notification as read")
                        return False
                else:
                    log("No notifications to test mark as read")
                    return True
        else:
            log("Failed to login as admin too")
            return False

if __name__ == "__main__":
    test_notifications_for_superviseur()