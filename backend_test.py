#!/usr/bin/env python3
"""
Backend API Tests for ICC Hub Application
Testing: Chatbot IA, Events Popup, and Berger Presences APIs
"""

import requests
import json
import os
from datetime import datetime, timedelta
import uuid

# Configuration
BASE_URL = "https://videosum-2.preview.emergentagent.com/api"
TEST_CREDENTIALS = {
    "username": "superadmin",
    "password": "superadmin123"
}

class ICCHubTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name, success, details="", error=""):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "error": error,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if error:
            print(f"   Error: {error}")
        print()

    def authenticate(self):
        """Authenticate and get token"""
        try:
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json=TEST_CREDENTIALS,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("token")
                self.session.headers.update({"Authorization": f"Bearer {self.token}"})
                self.log_test("Authentication", True, f"Logged in as {data.get('user', {}).get('username')}")
                return True
            else:
                self.log_test("Authentication", False, error=f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Authentication", False, error=str(e))
            return False

    def test_chatbot_ia_api(self):
        """Test Chatbot IA API with French message about app features"""
        try:
            # Test 1: Basic French message about app features
            test_message = {
                "message": "Bonjour Audrey ! Peux-tu me parler des fonctionnalités principales de l'application ICC Hub ? Quels sont les modules disponibles ?",
                "session_id": str(uuid.uuid4()),
                "role": "super_admin"
            }
            
            response = self.session.post(
                f"{self.base_url}/chatbot/message",
                json=test_message,
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                chatbot_response = data.get("response", "")
                session_id = data.get("session_id", "")
                
                # Verify response is in French and relevant
                french_indicators = ["ICC Hub", "application", "fonctionnalités", "module", "visiteur", "église"]
                has_french_content = any(indicator.lower() in chatbot_response.lower() for indicator in french_indicators)
                
                if has_french_content and len(chatbot_response) > 50:
                    self.log_test(
                        "Chatbot IA - French App Features Query", 
                        True, 
                        f"Response length: {len(chatbot_response)} chars, Session ID: {session_id[:8]}..."
                    )
                    
                    # Test 2: Session continuity
                    followup_message = {
                        "message": "Et comment puis-je gérer les visiteurs ?",
                        "session_id": session_id,
                        "role": "super_admin"
                    }
                    
                    followup_response = self.session.post(
                        f"{self.base_url}/chatbot/message",
                        json=followup_message,
                        timeout=60
                    )
                    
                    if followup_response.status_code == 200:
                        followup_data = followup_response.json()
                        self.log_test(
                            "Chatbot IA - Session Continuity", 
                            True, 
                            f"Follow-up response: {len(followup_data.get('response', ''))} chars"
                        )
                    else:
                        self.log_test(
                            "Chatbot IA - Session Continuity", 
                            False, 
                            error=f"Status: {followup_response.status_code}"
                        )
                        
                else:
                    self.log_test(
                        "Chatbot IA - French App Features Query", 
                        False, 
                        error=f"Response not relevant or too short: {chatbot_response[:100]}..."
                    )
            else:
                self.log_test(
                    "Chatbot IA - French App Features Query", 
                    False, 
                    error=f"Status: {response.status_code}, Response: {response.text}"
                )
                
        except Exception as e:
            self.log_test("Chatbot IA - French App Features Query", False, error=str(e))

    def test_events_popup_api(self):
        """Test Events Popup API - should return events from planning_activites collection"""
        try:
            response = self.session.get(
                f"{self.base_url}/events/upcoming",
                timeout=30
            )
            
            if response.status_code == 200:
                events = response.json()
                
                if isinstance(events, list):
                    self.log_test(
                        "Events Popup API - Response Format", 
                        True, 
                        f"Returned {len(events)} events"
                    )
                    
                    # Check event format if events exist
                    if events:
                        sample_event = events[0]
                        required_fields = ["titre", "ville", "days_until", "date_debut"]
                        has_required_fields = all(field in sample_event for field in required_fields)
                        
                        if has_required_fields:
                            self.log_test(
                                "Events Popup API - Event Format", 
                                True, 
                                f"Sample event: {sample_event.get('titre', 'N/A')} in {sample_event.get('ville', 'N/A')}"
                            )
                        else:
                            missing_fields = [field for field in required_fields if field not in sample_event]
                            self.log_test(
                                "Events Popup API - Event Format", 
                                False, 
                                error=f"Missing fields: {missing_fields}"
                            )
                    else:
                        self.log_test(
                            "Events Popup API - Event Format", 
                            True, 
                            "No events in next 30 days (expected if no events scheduled)"
                        )
                else:
                    self.log_test(
                        "Events Popup API - Response Format", 
                        False, 
                        error=f"Expected list, got {type(events)}"
                    )
            else:
                self.log_test(
                    "Events Popup API - Response Format", 
                    False, 
                    error=f"Status: {response.status_code}, Response: {response.text}"
                )
                
        except Exception as e:
            self.log_test("Events Popup API - Response Format", False, error=str(e))

    def test_berger_presences_apis(self):
        """Test Berger Presences APIs - batch save and latest get"""
        try:
            # Test 1: POST /api/berger-presences/batch
            test_date = datetime.now().strftime("%Y-%m-%d")
            test_berger_id = str(uuid.uuid4())
            
            batch_data = {
                "presences": [
                    {
                        "berger_id": test_berger_id,
                        "date": test_date,
                        "present": True,
                        "priere": True,
                        "commentaire": "Test presence entry",
                        "enregistre_par": "test_user",
                        "ville": "Milan",
                        "promo_name": "Test Promo 2024",
                        "noms_bergers": "Jean Dupont, Marie Martin",
                        "personnes_suivies": 15
                    }
                ]
            }
            
            response = self.session.post(
                f"{self.base_url}/berger-presences/batch",
                json=batch_data,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if "count" in data and data["count"] > 0:
                    self.log_test(
                        "Berger Presences - Batch Save", 
                        True, 
                        f"Saved {data['count']} presence(s)"
                    )
                else:
                    self.log_test(
                        "Berger Presences - Batch Save", 
                        False, 
                        error=f"No count in response: {data}"
                    )
            else:
                self.log_test(
                    "Berger Presences - Batch Save", 
                    False, 
                    error=f"Status: {response.status_code}, Response: {response.text}"
                )
            
            # Test 2: GET /api/berger-presences/latest?ville=Milan
            response = self.session.get(
                f"{self.base_url}/berger-presences/latest?ville=Milan",
                timeout=30
            )
            
            if response.status_code == 200:
                latest_presences = response.json()
                
                if isinstance(latest_presences, list):
                    self.log_test(
                        "Berger Presences - Latest Get", 
                        True, 
                        f"Retrieved {len(latest_presences)} latest presences for Milan"
                    )
                    
                    # Check if our test data is included (if any presences exist)
                    if latest_presences:
                        sample_presence = latest_presences[0]
                        expected_fields = ["berger_id", "date", "present", "ville"]
                        has_expected_fields = all(field in sample_presence for field in expected_fields)
                        
                        if has_expected_fields:
                            self.log_test(
                                "Berger Presences - Data Format", 
                                True, 
                                f"Sample presence for {sample_presence.get('ville', 'N/A')} on {sample_presence.get('date', 'N/A')}"
                            )
                        else:
                            missing_fields = [field for field in expected_fields if field not in sample_presence]
                            self.log_test(
                                "Berger Presences - Data Format", 
                                False, 
                                error=f"Missing fields: {missing_fields}"
                            )
                else:
                    self.log_test(
                        "Berger Presences - Latest Get", 
                        False, 
                        error=f"Expected list, got {type(latest_presences)}"
                    )
            else:
                self.log_test(
                    "Berger Presences - Latest Get", 
                    False, 
                    error=f"Status: {response.status_code}, Response: {response.text}"
                )
                
        except Exception as e:
            self.log_test("Berger Presences APIs", False, error=str(e))

    def run_all_tests(self):
        """Run all tests"""
        print("=" * 60)
        print("ICC Hub Backend API Tests")
        print("=" * 60)
        print(f"Base URL: {self.base_url}")
        print(f"Test Time: {datetime.now().isoformat()}")
        print("=" * 60)
        print()
        
        # Authenticate first
        if not self.authenticate():
            print("❌ Authentication failed. Cannot proceed with tests.")
            return
        
        # Run tests
        self.test_chatbot_ia_api()
        self.test_events_popup_api()
        self.test_berger_presences_apis()
        
        # Summary
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\nFAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"- {result['test']}: {result['error']}")
        
        print("=" * 60)
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = ICCHubTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)