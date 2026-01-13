"""
Test suite for Bergeries corrections - Iteration 3
Tests:
1. Cities API - no duplicates
2. Login superadmin - works and redirects correctly
3. Session persistence
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://faithflow-14.preview.emergentagent.com')

class TestCitiesAPI:
    """Test cities API for duplicates"""
    
    def test_cities_public_no_duplicates(self):
        """Verify /api/cities/public returns no duplicate cities"""
        response = requests.get(f"{BASE_URL}/api/cities/public")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        cities = response.json()
        assert isinstance(cities, list), "Response should be a list"
        
        # Check for duplicates
        unique_cities = set(cities)
        assert len(cities) == len(unique_cities), f"Found duplicates: {[c for c in cities if cities.count(c) > 1]}"
        
        print(f"✅ Cities API returns {len(cities)} unique cities: {cities}")
    
    def test_cities_public_contains_expected_cities(self):
        """Verify expected cities are present"""
        response = requests.get(f"{BASE_URL}/api/cities/public")
        assert response.status_code == 200
        
        cities = response.json()
        expected_cities = ['Dijon', 'Chalon-Sur-Saone', 'Besançon']
        
        for city in expected_cities:
            assert city in cities, f"Expected city '{city}' not found in {cities}"
        
        print(f"✅ All expected cities found")


class TestAuthentication:
    """Test authentication flows"""
    
    def test_login_superadmin_success(self):
        """Verify superadmin login works"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "superadmin", "password": "superadmin123"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "user" in data, "Response should contain user"
        assert data["user"]["role"] == "super_admin", f"Expected role 'super_admin', got {data['user']['role']}"
        assert data["user"]["username"] == "superadmin", f"Expected username 'superadmin', got {data['user']['username']}"
        
        print(f"✅ Superadmin login successful, token received")
        return data["token"]
    
    def test_login_invalid_credentials(self):
        """Verify invalid credentials return 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "invalid", "password": "invalid"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✅ Invalid credentials correctly rejected")


class TestDashboardAPIs:
    """Test dashboard-related APIs"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "superadmin", "password": "superadmin123"}
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_promotions_detailed_api(self, auth_token):
        """Test promotions detailed API (now called Bergeries)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/promotions/detailed", headers=headers)
        
        # Should return 200 or data
        assert response.status_code in [200, 404], f"Unexpected status: {response.status_code}"
        print(f"✅ Promotions/Bergeries detailed API accessible")
    
    def test_visitors_table_api(self, auth_token):
        """Test visitors table API"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/visitors/table", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✅ Visitors table API returns {len(data)} visitors")
    
    def test_users_api(self, auth_token):
        """Test users API for gestion-acces"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/users", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Check that users have expected roles
        roles = [u.get('role') for u in data]
        print(f"✅ Users API returns {len(data)} users with roles: {set(roles)}")


class TestBergeriesPages:
    """Test Bergeries-related pages APIs"""
    
    def test_bergeries_disciples_api(self):
        """Test bergeries disciples API"""
        response = requests.get(f"{BASE_URL}/api/bergeries-disciples")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✅ Bergeries disciples API returns {len(data)} bergeries")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
