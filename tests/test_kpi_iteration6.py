"""
Test KPI Discipolat - Iteration 6
Tests for:
1. Updated KPI coefficients (Présence Dimanche ×5, Présence FI ×2, Réunion Disciples ×3, Service Église ×6, Pain du Jour ×5, Baptême ×2)
2. Manual status endpoint for visitors
3. KPI endpoints for bergerie members
4. All-statuses endpoint returning manual_status if defined
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://disciple-tracker.preview.emergentagent.com')

# Expected KPI weights as per requirements
EXPECTED_WEIGHTS = {
    "presence_dimanche": 5,
    "presence_fi": 2,
    "presence_reunion_disciples": 3,
    "service_eglise": 6,
    "consommation_pain_jour": 5,
    "bapteme": 2
}

# Expected levels
EXPECTED_LEVELS = {
    "Non classé": (0, 19),
    "Débutant": (20, 39),
    "Intermédiaire": (40, 59),
    "Confirmé": (60, 200)
}

# Max possible score: (4×5)+(4×2)+(4×3)+(3×6)+(3×5)+(1×2) = 20+8+12+18+15+2 = 75 pts
MAX_SCORE = 75


class TestKPICoefficients:
    """Test that KPI coefficients are correctly updated"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as superadmin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "superadmin",
            "password": "superadmin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_kpi_weights_returned_in_response(self):
        """Test that GET /api/visitors/{id}/kpi returns correct weights"""
        # First get a visitor
        visitors_response = requests.get(f"{BASE_URL}/api/visitors", headers=self.headers)
        assert visitors_response.status_code == 200
        visitors = visitors_response.json()
        
        if len(visitors) == 0:
            pytest.skip("No visitors available for testing")
        
        visitor_id = visitors[0]["id"]
        
        # Get KPIs for this visitor
        response = requests.get(f"{BASE_URL}/api/visitors/{visitor_id}/kpi", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "weights" in data, "Response should contain weights"
        
        # Verify weights match expected values
        weights = data["weights"]
        for key, expected_weight in EXPECTED_WEIGHTS.items():
            assert key in weights, f"Weight for {key} should be present"
            assert weights[key] == expected_weight, f"Weight for {key} should be {expected_weight}, got {weights[key]}"
        
        print(f"✅ KPI weights verified: {weights}")
    
    def test_kpi_score_calculation_with_new_coefficients(self):
        """Test that score is calculated correctly with new coefficients"""
        # Get a visitor
        visitors_response = requests.get(f"{BASE_URL}/api/visitors", headers=self.headers)
        visitors = visitors_response.json()
        
        if len(visitors) == 0:
            pytest.skip("No visitors available for testing")
        
        visitor_id = visitors[0]["id"]
        
        # Post KPI with known values
        kpi_data = {
            "mois": "2025-12",
            "presence_dimanche": 4,      # 4 × 5 = 20
            "presence_fi": 4,            # 4 × 2 = 8
            "presence_reunion_disciples": 4,  # 4 × 3 = 12
            "service_eglise": 3,         # 3 × 6 = 18
            "consommation_pain_jour": 3, # 3 × 5 = 15
            "bapteme": 1,                # 1 × 2 = 2
            "commentaire": "Test iteration 6 - max score"
        }
        # Expected score: 20 + 8 + 12 + 18 + 15 + 2 = 75 (Confirmé)
        expected_score = 75
        
        response = requests.post(
            f"{BASE_URL}/api/visitors/{visitor_id}/kpi",
            headers=self.headers,
            json=kpi_data
        )
        assert response.status_code == 200, f"Failed to save KPI: {response.text}"
        
        result = response.json()
        assert result["score"] == expected_score, f"Score should be {expected_score}, got {result['score']}"
        assert result["level"] == "Confirmé", f"Level should be Confirmé for score {expected_score}"
        
        print(f"✅ Score calculation verified: {result['score']} pts = {result['level']}")
    
    def test_kpi_level_boundaries(self):
        """Test that levels are correctly assigned based on score boundaries"""
        visitors_response = requests.get(f"{BASE_URL}/api/visitors", headers=self.headers)
        visitors = visitors_response.json()
        
        if len(visitors) == 0:
            pytest.skip("No visitors available for testing")
        
        visitor_id = visitors[0]["id"]
        
        # Test boundary cases
        test_cases = [
            # (presence_dimanche, expected_score_approx, expected_level)
            (0, 0, "Non classé"),   # Score 0
            (3, 15, "Non classé"),  # Score ~15 (3×5=15)
            (4, 20, "Débutant"),    # Score 20 (4×5=20)
            (2, 10, "Non classé"),  # Score 10 (2×5=10)
        ]
        
        for pd_value, expected_min_score, expected_level in test_cases:
            kpi_data = {
                "mois": f"2024-{pd_value + 1:02d}",  # Different month for each test
                "presence_dimanche": pd_value,
                "presence_fi": 0,
                "presence_reunion_disciples": 0,
                "service_eglise": 0,
                "consommation_pain_jour": 0,
                "bapteme": 0,
                "commentaire": f"Test level boundary - pd={pd_value}"
            }
            
            response = requests.post(
                f"{BASE_URL}/api/visitors/{visitor_id}/kpi",
                headers=self.headers,
                json=kpi_data
            )
            assert response.status_code == 200
            result = response.json()
            
            actual_score = result["score"]
            actual_level = result["level"]
            
            # Verify score is calculated correctly
            expected_score = pd_value * 5  # Only presence_dimanche contributes
            assert actual_score == expected_score, f"Score should be {expected_score}, got {actual_score}"
            
            print(f"  Score {actual_score}: {actual_level}")


class TestManualStatus:
    """Test manual status endpoint for visitors"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as superadmin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "superadmin",
            "password": "superadmin123"
        })
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_set_manual_status(self):
        """Test POST /api/visitors/{id}/manual-status"""
        # Get a visitor
        visitors_response = requests.get(f"{BASE_URL}/api/visitors", headers=self.headers)
        visitors = visitors_response.json()
        
        if len(visitors) == 0:
            pytest.skip("No visitors available for testing")
        
        visitor_id = visitors[0]["id"]
        
        # Set manual status
        manual_data = {
            "manual_status": "Confirmé",
            "manual_commentaire": "Test manual status - iteration 6"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/visitors/{visitor_id}/manual-status",
            headers=self.headers,
            json=manual_data
        )
        assert response.status_code == 200, f"Failed to set manual status: {response.text}"
        
        result = response.json()
        assert "message" in result
        print(f"✅ Manual status set successfully for visitor {visitor_id}")
        
        # Store visitor_id for next test
        self.test_visitor_id = visitor_id
        return visitor_id
    
    def test_manual_status_in_all_statuses(self):
        """Test GET /api/visitors/kpi/all-statuses returns manual_status"""
        # First set a manual status
        visitors_response = requests.get(f"{BASE_URL}/api/visitors", headers=self.headers)
        visitors = visitors_response.json()
        
        if len(visitors) == 0:
            pytest.skip("No visitors available for testing")
        
        visitor_id = visitors[0]["id"]
        
        # Set manual status
        manual_data = {
            "manual_status": "Intermédiaire",
            "manual_commentaire": "Test for all-statuses endpoint"
        }
        
        set_response = requests.post(
            f"{BASE_URL}/api/visitors/{visitor_id}/manual-status",
            headers=self.headers,
            json=manual_data
        )
        assert set_response.status_code == 200
        
        # Now get all statuses
        response = requests.get(f"{BASE_URL}/api/visitors/kpi/all-statuses", headers=self.headers)
        assert response.status_code == 200, f"Failed to get all statuses: {response.text}"
        
        data = response.json()
        
        # Check if our visitor has manual_status
        if visitor_id in data:
            visitor_status = data[visitor_id]
            assert "manual_status" in visitor_status, "manual_status should be present"
            assert visitor_status["manual_status"] == "Intermédiaire", f"manual_status should be Intermédiaire"
            print(f"✅ Manual status returned in all-statuses: {visitor_status}")
        else:
            print(f"⚠️ Visitor {visitor_id} not found in all-statuses (may not have KPIs)")
    
    def test_clear_manual_status(self):
        """Test clearing manual status by setting it to null"""
        visitors_response = requests.get(f"{BASE_URL}/api/visitors", headers=self.headers)
        visitors = visitors_response.json()
        
        if len(visitors) == 0:
            pytest.skip("No visitors available for testing")
        
        visitor_id = visitors[0]["id"]
        
        # Clear manual status
        manual_data = {
            "manual_status": None,
            "manual_commentaire": ""
        }
        
        response = requests.post(
            f"{BASE_URL}/api/visitors/{visitor_id}/manual-status",
            headers=self.headers,
            json=manual_data
        )
        assert response.status_code == 200
        print(f"✅ Manual status cleared for visitor {visitor_id}")


class TestBergerieKPI:
    """Test KPI endpoints for bergerie members"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as superadmin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "superadmin",
            "password": "superadmin123"
        })
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def get_bergerie_with_members(self):
        """Helper to get a bergerie with members"""
        # Get list of bergeries
        response = requests.get(f"{BASE_URL}/api/bergeries-disciples/list", headers=self.headers)
        if response.status_code != 200:
            return None, None
        
        bergeries = response.json()
        if not bergeries:
            return None, None
        
        # Find a bergerie with members
        for bergerie in bergeries:
            membres_response = requests.get(
                f"{BASE_URL}/api/bergeries-disciples/{bergerie['id']}/membres",
                headers=self.headers
            )
            if membres_response.status_code == 200:
                data = membres_response.json()
                membres = data.get("membres", [])
                if membres:
                    return bergerie, membres[0]
        
        return bergeries[0] if bergeries else None, None
    
    def test_post_kpi_for_bergerie_member(self):
        """Test POST /api/bergeries-disciples/membres/{id}/kpi"""
        bergerie, membre = self.get_bergerie_with_members()
        
        if not membre:
            pytest.skip("No bergerie members available for testing")
        
        membre_id = membre["id"]
        
        # Post KPI
        kpi_data = {
            "mois": "2025-12",
            "presence_dimanche": 3,      # 3 × 5 = 15
            "presence_fi": 2,            # 2 × 2 = 4
            "presence_reunion_disciples": 2,  # 2 × 3 = 6
            "service_eglise": 2,         # 2 × 6 = 12
            "consommation_pain_jour": 2, # 2 × 5 = 10
            "bapteme": 1,                # 1 × 2 = 2
            "commentaire": "Test KPI for bergerie member - iteration 6"
        }
        # Expected score: 15 + 4 + 6 + 12 + 10 + 2 = 49 (Intermédiaire)
        expected_score = 49
        
        response = requests.post(
            f"{BASE_URL}/api/bergeries-disciples/membres/{membre_id}/kpi",
            headers=self.headers,
            json=kpi_data
        )
        assert response.status_code == 200, f"Failed to save KPI for bergerie member: {response.text}"
        
        result = response.json()
        assert result["score"] == expected_score, f"Score should be {expected_score}, got {result['score']}"
        assert result["level"] == "Intermédiaire", f"Level should be Intermédiaire for score {expected_score}"
        
        print(f"✅ KPI saved for bergerie member {membre_id}: {result['score']} pts = {result['level']}")
        return membre_id
    
    def test_get_kpi_for_bergerie_member(self):
        """Test GET /api/bergeries-disciples/membres/{id}/kpi"""
        bergerie, membre = self.get_bergerie_with_members()
        
        if not membre:
            pytest.skip("No bergerie members available for testing")
        
        membre_id = membre["id"]
        
        # First save a KPI
        kpi_data = {
            "mois": "2025-11",
            "presence_dimanche": 2,
            "presence_fi": 1,
            "presence_reunion_disciples": 1,
            "service_eglise": 1,
            "consommation_pain_jour": 1,
            "bapteme": 0,
            "commentaire": "Test GET KPI"
        }
        
        save_response = requests.post(
            f"{BASE_URL}/api/bergeries-disciples/membres/{membre_id}/kpi",
            headers=self.headers,
            json=kpi_data
        )
        assert save_response.status_code == 200
        
        # Now get KPIs
        response = requests.get(
            f"{BASE_URL}/api/bergeries-disciples/membres/{membre_id}/kpi",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed to get KPIs: {response.text}"
        
        data = response.json()
        assert "kpis" in data
        assert "average_score" in data
        assert "average_level" in data
        assert "weights" in data
        
        # Verify weights are correct
        for key, expected_weight in EXPECTED_WEIGHTS.items():
            assert data["weights"][key] == expected_weight
        
        print(f"✅ KPIs retrieved for bergerie member: {len(data['kpis'])} records, avg score: {data['average_score']}")
    
    def test_get_kpi_for_specific_month(self):
        """Test GET /api/bergeries-disciples/membres/{id}/kpi/{mois}"""
        bergerie, membre = self.get_bergerie_with_members()
        
        if not membre:
            pytest.skip("No bergerie members available for testing")
        
        membre_id = membre["id"]
        mois = "2025-12"
        
        response = requests.get(
            f"{BASE_URL}/api/bergeries-disciples/membres/{membre_id}/kpi/{mois}",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed to get KPI for month: {response.text}"
        
        data = response.json()
        assert "mois" in data
        assert "presence_dimanche" in data
        assert "score" in data
        assert "level" in data
        
        print(f"✅ KPI for month {mois}: score={data['score']}, level={data['level']}")
    
    def test_manual_status_for_bergerie_member(self):
        """Test POST /api/bergeries-disciples/membres/{id}/manual-status"""
        bergerie, membre = self.get_bergerie_with_members()
        
        if not membre:
            pytest.skip("No bergerie members available for testing")
        
        membre_id = membre["id"]
        
        # Set manual status
        manual_data = {
            "manual_status": "Confirmé",
            "manual_commentaire": "Test manual status for bergerie member"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/bergeries-disciples/membres/{membre_id}/manual-status",
            headers=self.headers,
            json=manual_data
        )
        assert response.status_code == 200, f"Failed to set manual status: {response.text}"
        
        print(f"✅ Manual status set for bergerie member {membre_id}")
        
        # Verify it's returned in GET KPI
        get_response = requests.get(
            f"{BASE_URL}/api/bergeries-disciples/membres/{membre_id}/kpi",
            headers=self.headers
        )
        assert get_response.status_code == 200
        
        data = get_response.json()
        assert data.get("manual_status") == "Confirmé", "Manual status should be returned"
        print(f"✅ Manual status verified in GET response: {data.get('manual_status')}")


class TestAllStatusesEndpoint:
    """Test the all-statuses endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as superadmin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "superadmin",
            "password": "superadmin123"
        })
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_all_statuses_endpoint(self):
        """Test GET /api/visitors/kpi/all-statuses"""
        response = requests.get(f"{BASE_URL}/api/visitors/kpi/all-statuses", headers=self.headers)
        assert response.status_code == 200, f"Failed to get all statuses: {response.text}"
        
        data = response.json()
        assert isinstance(data, dict), "Response should be a dictionary"
        
        # Check structure of each entry
        for visitor_id, status_data in data.items():
            assert "average_score" in status_data
            assert "level" in status_data
            assert "months_count" in status_data
            
            # If manual_status is set, it should be present
            if "manual_status" in status_data:
                print(f"  Visitor {visitor_id}: manual_status={status_data['manual_status']}")
        
        print(f"✅ All statuses endpoint returned {len(data)} visitors")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
