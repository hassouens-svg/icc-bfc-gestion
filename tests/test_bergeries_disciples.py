"""
Tests for Bergeries Disciples (Groupes de Disciples) feature
- Tests the list of 41 groups
- Tests filtering by city
- Tests CRUD operations for members, objectives, and contacts
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://faithflow-14.preview.emergentagent.com')

class TestBergeriesDisciplesList:
    """Tests for /api/bergeries-disciples/list endpoint"""
    
    def test_get_list_returns_41_groups(self):
        """Verify that the API returns exactly 41 groups"""
        response = requests.get(f"{BASE_URL}/api/bergeries-disciples/list")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 41, f"Expected 41 groups, got {len(data)}"
    
    def test_list_contains_required_fields(self):
        """Verify each group has required fields"""
        response = requests.get(f"{BASE_URL}/api/bergeries-disciples/list")
        assert response.status_code == 200
        
        data = response.json()
        for group in data:
            assert "id" in group, "Missing 'id' field"
            assert "nom" in group, "Missing 'nom' field"
            assert "responsable" in group, "Missing 'responsable' field"
            assert "ville" in group, "Missing 'ville' field"
            assert "membres_count" in group, "Missing 'membres_count' field"
    
    def test_list_contains_expected_cities(self):
        """Verify groups are from expected cities"""
        response = requests.get(f"{BASE_URL}/api/bergeries-disciples/list")
        assert response.status_code == 200
        
        data = response.json()
        cities = set(group["ville"] for group in data)
        
        # Expected cities based on the data
        expected_cities = {"Dijon", "Besançon", "Auxerre", "Chalon-sur-Saône"}
        assert cities.issubset(expected_cities) or expected_cities.issubset(cities), \
            f"Unexpected cities found: {cities}"


class TestBergeriesDisciplesDetail:
    """Tests for /api/bergeries-disciples/{id} endpoint"""
    
    def test_get_bergerie_by_id(self):
        """Test getting a specific bergerie by ID"""
        response = requests.get(f"{BASE_URL}/api/bergeries-disciples/bg-1")
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == "bg-1"
        assert data["nom"] == "Choisies de Dieu ICC"
        assert data["responsable"] == "Ps Nathalie"
        assert data["ville"] == "Dijon"
    
    def test_get_bergerie_not_found(self):
        """Test 404 for non-existent bergerie"""
        response = requests.get(f"{BASE_URL}/api/bergeries-disciples/bg-999")
        assert response.status_code == 404


class TestBergeriesDisciplesMembres:
    """Tests for members CRUD operations"""
    
    def test_get_membres_for_bergerie(self):
        """Test getting members for a bergerie"""
        response = requests.get(f"{BASE_URL}/api/bergeries-disciples/bg-1/membres")
        assert response.status_code == 200
        
        data = response.json()
        assert "membres" in data
        assert "objectifs" in data
        assert "contacts" in data
        assert isinstance(data["membres"], list)
    
    def test_add_membre(self):
        """Test adding a new member"""
        membre_data = {
            "prenom": "TEST_Pierre",
            "nom": "Test",
            "telephone": "0600000001",
            "profession": "Test Profession"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/bergeries-disciples/bg-2/membres",
            json=membre_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert data["message"] == "Membre ajouté avec succès"
        
        # Verify member was added by fetching members
        get_response = requests.get(f"{BASE_URL}/api/bergeries-disciples/bg-2/membres")
        assert get_response.status_code == 200
        membres = get_response.json()["membres"]
        
        # Find the added member
        added_member = next((m for m in membres if m["id"] == data["id"]), None)
        assert added_member is not None, "Added member not found in list"
        assert added_member["prenom"] == "TEST_Pierre"


class TestBergeriesDisciplesObjectifs:
    """Tests for objectives operations"""
    
    def test_add_objectif(self):
        """Test adding a multiplication objective"""
        objectif_data = {
            "mois": "Mars 2026",
            "objectif": 25
        }
        
        response = requests.post(
            f"{BASE_URL}/api/bergeries-disciples/bg-3/objectifs",
            json=objectif_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert data["message"] == "Objectif ajouté"


class TestBergeriesDisciplesContacts:
    """Tests for contacts operations"""
    
    def test_add_contact(self):
        """Test adding an evangelization contact"""
        contact_data = {
            "prenom": "TEST_Sophie",
            "nom": "Contact",
            "telephone": "0600000002",
            "type": "Évangélisation"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/bergeries-disciples/bg-3/contacts",
            json=contact_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert data["message"] == "Contact ajouté"


class TestCitiesPublic:
    """Tests for public cities endpoint (used for filtering)"""
    
    def test_get_cities_public(self):
        """Test getting public cities list"""
        response = requests.get(f"{BASE_URL}/api/cities/public")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Check that expected cities are present
        assert "Dijon" in data
        assert "Besançon" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
