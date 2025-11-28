#!/usr/bin/env python3
"""
COMPREHENSIVE PRODUCTION BACKEND TEST
ICC BFC-ITALIE - Pre-Production Testing
Backend URL: https://church-event-hub.preview.emergentagent.com/api
"""

import requests
import json
from datetime import datetime, timedelta

# Backend URL
BASE_URL = "https://church-event-hub.preview.emergentagent.com/api"

# Test accounts
TEST_ACCOUNTS = {
    "superadmin": {"username": "superadmin", "password": "superadmin123", "city": "Dijon"},
    "pasteur": {"username": "pasteur", "password": "pasteur123", "city": "Dijon"},
    "superviseur": {"username": "superviseur_promos", "password": "superviseur123", "city": "Dijon"},
    "accueil": {"username": "accueil_dijon", "password": "test123", "city": "Dijon"},
    "pilote": {"username": "pilote_dijon1", "password": "test123", "city": "Dijon"},
    "referent": {"username": "referent_dijon_oct", "password": "test123", "city": "Dijon"}
}

# Store tokens
tokens = {}
test_results = {
    "passed": [],
    "failed": [],
    "total": 0
}

def log_test(test_name, passed, details=""):
    """Log test result"""
    test_results["total"] += 1
    if passed:
        test_results["passed"].append(test_name)
        print(f"✅ PASS: {test_name}")
    else:
        test_results["failed"].append({"test": test_name, "details": details})
        print(f"❌ FAIL: {test_name}")
        if details:
            print(f"   Details: {details}")

def login(account_key):
    """Login and get token"""
    account = TEST_ACCOUNTS[account_key]
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json=account,
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            tokens[account_key] = data["token"]
            log_test(f"Login {account_key}", True)
            return True
        else:
            log_test(f"Login {account_key}", False, f"Status: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        log_test(f"Login {account_key}", False, str(e))
        return False

def get_headers(account_key):
    """Get authorization headers"""
    return {"Authorization": f"Bearer {tokens[account_key]}"}

# ==================== TEST 1: AUTHENTICATION ====================
def test_authentication():
    """Test all user logins"""
    print("\n" + "="*60)
    print("TEST 1: AUTHENTICATION")
    print("="*60)
    
    for account_key in TEST_ACCOUNTS.keys():
        login(account_key)

# ==================== TEST 2: CULTE STATS ENDPOINTS ====================
def test_culte_stats():
    """Test Culte Stats CRUD operations"""
    print("\n" + "="*60)
    print("TEST 2: CULTE STATS ENDPOINTS")
    print("="*60)
    
    created_stat_id = None
    
    # Test 2.1: Create culte stat with Accueil
    print("\n--- Test 2.1: POST /culte-stats (Accueil) ---")
    try:
        response = requests.post(
            f"{BASE_URL}/culte-stats",
            headers=get_headers("accueil"),
            json={
                "date": "2025-01-05",
                "ville": "Dijon",
                "type_culte": "Culte 1",
                "nombre_fideles": 50,
                "nombre_stars": 10
            },
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            created_stat_id = data.get("id")
            log_test("POST /culte-stats (Accueil)", True)
        else:
            log_test("POST /culte-stats (Accueil)", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("POST /culte-stats (Accueil)", False, str(e))
    
    # Test 2.2: Get culte stats with Accueil
    print("\n--- Test 2.2: GET /culte-stats (Accueil) ---")
    try:
        response = requests.get(
            f"{BASE_URL}/culte-stats",
            headers=get_headers("accueil"),
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            log_test("GET /culte-stats (Accueil)", True, f"Found {len(data)} stats")
        else:
            log_test("GET /culte-stats (Accueil)", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("GET /culte-stats (Accueil)", False, str(e))
    
    # Test 2.3: Get culte stats summary
    print("\n--- Test 2.3: GET /culte-stats/summary/all (Accueil) ---")
    try:
        response = requests.get(
            f"{BASE_URL}/culte-stats/summary/all",
            headers=get_headers("accueil"),
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            log_test("GET /culte-stats/summary/all (Accueil)", True)
        else:
            log_test("GET /culte-stats/summary/all (Accueil)", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("GET /culte-stats/summary/all (Accueil)", False, str(e))
    
    # Test 2.4: Update culte stat with Accueil
    if created_stat_id:
        print("\n--- Test 2.4: PUT /culte-stats/{id} (Accueil) ---")
        try:
            response = requests.put(
                f"{BASE_URL}/culte-stats/{created_stat_id}",
                headers=get_headers("accueil"),
                json={
                    "nombre_fideles": 55,
                    "nombre_stars": 12
                },
                timeout=10
            )
            if response.status_code == 200:
                log_test("PUT /culte-stats/{id} (Accueil)", True)
            else:
                log_test("PUT /culte-stats/{id} (Accueil)", False, f"Status: {response.status_code}")
        except Exception as e:
            log_test("PUT /culte-stats/{id} (Accueil)", False, str(e))
    
    # Test 2.5: Delete culte stat with Accueil (should fail)
    if created_stat_id:
        print("\n--- Test 2.5: DELETE /culte-stats/{id} (Accueil - should fail) ---")
        try:
            response = requests.delete(
                f"{BASE_URL}/culte-stats/{created_stat_id}",
                headers=get_headers("accueil"),
                timeout=10
            )
            if response.status_code == 403:
                log_test("DELETE /culte-stats/{id} (Accueil denied)", True, "Correctly denied")
            else:
                log_test("DELETE /culte-stats/{id} (Accueil denied)", False, f"Expected 403, got {response.status_code}")
        except Exception as e:
            log_test("DELETE /culte-stats/{id} (Accueil denied)", False, str(e))
    
    # Test 2.6: Delete culte stat with Super Admin (should succeed)
    if created_stat_id:
        print("\n--- Test 2.6: DELETE /culte-stats/{id} (Super Admin) ---")
        try:
            response = requests.delete(
                f"{BASE_URL}/culte-stats/{created_stat_id}",
                headers=get_headers("superadmin"),
                timeout=10
            )
            if response.status_code == 200:
                log_test("DELETE /culte-stats/{id} (Super Admin)", True)
            else:
                log_test("DELETE /culte-stats/{id} (Super Admin)", False, f"Status: {response.status_code}")
        except Exception as e:
            log_test("DELETE /culte-stats/{id} (Super Admin)", False, str(e))

# ==================== TEST 3: ANALYTICS ENDPOINTS ====================
def test_analytics():
    """Test Analytics endpoints"""
    print("\n" + "="*60)
    print("TEST 3: ANALYTICS ENDPOINTS")
    print("="*60)
    
    # Test 3.1: Promotions Detailed (Pasteur)
    print("\n--- Test 3.1: GET /analytics/promotions-detailed (Pasteur) ---")
    try:
        response = requests.get(
            f"{BASE_URL}/analytics/promotions-detailed",
            headers=get_headers("pasteur"),
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            log_test("GET /analytics/promotions-detailed (Pasteur)", True)
        else:
            log_test("GET /analytics/promotions-detailed (Pasteur)", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("GET /analytics/promotions-detailed (Pasteur)", False, str(e))
    
    # Test 3.2: Visitors Table (Pasteur)
    print("\n--- Test 3.2: GET /analytics/visitors-table (Pasteur) ---")
    try:
        response = requests.get(
            f"{BASE_URL}/analytics/visitors-table",
            headers=get_headers("pasteur"),
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            log_test("GET /analytics/visitors-table (Pasteur)", True)
        else:
            log_test("GET /analytics/visitors-table (Pasteur)", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("GET /analytics/visitors-table (Pasteur)", False, str(e))
    
    # Test 3.3: FI Detailed (Pasteur)
    print("\n--- Test 3.3: GET /analytics/fi-detailed (Pasteur) ---")
    try:
        response = requests.get(
            f"{BASE_URL}/analytics/fi-detailed",
            headers=get_headers("pasteur"),
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            log_test("GET /analytics/fi-detailed (Pasteur)", True)
        else:
            log_test("GET /analytics/fi-detailed (Pasteur)", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("GET /analytics/fi-detailed (Pasteur)", False, str(e))
    
    # Test 3.4: Membres Table (Pasteur)
    print("\n--- Test 3.4: GET /analytics/membres-table (Pasteur) ---")
    try:
        response = requests.get(
            f"{BASE_URL}/analytics/membres-table",
            headers=get_headers("pasteur"),
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            log_test("GET /analytics/membres-table (Pasteur)", True)
        else:
            log_test("GET /analytics/membres-table (Pasteur)", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("GET /analytics/membres-table (Pasteur)", False, str(e))
    
    # Test 3.5: Presences Dimanche (Pasteur)
    print("\n--- Test 3.5: GET /analytics/presences-dimanche (Pasteur) ---")
    try:
        response = requests.get(
            f"{BASE_URL}/analytics/presences-dimanche",
            headers=get_headers("pasteur"),
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            log_test("GET /analytics/presences-dimanche (Pasteur)", True)
        else:
            log_test("GET /analytics/presences-dimanche (Pasteur)", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("GET /analytics/presences-dimanche (Pasteur)", False, str(e))

# ==================== TEST 4: PERMISSIONS ====================
def test_permissions():
    """Test permission boundaries"""
    print("\n" + "="*60)
    print("TEST 4: PERMISSIONS")
    print("="*60)
    
    # Test 4.1: Accueil sees only their city
    print("\n--- Test 4.1: Accueil city isolation ---")
    try:
        response = requests.get(
            f"{BASE_URL}/visitors",
            headers=get_headers("accueil"),
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            # Check all visitors are from Dijon
            all_dijon = all(v.get("city") == "Dijon" for v in data)
            if all_dijon:
                log_test("Accueil city isolation", True, f"All {len(data)} visitors from Dijon")
            else:
                log_test("Accueil city isolation", False, "Found visitors from other cities")
        else:
            log_test("Accueil city isolation", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("Accueil city isolation", False, str(e))
    
    # Test 4.2: Pasteur sees all cities
    print("\n--- Test 4.2: Pasteur multi-city access ---")
    try:
        response = requests.get(
            f"{BASE_URL}/visitors",
            headers=get_headers("pasteur"),
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            cities = set(v.get("city") for v in data)
            log_test("Pasteur multi-city access", True, f"Sees {len(data)} visitors from cities: {cities}")
        else:
            log_test("Pasteur multi-city access", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("Pasteur multi-city access", False, str(e))
    
    # Test 4.3: Super Admin sees all cities
    print("\n--- Test 4.3: Super Admin multi-city access ---")
    try:
        response = requests.get(
            f"{BASE_URL}/analytics/stats",
            headers=get_headers("superadmin"),
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            log_test("Super Admin multi-city access", True, f"Total visitors: {data.get('total_visitors')}")
        else:
            log_test("Super Admin multi-city access", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("Super Admin multi-city access", False, str(e))

# ==================== TEST 5: CRITICAL EXISTING ENDPOINTS ====================
def test_critical_endpoints():
    """Test critical existing endpoints"""
    print("\n" + "="*60)
    print("TEST 5: CRITICAL EXISTING ENDPOINTS")
    print("="*60)
    
    # Test 5.1: GET /cities
    print("\n--- Test 5.1: GET /cities ---")
    try:
        response = requests.get(
            f"{BASE_URL}/cities",
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            log_test("GET /cities", True, f"Found {len(data)} cities")
        else:
            log_test("GET /cities", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("GET /cities", False, str(e))
    
    # Test 5.2: GET /users
    print("\n--- Test 5.2: GET /users/referents ---")
    try:
        response = requests.get(
            f"{BASE_URL}/users/referents",
            headers=get_headers("superviseur"),
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            log_test("GET /users/referents", True, f"Found {len(data)} users")
        else:
            log_test("GET /users/referents", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("GET /users/referents", False, str(e))
    
    # Test 5.3: GET /visitors
    print("\n--- Test 5.3: GET /visitors ---")
    try:
        response = requests.get(
            f"{BASE_URL}/visitors",
            headers=get_headers("superviseur"),
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            log_test("GET /visitors", True, f"Found {len(data)} visitors")
        else:
            log_test("GET /visitors", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("GET /visitors", False, str(e))
    
    # Test 5.4: GET /fi/secteurs
    print("\n--- Test 5.4: GET /fi/secteurs ---")
    try:
        response = requests.get(
            f"{BASE_URL}/fi/secteurs",
            headers=get_headers("superviseur"),
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            log_test("GET /fi/secteurs", True, f"Found {len(data)} secteurs")
        else:
            log_test("GET /fi/secteurs", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("GET /fi/secteurs", False, str(e))
    
    # Test 5.5: GET /fi/familles-impact
    print("\n--- Test 5.5: GET /fi/familles-impact ---")
    try:
        response = requests.get(
            f"{BASE_URL}/fi/familles-impact",
            headers=get_headers("superviseur"),
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            log_test("GET /fi/familles-impact", True, f"Found {len(data)} FI")
        else:
            log_test("GET /fi/familles-impact", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("GET /fi/familles-impact", False, str(e))
    
    # Test 5.6: GET /fi/membres
    print("\n--- Test 5.6: GET /fi/membres ---")
    try:
        response = requests.get(
            f"{BASE_URL}/fi/membres",
            headers=get_headers("superviseur"),
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            log_test("GET /fi/membres", True, f"Found {len(data)} membres")
        else:
            log_test("GET /fi/membres", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("GET /fi/membres", False, str(e))

# ==================== MAIN ====================
def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("ICC BFC-ITALIE - COMPREHENSIVE BACKEND TEST")
    print("Backend URL:", BASE_URL)
    print("="*60)
    
    # Run all test suites
    test_authentication()
    test_culte_stats()
    test_analytics()
    test_permissions()
    test_critical_endpoints()
    
    # Print summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"Total Tests: {test_results['total']}")
    print(f"Passed: {len(test_results['passed'])} ✅")
    print(f"Failed: {len(test_results['failed'])} ❌")
    
    if test_results['failed']:
        print("\n❌ FAILED TESTS:")
        for failure in test_results['failed']:
            print(f"  - {failure['test']}")
            if failure['details']:
                print(f"    {failure['details']}")
    else:
        print("\n🎉 ALL TESTS PASSED!")
    
    print("="*60)

if __name__ == "__main__":
    main()
