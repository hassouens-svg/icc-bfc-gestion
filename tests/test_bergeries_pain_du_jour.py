"""
Test suite for Bergeries Disciples and Pain du Jour Admin features
- Bergeries: List 43 bergeries (41 static + 2 manual), create new bergerie
- Pain du Jour Admin: 5 tabs, Semaine tab with 5 days, programmation API
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SUPERADMIN_USERNAME = "superadmin"
SUPERADMIN_PASSWORD = "superadmin123"


class TestBergeriesDisciples:
    """Tests for Bergeries Disciples feature"""
    
    def test_get_bergeries_list(self):
        """Test GET /api/bergeries-disciples/list returns bergeries"""
        response = requests.get(f"{BASE_URL}/api/bergeries-disciples/list")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) >= 41, f"Expected at least 41 bergeries, got {len(data)}"
        print(f"PASSED: GET /api/bergeries-disciples/list returns {len(data)} bergeries")
    
    def test_bergeries_list_has_required_fields(self):
        """Test that each bergerie has required fields"""
        response = requests.get(f"{BASE_URL}/api/bergeries-disciples/list")
        assert response.status_code == 200
        
        data = response.json()
        required_fields = ["id", "nom", "responsable", "ville"]
        
        for bergerie in data[:5]:  # Check first 5
            for field in required_fields:
                assert field in bergerie, f"Missing field '{field}' in bergerie {bergerie.get('id')}"
        
        print("PASSED: All bergeries have required fields (id, nom, responsable, ville)")
    
    def test_bergeries_list_contains_expected_cities(self):
        """Test that bergeries contain expected cities"""
        response = requests.get(f"{BASE_URL}/api/bergeries-disciples/list")
        assert response.status_code == 200
        
        data = response.json()
        cities = set(b.get("ville") for b in data)
        
        expected_cities = ["Dijon", "Besançon"]
        for city in expected_cities:
            assert city in cities, f"Expected city '{city}' not found"
        
        print(f"PASSED: Bergeries contain expected cities: {cities}")
    
    def test_create_bergerie(self):
        """Test POST /api/bergeries-disciples/create creates a new bergerie"""
        new_bergerie = {
            "nom": "TEST_Nouvelle Bergerie Test",
            "responsable": "TEST_Responsable",
            "ville": "Dijon"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/bergeries-disciples/create",
            json=new_bergerie
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "bergerie" in data, "Response should contain 'bergerie'"
        assert data["bergerie"]["nom"] == new_bergerie["nom"]
        assert data["bergerie"]["responsable"] == new_bergerie["responsable"]
        assert data["bergerie"]["ville"] == new_bergerie["ville"]
        assert "id" in data["bergerie"], "Created bergerie should have an ID"
        
        print(f"PASSED: Created bergerie with ID {data['bergerie']['id']}")
        return data["bergerie"]["id"]
    
    def test_get_bergerie_by_id(self):
        """Test GET /api/bergeries-disciples/{id} returns bergerie details"""
        # Use a known static bergerie ID
        bergerie_id = "bg-1"
        response = requests.get(f"{BASE_URL}/api/bergeries-disciples/{bergerie_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["id"] == bergerie_id
        assert "nom" in data
        assert "responsable" in data
        
        print(f"PASSED: GET /api/bergeries-disciples/{bergerie_id} returns bergerie details")
    
    def test_bergeries_count_after_creation(self):
        """Test that bergeries list includes manually created bergeries"""
        # First create a new bergerie
        new_bergerie = {
            "nom": "TEST_Bergerie Count Test",
            "responsable": "TEST_Count Responsable",
            "ville": "Besançon"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/bergeries-disciples/create",
            json=new_bergerie
        )
        assert create_response.status_code == 200
        
        # Now get the list
        list_response = requests.get(f"{BASE_URL}/api/bergeries-disciples/list")
        assert list_response.status_code == 200
        
        data = list_response.json()
        # Should have at least 41 static + 1 or more created
        assert len(data) >= 42, f"Expected at least 42 bergeries after creation, got {len(data)}"
        
        # Verify our created bergerie is in the list
        created_names = [b["nom"] for b in data]
        assert new_bergerie["nom"] in created_names, "Created bergerie should be in the list"
        
        print(f"PASSED: Bergeries list now has {len(data)} bergeries (includes manually created)")


class TestPainDuJourAdmin:
    """Tests for Pain du Jour Admin feature"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Login as superadmin"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": SUPERADMIN_USERNAME, "password": SUPERADMIN_PASSWORD}
        )
        if login_response.status_code == 200:
            self.token = login_response.json().get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip(f"Login failed: {login_response.status_code} - {login_response.text}")
    
    def test_login_superadmin(self):
        """Test login with superadmin credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": SUPERADMIN_USERNAME, "password": SUPERADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "user" in data, "Response should contain user"
        assert data["user"]["role"] in ["super_admin", "pasteur", "gestion_projet"], \
            f"User role should be admin, got {data['user']['role']}"
        
        print(f"PASSED: Login successful for {SUPERADMIN_USERNAME} with role {data['user']['role']}")
    
    def test_get_programmation_empty_week(self):
        """Test GET /api/pain-du-jour/programmation/{semaine} returns empty template"""
        # Use a future week that likely has no data
        week = "2030-W01"
        response = requests.get(
            f"{BASE_URL}/api/pain-du-jour/programmation/{week}",
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "semaine" in data, "Response should contain 'semaine'"
        assert "jours" in data, "Response should contain 'jours'"
        
        # Check all 5 days are present
        expected_days = ["lundi", "mardi", "mercredi", "jeudi", "vendredi"]
        for day in expected_days:
            assert day in data["jours"], f"Missing day '{day}' in programmation"
        
        print(f"PASSED: GET programmation returns template with 5 days: {list(data['jours'].keys())}")
    
    def test_save_programmation(self):
        """Test POST /api/pain-du-jour/programmation saves weekly schedule"""
        week = "2025-W52"  # Use a specific test week
        
        programmation_data = {
            "semaine": week,
            "jours": {
                "lundi": {
                    "lien_enseignement": "https://www.youtube.com/watch?v=test_lundi",
                    "titre_enseignement": "TEST_Enseignement Lundi",
                    "versets_text": "Jean 3:16",
                    "lien_priere": "https://www.youtube.com/watch?v=priere_lundi",
                    "titre_priere": "TEST_Prière Lundi"
                },
                "mardi": {
                    "lien_enseignement": "https://www.youtube.com/watch?v=test_mardi",
                    "titre_enseignement": "TEST_Enseignement Mardi",
                    "versets_text": "Romains 8:28",
                    "lien_priere": "",
                    "titre_priere": ""
                },
                "mercredi": {
                    "lien_enseignement": "https://www.youtube.com/watch?v=test_mercredi",
                    "titre_enseignement": "TEST_Enseignement Mercredi",
                    "versets_text": "Psaumes 23",
                    "lien_priere": "",
                    "titre_priere": ""
                },
                "jeudi": {
                    "lien_enseignement": "https://www.youtube.com/watch?v=test_jeudi",
                    "titre_enseignement": "TEST_Enseignement Jeudi",
                    "versets_text": "",
                    "lien_priere": "",
                    "titre_priere": ""
                },
                "vendredi": {
                    "lien_enseignement": "https://www.youtube.com/watch?v=test_vendredi",
                    "titre_enseignement": "TEST_Enseignement Vendredi",
                    "versets_text": "Matthieu 5:1-12",
                    "lien_priere": "",
                    "titre_priere": ""
                }
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pain-du-jour/programmation",
            json=programmation_data,
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should contain message"
        
        print(f"PASSED: POST programmation saved successfully: {data.get('message')}")
    
    def test_get_saved_programmation(self):
        """Test that saved programmation can be retrieved"""
        week = "2025-W52"
        
        # First save some data
        programmation_data = {
            "semaine": week,
            "jours": {
                "lundi": {
                    "lien_enseignement": "https://www.youtube.com/watch?v=verify_test",
                    "titre_enseignement": "TEST_Verify Enseignement",
                    "versets_text": "Jean 1:1",
                    "lien_priere": "",
                    "titre_priere": ""
                },
                "mardi": {"lien_enseignement": "", "titre_enseignement": "", "versets_text": "", "lien_priere": "", "titre_priere": ""},
                "mercredi": {"lien_enseignement": "", "titre_enseignement": "", "versets_text": "", "lien_priere": "", "titre_priere": ""},
                "jeudi": {"lien_enseignement": "", "titre_enseignement": "", "versets_text": "", "lien_priere": "", "titre_priere": ""},
                "vendredi": {"lien_enseignement": "", "titre_enseignement": "", "versets_text": "", "lien_priere": "", "titre_priere": ""}
            }
        }
        
        save_response = requests.post(
            f"{BASE_URL}/api/pain-du-jour/programmation",
            json=programmation_data,
            headers=self.headers
        )
        assert save_response.status_code == 200
        
        # Now retrieve it
        get_response = requests.get(
            f"{BASE_URL}/api/pain-du-jour/programmation/{week}",
            headers=self.headers
        )
        assert get_response.status_code == 200
        
        data = get_response.json()
        assert data["jours"]["lundi"]["lien_enseignement"] == "https://www.youtube.com/watch?v=verify_test"
        assert data["jours"]["lundi"]["titre_enseignement"] == "TEST_Verify Enseignement"
        
        print("PASSED: Saved programmation can be retrieved and verified")
    
    def test_get_all_programmations(self):
        """Test GET /api/pain-du-jour/programmations returns all saved programmations"""
        response = requests.get(
            f"{BASE_URL}/api/pain-du-jour/programmations",
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        print(f"PASSED: GET all programmations returns {len(data)} entries")


class TestCitiesPublic:
    """Test public cities endpoint"""
    
    def test_get_cities_public(self):
        """Test GET /api/cities/public returns city names"""
        response = requests.get(f"{BASE_URL}/api/cities/public")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should have at least one city"
        
        print(f"PASSED: GET /api/cities/public returns {len(data)} cities: {data[:5]}...")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
