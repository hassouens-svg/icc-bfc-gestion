#!/usr/bin/env python3
"""
FI Time Fields Backend Testing
Testing the /api/public/fi/all endpoint to verify heure_debut and heure_fin fields
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "https://agenda-ministry.preview.emergentagent.com/api"

def test_fi_public_endpoint_with_time_fields():
    """
    Test the /api/public/fi/all endpoint to verify heure_debut and heure_fin fields
    Specific test for the review request about FI time fields
    """
    print("\n🎯 TESTING FI PUBLIC ENDPOINT WITH TIME FIELDS")
    print("=" * 60)
    
    try:
        # Test 1: Call the API with ville=Dijon filter
        print("\n📍 TEST 1: Calling /api/public/fi/all?ville=Dijon")
        url = f"{BASE_URL}/public/fi/all?ville=Dijon"
        
        response = requests.get(url, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        # Parse response
        fi_list = response.json()
        print(f"✅ SUCCESS: API returned {len(fi_list)} FI entries")
        
        if not fi_list:
            print("⚠️  WARNING: No FI entries found for Dijon")
            return False
        
        # Test 2: Verify response structure and required fields
        print("\n📋 TEST 2: Verifying response structure and fields")
        
        required_fields = ["id", "nom", "ville", "adresse", "secteur_id"]
        time_fields = ["heure_debut", "heure_fin"]
        
        for i, fi in enumerate(fi_list):
            print(f"\n--- FI {i+1}: {fi.get('nom', 'Unknown')} ---")
            
            # Check required fields
            for field in required_fields:
                if field not in fi:
                    print(f"❌ MISSING FIELD: {field}")
                    return False
                else:
                    print(f"✅ {field}: {fi[field]}")
            
            # Check time fields (these are optional but should be present if set)
            for field in time_fields:
                if field in fi:
                    print(f"✅ {field}: {fi[field]}")
                else:
                    print(f"ℹ️  {field}: Not set")
        
        # Test 3: Look for specific "FI République" with expected values
        print("\n🔍 TEST 3: Looking for 'FI République' with specific time values")
        
        fi_republique = None
        for fi in fi_list:
            if "République" in fi.get("nom", ""):
                fi_republique = fi
                break
        
        if fi_republique:
            print(f"✅ FOUND: {fi_republique['nom']}")
            
            # Check expected values
            expected_values = {
                "adresse": "1 Place de la République",
                "heure_debut": "18:00",
                "heure_fin": "20:00"
            }
            
            all_correct = True
            for field, expected_value in expected_values.items():
                actual_value = fi_republique.get(field)
                if actual_value == expected_value:
                    print(f"✅ {field}: {actual_value} (matches expected)")
                else:
                    print(f"❌ {field}: {actual_value} (expected: {expected_value})")
                    all_correct = False
            
            if all_correct:
                print("🎉 SUCCESS: FI République has all expected values!")
                return True
            else:
                print("⚠️  WARNING: FI République values don't match expectations")
                return False
        else:
            print("⚠️  WARNING: FI République not found in results")
            # Still check if time fields are present in other FIs
            time_fields_present = any(fi.get("heure_debut") or fi.get("heure_fin") for fi in fi_list)
            if time_fields_present:
                print("✅ Time fields are present in other FI entries")
                return True
            else:
                print("❌ No time fields found in any FI entries")
                return False
        
    except requests.exceptions.RequestException as e:
        print(f"❌ NETWORK ERROR: {e}")
        return False
    except json.JSONDecodeError as e:
        print(f"❌ JSON DECODE ERROR: {e}")
        return False
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {e}")
        return False

def main():
    """Main test execution"""
    print("🚀 STARTING FI TIME FIELDS BACKEND TESTING")
    print(f"Backend URL: {BASE_URL}")
    print(f"Test Time: {datetime.now().isoformat()}")
    print("=" * 80)
    
    success = test_fi_public_endpoint_with_time_fields()
    
    print("\n" + "=" * 80)
    if success:
        print("🎉 TESTING COMPLETED SUCCESSFULLY!")
        print("✅ The FI system correctly supports heure_debut and heure_fin fields")
        print("✅ API /api/public/fi/all returns the new time fields as expected")
    else:
        print("❌ TESTING FAILED!")
        print("⚠️  Issues found with heure_debut and heure_fin field implementation")
    
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)