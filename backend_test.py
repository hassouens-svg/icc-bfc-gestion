#!/usr/bin/env python3
"""
Backend Test Suite for Le Pain du Jour Feature
Tests all Pain du Jour endpoints with realistic data
"""

import requests
import json
from datetime import datetime, timedelta
import sys

# Backend URL from frontend .env
BASE_URL = "https://dailymanna-1.preview.emergentagent.com/api"

# Test credentials
ADMIN_CREDENTIALS = {
    "username": "superadmin",
    "password": "superadmin123"
}

class PainDuJourTester:
    def __init__(self):
        self.token = None
        self.test_results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "details": details
        })
    
    def authenticate(self):
        """Login as admin to get token"""
        try:
            response = requests.post(
                f"{BASE_URL}/auth/login",
                json=ADMIN_CREDENTIALS,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("token")
                self.log_result("Authentication", True, "Admin login successful")
                return True
            else:
                self.log_result("Authentication", False, f"Login failed: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Authentication", False, f"Login error: {str(e)}")
            return False
    
    def test_get_bible_books(self):
        """Test GET /api/pain-du-jour/livres"""
        try:
            response = requests.get(f"{BASE_URL}/pain-du-jour/livres", timeout=10)
            
            if response.status_code == 200:
                books = response.json()
                if isinstance(books, list) and len(books) == 66:
                    # Check for some expected books
                    expected_books = ["Genèse", "Matthieu", "Apocalypse", "Psaumes"]
                    found_books = [book for book in expected_books if book in books]
                    
                    if len(found_books) == len(expected_books):
                        self.log_result("Bible Books", True, f"Retrieved {len(books)} Bible books correctly")
                    else:
                        self.log_result("Bible Books", False, f"Missing expected books: {set(expected_books) - set(found_books)}")
                else:
                    self.log_result("Bible Books", False, f"Expected 66 books, got {len(books) if isinstance(books, list) else 'non-list'}")
            else:
                self.log_result("Bible Books", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Bible Books", False, f"Request error: {str(e)}")
    
    def test_youtube_info(self):
        """Test POST /api/pain-du-jour/youtube-info"""
        try:
            # Test with a valid YouTube URL
            test_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            
            response = requests.post(
                f"{BASE_URL}/pain-du-jour/youtube-info",
                json={"url": test_url},
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["video_id", "title", "thumbnail_url", "duration"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_result("YouTube Info", True, f"Retrieved video metadata: {data.get('title', 'Unknown')}")
                else:
                    self.log_result("YouTube Info", False, f"Missing fields: {missing_fields}")
            else:
                self.log_result("YouTube Info", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("YouTube Info", False, f"Request error: {str(e)}")
    
    def test_get_today_content(self):
        """Test GET /api/pain-du-jour/today"""
        try:
            response = requests.get(f"{BASE_URL}/pain-du-jour/today", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                today = datetime.now().strftime("%Y-%m-%d")
                
                if "date" in data and "versets" in data:
                    self.log_result("Today Content", True, f"Retrieved today's content for {data.get('date')}")
                else:
                    self.log_result("Today Content", False, "Missing required fields (date, versets)")
            else:
                self.log_result("Today Content", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Today Content", False, f"Request error: {str(e)}")
    
    def test_get_specific_date_content(self):
        """Test GET /api/pain-du-jour/{date}"""
        try:
            test_date = "2025-12-15"
            response = requests.get(f"{BASE_URL}/pain-du-jour/{test_date}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if "date" in data and "versets" in data and data["date"] == test_date:
                    self.log_result("Specific Date Content", True, f"Retrieved content for {test_date}")
                else:
                    self.log_result("Specific Date Content", False, f"Invalid response structure or date mismatch")
            else:
                self.log_result("Specific Date Content", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Specific Date Content", False, f"Request error: {str(e)}")
    
    def test_track_click(self):
        """Test POST /api/pain-du-jour/click"""
        try:
            click_data = {
                "type": "priere",
                "date": "2025-12-15"
            }
            
            response = requests.post(
                f"{BASE_URL}/pain-du-jour/click",
                json=click_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_result("Click Tracking", True, "Click tracked successfully")
                else:
                    self.log_result("Click Tracking", False, "No confirmation message received")
            else:
                self.log_result("Click Tracking", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Click Tracking", False, f"Request error: {str(e)}")
    
    def test_submit_poll(self):
        """Test POST /api/pain-du-jour/sondage"""
        try:
            poll_data = {
                "date": "2025-12-15",
                "lecture_reponse": "Oui",
                "video_reponse": "Oui"
            }
            
            response = requests.post(
                f"{BASE_URL}/pain-du-jour/sondage",
                json=poll_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_result("Poll Submission", True, "Poll submitted successfully")
                else:
                    self.log_result("Poll Submission", False, "No confirmation message received")
            else:
                self.log_result("Poll Submission", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Poll Submission", False, f"Request error: {str(e)}")
    
    def test_save_content_admin(self):
        """Test POST /api/pain-du-jour (admin only)"""
        if not self.token:
            self.log_result("Save Content (Admin)", False, "No authentication token available")
            return
            
        try:
            content_data = {
                "date": "2025-12-15",
                "lien_priere": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "titre_priere": "Temps de Prière du Jour",
                "lien_enseignement": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "titre_enseignement": "Enseignement du Jour",
                "versets": [
                    {
                        "livre": "Matthieu",
                        "chapitre": 6,
                        "verset_debut": 11,
                        "verset_fin": 11
                    }
                ]
            }
            
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.post(
                f"{BASE_URL}/pain-du-jour",
                json=content_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_result("Save Content (Admin)", True, "Content saved successfully")
                else:
                    self.log_result("Save Content (Admin)", False, "No confirmation message received")
            else:
                self.log_result("Save Content (Admin)", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Save Content (Admin)", False, f"Request error: {str(e)}")
    
    def test_get_stats_admin(self):
        """Test GET /api/pain-du-jour/stats/{year} (admin only)"""
        if not self.token:
            self.log_result("Get Stats (Admin)", False, "No authentication token available")
            return
            
        try:
            year = 2025
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(
                f"{BASE_URL}/pain-du-jour/stats/{year}",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Get Stats (Admin)", True, f"Retrieved {len(data)} statistics records for {year}")
                else:
                    self.log_result("Get Stats (Admin)", False, "Expected list of statistics")
            else:
                self.log_result("Get Stats (Admin)", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Get Stats (Admin)", False, f"Request error: {str(e)}")
    
    def test_unauthorized_access(self):
        """Test that admin endpoints require authentication"""
        try:
            # Test save content without token
            response = requests.post(
                f"{BASE_URL}/pain-du-jour",
                json={"date": "2025-12-15"},
                timeout=10
            )
            
            if response.status_code == 401 or response.status_code == 403:
                self.log_result("Unauthorized Access", True, "Admin endpoints properly protected")
            else:
                self.log_result("Unauthorized Access", False, f"Expected 401/403, got {response.status_code}")
                
        except Exception as e:
            self.log_result("Unauthorized Access", False, f"Request error: {str(e)}")
    
    def run_all_tests(self):
        """Run all Pain du Jour tests"""
        print("🧪 Starting Le Pain du Jour Backend Tests")
        print("=" * 50)
        
        # Public endpoints (no auth required)
        self.test_get_bible_books()
        self.test_youtube_info()
        self.test_get_today_content()
        self.test_get_specific_date_content()
        self.test_track_click()
        self.test_submit_poll()
        
        # Test unauthorized access
        self.test_unauthorized_access()
        
        # Admin endpoints (auth required)
        if self.authenticate():
            self.test_save_content_admin()
            self.test_get_stats_admin()
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        return passed == total

if __name__ == "__main__":
    tester = PainDuJourTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)