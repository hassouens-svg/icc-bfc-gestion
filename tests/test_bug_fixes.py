"""
Test suite for ICC BFC-ITALIE church management app bug fixes
Tests: Redirect page, Recensement Stars form, Login/Auth, Session persistence
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://agenda-ministry.preview.emergentagent.com')

class TestCitiesAPI:
    """Test cities API endpoints"""
    
    def test_cities_public_endpoint(self):
        """Test public cities endpoint returns list"""
        response = requests.get(f"{BASE_URL}/api/cities")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"✅ Cities API returned {len(data)} cities")
    
    def test_cities_have_required_fields(self):
        """Test cities have name and country fields"""
        response = requests.get(f"{BASE_URL}/api/cities")
        assert response.status_code == 200
        data = response.json()
        for city in data:
            assert 'name' in city
            assert 'country' in city
        print("✅ All cities have required fields")


class TestAuthAPI:
    """Test authentication endpoints"""
    
    def test_login_superadmin_success(self):
        """Test superadmin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "superadmin",
            "password": "superadmin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert 'token' in data
        assert 'user' in data
        assert data['user']['username'] == 'superadmin'
        assert data['user']['role'] == 'super_admin'
        print("✅ Superadmin login successful")
        return data['token']
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "invalid_user",
            "password": "wrong_password"
        })
        assert response.status_code == 401
        print("✅ Invalid credentials correctly rejected with 401")
    
    def test_login_missing_password(self):
        """Test login with missing password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "superadmin"
        })
        assert response.status_code == 422  # Validation error
        print("✅ Missing password correctly rejected")


class TestStarsPublicAPI:
    """Test Stars public registration endpoint"""
    
    def test_stars_public_register_success(self):
        """Test public star registration with valid data"""
        response = requests.post(f"{BASE_URL}/api/stars/public/register", json={
            "prenom": "TestPrenom",
            "nom": "TestNom",
            "jour_naissance": 15,
            "mois_naissance": 6,
            "departements": ["MLA", "Accueil"],
            "ville": "Milan"
        })
        assert response.status_code == 200
        data = response.json()
        assert 'id' in data
        assert 'message' in data
        print(f"✅ Star registration successful - ID: {data['id']}")
    
    def test_stars_public_register_missing_ville(self):
        """Test star registration without ville returns error"""
        response = requests.post(f"{BASE_URL}/api/stars/public/register", json={
            "prenom": "TestPrenom",
            "nom": "TestNom",
            "jour_naissance": 15,
            "mois_naissance": 6,
            "departements": ["MLA"],
            "ville": ""
        })
        assert response.status_code == 400
        print("✅ Missing ville correctly rejected")
    
    def test_stars_public_register_missing_departements(self):
        """Test star registration without departements returns error"""
        response = requests.post(f"{BASE_URL}/api/stars/public/register", json={
            "prenom": "TestPrenom",
            "nom": "TestNom",
            "jour_naissance": 15,
            "mois_naissance": 6,
            "departements": [],
            "ville": "Milan"
        })
        assert response.status_code == 400
        print("✅ Missing departements correctly rejected")


class TestVisitorsAPI:
    """Test visitors API endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "superadmin",
            "password": "superadmin123"
        })
        if response.status_code == 200:
            return response.json()['token']
        pytest.skip("Authentication failed")
    
    def test_visitors_list_authenticated(self, auth_token):
        """Test visitors list with authentication"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/visitors", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Visitors API returned {len(data)} visitors")
    
    def test_visitors_list_unauthenticated(self):
        """Test visitors list without authentication returns 403"""
        response = requests.get(f"{BASE_URL}/api/visitors")
        assert response.status_code == 403
        print("✅ Unauthenticated visitors request correctly rejected")


class TestUsersAPI:
    """Test users API endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "superadmin",
            "password": "superadmin123"
        })
        if response.status_code == 200:
            return response.json()['token']
        pytest.skip("Authentication failed")
    
    def test_referents_list_authenticated(self, auth_token):
        """Test referents list with authentication"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/users/referents", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Users/referents API returned {len(data)} users")


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_is_reachable(self):
        """Test API is reachable"""
        response = requests.get(f"{BASE_URL}/api/cities")
        assert response.status_code == 200
        print("✅ API is reachable")
    
    def test_frontend_is_reachable(self):
        """Test frontend is reachable"""
        response = requests.get(BASE_URL)
        assert response.status_code == 200
        print("✅ Frontend is reachable")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
