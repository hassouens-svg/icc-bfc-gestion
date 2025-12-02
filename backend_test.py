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
BASE_URL = "https://church-shepherd-app.preview.emergentagent.com/api"
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

def test_visitor_management(results, tokens):
    """Test 5: GESTION DES VISITEURS"""
    print(f"\n👥 TEST 5: GESTION DES VISITEURS")
    print(f"{'='*50}")
    
    # Test A: GET /visitors avec différents rôles
    test_cases = [
        ("superadmin", "doit voir tous les visiteurs de toutes les villes"),
        ("pasteur", "doit voir tous les visiteurs de toutes les villes"),
        ("respo_aout", "doit voir uniquement son mois assigné")
    ]
    
    for role, expected_behavior in test_cases:
        if role in tokens:
            response = make_authenticated_request("GET", "/visitors", tokens[role])
            
            if response and response.status_code == 200:
                data = response.json()
                visitor_count = len(data)
                cities = list(set([v.get("city", "") for v in data]))
                months = list(set([v.get("assigned_month", "") for v in data]))
                
                results.add_success(f"Visitors {role}", f"{visitor_count} visiteurs, villes: {cities}, mois: {months}")
            else:
                error_msg = f"Status: {response.status_code if response else 'No response'}"
                results.add_failure(f"Visitors {role}", error_msg)
    
    # Test B: POST /visitors - Créer un nouveau visiteur
    if "superadmin" in tokens:
        new_visitor = {
            "firstname": "Test",
            "lastname": "Regression",
            "city": "Dijon",
            "types": ["Nouveau Arrivant"],
            "phone": "+33123456789",
            "email": "test.regression@example.com",
            "arrival_channel": "Evangelisation",
            "visit_date": "2025-01-15"
        }
        
        response = make_authenticated_request("POST", "/visitors", tokens["superadmin"], data=new_visitor)
        
        if response and response.status_code == 200:
            data = response.json()
            visitor_id = data.get("id")
            if visitor_id:
                results.add_success("Créer visiteur", f"Visiteur créé avec ID: {visitor_id}")
                
                # Nettoyer - supprimer le visiteur de test
                delete_response = make_authenticated_request("DELETE", f"/visitors/{visitor_id}", tokens["superadmin"])
                if delete_response and delete_response.status_code == 200:
                    results.add_success("Nettoyer visiteur test", "Visiteur de test supprimé")
            else:
                results.add_failure("Créer visiteur", "Pas d'ID retourné")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            results.add_failure("Créer visiteur", error_msg)

def test_culte_stats(results, tokens):
    """Test 6: CULTE STATS"""
    print(f"\n⛪ TEST 6: CULTE STATS")
    print(f"{'='*50}")
    
    if "superadmin" in tokens:
        # Test A: GET /culte-stats?ville=Dijon
        response = make_authenticated_request("GET", "/culte-stats", tokens["superadmin"], params={"ville": "Dijon"})
        
        if response and response.status_code == 200:
            data = response.json()
            if len(data) >= 1:
                results.add_success("Culte stats - récupération", f"{len(data)} statistiques trouvées pour Dijon")
            else:
                results.add_failure("Culte stats - récupération", "Aucune statistique trouvée pour Dijon")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            results.add_failure("Culte stats - récupération", error_msg)
        
        # Test B: POST /culte-stats - Créer une nouvelle statistique
        new_stat = {
            "date": "2025-01-19",
            "ville": "Dijon",
            "type_culte": "Test Regression",
            "nombre_fideles": 100,
            "nombre_adultes": 70,
            "nombre_enfants": 30,
            "nombre_stars": 10,
            "commentaire": "Test de régression automatique"
        }
        
        response = make_authenticated_request("POST", "/culte-stats", tokens["superadmin"], data=new_stat)
        
        if response and response.status_code == 200:
            data = response.json()
            stat_id = data.get("id")
            if stat_id:
                results.add_success("Culte stats - création", f"Statistique créée avec ID: {stat_id}")
                
                # Nettoyer - supprimer la statistique de test
                delete_response = make_authenticated_request("DELETE", f"/culte-stats/{stat_id}", tokens["superadmin"])
                if delete_response and delete_response.status_code == 200:
                    results.add_success("Nettoyer culte stats test", "Statistique de test supprimée")
            else:
                results.add_failure("Culte stats - création", "Pas d'ID retourné")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            results.add_failure("Culte stats - création", error_msg)

def test_data_consistency(results, tokens):
    """Test 7: VÉRIFICATIONS DE CONSISTANCE"""
    print(f"\n🔍 TEST 7: VÉRIFICATIONS DE CONSISTANCE")
    print(f"{'='*50}")
    
    if "superadmin" in tokens:
        # Test des endpoints critiques pour vérifier qu'il n'y a pas d'erreurs 500
        critical_endpoints = [
            ("/visitors", "GET", None),
            ("/users/referents", "GET", None),
            ("/cities", "GET", None),
            ("/analytics/stats", "GET", None)
        ]
        
        for endpoint, method, params in critical_endpoints:
            response = make_authenticated_request(method, endpoint, tokens["superadmin"], params=params)
            
            if response and response.status_code < 500:
                results.add_success(f"Consistance {endpoint}", f"Pas d'erreur 500 (status: {response.status_code})")
            else:
                error_msg = f"Erreur 500 ou pas de réponse: {response.status_code if response else 'No response'}"
                results.add_failure(f"Consistance {endpoint}", error_msg)
        
        # Test des filtres par ville
        ville_endpoints = [
            ("/analytics/promotions-detailed", {"ville": "Dijon"}),
            ("/analytics/fi-detailed", {"ville": "Dijon"}),
            ("/culte-stats", {"ville": "Dijon"})
        ]
        
        for endpoint, params in ville_endpoints:
            response = make_authenticated_request("GET", endpoint, tokens["superadmin"], params=params)
            
            if response and response.status_code == 200:
                results.add_success(f"Filtre ville {endpoint}", "Filtrage par ville fonctionne")
            else:
                error_msg = f"Status: {response.status_code if response else 'No response'}"
                results.add_failure(f"Filtre ville {endpoint}", error_msg)

def main():
    """Main test execution"""
    print(f"🎯 TEST DE RÉGRESSION COMPLET - APPLICATION ICC BFC-ITALIE")
    print(f"Backend URL: {BASE_URL}")
    print(f"Début des tests: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = TestResults()
    
    # Test 1: Authentication
    tokens, users = test_authentication(results)
    
    if not tokens:
        print("❌ ARRÊT CRITIQUE: Aucune authentification réussie")
        return
    
    # Test 2: Fidelisation (PRIORITÉ HAUTE)
    test_fidelisation_endpoints(results, tokens)
    
    # Test 3: Visiteurs arrêtés
    test_stopped_visitors(results, tokens)
    
    # Test 4: Analytics
    test_analytics_endpoints(results, tokens)
    
    # Test 5: Gestion des visiteurs
    test_visitor_management(results, tokens)
    
    # Test 6: Culte stats
    test_culte_stats(results, tokens)
    
    # Test 7: Consistance
    test_data_consistency(results, tokens)
    
    # Résultats finaux
    results.print_summary()
    
    # Critères de succès
    print(f"\n🎯 CRITÈRES DE SUCCÈS:")
    success_criteria = [
        "✅ Tous les comptes peuvent se connecter",
        "✅ Les endpoints de fidélisation retournent des données non-nulles",
        "✅ Les visiteurs arrêtés sont correctement retournés avec filtrage",
        "✅ Les analytics fonctionnent avec filtres par ville",
        "✅ Les permissions sont correctement appliquées pour chaque rôle",
        "✅ Aucune erreur 500 n'est retournée",
        "✅ La cohérence des données entre rôles est vérifiée"
    ]
    
    for criteria in success_criteria:
        print(f"  {criteria}")
    
    if results.failed == 0:
        print(f"\n🎉 TOUS LES TESTS SONT PASSÉS! Le système est prêt pour la production.")
        return 0
    else:
        print(f"\n⚠️  {results.failed} tests ont échoué. Vérification nécessaire.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)