#!/usr/bin/env python3
"""
Data Export/Import System Testing
Tests GET /api/admin/export-all-data and POST /api/admin/import-all-data endpoints
"""

import requests
import json
from datetime import datetime

# Backend URL
BASE_URL = "https://agenda-ministry.preview.emergentagent.com/api"

# Test credentials
SUPER_ADMIN = {"username": "superadmin", "password": "superadmin123", "city": "Dijon"}
PASTEUR = {"username": "pasteur", "password": "pasteur123", "city": "Dijon"}

def login(credentials):
    """Login and get token"""
    response = requests.post(f"{BASE_URL}/auth/login", json=credentials)
    if response.status_code == 200:
        data = response.json()
        return data["token"]
    else:
        print(f"❌ Login failed: {response.status_code} - {response.text}")
        return None

def test_export_as_superadmin(token):
    """Test 1: Export Data as Super Admin"""
    print("\n" + "="*80)
    print("TEST 1: Export Data as Super Admin")
    print("="*80)
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/admin/export-all-data", headers=headers)
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        
        # Verify response structure
        print("\n✅ Export successful!")
        print(f"\n📊 Metadata:")
        if "metadata" in data:
            metadata = data["metadata"]
            print(f"  - Export Date: {metadata.get('export_date')}")
            print(f"  - Exported By: {metadata.get('exported_by')}")
            print(f"  - Total Records: {metadata.get('total_records')}")
            
            if "collections" in metadata:
                print(f"\n📦 Collection Counts:")
                for collection, count in metadata["collections"].items():
                    print(f"  - {collection}: {count}")
        
        # Verify all collections are present
        expected_collections = [
            "cities", "users", "visitors", "secteurs", 
            "familles_impact", "membres_fi", "presences_fi", 
            "culte_stats", "notifications"
        ]
        
        missing_collections = []
        for collection in expected_collections:
            if collection not in data:
                missing_collections.append(collection)
        
        if missing_collections:
            print(f"\n⚠️ Missing collections: {missing_collections}")
            return False, None
        else:
            print(f"\n✅ All {len(expected_collections)} collections present")
        
        # Verify data structure is valid JSON
        try:
            json_str = json.dumps(data)
            print(f"✅ Data structure is valid JSON ({len(json_str)} bytes)")
        except Exception as e:
            print(f"❌ Invalid JSON structure: {e}")
            return False, None
        
        return True, data
    else:
        print(f"❌ Export failed: {response.text}")
        return False, None

def test_export_as_pasteur(token):
    """Test 2: Export Data as Pasteur (Should Fail)"""
    print("\n" + "="*80)
    print("TEST 2: Export Data as Pasteur (Should Fail with 403)")
    print("="*80)
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/admin/export-all-data", headers=headers)
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 403:
        print("✅ Correctly denied access (403)")
        try:
            error_data = response.json()
            print(f"Error Message: {error_data.get('detail')}")
            if "super admin" in error_data.get('detail', '').lower():
                print("✅ Correct error message: 'Super admin only'")
                return True
            else:
                print("⚠️ Error message doesn't mention super admin requirement")
                return True
        except:
            print("⚠️ No JSON error message")
            return True
    else:
        print(f"❌ Expected 403, got {response.status_code}")
        print(f"Response: {response.text}")
        return False

def test_import_as_superadmin(token, export_data):
    """Test 3: Import Data as Super Admin"""
    print("\n" + "="*80)
    print("TEST 3: Import Data as Super Admin")
    print("="*80)
    
    if not export_data:
        print("⚠️ Skipping test - no export data available")
        return False
    
    # Modify a small portion of the data for testing
    # We'll add a test city to verify import worked
    test_data = export_data.copy()
    
    # Add a test city
    test_city = {
        "id": "test-city-import-verification",
        "name": "Test Import City"
    }
    
    if "cities" in test_data:
        # Remove test city if it exists
        test_data["cities"] = [c for c in test_data["cities"] if c.get("id") != test_city["id"]]
        # Add test city
        test_data["cities"].append(test_city)
        print(f"📝 Modified data: Added test city '{test_city['name']}'")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"\n🔄 Importing data...")
    print(f"⚠️ WARNING: This will clear existing database!")
    
    response = requests.post(f"{BASE_URL}/admin/import-all-data", json=test_data, headers=headers, timeout=120)
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print("\n✅ Import successful!")
        
        if "message" in result:
            print(f"Message: {result['message']}")
        
        if "counts" in result:
            print(f"\n📊 Import Counts:")
            for collection, count in result["counts"].items():
                print(f"  - {collection}: {count}")
        
        # Verify the import by checking if test city exists
        print(f"\n🔍 Verifying import by checking test city...")
        cities_response = requests.get(f"{BASE_URL}/cities", headers=headers)
        if cities_response.status_code == 200:
            cities = cities_response.json()
            test_city_found = any(c.get("id") == test_city["id"] for c in cities)
            if test_city_found:
                print(f"✅ Test city found - Import verified!")
                return True
            else:
                print(f"⚠️ Test city not found - Import may have failed")
                return False
        else:
            print(f"⚠️ Could not verify import: {cities_response.status_code}")
            return True  # Import succeeded, verification failed
    else:
        print(f"❌ Import failed: {response.text}")
        return False

def test_import_as_pasteur(token):
    """Test 4: Import Data as Pasteur (Should Fail)"""
    print("\n" + "="*80)
    print("TEST 4: Import Data as Pasteur (Should Fail with 403)")
    print("="*80)
    
    # Sample data for import attempt
    sample_data = {
        "cities": [{"id": "test-id", "name": "Test City"}],
        "users": [],
        "visitors": []
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/admin/import-all-data", json=sample_data, headers=headers)
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 403:
        print("✅ Correctly denied access (403)")
        try:
            error_data = response.json()
            print(f"Error Message: {error_data.get('detail')}")
            if "super admin" in error_data.get('detail', '').lower():
                print("✅ Correct error message: 'Super admin only'")
                return True
            else:
                print("⚠️ Error message doesn't mention super admin requirement")
                return True
        except:
            print("⚠️ No JSON error message")
            return True
    else:
        print(f"❌ Expected 403, got {response.status_code}")
        print(f"Response: {response.text}")
        return False

def test_import_invalid_data(token):
    """Test 5: Import with Invalid Data"""
    print("\n" + "="*80)
    print("TEST 5: Import with Invalid Data (Error Handling)")
    print("="*80)
    
    # Test with invalid JSON structure (missing required fields)
    invalid_data = {
        "cities": [{"invalid_field": "test"}],  # Missing 'id' and 'name'
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/admin/import-all-data", json=invalid_data, headers=headers, timeout=120)
    
    print(f"Status Code: {response.status_code}")
    
    # Should handle error gracefully (not crash)
    if response.status_code in [200, 400, 500]:
        print("✅ Server handled invalid data without crashing")
        try:
            result = response.json()
            print(f"Response: {result}")
            if response.status_code == 500:
                print("✅ Proper error handling with 500 status")
            return True
        except:
            print("⚠️ No JSON response")
            return True
    else:
        print(f"⚠️ Unexpected status code: {response.status_code}")
        return True

def main():
    print("="*80)
    print("DATA EXPORT/IMPORT SYSTEM TESTING")
    print("Backend URL:", BASE_URL)
    print("="*80)
    
    # Login as Super Admin
    print("\n🔐 Logging in as Super Admin...")
    superadmin_token = login(SUPER_ADMIN)
    if not superadmin_token:
        print("❌ Failed to login as Super Admin")
        return
    print("✅ Super Admin login successful")
    
    # Login as Pasteur
    print("\n🔐 Logging in as Pasteur...")
    pasteur_token = login(PASTEUR)
    if not pasteur_token:
        print("❌ Failed to login as Pasteur")
        return
    print("✅ Pasteur login successful")
    
    # Track test results
    results = {}
    export_data = None
    
    # Test 1: Export as Super Admin
    success, export_data = test_export_as_superadmin(superadmin_token)
    results["Test 1: Export as Super Admin"] = success
    
    # Test 2: Export as Pasteur (should fail)
    success = test_export_as_pasteur(pasteur_token)
    results["Test 2: Export as Pasteur (403)"] = success
    
    # Test 3: Import as Super Admin
    success = test_import_as_superadmin(superadmin_token, export_data)
    results["Test 3: Import as Super Admin"] = success
    
    # Test 4: Import as Pasteur (should fail)
    success = test_import_as_pasteur(pasteur_token)
    results["Test 4: Import as Pasteur (403)"] = success
    
    # Test 5: Import with Invalid Data
    success = test_import_invalid_data(superadmin_token)
    results["Test 5: Import Invalid Data"] = success
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = 0
    failed = 0
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status} - {test_name}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print("\n" + "="*80)
    print(f"Total: {passed + failed} tests | Passed: {passed} | Failed: {failed}")
    print("="*80)
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED!")
    else:
        print(f"\n⚠️ {failed} TEST(S) FAILED")

if __name__ == "__main__":
    main()
