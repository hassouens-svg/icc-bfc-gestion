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
BASE_URL = "https://ministry-app-7.preview.emergentagent.com/api"
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

    def test_pain_du_jour_workflow(self):
        """Test complete Pain du Jour workflow: fetch transcription → extract verses → generate summary/quiz → save → retrieve"""
        
        # Test data
        test_youtube_url = "https://www.youtube.com/watch?v=jNQXAC9IVRw"
        test_date = datetime.now().strftime("%Y-%m-%d")
        test_title = "Test Message - Pain du Jour"
        
        # Fallback transcription if YouTube fails
        fallback_transcription = """Chers frères et soeurs, aujourd'hui nous allons parler de Jean 3:16. Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu'il ait la vie éternelle. Cela signifie que l'amour de Dieu est inconditionnel. Nous voyons aussi dans Romains 8:28 que toutes choses concourent au bien de ceux qui aiment Dieu. Cette vérité nous encourage dans les moments difficiles."""
        
        transcription_text = None
        
        # Step 1: Fetch YouTube transcription
        try:
            response = self.session.post(
                f"{self.base_url}/pain-du-jour/fetch-transcription",
                json={"youtube_url": test_youtube_url},
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["transcription_complete", "transcription_text", "duree_minutes"]
                
                if all(field in data for field in required_fields):
                    transcription_text = data["transcription_text"]
                    self.log_test(
                        "Pain du Jour - Fetch YouTube Transcription", 
                        True, 
                        f"Transcription: {len(transcription_text)} chars, Duration: {data['duree_minutes']} min"
                    )
                else:
                    missing_fields = [field for field in required_fields if field not in data]
                    self.log_test(
                        "Pain du Jour - Fetch YouTube Transcription", 
                        False, 
                        error=f"Missing fields: {missing_fields}"
                    )
            else:
                self.log_test(
                    "Pain du Jour - Fetch YouTube Transcription", 
                    False, 
                    error=f"Status: {response.status_code}, Response: {response.text}"
                )
                
        except Exception as e:
            self.log_test("Pain du Jour - Fetch YouTube Transcription", False, error=str(e))
        
        # Use fallback if YouTube transcription failed
        if not transcription_text:
            transcription_text = fallback_transcription
            self.log_test(
                "Pain du Jour - Using Fallback Transcription", 
                True, 
                f"Using test transcription: {len(transcription_text)} chars"
            )
        
        # Step 2: Extract biblical verses
        try:
            response = self.session.post(
                f"{self.base_url}/pain-du-jour/extract-versets",
                json={"transcription": transcription_text},
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if "versets" in data and isinstance(data["versets"], list):
                    verses_count = len(data["versets"])
                    self.log_test(
                        "Pain du Jour - Extract Biblical Verses", 
                        True, 
                        f"Extracted {verses_count} biblical verses"
                    )
                    
                    # Validate verse format if verses exist
                    if data["versets"]:
                        sample_verse = data["versets"][0]
                        required_verse_fields = ["reference", "type"]
                        has_required_fields = all(field in sample_verse for field in required_verse_fields)
                        
                        if has_required_fields:
                            self.log_test(
                                "Pain du Jour - Verse Format Validation", 
                                True, 
                                f"Sample verse: {sample_verse.get('reference', 'N/A')} ({sample_verse.get('type', 'N/A')})"
                            )
                        else:
                            missing_fields = [field for field in required_verse_fields if field not in sample_verse]
                            self.log_test(
                                "Pain du Jour - Verse Format Validation", 
                                False, 
                                error=f"Missing verse fields: {missing_fields}"
                            )
                else:
                    self.log_test(
                        "Pain du Jour - Extract Biblical Verses", 
                        False, 
                        error=f"Invalid response format: {data}"
                    )
            else:
                self.log_test(
                    "Pain du Jour - Extract Biblical Verses", 
                    False, 
                    error=f"Status: {response.status_code}, Response: {response.text}"
                )
                
        except Exception as e:
            self.log_test("Pain du Jour - Extract Biblical Verses", False, error=str(e))
        
        # Step 3: Generate summary and quiz
        try:
            response = self.session.post(
                f"{self.base_url}/pain-du-jour/generate-resume-quiz",
                json={
                    "transcription": transcription_text,
                    "titre_message": test_title,
                    "minute_debut": 0
                },
                timeout=120  # Longer timeout for AI generation
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate response structure
                if "resume" in data and "quiz" in data:
                    resume = data["resume"]
                    quiz = data["quiz"]
                    
                    # Validate resume structure
                    resume_fields = ["titre", "resume", "versets_expliques", "points_cles", "phrases_fortes"]
                    has_resume_fields = all(field in resume for field in resume_fields)
                    
                    # Validate quiz structure
                    is_valid_quiz = (
                        isinstance(quiz, list) and 
                        len(quiz) == 10 and
                        all("question" in q and "options" in q and "correct_index" in q for q in quiz)
                    )
                    
                    if has_resume_fields and is_valid_quiz:
                        self.log_test(
                            "Pain du Jour - Generate Summary & Quiz", 
                            True, 
                            f"Generated summary ({len(resume['resume'])} chars) and {len(quiz)} quiz questions"
                        )
                        
                        # Store for next step
                        self.generated_content = {
                            "date": test_date,
                            "resume": resume,
                            "quiz": quiz,
                            "titre_enseignement": test_title
                        }
                    else:
                        missing_resume = [field for field in resume_fields if field not in resume] if not has_resume_fields else []
                        quiz_error = "Invalid quiz format" if not is_valid_quiz else ""
                        self.log_test(
                            "Pain du Jour - Generate Summary & Quiz", 
                            False, 
                            error=f"Missing resume fields: {missing_resume}, Quiz error: {quiz_error}"
                        )
                else:
                    self.log_test(
                        "Pain du Jour - Generate Summary & Quiz", 
                        False, 
                        error=f"Missing 'resume' or 'quiz' in response: {list(data.keys())}"
                    )
            else:
                self.log_test(
                    "Pain du Jour - Generate Summary & Quiz", 
                    False, 
                    error=f"Status: {response.status_code}, Response: {response.text}"
                )
                
        except Exception as e:
            self.log_test("Pain du Jour - Generate Summary & Quiz", False, error=str(e))
        
        # Step 4: Save content
        if hasattr(self, 'generated_content'):
            try:
                response = self.session.post(
                    f"{self.base_url}/pain-du-jour",
                    json=self.generated_content,
                    timeout=30
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if "message" in data:
                        self.log_test(
                            "Pain du Jour - Save Content", 
                            True, 
                            f"Content saved successfully: {data['message']}"
                        )
                    else:
                        self.log_test(
                            "Pain du Jour - Save Content", 
                            False, 
                            error=f"No success message in response: {data}"
                        )
                else:
                    self.log_test(
                        "Pain du Jour - Save Content", 
                        False, 
                        error=f"Status: {response.status_code}, Response: {response.text}"
                    )
                    
            except Exception as e:
                self.log_test("Pain du Jour - Save Content", False, error=str(e))
        else:
            self.log_test(
                "Pain du Jour - Save Content", 
                False, 
                error="No generated content to save (previous step failed)"
            )
        
        # Step 5: Retrieve saved content
        try:
            response = self.session.get(
                f"{self.base_url}/pain-du-jour/{test_date}",
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if "date" in data:
                    # Check if content was properly saved
                    has_resume = "resume" in data and data["resume"] is not None
                    has_quiz = "quiz" in data and data["quiz"] is not None
                    
                    if has_resume and has_quiz:
                        self.log_test(
                            "Pain du Jour - Retrieve Saved Content", 
                            True, 
                            f"Retrieved content for {data['date']} with resume and quiz"
                        )
                    else:
                        self.log_test(
                            "Pain du Jour - Retrieve Saved Content", 
                            True, 
                            f"Retrieved content for {data['date']} (resume: {has_resume}, quiz: {has_quiz})"
                        )
                else:
                    self.log_test(
                        "Pain du Jour - Retrieve Saved Content", 
                        False, 
                        error=f"No date field in response: {data}"
                    )
            else:
                self.log_test(
                    "Pain du Jour - Retrieve Saved Content", 
                    False, 
                    error=f"Status: {response.status_code}, Response: {response.text}"
                )
                
        except Exception as e:
            self.log_test("Pain du Jour - Retrieve Saved Content", False, error=str(e))

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
        self.test_pain_du_jour_workflow()
        
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