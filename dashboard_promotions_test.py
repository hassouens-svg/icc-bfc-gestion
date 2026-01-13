#!/usr/bin/env python3
"""
Backend Testing for Dashboard Promotions Complete - French Review Request
Testing modifications to:
1. /analytics/promotions-detailed endpoint with new filters and data structure
2. Pasteur permissions for culte-stats (PUT/DELETE operations)
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Backend URL from environment
BACKEND_URL = "https://ministry-app-7.preview.emergentagent.com/api"

# Test accounts
TEST_ACCOUNTS = {
    "superadmin": {"username": "superadmin", "password": "superadmin123", "city": "Dijon"},
    "pasteur": {"username": "pasteur", "password": "pasteur123", "city": "Dijon"}
}

class DashboardPromotionsTest:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.current_user = None
        self.created_culte_stat_id = None
        
    def login(self, account_key):
        """Login with specified account"""
        if account_key not in TEST_ACCOUNTS:
            raise ValueError(f"Unknown account: {account_key}")
            
        account = TEST_ACCOUNTS[account_key]
        
        print(f"🔐 Logging in as {account['username']}...")
        
        response = self.session.post(
            f"{BACKEND_URL}/auth/login",
            json=account,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code != 200:
            raise Exception(f"Login failed: {response.status_code} - {response.text}")
            
        data = response.json()
        self.token = data["token"]
        self.current_user = data["user"]
        
        # Set authorization header for future requests
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        
        print(f"✅ Successfully logged in as {self.current_user['username']} (role: {self.current_user['role']})")
        return data
        
    def test_promotions_detailed_without_filters(self):
        """
        TEST 1: Test /analytics/promotions-detailed without filters
        """
        print("\n" + "="*80)
        print("🧪 TEST 1: GET /analytics/promotions-detailed - Sans filtres")
        print("="*80)
        
        print("📤 Sending GET request without filters...")
        
        response = self.session.get(f"{BACKEND_URL}/analytics/promotions-detailed")
        
        print(f"📥 Response Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            print(f"Error response: {response.text}")
            return False
            
        try:
            data = response.json()
            print(f"📥 Response Data Keys: {list(data.keys())}")
            
            # Verify required fields in response
            required_fields = ["summary"]
            missing_fields = []
            
            for field in required_fields:
                if field not in data:
                    missing_fields.append(field)
                    
            if missing_fields:
                print(f"❌ FAILED: Missing required fields: {missing_fields}")
                return False
                
            # Check summary structure
            summary = data.get("summary", {})
            print(f"📊 Summary keys: {list(summary.keys())}")
            
            # Verify summary contains required fields
            summary_required = ["total_dp"]
            summary_missing = []
            
            for field in summary_required:
                if field not in summary:
                    summary_missing.append(field)
                    
            if summary_missing:
                print(f"❌ FAILED: Summary missing required fields: {summary_missing}")
                return False
                
            print(f"✅ SUCCESS: total_dp found: {summary.get('total_dp')}")
            
            # Check for canal fields
            canal_fields = ["canal_evangelisation", "canal_invitation", "canal_reseaux", "canal_autres"]
            found_canals = []
            
            for canal in canal_fields:
                if canal in summary:
                    found_canals.append(canal)
                    print(f"✅ Found {canal}: {summary.get(canal)}")
                    
            if len(found_canals) == 0:
                print("⚠️  WARNING: No canal fields found in summary")
            else:
                print(f"✅ SUCCESS: Found {len(found_canals)}/{len(canal_fields)} canal fields")
                
            # Check if daily_details is present (should not be present without mois/annee)
            if "daily_details" in data:
                print(f"⚠️  WARNING: daily_details present without mois/annee filters: {len(data['daily_details'])} items")
            else:
                print("✅ SUCCESS: daily_details correctly absent without mois/annee filters")
                
            return True
            
        except json.JSONDecodeError as e:
            print(f"❌ FAILED: Invalid JSON response - {e}")
            print(f"Raw response: {response.text}")
            return False
            
    def test_promotions_detailed_with_ville_filter(self):
        """
        TEST 2: Test /analytics/promotions-detailed with ville=Dijon
        """
        print("\n" + "="*80)
        print("🧪 TEST 2: GET /analytics/promotions-detailed?ville=Dijon")
        print("="*80)
        
        print("📤 Sending GET request with ville=Dijon filter...")
        
        response = self.session.get(f"{BACKEND_URL}/analytics/promotions-detailed?ville=Dijon")
        
        print(f"📥 Response Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            print(f"Error response: {response.text}")
            return False
            
        try:
            data = response.json()
            print(f"📥 Response Data Keys: {list(data.keys())}")
            
            # Verify summary structure
            summary = data.get("summary", {})
            print(f"📊 Summary for Dijon: {json.dumps(summary, indent=2)}")
            
            # Check that we have data for Dijon specifically
            if "total_dp" in summary:
                print(f"✅ SUCCESS: total_dp for Dijon: {summary['total_dp']}")
            else:
                print("❌ FAILED: total_dp not found in summary")
                return False
                
            # Verify canal fields
            canal_fields = ["canal_evangelisation", "canal_invitation", "canal_reseaux", "canal_autres"]
            for canal in canal_fields:
                if canal in summary:
                    print(f"✅ {canal}: {summary[canal]}")
                    
            return True
            
        except json.JSONDecodeError as e:
            print(f"❌ FAILED: Invalid JSON response - {e}")
            print(f"Raw response: {response.text}")
            return False
            
    def test_promotions_detailed_with_full_filters(self):
        """
        TEST 3: Test /analytics/promotions-detailed with ville=Dijon&mois=01&annee=2025
        """
        print("\n" + "="*80)
        print("🧪 TEST 3: GET /analytics/promotions-detailed?ville=Dijon&mois=01&annee=2025")
        print("="*80)
        
        print("📤 Sending GET request with full filters...")
        
        response = self.session.get(f"{BACKEND_URL}/analytics/promotions-detailed?ville=Dijon&mois=01&annee=2025")
        
        print(f"📥 Response Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            print(f"Error response: {response.text}")
            return False
            
        try:
            data = response.json()
            print(f"📥 Response Data Keys: {list(data.keys())}")
            
            # Verify summary structure
            summary = data.get("summary", {})
            print(f"📊 Summary for Dijon Jan 2025: {json.dumps(summary, indent=2)}")
            
            # Check daily_details array (should be present with mois AND annee)
            if "daily_details" in data:
                daily_details = data["daily_details"]
                print(f"✅ SUCCESS: daily_details array found with {len(daily_details)} items")
                
                # Check structure of daily_details items
                if len(daily_details) > 0:
                    first_item = daily_details[0]
                    print(f"📋 First daily_details item keys: {list(first_item.keys())}")
                    
                    # Check for required fields in promo details
                    if "dp_count" in first_item:
                        print(f"✅ dp_count found: {first_item['dp_count']}")
                    if "suivis_arretes_count" in first_item:
                        print(f"✅ suivis_arretes_count found: {first_item['suivis_arretes_count']}")
                    if "suivis_arretes_details" in first_item:
                        print(f"✅ suivis_arretes_details found: {len(first_item['suivis_arretes_details'])} items")
                    if "expected_presences_dimanche" in first_item:
                        print(f"✅ expected_presences_dimanche found: {first_item['expected_presences_dimanche']}")
                    if "expected_presences_jeudi" in first_item:
                        print(f"✅ expected_presences_jeudi found: {first_item['expected_presences_jeudi']}")
                        
            else:
                print("❌ FAILED: daily_details array not found with mois/annee filters")
                return False
                
            return True
            
        except json.JSONDecodeError as e:
            print(f"❌ FAILED: Invalid JSON response - {e}")
            print(f"Raw response: {response.text}")
            return False
            
    def create_test_culte_stat(self):
        """Create a test culte stat for pasteur permissions testing"""
        print("\n🔧 Creating test culte stat for permissions testing...")
        
        test_stat = {
            "date": "2025-01-19",
            "ville": "Dijon",
            "type_culte": "Culte 1",
            "nombre_fideles": 100,
            "nombre_adultes": 70,
            "nombre_enfants": 30,
            "nombre_stars": 15,
            "commentaire": "Test stat for pasteur permissions"
        }
        
        response = self.session.post(
            f"{BACKEND_URL}/culte-stats",
            json=test_stat,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            self.created_culte_stat_id = data.get("id")
            print(f"✅ Created test culte stat with ID: {self.created_culte_stat_id}")
            return True
        else:
            print(f"❌ Failed to create test culte stat: {response.status_code} - {response.text}")
            return False
            
    def test_pasteur_culte_stats_update_permissions(self):
        """
        TEST 4: Test Pasteur permissions for PUT /culte-stats/{stat_id}
        """
        print("\n" + "="*80)
        print("🧪 TEST 4: Pasteur permissions - PUT /culte-stats/{stat_id}")
        print("="*80)
        
        # Login as pasteur
        self.login("pasteur")
        
        if not self.created_culte_stat_id:
            print("❌ FAILED: No test culte stat available")
            return False
            
        print(f"📤 Testing PUT /culte-stats/{self.created_culte_stat_id} as pasteur...")
        
        update_data = {
            "nombre_fideles": 120,
            "nombre_stars": 20,
            "commentaire": "Updated by pasteur - permissions test"
        }
        
        response = self.session.put(
            f"{BACKEND_URL}/culte-stats/{self.created_culte_stat_id}",
            json=update_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"📥 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ SUCCESS: Pasteur can update culte stats (no 403 error)")
            return True
        elif response.status_code == 403:
            print("❌ FAILED: Pasteur still denied access (403) - permissions not fixed")
            print(f"Error response: {response.text}")
            return False
        else:
            print(f"❌ FAILED: Unexpected status code {response.status_code}")
            print(f"Error response: {response.text}")
            return False
            
    def test_pasteur_culte_stats_delete_permissions(self):
        """
        TEST 5: Test Pasteur permissions for DELETE /culte-stats/{stat_id}
        """
        print("\n" + "="*80)
        print("🧪 TEST 5: Pasteur permissions - DELETE /culte-stats/{stat_id}")
        print("="*80)
        
        # Should already be logged in as pasteur from previous test
        if self.current_user.get("role") != "pasteur":
            self.login("pasteur")
            
        if not self.created_culte_stat_id:
            print("❌ FAILED: No test culte stat available")
            return False
            
        print(f"📤 Testing DELETE /culte-stats/{self.created_culte_stat_id} as pasteur...")
        
        response = self.session.delete(f"{BACKEND_URL}/culte-stats/{self.created_culte_stat_id}")
        
        print(f"📥 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ SUCCESS: Pasteur can delete culte stats (no 403 error)")
            self.created_culte_stat_id = None  # Mark as deleted
            return True
        elif response.status_code == 403:
            print("❌ FAILED: Pasteur still denied access (403) - permissions not fixed")
            print(f"Error response: {response.text}")
            return False
        else:
            print(f"❌ FAILED: Unexpected status code {response.status_code}")
            print(f"Error response: {response.text}")
            return False
            
    def cleanup_test_data(self):
        """Clean up created test data"""
        if self.created_culte_stat_id:
            print(f"\n🧹 Cleaning up test culte stat {self.created_culte_stat_id}...")
            
            # Login as superadmin for cleanup
            try:
                self.login("superadmin")
                response = self.session.delete(f"{BACKEND_URL}/culte-stats/{self.created_culte_stat_id}")
                if response.status_code == 200:
                    print("✅ Test culte stat cleaned up successfully")
                else:
                    print(f"⚠️  Could not clean up test culte stat: {response.status_code}")
            except Exception as e:
                print(f"❌ Error during cleanup: {e}")

def main():
    """Run all dashboard promotions tests"""
    print("🚀 Starting Dashboard Promotions Complete Testing")
    print("="*80)
    
    tester = DashboardPromotionsTest()
    
    try:
        # Initialize database first
        print("🔧 Initializing database...")
        init_response = tester.session.post(f"{BACKEND_URL}/init")
        if init_response.status_code == 200:
            print("✅ Database initialized successfully")
        else:
            print(f"⚠️  Database init returned: {init_response.status_code}")
        
        # Login as superadmin for initial tests
        tester.login("superadmin")
        
        # Create test culte stat for permissions testing
        tester.create_test_culte_stat()
        
        # Run tests
        test_results = []
        
        # Test 1: Promotions detailed without filters
        result1 = tester.test_promotions_detailed_without_filters()
        test_results.append(("GET /analytics/promotions-detailed (sans filtres)", result1))
        
        # Test 2: Promotions detailed with ville filter
        result2 = tester.test_promotions_detailed_with_ville_filter()
        test_results.append(("GET /analytics/promotions-detailed?ville=Dijon", result2))
        
        # Test 3: Promotions detailed with full filters
        result3 = tester.test_promotions_detailed_with_full_filters()
        test_results.append(("GET /analytics/promotions-detailed (filtres complets)", result3))
        
        # Test 4: Pasteur UPDATE permissions
        result4 = tester.test_pasteur_culte_stats_update_permissions()
        test_results.append(("Pasteur PUT /culte-stats permissions", result4))
        
        # Test 5: Pasteur DELETE permissions
        result5 = tester.test_pasteur_culte_stats_delete_permissions()
        test_results.append(("Pasteur DELETE /culte-stats permissions", result5))
        
        # Print summary
        print("\n" + "="*80)
        print("📊 TEST SUMMARY - Dashboard Promotions Complete")
        print("="*80)
        
        passed = 0
        total = len(test_results)
        
        for test_name, result in test_results:
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{status} - {test_name}")
            if result:
                passed += 1
                
        print(f"\n🎯 Overall Result: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 ALL TESTS PASSED - Dashboard Promotions modifications working correctly!")
            print("✅ Endpoint /analytics/promotions-detailed avec nouveaux filtres: FONCTIONNEL")
            print("✅ Permissions Pasteur pour culte-stats (PUT/DELETE): FONCTIONNELLES")
        else:
            print("⚠️  SOME TESTS FAILED - Issues need attention")
            
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        
    finally:
        # Cleanup
        tester.cleanup_test_data()

if __name__ == "__main__":
    main()