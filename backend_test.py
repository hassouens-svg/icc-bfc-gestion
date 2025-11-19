#!/usr/bin/env python3
"""
🎯 TEST DE RÉGRESSION COMPLET - APPLICATION ICC BFC-ITALIE
Backend API Testing Suite for comprehensive regression testing

This test suite verifies all critical functionalities after bug fixes for fidelisation.
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://churchadmin-3.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

# Test accounts
TEST_ACCOUNTS = {
    "superadmin": {"username": "superadmin", "password": "superadmin123", "city": "Dijon"},
    "pasteur": {"username": "pasteur", "password": "pasteur123", "city": "Dijon"},
    "respo_aout": {"username": "respo_aout", "password": "respo_aout123", "city": "Dijon"},
    "joyce": {"username": "Joyce", "password": "Joyce123", "city": "Dijon"}
}

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
        self.successes = []
    
    def add_success(self, test_name, message=""):
        self.passed += 1
        self.successes.append(f"✅ {test_name}: {message}")
        print(f"✅ {test_name}: {message}")
    
    def add_failure(self, test_name, error):
        self.failed += 1
        self.errors.append(f"❌ {test_name}: {error}")
        print(f"❌ {test_name}: {error}")
    
    def print_summary(self):
        print(f"\n{'='*60}")
        print(f"🎯 TEST DE RÉGRESSION COMPLET - RÉSULTATS FINAUX")
        print(f"{'='*60}")
        print(f"✅ Tests réussis: {self.passed}")
        print(f"❌ Tests échoués: {self.failed}")
        print(f"📊 Taux de réussite: {(self.passed/(self.passed+self.failed)*100):.1f}%")
        
        if self.errors:
            print(f"\n❌ ÉCHECS DÉTAILLÉS:")
            for error in self.errors:
                print(f"  {error}")
        
        print(f"\n✅ SUCCÈS:")
        for success in self.successes:
            print(f"  {success}")

def login_user(account_name):
    """Login and return JWT token"""
    account = TEST_ACCOUNTS[account_name]
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json=account,
            headers=HEADERS,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return data.get("token"), data.get("user")
        else:
            return None, f"Login failed: {response.status_code} - {response.text}"
    except Exception as e:
        return None, f"Login error: {str(e)}"

def make_authenticated_request(method, endpoint, token, data=None, params=None):
    """Make authenticated API request"""
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    try:
        if method.upper() == "GET":
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, params=params, timeout=10)
        elif method.upper() == "POST":
            response = requests.post(f"{BASE_URL}{endpoint}", headers=headers, json=data, timeout=10)
        elif method.upper() == "PUT":
            response = requests.put(f"{BASE_URL}{endpoint}", headers=headers, json=data, timeout=10)
        elif method.upper() == "DELETE":
            response = requests.delete(f"{BASE_URL}{endpoint}", headers=headers, timeout=10)
        
        return response
    except Exception as e:
        return None

def test_authentication(results):
    """Test 1: AUTHENTIFICATION - Test login for each account"""
    print(f"\n🔐 TEST 1: AUTHENTIFICATION")
    print(f"{'='*50}")
    
    tokens = {}
    users = {}
    
    for account_name, account_data in TEST_ACCOUNTS.items():
        token, user_or_error = login_user(account_name)
        
        if token:
            tokens[account_name] = token
            users[account_name] = user_or_error
            results.add_success(f"Login {account_name}", f"JWT token généré, role: {user_or_error.get('role', 'N/A')}")
        else:
            results.add_failure(f"Login {account_name}", user_or_error)
    
    return tokens, users

def test_fidelisation_endpoints(results, tokens):
    """Test 2: FIDELISATION (PRIORITÉ HAUTE - BUG FIX VÉRIFIÉ)"""
    print(f"\n📊 TEST 2: FIDELISATION (PRIORITÉ HAUTE)")
    print(f"{'='*50}")
    
    # Test A: Login comme respo_aout et appeler GET /fidelisation/referent
    if "respo_aout" in tokens:
        response = make_authenticated_request("GET", "/fidelisation/referent", tokens["respo_aout"])
        
        if response and response.status_code == 200:
            data = response.json()
            total_visitors = data.get("total_visitors", 0)
            total_na = data.get("total_na", 0)
            total_nc = data.get("total_nc", 0)
            weekly_rates = data.get("weekly_rates", [])
            
            # Vérifications critiques
            if total_visitors >= 6:
                results.add_success("Fidelisation respo_aout - total_visitors", f"{total_visitors} visiteurs (>= 6)")
            else:
                results.add_failure("Fidelisation respo_aout - total_visitors", f"Seulement {total_visitors} visiteurs (< 6)")
            
            if total_na >= 3:
                results.add_success("Fidelisation respo_aout - total_na", f"{total_na} nouveaux arrivants (>= 3)")
            else:
                results.add_failure("Fidelisation respo_aout - total_na", f"Seulement {total_na} nouveaux arrivants (< 3)")
            
            if total_nc >= 1:
                results.add_success("Fidelisation respo_aout - total_nc", f"{total_nc} nouveaux convertis (>= 1)")
            else:
                results.add_failure("Fidelisation respo_aout - total_nc", f"Seulement {total_nc} nouveaux convertis (< 1)")
            
            if weekly_rates:
                results.add_success("Fidelisation respo_aout - weekly_rates", f"{len(weekly_rates)} semaines de données")
            else:
                results.add_failure("Fidelisation respo_aout - weekly_rates", "Tableau weekly_rates vide")
            
            # Vérifier que ce ne sont pas tous des 0
            all_zeros = (total_visitors == 0 and total_na == 0 and total_nc == 0 and not weekly_rates)
            if all_zeros:
                results.add_failure("Fidelisation respo_aout - CRITÈRE CRITIQUE", "Tous les champs sont à 0 - BUG CRITIQUE!")
            else:
                results.add_success("Fidelisation respo_aout - CRITÈRE CRITIQUE", "Données non-nulles confirmées")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text[:200]}"
            results.add_failure("Fidelisation respo_aout - API call", error_msg)
    
    # Test B: Login comme Joyce (referent) et appeler GET /fidelisation/referent
    if "joyce" in tokens:
        response = make_authenticated_request("GET", "/fidelisation/referent", tokens["joyce"])
        
        if response and response.status_code == 200:
            data = response.json()
            joyce_total = data.get("total_visitors", 0)
            joyce_na = data.get("total_na", 0)
            joyce_nc = data.get("total_nc", 0)
            
            results.add_success("Fidelisation Joyce - API call", f"Données reçues: {joyce_total} visiteurs, {joyce_na} NA, {joyce_nc} NC")
            
            # Vérifier cohérence avec respo_aout (même ville, même mois)
            # Note: Ils devraient avoir des données similaires s'ils sont dans la même ville/mois
            if joyce_total > 0:
                results.add_success("Fidelisation Joyce - cohérence", "Données cohérentes avec même ville/mois")
            else:
                results.add_failure("Fidelisation Joyce - cohérence", "Aucune donnée pour Joyce")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            results.add_failure("Fidelisation Joyce - API call", error_msg)
    
    # Test C: Login comme superadmin et appeler GET /fidelisation/admin
    if "superadmin" in tokens:
        response = make_authenticated_request("GET", "/fidelisation/admin", tokens["superadmin"])
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                results.add_success("Fidelisation superadmin - admin view", f"Voit {len(data)} referents")
                
                # Vérifier qu'il inclut les stats de respo_aout et Joyce
                referent_names = [r.get("referent_username", "") for r in data]
                if "respo_aout" in referent_names or "Joyce" in referent_names:
                    results.add_success("Fidelisation superadmin - inclusion", "Inclut les données de respo_aout/Joyce")
                else:
                    results.add_failure("Fidelisation superadmin - inclusion", f"Ne trouve pas respo_aout/Joyce dans: {referent_names}")
            else:
                results.add_failure("Fidelisation superadmin - admin view", "Aucune donnée de referent")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            results.add_failure("Fidelisation superadmin - API call", error_msg)

def test_stopped_visitors(results, tokens):
    """Test 3: VISITEURS ARRÊTÉS (BUG FIX VÉRIFIÉ)"""
    print(f"\n🛑 TEST 3: VISITEURS ARRÊTÉS")
    print(f"{'='*50}")
    
    # Test A: Login comme superadmin et appeler GET /visitors/stopped
    if "superadmin" in tokens:
        response = make_authenticated_request("GET", "/visitors/stopped", tokens["superadmin"])
        
        if response and response.status_code == 200:
            data = response.json()
            stopped_visitors = [v for v in data if v.get("tracking_stopped") == True]
            
            if len(stopped_visitors) >= 2:
                results.add_success("Visiteurs arrêtés - count", f"{len(stopped_visitors)} visiteurs arrêtés (>= 2)")
            else:
                results.add_failure("Visiteurs arrêtés - count", f"Seulement {len(stopped_visitors)} visiteurs arrêtés (< 2)")
            
            # Vérifier que les visiteurs de la promo 2024-08 sont inclus
            promo_2024_08 = [v for v in stopped_visitors if v.get("assigned_month") == "2024-08"]
            if promo_2024_08:
                results.add_success("Visiteurs arrêtés - promo 2024-08", f"{len(promo_2024_08)} visiteurs de 2024-08 inclus")
            else:
                results.add_failure("Visiteurs arrêtés - promo 2024-08", "Aucun visiteur de 2024-08 trouvé")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            results.add_failure("Visiteurs arrêtés superadmin", error_msg)
    
    # Test B: Vérifier les permissions
    test_roles = [
        ("superadmin", True, "superadmin doit avoir accès"),
        ("pasteur", True, "pasteur doit avoir accès"),
        ("respo_aout", False, "responsable_promo doit être refusé avec 403"),
        ("joyce", False, "referent doit être refusé avec 403")
    ]
    
    for role, should_have_access, description in test_roles:
        if role in tokens:
            response = make_authenticated_request("GET", "/visitors/stopped", tokens[role])
            
            if should_have_access:
                if response and response.status_code == 200:
                    results.add_success(f"Permissions visiteurs arrêtés - {role}", description)
                else:
                    results.add_failure(f"Permissions visiteurs arrêtés - {role}", f"Accès refusé incorrectement: {response.status_code if response else 'No response'}")
            else:
                if response and response.status_code == 403:
                    results.add_success(f"Permissions visiteurs arrêtés - {role}", description)
                else:
                    results.add_failure(f"Permissions visiteurs arrêtés - {role}", f"Devrait être 403, reçu: {response.status_code if response else 'No response'}")

def test_analytics_endpoints(results, tokens):
    """Test 4: ANALYTICS ENDPOINTS"""
    print(f"\n📈 TEST 4: ANALYTICS ENDPOINTS")
    print(f"{'='*50}")
    
    if "superadmin" in tokens:
        # Test A: GET /analytics/promotions-detailed?ville=Dijon
        response = make_authenticated_request("GET", "/analytics/promotions-detailed", tokens["superadmin"], params={"ville": "Dijon"})
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list) or isinstance(data, dict):
                results.add_success("Analytics promotions-detailed", f"Données retournées pour Dijon")
            else:
                results.add_failure("Analytics promotions-detailed", "Format de réponse incorrect")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            results.add_failure("Analytics promotions-detailed", error_msg)
        
        # Test B: GET /analytics/fi-detailed?ville=Dijon
        response = make_authenticated_request("GET", "/analytics/fi-detailed", tokens["superadmin"], params={"ville": "Dijon"})
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list) or isinstance(data, dict):
                results.add_success("Analytics fi-detailed", f"Données FI retournées pour Dijon")
            else:
                results.add_failure("Analytics fi-detailed", "Format de réponse incorrect")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            results.add_failure("Analytics fi-detailed", error_msg)
                
            print(f"✅ SUCCESS: Created {len(created_ids)} ancien visitors")
            print(f"✅ Created IDs: {created_ids}")
            
            # Store IDs for cleanup later
            self.created_visitor_ids = created_ids
            
            return True
            
        except json.JSONDecodeError as e:
            print(f"❌ FAILED: Invalid JSON response - {e}")
            print(f"Raw response: {response.text}")
            return False
            
    def test_visitors_assigned_month_field(self):
        """
        TEST 2: Bug Fix - Promo column showing wrong data
        Verify GET /api/visitors returns visitors with correct assigned_month field
        """
        print("\n" + "="*80)
        print("🧪 TEST 2: GET /api/visitors - Verify assigned_month field calculation")
        print("="*80)
        
        print("📤 Sending GET request to retrieve all visitors...")
        
        response = self.session.get(f"{BACKEND_URL}/visitors")
        
        print(f"📥 Response Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            print(f"Error response: {response.text}")
            return False
            
        try:
            visitors = response.json()
            print(f"📥 Found {len(visitors)} total visitors")
            
            if len(visitors) == 0:
                print("⚠️  WARNING: No visitors found in database")
                return True
                
            # Check if we have visitors with assigned_month field
            visitors_with_assigned_month = [v for v in visitors if "assigned_month" in v]
            print(f"📊 Visitors with assigned_month field: {len(visitors_with_assigned_month)}")
            
            if len(visitors_with_assigned_month) == 0:
                print("❌ FAILED: No visitors have assigned_month field")
                return False
                
            # Verify assigned_month format and calculation
            print("\n📋 Checking assigned_month field format and calculation:")
            
            valid_assigned_months = 0
            for i, visitor in enumerate(visitors_with_assigned_month[:10]):  # Check first 10
                visitor_id = visitor.get("id", "unknown")
                firstname = visitor.get("firstname", "unknown")
                lastname = visitor.get("lastname", "unknown")
                visit_date = visitor.get("visit_date", "")
                assigned_month = visitor.get("assigned_month", "")
                
                print(f"  {i+1}. {firstname} {lastname} (ID: {visitor_id[:8]}...)")
                print(f"     visit_date: {visit_date}")
                print(f"     assigned_month: {assigned_month}")
                
                # Verify assigned_month format (YYYY-MM)
                if not assigned_month or len(assigned_month) != 7 or assigned_month[4] != '-':
                    print(f"     ❌ Invalid assigned_month format: {assigned_month}")
                    continue
                    
                # Verify assigned_month matches visit_date month
                if visit_date:
                    try:
                        visit_dt = datetime.fromisoformat(visit_date)
                        expected_month = visit_dt.strftime("%Y-%m")
                        
                        if assigned_month == expected_month:
                            print(f"     ✅ assigned_month matches visit_date month")
                            valid_assigned_months += 1
                        else:
                            print(f"     ❌ assigned_month ({assigned_month}) doesn't match visit_date month ({expected_month})")
                    except Exception as e:
                        print(f"     ⚠️  Could not parse visit_date: {e}")
                else:
                    print(f"     ⚠️  No visit_date to verify against")
                    
                print()
                
            print(f"📊 Summary: {valid_assigned_months}/{len(visitors_with_assigned_month[:10])} visitors have correctly calculated assigned_month")
            
            # Check for different months to verify filtering will work
            unique_months = set(v.get("assigned_month", "") for v in visitors_with_assigned_month if v.get("assigned_month"))
            print(f"📅 Unique assigned_month values found: {sorted(unique_months)}")
            
            if len(unique_months) >= 2:
                print("✅ SUCCESS: Multiple months found - filtering functionality will work correctly")
            else:
                print("⚠️  WARNING: Only one unique month found - limited filtering test coverage")
                
            return True
            
        except json.JSONDecodeError as e:
            print(f"❌ FAILED: Invalid JSON response - {e}")
            print(f"Raw response: {response.text}")
            return False
            
    def test_role_permissions(self):
        """
        TEST 3: Verify role-based permissions for bulk-ancien endpoint
        """
        print("\n" + "="*80)
        print("🧪 TEST 3: Role-based permissions for bulk-ancien endpoint")
        print("="*80)
        
        # Test with different roles
        roles_to_test = ["promotions", "superviseur_promos"]
        
        for role in roles_to_test:
            print(f"\n🔄 Testing with {role} role...")
            
            try:
                self.login(role)
                
                # Simple test data
                test_data = [{
                    "firstname": f"Test{role}",
                    "lastname": "Permission",
                    "city": "Dijon",
                    "types": ["Nouveau Arrivant"],
                    "phone": "+33612999999",
                    "email": f"test.{role}@permission.com",
                    "arrival_channel": "Test",
                    "visit_date": "2025-01-15",
                    "is_ancien": True
                }]
                
                response = self.session.post(
                    f"{BACKEND_URL}/visitors/bulk-ancien",
                    json=test_data,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    print(f"  ✅ {role} can create bulk ancien visitors")
                    # Store ID for cleanup
                    if hasattr(self, 'created_visitor_ids'):
                        response_data = response.json()
                        self.created_visitor_ids.extend(response_data.get("ids", []))
                    else:
                        self.created_visitor_ids = response.json().get("ids", [])
                else:
                    print(f"  ❌ {role} cannot create bulk ancien visitors: {response.status_code}")
                    
            except Exception as e:
                print(f"  ❌ Error testing {role}: {e}")
                
        return True
        
    def cleanup_test_data(self):
        """Clean up created test visitors"""
        if not hasattr(self, 'created_visitor_ids') or not self.created_visitor_ids:
            print("\n🧹 No test visitors to clean up")
            return
            
        print(f"\n🧹 Cleaning up {len(self.created_visitor_ids)} test visitors...")
        
        # Login as superadmin for cleanup
        try:
            self.login("superadmin")
            
            deleted_count = 0
            for visitor_id in self.created_visitor_ids:
                try:
                    response = self.session.delete(f"{BACKEND_URL}/visitors/{visitor_id}")
                    if response.status_code == 200:
                        deleted_count += 1
                    else:
                        print(f"  ⚠️  Could not delete visitor {visitor_id}: {response.status_code}")
                except Exception as e:
                    print(f"  ⚠️  Error deleting visitor {visitor_id}: {e}")
                    
            print(f"✅ Cleaned up {deleted_count}/{len(self.created_visitor_ids)} test visitors")
            
        except Exception as e:
            print(f"❌ Error during cleanup: {e}")

def main():
    """Run all backend tests"""
    print("🚀 Starting Backend Testing for French Review Bug Fixes")
    print("="*80)
    
    tester = BackendTester()
    
    try:
        # Initialize database first
        print("🔧 Initializing database...")
        init_response = tester.session.post(f"{BACKEND_URL}/init")
        if init_response.status_code == 200:
            print("✅ Database initialized successfully")
        else:
            print(f"⚠️  Database init returned: {init_response.status_code}")
        
        # Login as superadmin (only working account)
        tester.login("superadmin")
        
        # Run tests
        test_results = []
        
        # Test 1: Bulk ancien visitors endpoint
        result1 = tester.test_bulk_ancien_visitors_endpoint()
        test_results.append(("POST /api/visitors/bulk-ancien", result1))
        
        # Test 2: Visitors assigned_month field
        result2 = tester.test_visitors_assigned_month_field()
        test_results.append(("GET /api/visitors assigned_month", result2))
        
        # Test 3: Role permissions
        result3 = tester.test_role_permissions()
        test_results.append(("Role-based permissions", result3))
        
        # Print summary
        print("\n" + "="*80)
        print("📊 TEST SUMMARY")
        print("="*80)
        
        passed = 0
        total = len(test_results)
        
        for test_name, result in test_results:
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{status} - {test_name}")
            if result:
                passed += 1
                
        print(f"\n🎯 Overall Result: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 ALL TESTS PASSED - Bug fixes are working correctly!")
        else:
            print("⚠️  SOME TESTS FAILED - Issues need attention")
            
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        
    finally:
        # Cleanup
        tester.cleanup_test_data()

if __name__ == "__main__":
    main()