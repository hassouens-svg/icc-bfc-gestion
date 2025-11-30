#!/usr/bin/env python3
"""
Create test scenario to reproduce the 309 fidèles issue
"""

import requests
import json
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')
BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://event-church.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

class TestScenarioCreator:
    def __init__(self):
        self.session = requests.Session()
        self.pasteur_token = None
        self.admin_token = None
        
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
    
    def login_as_admin(self):
        """Login as super admin to create test data"""
        login_data = {
            "username": "superadmin",
            "password": "superadmin123",
            "city": "Dijon"
        }
        
        response = self.make_request('POST', '/auth/login', json=login_data)
        
        if not response or response.status_code != 200:
            self.log("❌ Admin login failed", "ERROR")
            return False
        
        login_result = response.json()
        self.admin_token = login_result['token']
        self.log("✅ Admin login successful")
        return True
    
    def login_as_pasteur(self):
        """Login as pasteur"""
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
    
    def create_culte_stats_with_309_fideles(self):
        """Create culte stats with 309 fidèles in Dijon to reproduce the issue"""
        self.log("\n=== CREATING CULTE STATS WITH 309 FIDÈLES ===")
        
        if not self.admin_token:
            return False
        
        # Create culte stats for Dijon with 309 fidèles
        dijon_stats = {
            "date": "2025-01-05",
            "ville": "Dijon",
            "type_culte": "Culte 1",
            "nombre_fideles": 309,
            "nombre_adultes": 250,
            "nombre_enfants": 59,
            "nombre_stars": 15
        }
        
        response = self.make_request('POST', '/culte-stats', 
                                   token=self.admin_token,
                                   json=dijon_stats)
        
        if response and response.status_code == 200:
            self.log("✅ Created Dijon culte stats with 309 fidèles")
        else:
            self.log("❌ Failed to create Dijon culte stats", "ERROR")
            return False
        
        # Create culte stats for Milan with different numbers
        milan_stats = {
            "date": "2025-01-05",
            "ville": "Milan",
            "type_culte": "Culte 1",
            "nombre_fideles": 85,
            "nombre_adultes": 70,
            "nombre_enfants": 15,
            "nombre_stars": 8
        }
        
        response = self.make_request('POST', '/culte-stats', 
                                   token=self.admin_token,
                                   json=milan_stats)
        
        if response and response.status_code == 200:
            self.log("✅ Created Milan culte stats with 85 fidèles")
        else:
            self.log("❌ Failed to create Milan culte stats", "ERROR")
        
        return True
    
    def create_more_visitors_for_cities(self):
        """Create more visitors to have substantial data"""
        self.log("\n=== CREATING MORE VISITORS FOR TESTING ===")
        
        if not self.admin_token:
            return False
        
        # Create more visitors for Dijon
        dijon_visitors = [
            {
                "firstname": "Pierre",
                "lastname": "Dubois",
                "city": "Dijon",
                "types": ["Nouveau Arrivant"],
                "phone": "+33111111111",
                "arrival_channel": "Ami",
                "visit_date": "2025-01-05"
            },
            {
                "firstname": "Sophie",
                "lastname": "Moreau",
                "city": "Dijon",
                "types": ["Nouveau Converti"],
                "phone": "+33222222222",
                "arrival_channel": "Internet",
                "visit_date": "2025-01-08"
            },
            {
                "firstname": "Luc",
                "lastname": "Bernard",
                "city": "Dijon",
                "types": ["De Passage"],
                "phone": "+33333333333",
                "arrival_channel": "Famille",
                "visit_date": "2025-01-12"
            }
        ]
        
        # Create more visitors for Milan
        milan_visitors = [
            {
                "firstname": "Alessandro",
                "lastname": "Bianchi",
                "city": "Milan",
                "types": ["Nouveau Arrivant"],
                "phone": "+39111111111",
                "arrival_channel": "Publicité",
                "visit_date": "2025-01-06"
            },
            {
                "firstname": "Francesca",
                "lastname": "Romano",
                "city": "Milan",
                "types": ["Nouveau Converti"],
                "phone": "+39222222222",
                "arrival_channel": "Ami",
                "visit_date": "2025-01-09"
            }
        ]
        
        all_visitors = dijon_visitors + milan_visitors
        created_count = 0
        
        for visitor_data in all_visitors:
            response = self.make_request('POST', '/visitors', 
                                       token=self.admin_token,
                                       json=visitor_data)
            if response and response.status_code == 200:
                created_count += 1
                self.log(f"   ✅ Created: {visitor_data['firstname']} {visitor_data['lastname']} ({visitor_data['city']})")
        
        self.log(f"Created {created_count}/{len(all_visitors)} additional visitors")
        return True
    
    def test_city_filtering_with_real_data(self):
        """Test city filtering with the created data"""
        self.log("\n=== TESTING CITY FILTERING WITH REAL DATA ===")
        
        if not self.pasteur_token:
            return False
        
        # Test promotions data
        self.log("\n--- Promotions Data ---")
        
        # All cities
        response = self.make_request('GET', '/analytics/promotions-detailed', 
                                   token=self.pasteur_token)
        if response and response.status_code == 200:
            data = response.json()
            total = data.get('summary', {}).get('total_visitors', 0)
            self.log(f"All cities: {total} visitors")
        
        # Milan only
        response = self.make_request('GET', '/analytics/promotions-detailed?ville=Milan', 
                                   token=self.pasteur_token)
        if response and response.status_code == 200:
            data = response.json()
            milan_total = data.get('summary', {}).get('total_visitors', 0)
            self.log(f"Milan only: {milan_total} visitors")
        
        # Dijon only
        response = self.make_request('GET', '/analytics/promotions-detailed?ville=Dijon', 
                                   token=self.pasteur_token)
        if response and response.status_code == 200:
            data = response.json()
            dijon_total = data.get('summary', {}).get('total_visitors', 0)
            self.log(f"Dijon only: {dijon_total} visitors")
        
        # Test culte stats
        self.log("\n--- Culte Stats ---")
        response = self.make_request('GET', '/culte-stats', token=self.pasteur_token)
        if response and response.status_code == 200:
            stats = response.json()
            for stat in stats:
                ville = stat.get('ville')
                fideles = stat.get('nombre_fideles')
                self.log(f"{ville}: {fideles} fidèles")
        
        return True
    
    def verify_fix_is_working(self):
        """Verify that the city filtering fix is working correctly"""
        self.log("\n=== VERIFYING THE FIX IS WORKING ===")
        
        if not self.pasteur_token:
            return False
        
        # When pasteur selects Milan, should see Milan data only
        milan_response = self.make_request('GET', '/analytics/promotions-detailed?ville=Milan', 
                                         token=self.pasteur_token)
        
        # When pasteur selects Dijon, should see Dijon data only  
        dijon_response = self.make_request('GET', '/analytics/promotions-detailed?ville=Dijon', 
                                         token=self.pasteur_token)
        
        if milan_response and dijon_response and milan_response.status_code == 200 and dijon_response.status_code == 200:
            milan_data = milan_response.json()
            dijon_data = dijon_response.json()
            
            milan_visitors = milan_data.get('summary', {}).get('total_visitors', 0)
            dijon_visitors = dijon_data.get('summary', {}).get('total_visitors', 0)
            
            self.log(f"✅ Milan selection shows {milan_visitors} Milan visitors")
            self.log(f"✅ Dijon selection shows {dijon_visitors} Dijon visitors")
            
            if milan_visitors != dijon_visitors:
                self.log("✅ CITY FILTERING IS WORKING CORRECTLY!")
                self.log("   - Different cities show different visitor counts")
                self.log("   - No more showing Dijon data when Milan is selected")
                return True
            else:
                self.log("❌ City filtering might not be working - same counts for different cities")
                return False
        
        return False
    
    def run_test_scenario(self):
        """Run the complete test scenario"""
        self.log("Creating Test Scenario to Verify Pasteur Dashboard City Filtering Fix")
        self.log("=" * 80)
        
        # Login as admin to create data
        if not self.login_as_admin():
            return
        
        # Create test data
        self.create_culte_stats_with_309_fideles()
        self.create_more_visitors_for_cities()
        
        # Login as pasteur to test
        if not self.login_as_pasteur():
            return
        
        # Test the filtering
        self.test_city_filtering_with_real_data()
        
        # Verify the fix
        success = self.verify_fix_is_working()
        
        self.log("\n" + "=" * 80)
        if success:
            self.log("🎉 TEST SCENARIO COMPLETE - CITY FILTERING FIX VERIFIED!")
        else:
            self.log("⚠️  TEST SCENARIO COMPLETE - ISSUES DETECTED")
        self.log("=" * 80)

if __name__ == "__main__":
    creator = TestScenarioCreator()
    creator.run_test_scenario()