"""
Test Analytics Endpoints - Iteration 7
Testing:
- /api/analytics/promotions-detailed with filters (ville, mois, annee)
- /api/analytics/age-distribution with year filter
- /api/analytics/arrival-channel-distribution with year filter
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAnalyticsEndpoints:
    """Test analytics endpoints for Super Admin dashboard"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as superadmin before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "superadmin",
            "password": "superadmin123",
            "city": "Douala"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    # ==================== PROMOTIONS DETAILED ====================
    
    def test_promotions_detailed_no_filter(self):
        """Test promotions-detailed without any filter"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/promotions-detailed",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify structure
        assert "promos" in data, "Missing 'promos' key"
        assert "summary" in data, "Missing 'summary' key"
        
        # Verify summary has expected fields (correct field names)
        summary = data["summary"]
        assert "total_personnes_recues" in summary, "Missing total_personnes_recues in summary"
        assert "total_dp" in summary, "Missing total_dp in summary"
        assert "total_suivis_arretes" in summary, "Missing total_suivis_arretes in summary"
        assert "total_personnes_suivies" in summary, "Missing total_personnes_suivies in summary"
        
        # Verify we have data (67 visitors in DB)
        assert summary["total_personnes_recues"] > 0, f"Expected visitors, got {summary['total_personnes_recues']}"
        print(f"✓ Promotions detailed (no filter): {summary['total_personnes_recues']} visitors")
    
    def test_promotions_detailed_filter_year_2024(self):
        """Test promotions-detailed with year 2024 filter"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/promotions-detailed",
            params={"annee": "2024"},
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        summary = data["summary"]
        # 2024 has 53 visitors based on DB check
        assert summary["total_recus"] > 0, f"Expected 2024 visitors, got {summary['total_recus']}"
        print(f"✓ Promotions detailed (2024): {summary['total_recus']} visitors")
    
    def test_promotions_detailed_filter_year_2025(self):
        """Test promotions-detailed with year 2025 filter"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/promotions-detailed",
            params={"annee": "2025"},
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        summary = data["summary"]
        # 2025 has 14 visitors based on DB check
        assert summary["total_recus"] > 0, f"Expected 2025 visitors, got {summary['total_recus']}"
        print(f"✓ Promotions detailed (2025): {summary['total_recus']} visitors")
    
    def test_promotions_detailed_filter_month_and_year(self):
        """Test promotions-detailed with month and year filter"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/promotions-detailed",
            params={"annee": "2024", "mois": "08"},
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        summary = data["summary"]
        # 2024-08 has 8 visitors based on DB check
        assert summary["total_recus"] > 0, f"Expected August 2024 visitors, got {summary['total_recus']}"
        print(f"✓ Promotions detailed (2024-08): {summary['total_recus']} visitors")
    
    def test_promotions_detailed_filter_city(self):
        """Test promotions-detailed with city filter"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/promotions-detailed",
            params={"ville": "Dijon"},
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        summary = data["summary"]
        # Dijon has 66 visitors based on DB check
        assert summary["total_recus"] > 0, f"Expected Dijon visitors, got {summary['total_recus']}"
        print(f"✓ Promotions detailed (Dijon): {summary['total_recus']} visitors")
    
    def test_promotions_detailed_all_filters(self):
        """Test promotions-detailed with all filters combined"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/promotions-detailed",
            params={"ville": "Dijon", "annee": "2024", "mois": "08"},
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        summary = data["summary"]
        print(f"✓ Promotions detailed (Dijon, 2024-08): {summary['total_recus']} visitors")
    
    # ==================== AGE DISTRIBUTION ====================
    
    def test_age_distribution_no_filter(self):
        """Test age-distribution without any filter"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/age-distribution",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Should return list of {name, value}
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        
        total = sum(item["value"] for item in data)
        assert total > 0, f"Expected age distribution data, got total {total}"
        print(f"✓ Age distribution (no filter): {total} visitors, {len(data)} categories")
    
    def test_age_distribution_filter_year_2024(self):
        """Test age-distribution with year 2024 filter"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/age-distribution",
            params={"annee": "2024"},
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        total = sum(item["value"] for item in data)
        assert total > 0, f"Expected 2024 age distribution, got total {total}"
        print(f"✓ Age distribution (2024): {total} visitors")
    
    def test_age_distribution_filter_year_2025(self):
        """Test age-distribution with year 2025 filter"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/age-distribution",
            params={"annee": "2025"},
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        total = sum(item["value"] for item in data)
        assert total > 0, f"Expected 2025 age distribution, got total {total}"
        print(f"✓ Age distribution (2025): {total} visitors")
    
    def test_age_distribution_filter_month_and_year(self):
        """Test age-distribution with month and year filter"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/age-distribution",
            params={"annee": "2024", "mois": "08"},
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        total = sum(item["value"] for item in data)
        print(f"✓ Age distribution (2024-08): {total} visitors")
    
    # ==================== ARRIVAL CHANNEL DISTRIBUTION ====================
    
    def test_arrival_channel_no_filter(self):
        """Test arrival-channel-distribution without any filter"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/arrival-channel-distribution",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Should return list of {name, value}
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        
        total = sum(item["value"] for item in data)
        assert total > 0, f"Expected arrival channel data, got total {total}"
        print(f"✓ Arrival channel (no filter): {total} visitors, {len(data)} channels")
    
    def test_arrival_channel_filter_year_2024(self):
        """Test arrival-channel-distribution with year 2024 filter"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/arrival-channel-distribution",
            params={"annee": "2024"},
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        total = sum(item["value"] for item in data)
        assert total > 0, f"Expected 2024 arrival channel data, got total {total}"
        print(f"✓ Arrival channel (2024): {total} visitors")
    
    def test_arrival_channel_filter_year_2025(self):
        """Test arrival-channel-distribution with year 2025 filter"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/arrival-channel-distribution",
            params={"annee": "2025"},
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        total = sum(item["value"] for item in data)
        assert total > 0, f"Expected 2025 arrival channel data, got total {total}"
        print(f"✓ Arrival channel (2025): {total} visitors")
    
    def test_arrival_channel_filter_month_and_year(self):
        """Test arrival-channel-distribution with month and year filter"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/arrival-channel-distribution",
            params={"annee": "2024", "mois": "08"},
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        total = sum(item["value"] for item in data)
        print(f"✓ Arrival channel (2024-08): {total} visitors")


class TestEJPEndpoints:
    """Test EJP (Église des Jeunes Prodiges) endpoints"""
    
    def test_ejp_cultes_list(self):
        """Test GET /api/ejp/cultes - list all cultes"""
        response = requests.get(f"{BASE_URL}/api/ejp/cultes")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"✓ EJP Cultes list: {len(data)} cultes")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
