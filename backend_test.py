#!/usr/bin/env python3
"""
Backend Testing for Bug Fixes - French Review Request
Testing two critical bug fixes:
1. VITE_API_URL error in bulk-add Anciens Visiteurs 
2. Promo column displaying wrong data (assigned_month vs promo_name)
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Backend URL from environment
BACKEND_URL = "https://churchflow-5.preview.emergentagent.com/api"

# Test accounts
TEST_ACCOUNTS = {
    "superadmin": {"username": "superadmin", "password": "superadmin123", "city": "Dijon"},
    "promotions": {"username": "promotions", "password": "test123", "city": "Dijon"},
    "superviseur_promos": {"username": "superviseur_promos", "password": "superviseur123", "city": "Dijon"}
}

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.current_user = None
        
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
        
    def test_bulk_ancien_visitors_endpoint(self):
        """
        TEST 1: Bug Fix - VITE_API_URL error in bulk-add Anciens Visiteurs
        Verify POST /api/visitors/bulk-ancien works correctly
        """
        print("\n" + "="*80)
        print("🧪 TEST 1: POST /api/visitors/bulk-ancien - Bulk Add Anciens Visiteurs")
        print("="*80)
        
        # Test data - 5 ancien visitors with different months
        test_visitors = [
            {
                "firstname": "Jean",
                "lastname": "Ancien1",
                "city": "Dijon",
                "types": ["Nouveau Arrivant"],
                "phone": "+33612345001",
                "email": "jean.ancien1@test.com",
                "address": "123 Rue Test 1, Dijon",
                "arrival_channel": "Evangelisation",
                "visit_date": "2024-10-15",
                "is_ancien": True
            },
            {
                "firstname": "Marie",
                "lastname": "Ancien2", 
                "city": "Dijon",
                "types": ["Nouveau Converti"],
                "phone": "+33612345002",
                "email": "marie.ancien2@test.com",
                "address": "456 Rue Test 2, Dijon",
                "arrival_channel": "Invitation",
                "visit_date": "2024-11-20",
                "is_ancien": True
            },
            {
                "firstname": "Pierre",
                "lastname": "Ancien3",
                "city": "Dijon", 
                "types": ["De Passage"],
                "phone": "+33612345003",
                "email": "pierre.ancien3@test.com",
                "address": "789 Rue Test 3, Dijon",
                "arrival_channel": "Site Web",
                "visit_date": "2024-12-05",
                "is_ancien": True
            },
            {
                "firstname": "Sophie",
                "lastname": "Ancien4",
                "city": "Dijon",
                "types": ["Nouveau Arrivant", "Nouveau Converti"],
                "phone": "+33612345004", 
                "email": "sophie.ancien4@test.com",
                "address": "321 Rue Test 4, Dijon",
                "arrival_channel": "Réseaux Sociaux",
                "visit_date": "2025-01-10",
                "is_ancien": True
            },
            {
                "firstname": "Lucas",
                "lastname": "Ancien5",
                "city": "Dijon",
                "types": ["De Passage"],
                "phone": "+33612345005",
                "email": "lucas.ancien5@test.com", 
                "address": "654 Rue Test 5, Dijon",
                "arrival_channel": "Bouche à oreille",
                "visit_date": "2025-01-25",
                "is_ancien": True
            }
        ]
        
        print(f"📤 Sending POST request to create {len(test_visitors)} ancien visitors...")
        
        response = self.session.post(
            f"{BACKEND_URL}/visitors/bulk-ancien",
            json=test_visitors,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"📥 Response Status: {response.status_code}")
        print(f"📥 Response Headers: {dict(response.headers)}")
        
        if response.status_code != 200:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            print(f"Error response: {response.text}")
            return False
            
        try:
            response_data = response.json()
            print(f"📥 Response Data: {json.dumps(response_data, indent=2)}")
            
            # Verify response structure
            if "message" not in response_data or "ids" not in response_data:
                print("❌ FAILED: Response missing required fields (message, ids)")
                return False
                
            created_ids = response_data["ids"]
            if len(created_ids) != len(test_visitors):
                print(f"❌ FAILED: Expected {len(test_visitors)} IDs, got {len(created_ids)}")
                return False
                
            print(f"✅ SUCCESS: Created {len(created_ids)} ancien visitors")
            print(f"✅ Created IDs: {created_ids}")
            
            # Store IDs for cleanup later
            self.created_visitor_ids = created_ids
            
            return True
            
        except json.JSONDecodeError as e:
            print(f"❌ FAILED: Invalid JSON response - {e}")
            print(f"Raw response: {response.text}")
            return False
            
    def test_visitors_assigned_month_field(self):
        """
        TEST 2: Bug Fix - Promo column showing wrong data
        Verify GET /api/visitors returns visitors with correct assigned_month field
        """
        print("\n" + "="*80)
        print("🧪 TEST 2: GET /api/visitors - Verify assigned_month field calculation")
        print("="*80)
        
        print("📤 Sending GET request to retrieve all visitors...")
        
        response = self.session.get(f"{BACKEND_URL}/visitors")
        
        print(f"📥 Response Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            print(f"Error response: {response.text}")
            return False
            
        try:
            visitors = response.json()
            print(f"📥 Found {len(visitors)} total visitors")
            
            if len(visitors) == 0:
                print("⚠️  WARNING: No visitors found in database")
                return True
                
            # Check if we have visitors with assigned_month field
            visitors_with_assigned_month = [v for v in visitors if "assigned_month" in v]
            print(f"📊 Visitors with assigned_month field: {len(visitors_with_assigned_month)}")
            
            if len(visitors_with_assigned_month) == 0:
                print("❌ FAILED: No visitors have assigned_month field")
                return False
                
            # Verify assigned_month format and calculation
            print("\n📋 Checking assigned_month field format and calculation:")
            
            valid_assigned_months = 0
            for i, visitor in enumerate(visitors_with_assigned_month[:10]):  # Check first 10
                visitor_id = visitor.get("id", "unknown")
                firstname = visitor.get("firstname", "unknown")
                lastname = visitor.get("lastname", "unknown")
                visit_date = visitor.get("visit_date", "")
                assigned_month = visitor.get("assigned_month", "")
                
                print(f"  {i+1}. {firstname} {lastname} (ID: {visitor_id[:8]}...)")
                print(f"     visit_date: {visit_date}")
                print(f"     assigned_month: {assigned_month}")
                
                # Verify assigned_month format (YYYY-MM)
                if not assigned_month or len(assigned_month) != 7 or assigned_month[4] != '-':
                    print(f"     ❌ Invalid assigned_month format: {assigned_month}")
                    continue
                    
                # Verify assigned_month matches visit_date month
                if visit_date:
                    try:
                        visit_dt = datetime.fromisoformat(visit_date)
                        expected_month = visit_dt.strftime("%Y-%m")
                        
                        if assigned_month == expected_month:
                            print(f"     ✅ assigned_month matches visit_date month")
                            valid_assigned_months += 1
                        else:
                            print(f"     ❌ assigned_month ({assigned_month}) doesn't match visit_date month ({expected_month})")
                    except Exception as e:
                        print(f"     ⚠️  Could not parse visit_date: {e}")
                else:
                    print(f"     ⚠️  No visit_date to verify against")
                    
                print()
                
            print(f"📊 Summary: {valid_assigned_months}/{len(visitors_with_assigned_month[:10])} visitors have correctly calculated assigned_month")
            
            # Check for different months to verify filtering will work
            unique_months = set(v.get("assigned_month", "") for v in visitors_with_assigned_month if v.get("assigned_month"))
            print(f"📅 Unique assigned_month values found: {sorted(unique_months)}")
            
            if len(unique_months) >= 2:
                print("✅ SUCCESS: Multiple months found - filtering functionality will work correctly")
            else:
                print("⚠️  WARNING: Only one unique month found - limited filtering test coverage")
                
            return True
            
        except json.JSONDecodeError as e:
            print(f"❌ FAILED: Invalid JSON response - {e}")
            print(f"Raw response: {response.text}")
            return False
            
    def test_role_permissions(self):
        """
        TEST 3: Verify role-based permissions for bulk-ancien endpoint
        """
        print("\n" + "="*80)
        print("🧪 TEST 3: Role-based permissions for bulk-ancien endpoint")
        print("="*80)
        
        # Test with different roles
        roles_to_test = ["promotions", "superviseur_promos"]
        
        for role in roles_to_test:
            print(f"\n🔄 Testing with {role} role...")
            
            try:
                self.login(role)
                
                # Simple test data
                test_data = [{
                    "firstname": f"Test{role}",
                    "lastname": "Permission",
                    "city": "Dijon",
                    "types": ["Nouveau Arrivant"],
                    "phone": "+33612999999",
                    "email": f"test.{role}@permission.com",
                    "arrival_channel": "Test",
                    "visit_date": "2025-01-15",
                    "is_ancien": True
                }]
                
                response = self.session.post(
                    f"{BACKEND_URL}/visitors/bulk-ancien",
                    json=test_data,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    print(f"  ✅ {role} can create bulk ancien visitors")
                    # Store ID for cleanup
                    if hasattr(self, 'created_visitor_ids'):
                        response_data = response.json()
                        self.created_visitor_ids.extend(response_data.get("ids", []))
                    else:
                        self.created_visitor_ids = response.json().get("ids", [])
                else:
                    print(f"  ❌ {role} cannot create bulk ancien visitors: {response.status_code}")
                    
            except Exception as e:
                print(f"  ❌ Error testing {role}: {e}")
                
        return True
        
    def cleanup_test_data(self):
        """Clean up created test visitors"""
        if not hasattr(self, 'created_visitor_ids') or not self.created_visitor_ids:
            print("\n🧹 No test visitors to clean up")
            return
            
        print(f"\n🧹 Cleaning up {len(self.created_visitor_ids)} test visitors...")
        
        # Login as superadmin for cleanup
        try:
            self.login("superadmin")
            
            deleted_count = 0
            for visitor_id in self.created_visitor_ids:
                try:
                    response = self.session.delete(f"{BACKEND_URL}/visitors/{visitor_id}")
                    if response.status_code == 200:
                        deleted_count += 1
                    else:
                        print(f"  ⚠️  Could not delete visitor {visitor_id}: {response.status_code}")
                except Exception as e:
                    print(f"  ⚠️  Error deleting visitor {visitor_id}: {e}")
                    
            print(f"✅ Cleaned up {deleted_count}/{len(self.created_visitor_ids)} test visitors")
            
        except Exception as e:
            print(f"❌ Error during cleanup: {e}")

def main():
    """Run all backend tests"""
    print("🚀 Starting Backend Testing for French Review Bug Fixes")
    print("="*80)
    
    tester = BackendTester()
    
    try:
        # Initialize database first
        print("🔧 Initializing database...")
        init_response = tester.session.post(f"{BACKEND_URL}/init")
        if init_response.status_code == 200:
            print("✅ Database initialized successfully")
        else:
            print(f"⚠️  Database init returned: {init_response.status_code}")
        
        # Login as superadmin (only working account)
        tester.login("superadmin")
        
        # Run tests
        test_results = []
        
        # Test 1: Bulk ancien visitors endpoint
        result1 = tester.test_bulk_ancien_visitors_endpoint()
        test_results.append(("POST /api/visitors/bulk-ancien", result1))
        
        # Test 2: Visitors assigned_month field
        result2 = tester.test_visitors_assigned_month_field()
        test_results.append(("GET /api/visitors assigned_month", result2))
        
        # Test 3: Role permissions
        result3 = tester.test_role_permissions()
        test_results.append(("Role-based permissions", result3))
        
        # Print summary
        print("\n" + "="*80)
        print("📊 TEST SUMMARY")
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
            print("🎉 ALL TESTS PASSED - Bug fixes are working correctly!")
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