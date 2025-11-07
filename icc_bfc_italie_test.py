#!/usr/bin/env python3
"""
ICC BFC-ITALIE Backend Testing - Comprehensive Testing for New Features
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

class ICCBFCItalieTester:
    def __init__(self):
        self.session = requests.Session()
        self.tokens = {}
        self.test_users = {}
        self.test_notifications = []
        
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
            {"username": "admin", "password": "admin123", "city": "Dijon", "role": "admin"},
            {"username": "pilote1", "password": "pilote123", "city": "Dijon", "role": "pilote_fi"}
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
        
    def test_notifications_get_endpoint(self):
        """Test 1: GET /api/notifications - Should return notifications for authenticated user"""
        self.log("\n=== TEST 1: GET /api/notifications ===")
        
        token = self.tokens.get('super_admin')
        if not token:
            self.log("❌ No super_admin token available", "ERROR")
            return False
            
        # Test basic notifications endpoint
        response = self.make_request('GET', '/notifications', token=token)
        
        if not response:
            self.log("❌ Request failed", "ERROR")
            return False
            
        if response.status_code == 200:
            notifications = response.json()
            self.log(f"✅ GET /notifications successful - Found {len(notifications)} notifications")
            
            # Test with unread_only filter
            response_unread = self.make_request('GET', '/notifications?unread_only=true', token=token)
            if response_unread and response_unread.status_code == 200:
                unread_notifications = response_unread.json()
                self.log(f"✅ GET /notifications?unread_only=true successful - Found {len(unread_notifications)} unread notifications")
                return True
            else:
                self.log("❌ Failed to get unread notifications", "ERROR")
                return False
        else:
            self.log(f"❌ GET /notifications failed - Status: {response.status_code}", "ERROR")
            if response.text:
                self.log(f"   Error: {response.text}")
            return False
            
    def test_notifications_mark_read(self):
        """Test 2: PUT /api/notifications/{notification_id}/read - Should mark notification as read"""
        self.log("\n=== TEST 2: PUT /api/notifications/{id}/read ===")
        
        token = self.tokens.get('super_admin')
        if not token:
            self.log("❌ No super_admin token available", "ERROR")
            return False
        
        # First, generate some notifications to test with
        generate_response = self.make_request('POST', '/notifications/generate', token=token)
        if generate_response and generate_response.status_code == 200:
            self.log("✅ Generated test notifications")
        
        # Get notifications to find one to mark as read
        response = self.make_request('GET', '/notifications', token=token)
        if not response or response.status_code != 200:
            self.log("❌ Failed to get notifications for testing", "ERROR")
            return False
            
        notifications = response.json()
        if not notifications:
            self.log("❌ No notifications available to test mark as read", "ERROR")
            return False
            
        # Find an unread notification
        unread_notification = None
        for notif in notifications:
            if not notif.get('read', True):
                unread_notification = notif
                break
                
        if not unread_notification:
            self.log("❌ No unread notifications found to test", "ERROR")
            return False
            
        notification_id = unread_notification['id']
        
        # Mark notification as read
        mark_read_response = self.make_request('PUT', f'/notifications/{notification_id}/read', token=token)
        
        if mark_read_response and mark_read_response.status_code == 200:
            self.log(f"✅ Successfully marked notification {notification_id} as read")
            
            # Verify it's marked as read
            verify_response = self.make_request('GET', '/notifications', token=token)
            if verify_response and verify_response.status_code == 200:
                updated_notifications = verify_response.json()
                marked_notification = next((n for n in updated_notifications if n['id'] == notification_id), None)
                
                if marked_notification and marked_notification.get('read', False):
                    self.log("✅ Notification successfully marked as read")
                    return True
                else:
                    self.log("❌ Notification not properly marked as read", "ERROR")
                    return False
            else:
                self.log("❌ Failed to verify notification status", "ERROR")
                return False
        else:
            self.log(f"❌ Failed to mark notification as read - Status: {mark_read_response.status_code if mark_read_response else 'None'}", "ERROR")
            return False
            
    def test_notifications_generate(self):
        """Test 3: POST /api/notifications/generate - Should generate automated notifications"""
        self.log("\n=== TEST 3: POST /api/notifications/generate ===")
        
        # Test with superviseur role (should have permission)
        token = self.tokens.get('admin')
        if not token:
            self.log("❌ No admin token available", "ERROR")
            return False
            
        response = self.make_request('POST', '/notifications/generate', token=token)
        
        if not response:
            self.log("❌ Request failed", "ERROR")
            return False
            
        if response.status_code == 200:
            result = response.json()
            self.log(f"✅ Notifications generation successful")
            self.log(f"   Generated notifications: {result.get('generated', 0)}")
            
            # Verify notifications were created by checking the notifications endpoint
            notifications_response = self.make_request('GET', '/notifications', token=token)
            if notifications_response and notifications_response.status_code == 200:
                notifications = notifications_response.json()
                self.log(f"   Total notifications now: {len(notifications)}")
                
                # Check for different notification types
                notification_types = set(n.get('type') for n in notifications)
                self.log(f"   Notification types found: {sorted(notification_types)}")
                return True
            else:
                self.log("❌ Failed to verify generated notifications", "ERROR")
                return False
        else:
            self.log(f"❌ Notifications generation failed - Status: {response.status_code}", "ERROR")
            if response.text:
                self.log(f"   Error: {response.text}")
            return False
            
    def test_password_reset_super_admin_only(self):
        """Test 4: PUT /api/users/{user_id}/reset-password - Should allow super_admin to reset user password"""
        self.log("\n=== TEST 4: Password Reset - Super Admin Access ===")
        
        super_admin_token = self.tokens.get('super_admin')
        if not super_admin_token:
            self.log("❌ No super_admin token available", "ERROR")
            return False
        
        # First, get list of users to find one to reset password for
        users_response = self.make_request('GET', '/users/referents', token=super_admin_token)
        if not users_response or users_response.status_code != 200:
            self.log("❌ Failed to get users list", "ERROR")
            return False
            
        users = users_response.json()
        if not users:
            self.log("❌ No users found to test password reset", "ERROR")
            return False
            
        # Find a test user (not super admin)
        test_user = None
        for user in users:
            if user.get('role') != 'super_admin':
                test_user = user
                break
                
        if not test_user:
            self.log("❌ No suitable test user found", "ERROR")
            return False
            
        user_id = test_user['id']
        
        # Test password reset
        reset_data = {"new_password": "newpassword123"}
        reset_response = self.make_request('PUT', f'/users/{user_id}/reset-password', 
                                         token=super_admin_token, json=reset_data)
        
        if reset_response and reset_response.status_code == 200:
            self.log(f"✅ Password reset successful for user {test_user.get('username')}")
            return True
        else:
            self.log(f"❌ Password reset failed - Status: {reset_response.status_code if reset_response else 'None'}", "ERROR")
            if reset_response and reset_response.text:
                self.log(f"   Error: {reset_response.text}")
            return False
            
    def test_password_reset_permission_denied(self):
        """Test 5: Password reset should return 403 for non-super_admin users"""
        self.log("\n=== TEST 5: Password Reset - Permission Denied for Non-Super Admin ===")
        
        admin_token = self.tokens.get('admin')
        if not admin_token:
            self.log("❌ No admin token available", "ERROR")
            return False
        
        # Try to reset password with regular admin (should fail)
        reset_data = {"new_password": "shouldfail123"}
        reset_response = self.make_request('PUT', '/users/dummy-user-id/reset-password', 
                                         token=admin_token, json=reset_data)
        
        if reset_response and reset_response.status_code == 403:
            self.log("✅ Password reset correctly denied for non-super_admin")
            return True
        else:
            self.log(f"❌ Password reset permission check failed - Status: {reset_response.status_code if reset_response else 'None'}", "ERROR")
            self.log("   Expected 403 Forbidden for non-super_admin users")
            return False
            
    def test_users_endpoint_super_admin_access(self):
        """Test 6: GET /api/users should return all users for super_admin"""
        self.log("\n=== TEST 6: GET /api/users - Super Admin Access ===")
        
        super_admin_token = self.tokens.get('super_admin')
        if not super_admin_token:
            self.log("❌ No super_admin token available", "ERROR")
            return False
        
        # Test getting all users (this might be /users/referents or similar)
        response = self.make_request('GET', '/users/referents', token=super_admin_token)
        
        if not response:
            self.log("❌ Request failed", "ERROR")
            return False
            
        if response.status_code == 200:
            users = response.json()
            self.log(f"✅ GET /users successful - Found {len(users)} users")
            
            # Check if we have users with different roles
            roles = set(user.get('role') for user in users)
            self.log(f"   User roles found: {sorted(roles)}")
            return True
        else:
            self.log(f"❌ GET /users failed - Status: {response.status_code}", "ERROR")
            if response.text:
                self.log(f"   Error: {response.text}")
            return False
            
    def test_user_update_with_assignments(self):
        """Test 7: PUT /api/users/{user_id} with assigned_fi_id and assigned_secteur_id fields"""
        self.log("\n=== TEST 7: User Update with FI and Secteur Assignments ===")
        
        super_admin_token = self.tokens.get('super_admin')
        if not super_admin_token:
            self.log("❌ No super_admin token available", "ERROR")
            return False
        
        # Get users to find one to update
        users_response = self.make_request('GET', '/users/referents', token=super_admin_token)
        if not users_response or users_response.status_code != 200:
            self.log("❌ Failed to get users list", "ERROR")
            return False
            
        users = users_response.json()
        if not users:
            self.log("❌ No users found to test update", "ERROR")
            return False
            
        test_user = users[0]  # Use first user
        user_id = test_user['id']
        
        # Test updating user with assignment fields
        update_data = {
            "username": test_user.get('username'),  # Keep existing username
            "assigned_fi_id": "test-fi-id-123",
            "assigned_secteur_id": "test-secteur-id-456"
        }
        
        update_response = self.make_request('PUT', f'/users/{user_id}', 
                                          token=super_admin_token, json=update_data)
        
        if update_response and update_response.status_code == 200:
            self.log(f"✅ User update with assignments successful")
            self.log(f"   Updated user: {test_user.get('username')}")
            self.log(f"   Assigned FI ID: {update_data['assigned_fi_id']}")
            self.log(f"   Assigned Secteur ID: {update_data['assigned_secteur_id']}")
            return True
        else:
            self.log(f"❌ User update failed - Status: {update_response.status_code if update_response else 'None'}", "ERROR")
            if update_response and update_response.text:
                self.log(f"   Error: {update_response.text}")
            return False
            
    def test_post_visitors_role_restrictions(self):
        """Test 8: POST /api/visitors should have role restrictions (accueil should return 403)"""
        self.log("\n=== TEST 8: POST /visitors Role Restrictions ===")
        
        # First test with admin (should work)
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
        
        # Test with admin (should succeed)
        admin_response = self.make_request('POST', '/visitors', token=admin_token, json=visitor_data)
        
        if admin_response and admin_response.status_code == 200:
            self.log("✅ Admin can create visitors (expected)")
            created_visitor = admin_response.json()
            visitor_id = created_visitor.get('id')
            
            # Clean up - delete the test visitor
            if visitor_id:
                self.make_request('DELETE', f'/visitors/{visitor_id}', token=admin_token)
        else:
            self.log("❌ Admin failed to create visitor (unexpected)", "ERROR")
            return False
        
        # Now test with accueil role (should fail with 403)
        # First, create a user with accueil role or login with department selection
        # Let's try to login as referent with accueil department
        accueil_login = self.make_request('POST', '/auth/login', json={
            "username": "admin",  # Use existing admin but select accueil department
            "password": "admin123",
            "city": "Dijon",
            "department": "accueil"
        })
        
        if accueil_login and accueil_login.status_code == 200:
            accueil_token = accueil_login.json()['token']
            
            # Test creating visitor with accueil role (should fail)
            accueil_response = self.make_request('POST', '/visitors', token=accueil_token, json=visitor_data)
            
            if accueil_response and accueil_response.status_code == 403:
                self.log("✅ Accueil role correctly denied visitor creation (403)")
                return True
            else:
                self.log(f"❌ Accueil role restriction failed - Status: {accueil_response.status_code if accueil_response else 'None'}", "ERROR")
                self.log("   Expected 403 Forbidden for accueil role")
                if accueil_response and accueil_response.text:
                    self.log(f"   Response: {accueil_response.text}")
                return False
        else:
            self.log("❌ Failed to login with accueil role", "ERROR")
            return False
            
    def test_basic_login_flow(self):
        """Test 9: Verify basic login flow with city and department selection still works"""
        self.log("\n=== TEST 9: Basic Login Flow Regression Check ===")
        
        # Test basic login without department
        basic_login = self.make_request('POST', '/auth/login', json={
            "username": "admin",
            "password": "admin123",
            "city": "Dijon"
        })
        
        if not basic_login or basic_login.status_code != 200:
            self.log("❌ Basic login failed", "ERROR")
            return False
            
        login_result = basic_login.json()
        user_info = login_result.get('user', {})
        
        if user_info.get('role') and user_info.get('city') == 'Dijon':
            self.log(f"✅ Basic login successful - Role: {user_info['role']}, City: {user_info['city']}")
        else:
            self.log("❌ Basic login returned invalid user info", "ERROR")
            return False
        
        # Test login with department selection
        dept_login = self.make_request('POST', '/auth/login', json={
            "username": "admin",
            "password": "admin123",
            "city": "Dijon",
            "department": "promotions"
        })
        
        if not dept_login or dept_login.status_code != 200:
            self.log("❌ Department login failed", "ERROR")
            return False
            
        dept_result = dept_login.json()
        dept_user_info = dept_result.get('user', {})
        
        if dept_user_info.get('role') == 'promotions':
            self.log(f"✅ Department login successful - Role changed to: {dept_user_info['role']}")
            return True
        else:
            self.log(f"❌ Department login failed to change role - Got: {dept_user_info.get('role')}", "ERROR")
            return False
            
    def test_jwt_role_authentication_still_working(self):
        """Test 10: Verify JWT role authentication is still working correctly"""
        self.log("\n=== TEST 10: JWT Role Authentication Regression Check ===")
        
        # Login with different roles and verify they work correctly
        test_scenarios = [
            {
                "username": "admin",
                "password": "admin123", 
                "city": "Dijon",
                "department": "promotions",
                "expected_role": "promotions",
                "test_endpoint": "/visitors"
            },
            {
                "username": "admin",
                "password": "admin123",
                "city": "Dijon", 
                "department": "accueil",
                "expected_role": "accueil",
                "test_endpoint": "/visitors"
            }
        ]
        
        for scenario in test_scenarios:
            login_data = {k: v for k, v in scenario.items() if k not in ['expected_role', 'test_endpoint']}
            
            login_response = self.make_request('POST', '/auth/login', json=login_data)
            
            if not login_response or login_response.status_code != 200:
                self.log(f"❌ Login failed for {scenario['expected_role']} role", "ERROR")
                return False
                
            token = login_response.json()['token']
            user_role = login_response.json()['user']['role']
            
            if user_role != scenario['expected_role']:
                self.log(f"❌ Wrong role returned. Expected: {scenario['expected_role']}, Got: {user_role}", "ERROR")
                return False
                
            # Test that the token works with the expected role
            test_response = self.make_request('GET', scenario['test_endpoint'], token=token)
            
            if not test_response or test_response.status_code not in [200, 403]:
                self.log(f"❌ Token test failed for {scenario['expected_role']} role", "ERROR")
                return False
                
            self.log(f"✅ JWT authentication working for {scenario['expected_role']} role")
        
        return True

    def run_all_tests(self):
        """Run all ICC BFC-ITALIE backend tests"""
        self.log("Starting ICC BFC-ITALIE Backend Comprehensive Testing")
        self.log("=" * 70)
        
        # Setup
        self.setup_test_environment()
        
        # Run tests
        tests = [
            ("Notifications GET Endpoint", self.test_notifications_get_endpoint),
            ("Notifications Mark as Read", self.test_notifications_mark_read),
            ("Notifications Generate", self.test_notifications_generate),
            ("Password Reset - Super Admin Access", self.test_password_reset_super_admin_only),
            ("Password Reset - Permission Denied", self.test_password_reset_permission_denied),
            ("Users Endpoint - Super Admin Access", self.test_users_endpoint_super_admin_access),
            ("User Update with Assignments", self.test_user_update_with_assignments),
            ("POST Visitors Role Restrictions", self.test_post_visitors_role_restrictions),
            ("Basic Login Flow Regression", self.test_basic_login_flow),
            ("JWT Role Authentication Regression", self.test_jwt_role_authentication_still_working)
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
        self.log("\n" + "=" * 70)
        self.log("ICC BFC-ITALIE BACKEND TEST SUMMARY")
        self.log("=" * 70)
        
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
    tester = ICCBFCItalieTester()
    results = tester.run_all_tests()