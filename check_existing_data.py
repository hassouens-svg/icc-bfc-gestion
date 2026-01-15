#!/usr/bin/env python3
"""
Check existing data to see if we can find the "309 fidèles" mentioned in the issue
"""

import requests
import json
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')
BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://disciple-tracker.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

class DataChecker:
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
    
    def check_all_visitors(self):
        """Check all visitors in the system"""
        self.log("\n=== CHECKING ALL VISITORS ===")
        
        if not self.pasteur_token:
            return
        
        response = self.make_request('GET', '/visitors', token=self.pasteur_token)
        if response and response.status_code == 200:
            visitors = response.json()
            self.log(f"Total visitors found: {len(visitors)}")
            
            # Group by city
            by_city = {}
            for visitor in visitors:
                city = visitor.get('city', 'Unknown')
                if city not in by_city:
                    by_city[city] = []
                by_city[city].append(visitor)
            
            for city, city_visitors in by_city.items():
                self.log(f"   {city}: {len(city_visitors)} visitors")
                for visitor in city_visitors[:3]:  # Show first 3
                    self.log(f"      - {visitor.get('firstname')} {visitor.get('lastname')} (Month: {visitor.get('assigned_month')})")
                if len(city_visitors) > 3:
                    self.log(f"      ... and {len(city_visitors) - 3} more")
    
    def check_culte_stats(self):
        """Check culte stats which might contain the 309 fidèles"""
        self.log("\n=== CHECKING CULTE STATS ===")
        
        if not self.pasteur_token:
            return
        
        response = self.make_request('GET', '/culte-stats', token=self.pasteur_token)
        if response and response.status_code == 200:
            stats = response.json()
            self.log(f"Total culte stats found: {len(stats)}")
            
            for stat in stats:
                fideles = stat.get('nombre_fideles', 0)
                ville = stat.get('ville', 'Unknown')
                date = stat.get('date', 'Unknown')
                self.log(f"   {ville} on {date}: {fideles} fidèles")
                
                if fideles == 309:
                    self.log(f"   🎯 FOUND THE 309 FIDÈLES! City: {ville}, Date: {date}")
        else:
            self.log("No culte stats found or access denied")
    
    def check_old_endpoints(self):
        """Check the old endpoints that were mentioned in the issue"""
        self.log("\n=== CHECKING OLD ENDPOINTS ===")
        
        if not self.pasteur_token:
            return
        
        # Check old getStats endpoint
        response = self.make_request('GET', '/analytics/stats', token=self.pasteur_token)
        if response and response.status_code == 200:
            stats = response.json()
            self.log("Old /analytics/stats endpoint data:")
            self.log(f"   {json.dumps(stats, indent=2)}")
        
        # Check old getAdminFidelisation endpoint  
        response = self.make_request('GET', '/fidelisation/admin', token=self.pasteur_token)
        if response and response.status_code == 200:
            fidelisation = response.json()
            self.log("Old /fidelisation/admin endpoint data:")
            self.log(f"   Found {len(fidelisation)} referent records")
            for ref in fidelisation:
                self.log(f"      - {ref.get('referent_username')}: {ref.get('total_visitors')} visitors")
    
    def test_dashboard_endpoints_with_different_cities(self):
        """Test dashboard endpoints with different city selections"""
        self.log("\n=== TESTING DASHBOARD ENDPOINTS WITH CITY SELECTION ===")
        
        if not self.pasteur_token:
            return
        
        cities_to_test = ['Milan', 'Dijon', 'Rome', 'Perugia']
        
        for city in cities_to_test:
            self.log(f"\n--- Testing with city: {city} ---")
            
            # Test promotions-detailed
            response = self.make_request('GET', f'/analytics/promotions-detailed?ville={city}', 
                                       token=self.pasteur_token)
            if response and response.status_code == 200:
                data = response.json()
                total_visitors = data.get('summary', {}).get('total_visitors', 0)
                self.log(f"   Promotions for {city}: {total_visitors} visitors")
            
            # Test fi-detailed
            response = self.make_request('GET', f'/analytics/fi-detailed?ville={city}', 
                                       token=self.pasteur_token)
            if response and response.status_code == 200:
                data = response.json()
                total_fi = data.get('summary', {}).get('total_fi', 0)
                self.log(f"   FI for {city}: {total_fi} familles d'impact")
    
    def run_data_check(self):
        """Run comprehensive data check"""
        self.log("Starting Data Check to Find 309 Fidèles Issue")
        self.log("=" * 60)
        
        if not self.login_as_pasteur():
            return
        
        self.check_all_visitors()
        self.check_culte_stats()
        self.check_old_endpoints()
        self.test_dashboard_endpoints_with_different_cities()
        
        self.log("\n" + "=" * 60)
        self.log("DATA CHECK COMPLETE")
        self.log("=" * 60)

if __name__ == "__main__":
    checker = DataChecker()
    checker.run_data_check()