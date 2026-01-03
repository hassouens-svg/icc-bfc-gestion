#!/usr/bin/env python3
"""
RSVP Events Backend Test Suite
Tests the complete RSVP Links feature for My Events Church section
"""

import requests
import json
import os
import sys
from datetime import datetime, timedelta

# Configuration
BACKEND_URL = "https://faith-hub-23.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test credentials
TEST_USER = {
    "username": "superadmin",
    "password": "superadmin123", 
    "city": "Dijon"
}

class RSVPEventsTest:
    def __init__(self):
        self.token = None
        self.created_events = []
        self.test_results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "message": message,
            "details": details or {}
        }
        self.test_results.append(result)
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_login(self):
        """Test 1: Login and get authentication token"""
        try:
            response = requests.post(f"{API_BASE}/auth/login", json=TEST_USER)
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("token")
                user_info = data.get("user", {})
                
                if self.token and user_info.get("role") == "super_admin":
                    self.log_result("Login", True, f"Successfully logged in as {user_info.get('username')}")
                    return True
                else:
                    self.log_result("Login", False, "Invalid token or role in response", data)
                    return False
            else:
                self.log_result("Login", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Login", False, f"Exception: {str(e)}")
            return False
    
    def get_headers(self):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {self.token}"}
    
    def test_upload_event_image(self):
        """Test 2: Upload image for event"""
        try:
            # Create a simple test image file
            test_image_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
            
            files = {'file': ('test_event.png', test_image_content, 'image/png')}
            
            response = requests.post(
                f"{API_BASE}/upload-event-image",
                files=files,
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                image_url = data.get("image_url")
                if image_url and image_url.startswith(BACKEND_URL):
                    self.log_result("Image Upload", True, f"Image uploaded successfully: {image_url}")
                    return image_url
                else:
                    self.log_result("Image Upload", False, "Invalid image URL in response", data)
                    return None
            else:
                self.log_result("Image Upload", False, f"HTTP {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_result("Image Upload", False, f"Exception: {str(e)}")
            return None
    
    def test_create_event_full(self, image_url=None):
        """Test 3: Create event with all fields"""
        try:
            future_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
            
            event_data = {
                "title": "Test Church Event - Full Details",
                "description": "This is a comprehensive test event with all fields populated",
                "date": future_date,
                "time": "18:00",
                "location": "Paris Community Center",
                "image_url": image_url,
                "rsvp_enabled": True,
                "max_participants": 50
            }
            
            response = requests.post(
                f"{API_BASE}/events",
                json=event_data,
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                event_id = data.get("id")
                if event_id:
                    self.created_events.append(event_id)
                    self.log_result("Create Event (Full)", True, f"Event created with ID: {event_id}")
                    return event_id
                else:
                    self.log_result("Create Event (Full)", False, "No event ID in response", data)
                    return None
            else:
                self.log_result("Create Event (Full)", False, f"HTTP {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_result("Create Event (Full)", False, f"Exception: {str(e)}")
            return None
    
    def test_create_event_minimal(self):
        """Test 4: Create event with only required fields"""
        try:
            future_date = (datetime.now() + timedelta(days=15)).strftime("%Y-%m-%d")
            
            event_data = {
                "title": "Minimal Test Event",
                "date": future_date,
                "description": None,
                "time": None,
                "location": None,
                "image_url": None
            }
            
            response = requests.post(
                f"{API_BASE}/events",
                json=event_data,
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                event_id = data.get("id")
                if event_id:
                    self.created_events.append(event_id)
                    self.log_result("Create Event (Minimal)", True, f"Minimal event created with ID: {event_id}")
                    return event_id
                else:
                    self.log_result("Create Event (Minimal)", False, "No event ID in response", data)
                    return None
            else:
                self.log_result("Create Event (Minimal)", False, f"HTTP {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_result("Create Event (Minimal)", False, f"Exception: {str(e)}")
            return None
    
    def test_get_events(self):
        """Test 5: Get all user's events"""
        try:
            response = requests.get(
                f"{API_BASE}/events",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                events = response.json()
                if isinstance(events, list):
                    created_count = len([e for e in events if e.get("id") in self.created_events])
                    self.log_result("Get Events", True, f"Retrieved {len(events)} events, {created_count} are our test events")
                    return events
                else:
                    self.log_result("Get Events", False, "Response is not a list", events)
                    return []
            else:
                self.log_result("Get Events", False, f"HTTP {response.status_code}", response.text)
                return []
                
        except Exception as e:
            self.log_result("Get Events", False, f"Exception: {str(e)}")
            return []
    
    def test_get_specific_event(self, event_id):
        """Test 6: Get specific event (public access)"""
        try:
            response = requests.get(f"{API_BASE}/events/{event_id}")
            
            if response.status_code == 200:
                event = response.json()
                if event.get("id") == event_id:
                    self.log_result("Get Specific Event", True, f"Retrieved event: {event.get('title')}")
                    return event
                else:
                    self.log_result("Get Specific Event", False, "Event ID mismatch", event)
                    return None
            else:
                self.log_result("Get Specific Event", False, f"HTTP {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_result("Get Specific Event", False, f"Exception: {str(e)}")
            return None
    
    def test_submit_rsvp(self, event_id, rsvp_data):
        """Test 7: Submit RSVP (public endpoint)"""
        try:
            response = requests.post(f"{API_BASE}/events/{event_id}/rsvp-public", json=rsvp_data)
            
            if response.status_code == 200:
                data = response.json()
                rsvp_id = data.get("id")
                if rsvp_id and data.get("message") == "RSVP submitted":
                    self.log_result("Submit RSVP", True, f"RSVP submitted with ID: {rsvp_id}")
                    return rsvp_id
                else:
                    self.log_result("Submit RSVP", False, "Invalid response format", data)
                    return None
            else:
                self.log_result("Submit RSVP", False, f"HTTP {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_result("Submit RSVP", False, f"Exception: {str(e)}")
            return None
    
    def test_get_rsvp_stats(self, event_id):
        """Test 8: Get RSVP statistics"""
        try:
            response = requests.get(
                f"{API_BASE}/events/{event_id}/rsvp",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["total", "confirmed", "declined", "maybe", "responses"]
                if all(field in data for field in required_fields):
                    stats = f"Total: {data['total']}, Confirmed: {data['confirmed']}, Declined: {data['declined']}, Maybe: {data['maybe']}"
                    self.log_result("Get RSVP Stats", True, f"RSVP stats retrieved - {stats}")
                    return data
                else:
                    self.log_result("Get RSVP Stats", False, "Missing required fields in response", data)
                    return None
            else:
                self.log_result("Get RSVP Stats", False, f"HTTP {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_result("Get RSVP Stats", False, f"Exception: {str(e)}")
            return None
    
    def test_delete_event(self, event_id):
        """Test 9: Delete event"""
        try:
            response = requests.delete(
                f"{API_BASE}/events/{event_id}",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "Event deleted":
                    self.log_result("Delete Event", True, f"Event {event_id} deleted successfully")
                    return True
                else:
                    self.log_result("Delete Event", False, "Unexpected response message", data)
                    return False
            else:
                self.log_result("Delete Event", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Delete Event", False, f"Exception: {str(e)}")
            return False
    
    def test_verify_rsvp_deletion(self, event_id):
        """Test 10: Verify RSVPs are deleted with event"""
        try:
            response = requests.get(
                f"{API_BASE}/events/{event_id}/rsvp",
                headers=self.get_headers()
            )
            
            if response.status_code == 404:
                self.log_result("Verify RSVP Deletion", True, "Event and RSVPs properly deleted")
                return True
            else:
                self.log_result("Verify RSVP Deletion", False, f"Event still exists: HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Verify RSVP Deletion", False, f"Exception: {str(e)}")
            return False
    
    def run_comprehensive_test(self):
        """Run the complete test suite"""
        print("=" * 60)
        print("RSVP EVENTS BACKEND TEST SUITE")
        print("=" * 60)
        
        # Test 1: Login
        if not self.test_login():
            print("❌ Login failed - cannot continue tests")
            return False
        
        # Test 2: Upload image
        image_url = self.test_upload_event_image()
        
        # Test 3: Create event with full details
        full_event_id = self.test_create_event_full(image_url)
        
        # Test 4: Create minimal event
        minimal_event_id = self.test_create_event_minimal()
        
        # Test 5: Get all events
        events = self.test_get_events()
        
        # Test 6: Get specific event (use full event)
        if full_event_id:
            event_details = self.test_get_specific_event(full_event_id)
        
        # Test 7: Submit multiple RSVPs
        rsvp_ids = []
        if full_event_id:
            # RSVP 1: Confirmed with guests
            rsvp1 = {
                "name": "Jean Dupont",
                "email": "jean.dupont@test.com",
                "phone": "+33123456789",
                "status": "confirmed",
                "guests_count": 2,
                "message": "Looking forward to this event!",
                "source": "direct"
            }
            rsvp_id1 = self.test_submit_rsvp(full_event_id, rsvp1)
            if rsvp_id1:
                rsvp_ids.append(rsvp_id1)
            
            # RSVP 2: Declined
            rsvp2 = {
                "name": "Marie Martin",
                "email": "marie.martin@test.com",
                "status": "declined",
                "guests_count": 1,
                "message": "Unfortunately cannot attend"
            }
            rsvp_id2 = self.test_submit_rsvp(full_event_id, rsvp2)
            if rsvp_id2:
                rsvp_ids.append(rsvp_id2)
            
            # RSVP 3: Maybe
            rsvp3 = {
                "name": "Pierre Durand",
                "phone": "+33987654321",
                "status": "maybe",
                "guests_count": 1,
                "message": "Will try to make it"
            }
            rsvp_id3 = self.test_submit_rsvp(full_event_id, rsvp3)
            if rsvp_id3:
                rsvp_ids.append(rsvp_id3)
        
        # Test 8: Get RSVP statistics
        if full_event_id:
            stats = self.test_get_rsvp_stats(full_event_id)
            
            # Verify stats are correct
            if stats:
                expected_total = len(rsvp_ids)
                if stats["total"] == expected_total:
                    self.log_result("RSVP Stats Verification", True, f"Stats match expected values")
                else:
                    self.log_result("RSVP Stats Verification", False, f"Expected {expected_total} total, got {stats['total']}")
        
        # Test 9: Delete one event and verify RSVPs are also deleted
        if minimal_event_id:
            if self.test_delete_event(minimal_event_id):
                self.test_verify_rsvp_deletion(minimal_event_id)
        
        # Summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        passed = len([r for r in self.test_results if "✅" in r["status"]])
        failed = len([r for r in self.test_results if "❌" in r["status"]])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success Rate: {(passed/total*100):.1f}%")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if "❌" in result["status"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        # Clean up remaining events
        print(f"\n🧹 Cleaning up {len(self.created_events)} test events...")
        for event_id in self.created_events:
            try:
                requests.delete(f"{API_BASE}/events/{event_id}", headers=self.get_headers())
            except:
                pass
        
        return failed == 0

if __name__ == "__main__":
    tester = RSVPEventsTest()
    success = tester.run_comprehensive_test()
    sys.exit(0 if success else 1)