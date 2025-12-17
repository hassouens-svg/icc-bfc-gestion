#!/usr/bin/env python3
"""
Backend Test Suite for 2 Bug Fixes - December 4, 2024
Testing Agent - Comprehensive Backend Testing

Bug 1: Erreur 404 lors de la suppression d'événements RSVP
Bug 2: Erreur lors de la modification d'un nouveau arrivant (visiteur) par superadmin

Test Focus:
- DELETE /api/events/{event_id} - Universal access for event deletion
- PUT /api/visitors/{visitor_id} - Superadmin can modify all visitors without city filtering
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Configuration
BACKEND_URL = "https://spiritualapp-3.preview.emergentagent.com/api"
TEST_USER = {
    "username": "superadmin",
    "password": "superadmin123",
    "city": "Dijon"
}

class BugFixesBackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.user_info = None
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "status": status,
            "details": details
        })
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
    
    def login(self):
        """Authenticate with the backend"""
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/login", json=TEST_USER)
            if response.status_code == 200:
                data = response.json()
                self.token = data["token"]
                self.user_info = data["user"]
                self.session.headers.update({"Authorization": f"Bearer {self.token}"})
                self.log_test("Authentication", True, f"Logged in as {self.user_info['username']} with role {self.user_info['role']}")
                return True
            else:
                self.log_test("Authentication", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Authentication", False, f"Exception: {str(e)}")
            return False
    
    def test_bug_1_event_deletion(self):
        """
        Bug 1: Test universal access for event deletion
        
        Test Steps:
        1. Create a test event
        2. Add RSVPs to the event
        3. Delete the event (should work with universal access)
        4. Verify event is deleted (404 when trying to get it)
        5. Verify associated RSVPs are also deleted
        6. Test negative case: delete non-existent event (should return 404)
        """
        print("\n🔧 Testing Bug 1: Event Deletion with Universal Access")
        
        # Step 1: Create a test event
        event_data = {
            "title": "Test Event for Deletion",
            "description": "Event created to test universal deletion access",
            "date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
            "time": "19:00",
            "location": "Test Location",
            "rsvp_enabled": True,
            "max_participants": 50
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/events", json=event_data)
            if response.status_code == 200:
                event_result = response.json()
                event_id = event_result["id"]
                self.log_test("Bug 1 - Event Creation", True, f"Created event with ID: {event_id}")
            else:
                self.log_test("Bug 1 - Event Creation", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Bug 1 - Event Creation", False, f"Exception: {str(e)}")
            return False
        
        # Step 2: Add RSVPs to the event
        rsvp_data = {
            "name": "Jean Dupont",
            "email": "jean.dupont@test.com",
            "phone": "+33123456789",
            "status": "confirmed",
            "guests_count": 2,
            "message": "Looking forward to the event!"
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/events/{event_id}/rsvp-public", json=rsvp_data)
            if response.status_code == 200:
                rsvp_result = response.json()
                rsvp_id = rsvp_result["id"]
                self.log_test("Bug 1 - RSVP Creation", True, f"Created RSVP with ID: {rsvp_id}")
            else:
                self.log_test("Bug 1 - RSVP Creation", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Bug 1 - RSVP Creation", False, f"Exception: {str(e)}")
            return False
        
        # Step 3: Verify RSVP exists before deletion
        try:
            response = self.session.get(f"{BACKEND_URL}/events/{event_id}/rsvp")
            if response.status_code == 200:
                rsvp_stats = response.json()
                if rsvp_stats["total"] > 0:
                    self.log_test("Bug 1 - RSVP Verification Before Deletion", True, f"Found {rsvp_stats['total']} RSVP(s)")
                else:
                    self.log_test("Bug 1 - RSVP Verification Before Deletion", False, "No RSVPs found")
            else:
                self.log_test("Bug 1 - RSVP Verification Before Deletion", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Bug 1 - RSVP Verification Before Deletion", False, f"Exception: {str(e)}")
        
        # Step 4: Delete the event (testing universal access)
        try:
            response = self.session.delete(f"{BACKEND_URL}/events/{event_id}")
            if response.status_code == 200:
                self.log_test("Bug 1 - Event Deletion (Universal Access)", True, "Event deleted successfully")
            else:
                self.log_test("Bug 1 - Event Deletion (Universal Access)", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Bug 1 - Event Deletion (Universal Access)", False, f"Exception: {str(e)}")
            return False
        
        # Step 5: Verify event is deleted (should return 404)
        try:
            response = self.session.get(f"{BACKEND_URL}/events/{event_id}")
            if response.status_code == 404:
                self.log_test("Bug 1 - Event Deletion Verification", True, "Event not found (correctly deleted)")
            else:
                self.log_test("Bug 1 - Event Deletion Verification", False, f"Event still exists, Status: {response.status_code}")
        except Exception as e:
            self.log_test("Bug 1 - Event Deletion Verification", False, f"Exception: {str(e)}")
        
        # Step 6: Verify associated RSVPs are also deleted
        try:
            response = self.session.get(f"{BACKEND_URL}/events/{event_id}/rsvp")
            if response.status_code == 404:
                self.log_test("Bug 1 - RSVP Cascade Deletion", True, "RSVPs correctly deleted with event")
            else:
                self.log_test("Bug 1 - RSVP Cascade Deletion", False, f"RSVPs still exist, Status: {response.status_code}")
        except Exception as e:
            self.log_test("Bug 1 - RSVP Cascade Deletion", False, f"Exception: {str(e)}")
        
        # Step 7: Test negative case - delete non-existent event
        fake_event_id = "non-existent-event-id-12345"
        try:
            response = self.session.delete(f"{BACKEND_URL}/events/{fake_event_id}")
            if response.status_code == 404:
                self.log_test("Bug 1 - Delete Non-existent Event", True, "Correctly returned 404 for non-existent event")
            else:
                self.log_test("Bug 1 - Delete Non-existent Event", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_test("Bug 1 - Delete Non-existent Event", False, f"Exception: {str(e)}")
        
        return True
    
    def test_bug_2_visitor_modification(self):
        """
        Bug 2: Test superadmin can modify all visitors without city filtering
        
        Test Steps:
        1. Get an existing visitor (any city)
        2. Modify the visitor as superadmin
        3. Verify the modification was successful
        4. Verify the data was actually updated
        5. Test negative case: modify non-existent visitor (should return 404)
        """
        print("\n🔧 Testing Bug 2: Superadmin Visitor Modification")
        
        # Step 1: Get list of visitors to find one to modify
        try:
            response = self.session.get(f"{BACKEND_URL}/visitors")
            if response.status_code == 200:
                visitors = response.json()
                if visitors:
                    test_visitor = visitors[0]  # Take the first visitor
                    visitor_id = test_visitor["id"]
                    original_firstname = test_visitor["firstname"]
                    self.log_test("Bug 2 - Get Visitor for Testing", True, f"Found visitor: {original_firstname} (ID: {visitor_id})")
                else:
                    # Create a test visitor if none exist
                    visitor_data = {
                        "firstname": "Test",
                        "lastname": "Visitor",
                        "city": "Paris",  # Different city to test cross-city access
                        "types": ["Nouveau Arrivant"],
                        "phone": "+33987654321",
                        "email": "test.visitor@example.com",
                        "arrival_channel": "Site web",
                        "visit_date": datetime.now().strftime("%Y-%m-%d")
                    }
                    
                    create_response = self.session.post(f"{BACKEND_URL}/visitors", json=visitor_data)
                    if create_response.status_code == 200:
                        visitor_result = create_response.json()
                        visitor_id = visitor_result["id"]
                        original_firstname = "Test"
                        self.log_test("Bug 2 - Create Test Visitor", True, f"Created test visitor with ID: {visitor_id}")
                    else:
                        self.log_test("Bug 2 - Create Test Visitor", False, f"Status: {create_response.status_code}")
                        return False
            else:
                self.log_test("Bug 2 - Get Visitor for Testing", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Bug 2 - Get Visitor for Testing", False, f"Exception: {str(e)}")
            return False
        
        # Step 2: Modify the visitor as superadmin
        update_data = {
            "firstname": f"Modified_{original_firstname}",
            "phone": "+33111222333",
            "address": "123 Test Street, Modified City"
        }
        
        try:
            response = self.session.put(f"{BACKEND_URL}/visitors/{visitor_id}", json=update_data)
            if response.status_code == 200:
                self.log_test("Bug 2 - Visitor Modification (Superadmin)", True, "Visitor modified successfully")
            else:
                self.log_test("Bug 2 - Visitor Modification (Superadmin)", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Bug 2 - Visitor Modification (Superadmin)", False, f"Exception: {str(e)}")
            return False
        
        # Step 3: Verify the modification was successful by retrieving the visitor
        try:
            response = self.session.get(f"{BACKEND_URL}/visitors/{visitor_id}")
            if response.status_code == 200:
                updated_visitor = response.json()
                if (updated_visitor["firstname"] == update_data["firstname"] and 
                    updated_visitor["phone"] == update_data["phone"] and
                    updated_visitor.get("address") == update_data["address"]):
                    self.log_test("Bug 2 - Modification Verification", True, f"All fields updated correctly: {updated_visitor['firstname']}, {updated_visitor['phone']}")
                else:
                    self.log_test("Bug 2 - Modification Verification", False, f"Fields not updated correctly. Expected: {update_data}, Got: {updated_visitor}")
            else:
                self.log_test("Bug 2 - Modification Verification", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Bug 2 - Modification Verification", False, f"Exception: {str(e)}")
        
        # Step 4: Test negative case - modify non-existent visitor
        fake_visitor_id = "non-existent-visitor-id-12345"
        try:
            response = self.session.put(f"{BACKEND_URL}/visitors/{fake_visitor_id}", json={"firstname": "Should Fail"})
            if response.status_code == 404:
                self.log_test("Bug 2 - Modify Non-existent Visitor", True, "Correctly returned 404 for non-existent visitor")
            else:
                self.log_test("Bug 2 - Modify Non-existent Visitor", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_test("Bug 2 - Modify Non-existent Visitor", False, f"Exception: {str(e)}")
        
        return True
    
    def run_all_tests(self):
        """Run all bug fix tests"""
        print("🚀 Starting Bug Fixes Backend Test Suite")
        print("=" * 60)
        
        # Authenticate
        if not self.login():
            print("❌ Authentication failed. Cannot proceed with tests.")
            return False
        
        # Test Bug 1: Event Deletion
        self.test_bug_1_event_deletion()
        
        # Test Bug 2: Visitor Modification
        self.test_bug_2_visitor_modification()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if "✅ PASS" in result["status"])
        failed = sum(1 for result in self.test_results if "❌ FAIL" in result["status"])
        
        for result in self.test_results:
            print(f"{result['status']}: {result['test']}")
        
        print(f"\n📈 Results: {passed} passed, {failed} failed out of {len(self.test_results)} tests")
        
        if failed == 0:
            print("🎉 ALL TESTS PASSED! Both bug fixes are working correctly.")
            return True
        else:
            print(f"⚠️  {failed} test(s) failed. Bug fixes may need attention.")
            return False

def main():
    """Main test execution"""
    tester = BugFixesBackendTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ Bug fixes validation completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Bug fixes validation failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()