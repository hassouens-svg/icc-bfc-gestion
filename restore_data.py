#!/usr/bin/env python3
"""
Restore original data by removing test city
"""

import requests

BASE_URL = "https://pastoral-dash.preview.emergentagent.com/api"
SUPER_ADMIN = {"username": "superadmin", "password": "superadmin123", "city": "Dijon"}

def login():
    response = requests.post(f"{BASE_URL}/auth/login", json=SUPER_ADMIN)
    if response.status_code == 200:
        return response.json()["token"]
    return None

def main():
    print("🔐 Logging in as Super Admin...")
    token = login()
    if not token:
        print("❌ Login failed")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Export current data
    print("📥 Exporting current data...")
    response = requests.get(f"{BASE_URL}/admin/export-all-data", headers=headers)
    if response.status_code != 200:
        print("❌ Export failed")
        return
    
    data = response.json()
    
    # Remove test city
    if "cities" in data:
        original_count = len(data["cities"])
        data["cities"] = [c for c in data["cities"] if c.get("id") != "test-city-import-verification"]
        new_count = len(data["cities"])
        print(f"🗑️ Removed test city (cities: {original_count} -> {new_count})")
    
    # Re-import clean data
    print("📤 Re-importing clean data...")
    response = requests.post(f"{BASE_URL}/admin/import-all-data", json=data, headers=headers, timeout=120)
    if response.status_code == 200:
        print("✅ Data restored successfully!")
    else:
        print(f"❌ Restore failed: {response.text}")

if __name__ == "__main__":
    main()
