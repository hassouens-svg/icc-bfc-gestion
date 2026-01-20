#!/usr/bin/env python3
"""
Detailed Pasteur Dashboard City Filtering Test
Examines the actual data returned by endpoints to verify city filtering
"""

import requests
import json
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')
BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://agenda-ministry.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

class DetailedPasteurTester:
    def __init__(self):
        self.session = requests.Session()
        self.pasteur_token = None
        
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
    
    def setup_and_login(self):
        """Setup test data and login as pasteur"""
        self.log("Setting up test data and logging in as pasteur...")
        
        # Initialize data
        init_response = self.make_request('POST', '/init')
        if init_response and init_response.status_code == 200:
            self.log("✅ Test data initialized")
        
        # Login as pasteur
        login_data = {
            "username": "pasteur",
            "password": "pasteur123",
            "city": "Dijon"
        }
        
        response = self.make_request('POST', '/auth/login', json=login_data)
        
        if not response or response.status_code != 200:
            self.log("❌ Pasteur login failed", "ERROR")
            return False
        
        login_result = response.json()
        self.pasteur_token = login_result['token']
        self.log("✅ Pasteur login successful")
        return True
    
    def examine_promotions_detailed_data(self):
        """Examine the actual data returned by promotions-detailed endpoints"""
        self.log("\n=== EXAMINING PROMOTIONS DETAILED DATA ===")
        
        if not self.pasteur_token:
            self.log("❌ No pasteur token", "ERROR")
            return
        
        # Test all cities
        self.log("\n--- All Cities Data ---")
        all_response = self.make_request('GET', '/analytics/promotions-detailed', 
                                       token=self.pasteur_token)
        if all_response and all_response.status_code == 200:
            all_data = all_response.json()
            self.log(f"All cities response: {json.dumps(all_data, indent=2)}")
        
        # Test Milan
        self.log("\n--- Milan Data ---")
        milan_response = self.make_request('GET', '/analytics/promotions-detailed?ville=Milan', 
                                         token=self.pasteur_token)
        if milan_response and milan_response.status_code == 200:
            milan_data = milan_response.json()
            self.log(f"Milan response: {json.dumps(milan_data, indent=2)}")
        
        # Test Dijon
        self.log("\n--- Dijon Data ---")
        dijon_response = self.make_request('GET', '/analytics/promotions-detailed?ville=Dijon', 
                                         token=self.pasteur_token)
        if dijon_response and dijon_response.status_code == 200:
            dijon_data = dijon_response.json()
            self.log(f"Dijon response: {json.dumps(dijon_data, indent=2)}")
    
    def examine_fi_detailed_data(self):
        """Examine the actual data returned by fi-detailed endpoints"""
        self.log("\n=== EXAMINING FI DETAILED DATA ===")
        
        if not self.pasteur_token:
            self.log("❌ No pasteur token", "ERROR")
            return
        
        # Test Milan FI
        self.log("\n--- Milan FI Data ---")
        milan_fi_response = self.make_request('GET', '/analytics/fi-detailed?ville=Milan', 
                                            token=self.pasteur_token)
        if milan_fi_response and milan_fi_response.status_code == 200:
            milan_fi_data = milan_fi_response.json()
            self.log(f"Milan FI response: {json.dumps(milan_fi_data, indent=2)}")
        
        # Test Dijon FI
        self.log("\n--- Dijon FI Data ---")
        dijon_fi_response = self.make_request('GET', '/analytics/fi-detailed?ville=Dijon', 
                                            token=self.pasteur_token)
        if dijon_fi_response and dijon_fi_response.status_code == 200:
            dijon_fi_data = dijon_fi_response.json()
            self.log(f"Dijon FI response: {json.dumps(dijon_fi_data, indent=2)}")
    
    def check_if_endpoints_exist(self):
        """Check if the analytics endpoints exist in the backend"""
        self.log("\n=== CHECKING ENDPOINT AVAILABILITY ===")
        
        if not self.pasteur_token:
            self.log("❌ No pasteur token", "ERROR")
            return
        
        endpoints_to_check = [
            '/analytics/promotions-detailed',
            '/analytics/fi-detailed',
            '/analytics/stats',
            '/fidelisation/admin'
        ]
        
        for endpoint in endpoints_to_check:
            response = self.make_request('GET', endpoint, token=self.pasteur_token)
            if response:
                self.log(f"   {endpoint}: {response.status_code}")
                if response.status_code == 404:
                    self.log(f"      ❌ Endpoint not found")
                elif response.status_code == 200:
                    self.log(f"      ✅ Endpoint available")
                elif response.status_code == 403:
                    self.log(f"      ⚠️  Endpoint exists but access denied")
                else:
                    self.log(f"      ⚠️  Unexpected status")
    
    def create_test_visitors_for_cities(self):
        """Create test visitors for different cities to test filtering"""
        self.log("\n=== CREATING TEST VISITORS FOR DIFFERENT CITIES ===")
        
        if not self.pasteur_token:
            self.log("❌ No pasteur token", "ERROR")
            return
        
        # Create visitors for Milan and Dijon
        test_visitors = [
            {
                "firstname": "Marco",
                "lastname": "Rossi",
                "city": "Milan",
                "types": ["Nouveau Arrivant"],
                "phone": "+39123456789",
                "arrival_channel": "Ami",
                "visit_date": "2025-01-15"
            },
            {
                "firstname": "Giuseppe",
                "lastname": "Verdi",
                "city": "Milan", 
                "types": ["Nouveau Converti"],
                "phone": "+39987654321",
                "arrival_channel": "Internet",
                "visit_date": "2025-01-20"
            },
            {
                "firstname": "Jean",
                "lastname": "Dupont",
                "city": "Dijon",
                "types": ["Nouveau Arrivant"],
                "phone": "+33123456789",
                "arrival_channel": "Famille",
                "visit_date": "2025-01-10"
            },
            {
                "firstname": "Marie",
                "lastname": "Martin",
                "city": "Dijon",
                "types": ["De Passage"],
                "phone": "+33987654321",
                "arrival_channel": "Publicité",
                "visit_date": "2025-01-25"
            }
        ]
        
        created_count = 0
        for visitor_data in test_visitors:
            response = self.make_request('POST', '/visitors', 
                                       token=self.pasteur_token,
                                       json=visitor_data)
            if response and response.status_code == 200:
                created_count += 1
                self.log(f"   ✅ Created visitor: {visitor_data['firstname']} {visitor_data['lastname']} ({visitor_data['city']})")
            else:
                self.log(f"   ⚠️  Failed to create visitor: {visitor_data['firstname']} {visitor_data['lastname']}")
        
        self.log(f"Created {created_count}/{len(test_visitors)} test visitors")
    
    def run_comprehensive_test(self):
        """Run comprehensive test of Pasteur dashboard city filtering"""
        self.log("Starting Comprehensive Pasteur Dashboard City Filtering Test")
        self.log("=" * 70)
        
        # Setup
        if not self.setup_and_login():
            return
        
        # Check endpoint availability
        self.check_if_endpoints_exist()
        
        # Create test data
        self.create_test_visitors_for_cities()
        
        # Examine actual data
        self.examine_promotions_detailed_data()
        self.examine_fi_detailed_data()
        
        self.log("\n" + "=" * 70)
        self.log("COMPREHENSIVE TEST COMPLETE")
        self.log("=" * 70)

if __name__ == "__main__":
    tester = DetailedPasteurTester()
    tester.run_comprehensive_test()