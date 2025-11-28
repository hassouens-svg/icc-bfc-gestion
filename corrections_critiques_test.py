#!/usr/bin/env python3
"""
Test des 3 corrections critiques - Backend Testing
=================================================

Tests spécifiques pour vérifier les corrections critiques:
1. Filtre Super Admin dans GET /visitors - doit voir TOUS les visiteurs de TOUTES les villes
2. Backend doit supporter le rechargement immédiat des statistiques de culte
3. Vérifier que l'ancien comportement est préservé pour les autres rôles

Credentials disponibles:
- superadmin/superadmin123
- promotions/test123 (Dijon)
- superviseur_promos/superviseur123 (Dijon)
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BACKEND_URL = "https://ministry-hub-32.preview.emergentagent.com/api"

class TestCorrectionsAPI:
    def __init__(self):
        self.session = requests.Session()
        self.tokens = {}
        
    def login(self, username, password, city, department=None):
        """Login and get JWT token"""
        login_data = {
            "username": username,
            "password": password,
            "city": city
        }
        if department:
            login_data["department"] = department
            
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/login", json=login_data)
            if response.status_code == 200:
                data = response.json()
                token = data.get("token")
                if token:
                    self.tokens[username] = token
                    print(f"✅ Login successful for {username} (role: {data.get('user', {}).get('role', 'unknown')})")
                    return token, data.get("user", {})
                else:
                    print(f"❌ Login failed for {username}: No token in response")
                    return None, None
            else:
                print(f"❌ Login failed for {username}: {response.status_code} - {response.text}")
                return None, None
        except Exception as e:
            print(f"❌ Login error for {username}: {str(e)}")
            return None, None
    
    def make_request(self, method, endpoint, token, **kwargs):
        """Make authenticated request"""
        headers = {"Authorization": f"Bearer {token}"}
        if "headers" in kwargs:
            kwargs["headers"].update(headers)
        else:
            kwargs["headers"] = headers
            
        try:
            response = self.session.request(method, f"{BACKEND_URL}{endpoint}", **kwargs)
            return response
        except Exception as e:
            print(f"❌ Request error: {str(e)}")
            return None

def test_1_super_admin_filter():
    """TEST 1: Filtre Super Admin - GET /visitors"""
    print("\n" + "="*60)
    print("TEST 1: Filtre Super Admin - GET /visitors")
    print("Objectif: Vérifier que super_admin voit tous les visiteurs de toutes les villes")
    print("="*60)
    
    api = TestCorrectionsAPI()
    
    # Login avec superadmin
    token, user = api.login("superadmin", "superadmin123", "Dijon")
    if not token:
        print("❌ ÉCHEC: Impossible de se connecter avec superadmin")
        return False
    
    # GET /api/visitors
    print("\n📋 Étape 1: GET /api/visitors avec superadmin...")
    response = api.make_request("GET", "/visitors", token)
    
    if not response or response.status_code != 200:
        print(f"❌ ÉCHEC: GET /visitors failed - Status: {response.status_code if response else 'No response'}")
        if response:
            print(f"Response: {response.text}")
        return False
    
    visitors = response.json()
    print(f"✅ Status 200 - {len(visitors)} visiteurs récupérés")
    
    # Analyser les villes présentes
    cities_found = set()
    for visitor in visitors:
        city = visitor.get("city", "Unknown")
        cities_found.add(city)
    
    print(f"\n📊 Analyse des résultats:")
    print(f"   - Nombre total de visiteurs: {len(visitors)}")
    print(f"   - Villes trouvées: {sorted(list(cities_found))}")
    print(f"   - Nombre de villes différentes: {len(cities_found)}")
    
    # Vérification des critères de succès
    success = True
    
    if len(cities_found) <= 1:
        print("❌ ÉCHEC: Super admin ne voit que des visiteurs d'une seule ville")
        success = False
    else:
        print("✅ SUCCÈS: Super admin voit des visiteurs de plusieurs villes")
    
    if len(visitors) == 0:
        print("❌ ÉCHEC: Aucun visiteur retourné")
        success = False
    
    # Afficher quelques exemples
    if len(visitors) > 0:
        print(f"\n📝 Exemples de visiteurs (premiers 3):")
        for i, visitor in enumerate(visitors[:3]):
            print(f"   {i+1}. {visitor.get('firstname', 'N/A')} {visitor.get('lastname', 'N/A')} - Ville: {visitor.get('city', 'N/A')}")
    
    return success

def test_2_culte_stats_reload():
    """TEST 2: Rechargement des statistiques de culte"""
    print("\n" + "="*60)
    print("TEST 2: Rechargement des statistiques de culte")
    print("Objectif: Vérifier que les statistiques de culte sont bien sauvegardées et récupérées")
    print("="*60)
    
    api = TestCorrectionsAPI()
    
    # Login avec superadmin
    token, user = api.login("superadmin", "superadmin123", "Dijon")
    if not token:
        print("❌ ÉCHEC: Impossible de se connecter avec superadmin")
        return False
    
    # Données de test
    test_data = {
        "date": "2025-01-20",
        "ville": "Dijon",
        "type_culte": "Culte 1",
        "nombre_fideles": 100,
        "nombre_adultes": 70,
        "nombre_enfants": 30,
        "nombre_stars": 15,
        "commentaire": "Test correction bug"
    }
    
    print(f"\n📋 Étape 1: POST /api/culte-stats avec données de test...")
    print(f"   Données: {json.dumps(test_data, indent=2)}")
    
    # POST culte-stats
    response = api.make_request("POST", "/culte-stats", token, json=test_data)
    
    if not response or response.status_code != 200:
        print(f"❌ ÉCHEC: POST /culte-stats failed - Status: {response.status_code if response else 'No response'}")
        if response:
            print(f"Response: {response.text}")
        return False
    
    post_result = response.json()
    stat_id = post_result.get("id")
    print(f"✅ POST réussi - Status 200, ID: {stat_id}")
    
    # Immédiatement après, GET culte-stats
    print(f"\n📋 Étape 2: GET /api/culte-stats?ville=Dijon (immédiatement après)...")
    response = api.make_request("GET", "/culte-stats", token, params={"ville": "Dijon"})
    
    if not response or response.status_code != 200:
        print(f"❌ ÉCHEC: GET /culte-stats failed - Status: {response.status_code if response else 'No response'}")
        if response:
            print(f"Response: {response.text}")
        return False
    
    stats = response.json()
    print(f"✅ GET réussi - Status 200, {len(stats)} statistiques récupérées")
    
    # Vérifier que les données créées sont présentes
    found_stat = None
    for stat in stats:
        if (stat.get("date") == test_data["date"] and 
            stat.get("type_culte") == test_data["type_culte"] and
            stat.get("nombre_fideles") == test_data["nombre_fideles"]):
            found_stat = stat
            break
    
    success = True
    
    if not found_stat:
        print("❌ ÉCHEC: Les données créées ne sont pas trouvées dans la réponse GET")
        success = False
    else:
        print("✅ SUCCÈS: Les données créées sont présentes dans la réponse")
        
        # Vérifier toutes les valeurs
        checks = [
            ("nombre_fideles", test_data["nombre_fideles"], found_stat.get("nombre_fideles")),
            ("nombre_adultes", test_data["nombre_adultes"], found_stat.get("nombre_adultes")),
            ("nombre_enfants", test_data["nombre_enfants"], found_stat.get("nombre_enfants")),
            ("nombre_stars", test_data["nombre_stars"], found_stat.get("nombre_stars")),
            ("commentaire", test_data["commentaire"], found_stat.get("commentaire"))
        ]
        
        print(f"\n📊 Vérification des valeurs:")
        for field, expected, actual in checks:
            if expected == actual:
                print(f"   ✅ {field}: {actual} (correct)")
            else:
                print(f"   ❌ {field}: attendu {expected}, reçu {actual}")
                success = False
    
    return success

def test_3_preserve_old_behavior():
    """TEST 3: Vérifier que l'ancien comportement est préservé"""
    print("\n" + "="*60)
    print("TEST 3: Vérifier que l'ancien comportement est préservé")
    print("Objectif: S'assurer que les autres rôles ne voient que leur ville")
    print("="*60)
    
    api = TestCorrectionsAPI()
    
    # Test avec superviseur_promos
    print(f"\n📋 Test avec superviseur_promos de Dijon...")
    token, user = api.login("superviseur_promos", "superviseur123", "Dijon")
    if not token:
        print("❌ ÉCHEC: Impossible de se connecter avec superviseur_promos")
        return False
    
    # GET /api/visitors
    response = api.make_request("GET", "/visitors", token)
    
    if not response or response.status_code != 200:
        print(f"❌ ÉCHEC: GET /visitors failed - Status: {response.status_code if response else 'No response'}")
        if response:
            print(f"Response: {response.text}")
        return False
    
    visitors = response.json()
    print(f"✅ Status 200 - {len(visitors)} visiteurs récupérés")
    
    # Vérifier que tous les visiteurs sont de Dijon
    non_dijon_visitors = []
    dijon_visitors = []
    
    for visitor in visitors:
        city = visitor.get("city", "Unknown")
        if city != "Dijon":
            non_dijon_visitors.append(visitor)
        else:
            dijon_visitors.append(visitor)
    
    print(f"\n📊 Analyse des résultats:")
    print(f"   - Visiteurs de Dijon: {len(dijon_visitors)}")
    print(f"   - Visiteurs d'autres villes: {len(non_dijon_visitors)}")
    
    success = True
    
    if len(non_dijon_visitors) > 0:
        print("❌ ÉCHEC: Le superviseur voit des visiteurs d'autres villes")
        print("   Visiteurs non-Dijon trouvés:")
        for visitor in non_dijon_visitors[:3]:  # Afficher les 3 premiers
            print(f"     - {visitor.get('firstname', 'N/A')} {visitor.get('lastname', 'N/A')} - Ville: {visitor.get('city', 'N/A')}")
        success = False
    else:
        print("✅ SUCCÈS: Le superviseur ne voit que des visiteurs de Dijon")
    
    if len(dijon_visitors) == 0:
        print("⚠️  ATTENTION: Aucun visiteur de Dijon trouvé")
    
    return success

def main():
    """Exécuter tous les tests"""
    print("🚀 DÉBUT DES TESTS DES 3 CORRECTIONS CRITIQUES")
    print("=" * 80)
    
    results = {}
    
    # Exécuter les tests
    results["test_1"] = test_1_super_admin_filter()
    results["test_2"] = test_2_culte_stats_reload()
    results["test_3"] = test_3_preserve_old_behavior()
    
    # Résumé final
    print("\n" + "="*80)
    print("📊 RÉSUMÉ FINAL DES TESTS")
    print("="*80)
    
    total_tests = len(results)
    passed_tests = sum(1 for result in results.values() if result)
    
    test_names = {
        "test_1": "TEST 1: Filtre Super Admin - GET /visitors",
        "test_2": "TEST 2: Rechargement des statistiques de culte", 
        "test_3": "TEST 3: Préservation ancien comportement"
    }
    
    for test_key, result in results.items():
        status = "✅ PASSÉ" if result else "❌ ÉCHEC"
        print(f"{status} - {test_names[test_key]}")
    
    print(f"\n🎯 RÉSULTAT GLOBAL: {passed_tests}/{total_tests} tests réussis")
    
    if passed_tests == total_tests:
        print("🎉 TOUS LES TESTS SONT PASSÉS - Les corrections critiques fonctionnent correctement!")
        return True
    else:
        print("⚠️  CERTAINS TESTS ONT ÉCHOUÉ - Vérification nécessaire")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)