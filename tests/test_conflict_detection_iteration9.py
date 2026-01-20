"""
Test suite for Conflict Detection in Planning des Activités (Iteration 9)
Tests the check-conflicts API and agenda-priere endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://agenda-ministry.preview.emergentagent.com')

class TestConflictDetection:
    """Tests for /api/planning/check-conflicts endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "superadmin", "password": "superadmin123"}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_check_conflicts_with_conflict(self):
        """Test check-conflicts returns conflict for 2026-01-31 Dijon (MLA Retraite)"""
        response = requests.get(
            f"{BASE_URL}/api/planning/check-conflicts",
            params={"ville": "Dijon", "date": "2026-01-31"},
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify conflict is detected
        assert data["has_conflicts"] == True
        assert len(data["conflicts"]) > 0
        
        # Verify MLA Retraite is in conflicts
        mla_conflict = next((c for c in data["conflicts"] if c["departement"] == "MLA"), None)
        assert mla_conflict is not None, "MLA conflict not found"
        assert mla_conflict["titre"] == "Retraite"
        assert mla_conflict["date"] == "2026-01-31"
        print(f"SUCCESS: Conflict detected - MLA Retraite at {mla_conflict.get('heure')}")
    
    def test_check_conflicts_no_conflict(self):
        """Test check-conflicts returns no conflict for date without activities"""
        response = requests.get(
            f"{BASE_URL}/api/planning/check-conflicts",
            params={"ville": "Dijon", "date": "2030-12-25"},
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify no conflict
        assert data["has_conflicts"] == False
        assert len(data["conflicts"]) == 0
        print("SUCCESS: No conflict detected for 2030-12-25")
    
    def test_check_conflicts_different_city(self):
        """Test check-conflicts for different city (Rome)"""
        response = requests.get(
            f"{BASE_URL}/api/planning/check-conflicts",
            params={"ville": "Rome", "date": "2026-01-31"},
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Rome should not have MLA Retraite conflict (it's in Dijon)
        mla_conflict = next((c for c in data["conflicts"] if c["departement"] == "MLA" and c["titre"] == "Retraite"), None)
        assert mla_conflict is None, "MLA Retraite should not be in Rome"
        print(f"SUCCESS: Rome has {len(data['conflicts'])} conflicts (no MLA Retraite)")


class TestAgendaPriere:
    """Tests for /api/stars/agenda-priere endpoint"""
    
    def test_save_priere_config(self):
        """Test saving prayer time configuration"""
        response = requests.post(
            f"{BASE_URL}/api/stars/agenda-priere",
            json={
                "type": "temps_priere_config",
                "departement": "TEST_DEPT",
                "jour": "mercredi",
                "heure": "20:00",
                "isRecurrent": True,
                "frequence": "hebdomadaire",
                "semestre": "1",
                "annee": 2026,
                "ville": "Dijon"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["message"] == "Configuration temps de prière enregistrée"
        print(f"SUCCESS: Prayer config saved with id {data['id']}")


class TestAgendaDepartement:
    """Tests for /api/stars/agenda/{departement} endpoint"""
    
    def test_get_agenda_mla(self):
        """Test getting MLA department agenda"""
        response = requests.get(
            f"{BASE_URL}/api/stars/agenda/MLA",
            params={"semestre": "1", "annee": 2026}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return list of agenda entries
        assert isinstance(data, list)
        print(f"SUCCESS: MLA agenda has {len(data)} entries for S1 2026")
        
        # Check for Retraite activity
        retraite = next((e for e in data if e.get("titre") == "Retraite"), None)
        if retraite:
            print(f"  - Found Retraite: {retraite.get('date')}")
    
    def test_get_agenda_with_ville_filter(self):
        """Test getting agenda with ville filter"""
        response = requests.get(
            f"{BASE_URL}/api/stars/agenda/MLA",
            params={"semestre": "1", "annee": 2026, "ville": "Dijon"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # All entries should be for Dijon
        for entry in data:
            if entry.get("ville"):
                assert entry["ville"] == "Dijon", f"Entry has wrong ville: {entry.get('ville')}"
        
        print(f"SUCCESS: All {len(data)} entries are for Dijon")


class TestAgendaPublic:
    """Tests for /api/stars/agenda-public endpoint"""
    
    def test_create_agenda_entry_public(self):
        """Test creating agenda entry via public form"""
        response = requests.post(
            f"{BASE_URL}/api/stars/agenda-public",
            json={
                "date": "2026-06-15",
                "type": "activite",
                "titre": "TEST_Public_Activity",
                "description": "Test activity created via public form",
                "statut": "planifie",
                "departement": "MLA",
                "semestre": "1",
                "annee": 2026,
                "ville": "Dijon",
                "heure": "14:00"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["message"] == "Entrée ajoutée à l'agenda"
        print(f"SUCCESS: Public agenda entry created with id {data['id']}")


class TestPlanningActivites:
    """Tests for /api/planning/activites endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "superadmin", "password": "superadmin123"}
        )
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_planning_activites(self):
        """Test getting planning activities for a city"""
        response = requests.get(
            f"{BASE_URL}/api/planning/activites",
            params={"ville": "Dijon", "annee": 2026},
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: Found {len(data)} planning activities for Dijon 2026")
    
    def test_create_planning_activite(self):
        """Test creating a new planning activity"""
        response = requests.post(
            f"{BASE_URL}/api/planning/activites",
            json={
                "nom": "TEST_Planning_Activity",
                "annee": 2026,
                "semestre": 1,
                "date_debut": "2026-07-01",
                "date_fin": "2026-07-01",
                "ministeres": "Test",
                "statut": "À venir",
                "commentaire": "Test activity",
                "ville": "Dijon"
            },
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        print(f"SUCCESS: Planning activity created with id {data['id']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
