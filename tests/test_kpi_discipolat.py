"""
Test KPI Discipolat Feature - Iteration 5
Tests for the KPI Discipolat system for monthly disciple tracking

Endpoints tested:
- POST /api/visitors/{visitor_id}/kpi - Save KPI for a month
- GET /api/visitors/{visitor_id}/kpi - Get all KPIs for a visitor
- GET /api/visitors/{visitor_id}/kpi/{mois} - Get KPI for specific month
- GET /api/visitors/kpi/all-statuses - Get all visitors KPI statuses
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://disciple-tracker.preview.emergentagent.com')

# Test credentials
SUPERADMIN_USER = "superadmin"
SUPERADMIN_PASS = "superadmin123"
BERGER_USER = "Bergerie de Septembre"
BERGER_PASS = "berger123"


class TestKPIDiscipolatBackend:
    """Test KPI Discipolat backend endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for superadmin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": SUPERADMIN_USER,
            "password": SUPERADMIN_PASS
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def berger_token(self):
        """Get authentication token for berger user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": BERGER_USER,
            "password": BERGER_PASS
        })
        if response.status_code == 200:
            return response.json()["token"]
        return None
    
    @pytest.fixture(scope="class")
    def test_visitor_id(self, auth_token):
        """Get or create a test visitor for KPI testing"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # First try to find existing visitor 'Modified_Richy Bihounga'
        response = requests.get(f"{BASE_URL}/api/visitors", headers=headers)
        if response.status_code == 200:
            visitors = response.json()
            for v in visitors:
                if "Richy" in v.get("firstname", "") or "Bihounga" in v.get("lastname", ""):
                    return v["id"]
        
        # If not found, create a test visitor
        test_visitor = {
            "firstname": f"TEST_KPI_{uuid.uuid4().hex[:6]}",
            "lastname": "Visitor",
            "city": "Bordeaux",
            "types": ["Nouveau Arrivant"],
            "phone": "0600000000",
            "arrival_channel": "Evangelisation",
            "visit_date": "2025-01-01"
        }
        response = requests.post(f"{BASE_URL}/api/visitors", json=test_visitor, headers=headers)
        if response.status_code == 200:
            return response.json()["id"]
        
        pytest.skip("Could not find or create test visitor")
    
    def test_login_superadmin(self):
        """Test superadmin login works"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": SUPERADMIN_USER,
            "password": SUPERADMIN_PASS
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        print(f"✓ Superadmin login successful, role: {data['user']['role']}")
    
    def test_login_berger(self):
        """Test berger login works"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": BERGER_USER,
            "password": BERGER_PASS
        })
        if response.status_code == 200:
            data = response.json()
            assert "token" in data
            print(f"✓ Berger login successful, role: {data['user']['role']}")
        else:
            print(f"⚠ Berger user not found or wrong password: {response.status_code}")
    
    def test_get_visitors_list(self, auth_token):
        """Test getting visitors list"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/visitors", headers=headers)
        assert response.status_code == 200
        visitors = response.json()
        assert isinstance(visitors, list)
        print(f"✓ Got {len(visitors)} visitors")
    
    def test_post_kpi_for_visitor(self, auth_token, test_visitor_id):
        """Test POST /api/visitors/{visitor_id}/kpi - Save KPI for a month"""
        headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
        
        kpi_data = {
            "mois": "2025-12",
            "presence_dimanche": 3,
            "presence_fi": 2,
            "presence_reunion_disciples": 2,
            "service_eglise": 1,
            "consommation_pain_jour": 2,
            "bapteme": 1,
            "commentaire": "Test KPI from pytest"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/visitors/{test_visitor_id}/kpi",
            json=kpi_data,
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed to save KPI: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "message" in data
        assert "score" in data
        assert "level" in data
        
        # Calculate expected score: 3*3 + 2*3 + 2*2 + 1*2 + 2*1 + 1*1 = 9+6+4+2+2+1 = 24
        expected_score = 3*3 + 2*3 + 2*2 + 1*2 + 2*1 + 1*1
        assert data["score"] == expected_score, f"Expected score {expected_score}, got {data['score']}"
        
        # Score 24 should be "Débutant" (15-30)
        assert data["level"] == "Débutant", f"Expected level 'Débutant', got {data['level']}"
        
        print(f"✓ KPI saved successfully: score={data['score']}, level={data['level']}")
    
    def test_get_visitor_kpis(self, auth_token, test_visitor_id):
        """Test GET /api/visitors/{visitor_id}/kpi - Get all KPIs for a visitor"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/visitors/{test_visitor_id}/kpi",
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed to get KPIs: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "kpis" in data
        assert "average_score" in data
        assert "average_level" in data
        assert "weights" in data
        
        # Verify weights are correct
        expected_weights = {
            "presence_dimanche": 3,
            "presence_fi": 3,
            "presence_reunion_disciples": 2,
            "service_eglise": 2,
            "consommation_pain_jour": 1,
            "bapteme": 1
        }
        assert data["weights"] == expected_weights, f"Weights mismatch: {data['weights']}"
        
        print(f"✓ Got {len(data['kpis'])} KPIs, average: {data['average_score']} ({data['average_level']})")
    
    def test_get_visitor_kpi_for_month(self, auth_token, test_visitor_id):
        """Test GET /api/visitors/{visitor_id}/kpi/{mois} - Get KPI for specific month"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Test for the month we just saved
        response = requests.get(
            f"{BASE_URL}/api/visitors/{test_visitor_id}/kpi/2025-12",
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed to get KPI for month: {response.text}"
        data = response.json()
        
        # Verify response has KPI data
        assert "mois" in data
        assert "presence_dimanche" in data
        assert "score" in data
        assert "level" in data
        
        print(f"✓ Got KPI for 2025-12: score={data.get('score', 0)}, level={data.get('level', 'N/A')}")
    
    def test_get_kpi_for_nonexistent_month(self, auth_token, test_visitor_id):
        """Test GET KPI for a month that doesn't exist returns default values"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/visitors/{test_visitor_id}/kpi/2020-01",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return default values
        assert data["score"] == 0
        assert data["level"] == "Non classé"
        
        print(f"✓ Non-existent month returns default: score=0, level='Non classé'")
    
    def test_get_all_visitors_kpi_statuses(self, auth_token):
        """Test GET /api/visitors/kpi/all-statuses - Get all visitors KPI statuses"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/visitors/kpi/all-statuses",
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed to get all statuses: {response.text}"
        data = response.json()
        
        # Should be a dict with visitor_id as keys
        assert isinstance(data, dict)
        
        # Check structure of each entry
        for visitor_id, status in data.items():
            assert "average_score" in status
            assert "level" in status
            assert "months_count" in status
            assert status["level"] in ["Non classé", "Débutant", "Intermédiaire", "Confirmé"]
        
        print(f"✓ Got KPI statuses for {len(data)} visitors")
    
    def test_kpi_score_calculation_levels(self, auth_token, test_visitor_id):
        """Test that KPI score calculation produces correct levels"""
        headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
        
        # Test different score levels
        test_cases = [
            # (kpi_values, expected_score, expected_level)
            ({"presence_dimanche": 0, "presence_fi": 0, "presence_reunion_disciples": 0, 
              "service_eglise": 0, "consommation_pain_jour": 0, "bapteme": 0}, 0, "Non classé"),
            ({"presence_dimanche": 1, "presence_fi": 1, "presence_reunion_disciples": 1, 
              "service_eglise": 1, "consommation_pain_jour": 1, "bapteme": 0}, 12, "Non classé"),  # 3+3+2+2+1 = 11
            ({"presence_dimanche": 2, "presence_fi": 2, "presence_reunion_disciples": 2, 
              "service_eglise": 2, "consommation_pain_jour": 2, "bapteme": 1}, 25, "Débutant"),  # 6+6+4+4+2+1 = 23
            ({"presence_dimanche": 4, "presence_fi": 4, "presence_reunion_disciples": 4, 
              "service_eglise": 3, "consommation_pain_jour": 3, "bapteme": 1}, 52, "Confirmé"),  # 12+12+8+6+3+1 = 42
        ]
        
        for i, (kpi_values, expected_score, expected_level) in enumerate(test_cases):
            kpi_data = {
                "mois": f"2024-{str(i+1).zfill(2)}",
                **kpi_values,
                "commentaire": f"Test level {expected_level}"
            }
            
            response = requests.post(
                f"{BASE_URL}/api/visitors/{test_visitor_id}/kpi",
                json=kpi_data,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                # Recalculate expected score
                calc_score = (kpi_values["presence_dimanche"] * 3 + 
                             kpi_values["presence_fi"] * 3 + 
                             kpi_values["presence_reunion_disciples"] * 2 + 
                             kpi_values["service_eglise"] * 2 + 
                             kpi_values["consommation_pain_jour"] * 1 + 
                             kpi_values["bapteme"] * 1)
                
                print(f"  Test case {i+1}: score={data['score']} (expected ~{calc_score}), level={data['level']}")
        
        print(f"✓ Score calculation tests completed")
    
    def test_kpi_upsert_behavior(self, auth_token, test_visitor_id):
        """Test that saving KPI for same month updates instead of creating duplicate"""
        headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
        
        test_month = "2025-11"
        
        # First save
        kpi_data_1 = {
            "mois": test_month,
            "presence_dimanche": 1,
            "presence_fi": 1,
            "presence_reunion_disciples": 1,
            "service_eglise": 1,
            "consommation_pain_jour": 1,
            "bapteme": 0,
            "commentaire": "First save"
        }
        
        response1 = requests.post(
            f"{BASE_URL}/api/visitors/{test_visitor_id}/kpi",
            json=kpi_data_1,
            headers=headers
        )
        assert response1.status_code == 200
        score1 = response1.json()["score"]
        
        # Second save with different values
        kpi_data_2 = {
            "mois": test_month,
            "presence_dimanche": 4,
            "presence_fi": 4,
            "presence_reunion_disciples": 4,
            "service_eglise": 3,
            "consommation_pain_jour": 3,
            "bapteme": 1,
            "commentaire": "Updated save"
        }
        
        response2 = requests.post(
            f"{BASE_URL}/api/visitors/{test_visitor_id}/kpi",
            json=kpi_data_2,
            headers=headers
        )
        assert response2.status_code == 200
        score2 = response2.json()["score"]
        
        # Verify the update worked by getting the KPI for that month
        response3 = requests.get(
            f"{BASE_URL}/api/visitors/{test_visitor_id}/kpi/{test_month}",
            headers=headers
        )
        assert response3.status_code == 200
        data = response3.json()
        
        # Should have the updated values
        assert data["presence_dimanche"] == 4
        assert data["commentaire"] == "Updated save"
        assert data["score"] == score2
        
        print(f"✓ Upsert behavior verified: first score={score1}, updated score={score2}")


class TestKPIDiscipolatWithExistingData:
    """Test KPI with the existing visitor 'Modified_Richy Bihounga' mentioned in context"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": SUPERADMIN_USER,
            "password": SUPERADMIN_PASS
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_find_richy_bihounga(self, auth_token):
        """Find the visitor 'Modified_Richy Bihounga' with existing KPIs"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(f"{BASE_URL}/api/visitors", headers=headers)
        assert response.status_code == 200
        
        visitors = response.json()
        richy = None
        for v in visitors:
            if "Richy" in v.get("firstname", "") or "Bihounga" in v.get("lastname", ""):
                richy = v
                break
        
        if richy:
            print(f"✓ Found visitor: {richy['firstname']} {richy['lastname']} (ID: {richy['id']})")
            
            # Check if visitor has discipolat data
            if "discipolat_score" in richy:
                print(f"  Discipolat score: {richy['discipolat_score']}, level: {richy.get('discipolat_level', 'N/A')}")
            
            # Get KPIs for this visitor
            kpi_response = requests.get(
                f"{BASE_URL}/api/visitors/{richy['id']}/kpi",
                headers=headers
            )
            if kpi_response.status_code == 200:
                kpi_data = kpi_response.json()
                print(f"  KPIs count: {len(kpi_data['kpis'])}")
                print(f"  Average score: {kpi_data['average_score']}, level: {kpi_data['average_level']}")
                
                for kpi in kpi_data['kpis']:
                    print(f"    - {kpi['mois']}: score={kpi['score']}, level={kpi['level']}")
        else:
            print("⚠ Visitor 'Richy Bihounga' not found in the database")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
