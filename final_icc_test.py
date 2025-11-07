#!/usr/bin/env python3
"""
ICC BFC-ITALIE Final Backend Testing - Corrected Version
Tests notifications system, password reset, and role-based access control
"""

import requests
import json
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')
BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://impact-family.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

class FinalICCTester:
    def __init__(self):
        self.session = requests.Session()
        self.tokens = {}
        
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
            
    def setup_test_environment(self):
        """Initialize test environment and authenticate users"""
        self.log("Setting up test environment...")
        
        # Initialize database
        response = self.make_request('POST', '/init')
        if response and response.status_code == 200:
            self.log("Database initialized successfully")
        
        # Login as different user types for testing
        test_logins = [
            {"username": "superadmin", "password": "superadmin123", "city": "Dijon", "role": "super_admin"},
            {"username": "admin", "password": "admin123", "city": "Dijon", "role": "admin"}
        ]
        
        for login_data in test_logins:
            response = self.make_request('POST', '/auth/login', json={
                "username": login_data["username"],
                "password": login_data["password"],
                "city": login_data["city"]
            })
            
            if response and response.status_code == 200:
                token = response.json()['token']
                self.tokens[login_data["role"]] = token
                self.log(f"✅ Authenticated as {login_data['role']}: {login_data['username']}")
            else:
                self.log(f"❌ Failed to authenticate {login_data['username']}", "ERROR")
        
        self.log(f"Setup complete. Authenticated {len(self.tokens)} users")
        
    def test_notifications_system_comprehensive(self):
        """Test 1: Comprehensive notifications system test"""
        self.log("\n=== TEST 1: Comprehensive Notifications System ===")
        
        admin_token = self.tokens.get('admin')
        if not admin_token:
            self.log("❌ No admin token available", "ERROR")
            return False
        
        # Generate notifications
        gen_response = self.make_request('POST', '/notifications/generate', token=admin_token)
        if not gen_response or gen_response.status_code != 200:
            self.log("❌ Failed to generate notifications", "ERROR")
            return False
        
        gen_result = gen_response.json()
        self.log(f"✅ Generated {gen_result.get('count', 0)} notifications")
        
        # Get notifications for admin (who should receive some)
        notifs_response = self.make_request('GET', '/notifications', token=admin_token)
        if not notifs_response or notifs_response.status_code != 200:
            self.log("❌ Failed to get notifications", "ERROR")
            return False
        
        notifications = notifs_response.json()
        self.log(f"✅ Admin has {len(notifications)} notifications")
        
        if notifications:
            # Test unread filter
            unread_response = self.make_request('GET', '/notifications?unread_only=true', token=admin_token)
            if unread_response and unread_response.status_code == 200:
                unread_notifications = unread_response.json()
                self.log(f"✅ Found {len(unread_notifications)} unread notifications")
            
            # Test marking as read
            first_notif = notifications[0]
            mark_response = self.make_request('PUT', f'/notifications/{first_notif["id"]}/read', token=admin_token)
            if mark_response and mark_response.status_code == 200:
                self.log("✅ Successfully marked notification as read")
                return True
            else:
                self.log("❌ Failed to mark notification as read", "ERROR")
                return False
        else:
            self.log("✅ Notifications system working (no notifications for this user)")
            return True
            
    def test_password_reset_functionality(self):
        """Test 2: Password reset functionality"""
        self.log("\n=== TEST 2: Password Reset Functionality ===")
        
        super_admin_token = self.tokens.get('super_admin')
        admin_token = self.tokens.get('admin')
        
        if not super_admin_token or not admin_token:
            self.log("❌ Missing required tokens", "ERROR")
            return False
        
        # Get a user to test password reset on
        users_response = self.make_request('GET', '/users/referents', token=super_admin_token)
        if not users_response or users_response.status_code != 200:
            self.log("❌ Failed to get users", "ERROR")
            return False
        
        users = users_response.json()
        if not users:
            self.log("❌ No users found", "ERROR")
            return False
        
        test_user = users[0]
        user_id = test_user['id']
        
        # Test 1: Super admin should be able to reset password
        reset_data = {"new_password": "newpassword123"}
        reset_response = self.make_request('PUT', f'/users/{user_id}/reset-password', 
                                         token=super_admin_token, json=reset_data)
        
        if not reset_response or reset_response.status_code != 200:
            self.log("❌ Super admin failed to reset password", "ERROR")
            return False
        
        self.log("✅ Super admin can reset passwords")
        
        # Test 2: Regular admin should be denied
        reset_response_admin = self.make_request('PUT', f'/users/{user_id}/reset-password', 
                                               token=admin_token, json=reset_data)
        
        if reset_response_admin and reset_response_admin.status_code == 403:
            self.log("✅ Regular admin correctly denied password reset")
            return True
        else:
            self.log(f"❌ Regular admin permission check failed - Status: {reset_response_admin.status_code if reset_response_admin else 'None'}", "ERROR")
            return False
            
    def test_user_management_with_assignments(self):
        """Test 3: User management with FI and secteur assignments"""
        self.log("\n=== TEST 3: User Management with Assignments ===")
        
        super_admin_token = self.tokens.get('super_admin')
        if not super_admin_token:
            self.log("❌ No super_admin token available", "ERROR")
            return False
        
        # Get users
        users_response = self.make_request('GET', '/users/referents', token=super_admin_token)
        if not users_response or users_response.status_code != 200:
            self.log("❌ Failed to get users", "ERROR")
            return False
        
        users = users_response.json()
        if not users:
            self.log("❌ No users found", "ERROR")
            return False
        
        test_user = users[0]
        user_id = test_user['id']
        
        # Test updating with assignment fields
        update_data = {
            "assigned_fi_id": "test-fi-assignment-123",
            "assigned_secteur_id": "test-secteur-assignment-456"
        }
        
        update_response = self.make_request('PUT', f'/users/{user_id}', 
                                          token=super_admin_token, json=update_data)
        
        if update_response and update_response.status_code == 200:
            self.log(f"✅ User assignment update successful")
            self.log(f"   Updated user: {test_user.get('username')}")
            return True
        else:
            self.log(f"❌ User assignment update failed - Status: {update_response.status_code if update_response else 'None'}", "ERROR")
            return False
            
    def test_visitor_role_restrictions(self):
        """Test 4: Visitor creation role restrictions"""
        self.log("\n=== TEST 4: Visitor Creation Role Restrictions ===")
        
        admin_token = self.tokens.get('admin')
        if not admin_token:
            self.log("❌ No admin token available", "ERROR")
            return False
        
        visitor_data = {
            "firstname": "Test",
            "lastname": "Visitor",
            "city": "Dijon",
            "types": ["Nouveau Arrivant"],
            "phone": "+33123456789",
            "arrival_channel": "Test Channel",
            "visit_date": "2025-01-25"
        }
        
        # Test 1: Admin should be able to create visitors
        admin_response = self.make_request('POST', '/visitors', token=admin_token, json=visitor_data)
        
        if not admin_response or admin_response.status_code != 200:
            self.log("❌ Admin failed to create visitor", "ERROR")
            return False
        
        created_visitor = admin_response.json()
        visitor_id = created_visitor.get('id')
        self.log("✅ Admin can create visitors")
        
        # Clean up
        if visitor_id:
            self.make_request('DELETE', f'/visitors/{visitor_id}', token=admin_token)
        
        # Test 2: Accueil role should be denied
        accueil_login = self.make_request('POST', '/auth/login', json={
            "username": "admin",
            "password": "admin123",
            "city": "Dijon",
            "department": "accueil"
        })
        
        if not accueil_login or accueil_login.status_code != 200:
            self.log("❌ Failed to login with accueil role", "ERROR")
            return False
        
        accueil_token = accueil_login.json()['token']
        accueil_response = self.make_request('POST', '/visitors', token=accueil_token, json=visitor_data)
        
        if accueil_response and accueil_response.status_code == 403:
            self.log("✅ Accueil role correctly denied visitor creation")
            return True
        else:
            self.log(f"❌ Accueil role restriction failed - Status: {accueil_response.status_code if accueil_response else 'None'}", "ERROR")
            return False
            
    def test_existing_functionality_regression(self):
        """Test 5: Existing functionality regression check"""
        self.log("\n=== TEST 5: Existing Functionality Regression Check ===")
        
        # Test basic login
        basic_login = self.make_request('POST', '/auth/login', json={
            "username": "admin",
            "password": "admin123",
            "city": "Dijon"
        })
        
        if not basic_login or basic_login.status_code != 200:
            self.log("❌ Basic login failed", "ERROR")
            return False
        
        user_info = basic_login.json()['user']
        self.log(f"✅ Basic login working - Role: {user_info['role']}")
        
        # Test department selection
        dept_login = self.make_request('POST', '/auth/login', json={
            "username": "admin",
            "password": "admin123",
            "city": "Dijon",
            "department": "promotions"
        })
        
        if not dept_login or dept_login.status_code != 200:
            self.log("❌ Department login failed", "ERROR")
            return False
        
        dept_user_info = dept_login.json()['user']
        if dept_user_info.get('role') == 'promotions':
            self.log("✅ Department selection working correctly")
            return True
        else:
            self.log(f"❌ Department selection failed - Got role: {dept_user_info.get('role')}", "ERROR")
            return False

    def run_all_tests(self):
        """Run all ICC BFC-ITALIE backend tests"""
        self.log("Starting ICC BFC-ITALIE Final Backend Testing")
        self.log("=" * 60)
        
        # Setup
        self.setup_test_environment()
        
        # Run tests
        tests = [
            ("Notifications System Comprehensive", self.test_notifications_system_comprehensive),
            ("Password Reset Functionality", self.test_password_reset_functionality),
            ("User Management with Assignments", self.test_user_management_with_assignments),
            ("Visitor Role Restrictions", self.test_visitor_role_restrictions),
            ("Existing Functionality Regression", self.test_existing_functionality_regression)
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
        self.log("ICC BFC-ITALIE FINAL TEST SUMMARY")
        self.log("=" * 60)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{status} {test_name}")
        
        self.log(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 All ICC BFC-ITALIE backend tests passed!")
        else:
            self.log(f"⚠️  {total - passed} test(s) failed. Issues need to be addressed.")
        
        return results

if __name__ == "__main__":
    tester = FinalICCTester()
    results = tester.run_all_tests()