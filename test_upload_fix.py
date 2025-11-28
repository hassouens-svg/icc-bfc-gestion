#!/usr/bin/env python3
"""
Quick test to verify the upload image fix works
"""

import requests
import tempfile
import base64
import os

# Configuration
BASE_URL = "https://church-campaign-hub.preview.emergentagent.com/api"

def main():
    print("🧪 Testing image upload fix...")
    
    # Login
    login_data = {"username": "superadmin", "password": "superadmin123", "city": "Dijon"}
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    
    if response.status_code != 200:
        print(f"❌ Login failed: {response.status_code}")
        return 1
    
    token = response.json()["token"]
    print("✅ Login successful")
    
    # Create test image
    base64_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    image_data = base64.b64decode(base64_image)
    
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
    temp_file.write(image_data)
    temp_file.close()
    
    # Upload image
    headers = {"Authorization": f"Bearer {token}"}
    
    with open(temp_file.name, 'rb') as f:
        files = {'file': ('test.png', f, 'image/png')}
        response = requests.post(f"{BASE_URL}/events/upload-image", headers=headers, files=files)
    
    # Clean up
    os.unlink(temp_file.name)
    
    if response.status_code == 200:
        data = response.json()
        image_url = data.get("image_url")
        
        if image_url and image_url.startswith("/uploads/"):
            print(f"✅ Upload successful: {image_url}")
            
            # Check if file exists
            file_path = f"/app/frontend/public{image_url}"
            if os.path.exists(file_path):
                print(f"✅ File exists at: {file_path}")
                return 0
            else:
                print(f"❌ File not found at: {file_path}")
                return 1
        else:
            print(f"❌ Unexpected response format: {data}")
            return 1
    else:
        print(f"❌ Upload failed: {response.status_code} - {response.text}")
        return 1

if __name__ == "__main__":
    exit(main())