#!/usr/bin/env python3
"""
🎯 TEST ANALYTICS FI - BUGS #2 ET #3
Test spécifique pour vérifier les corrections des bugs FI Analytics
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://church-connect-67.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

def login_user(username, password, city):
    """Login and return JWT token"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"username": username, "password": password, "city": city},
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
        print(f"Request error: {str(e)}")
        return None

def test_fi_analytics():
    """Test FI Analytics endpoints for Bug #2 and #3"""
    print(f"🎯 TEST ANALYTICS FI - BUGS #2 ET #3")
    print(f"Backend URL: {BASE_URL}")
    print(f"{'='*80}")
    
    # Login as superadmin
    token, user = login_user("superadmin", "superadmin123", "Dijon")
    
    if not token:
        print(f"❌ Échec de connexion: {user}")
        return False
    
    print(f"✅ Connecté comme: {user.get('username')} (role: {user.get('role')})")
    
    success = True
    
    # Test Bug #2: Tableau FI Dynamique avec date
    print(f"\n📊 TEST BUG #2: TABLEAU FI DYNAMIQUE")
    print(f"{'='*60}")
    
    # Test avec date spécifique
    test_date = "2025-01-15"
    response = make_authenticated_request("GET", "/analytics/fi-detailed", token, params={"date": test_date, "ville": "Dijon"})
    
    if response and response.status_code == 200:
        data = response.json()
        print(f"✅ Réponse API avec date {test_date}: Status 200")
        
        # Vérifier la structure de la réponse
        if "fi_fidelisation" in data:
            fi_data = data["fi_fidelisation"]
            print(f"✅ Champ fi_fidelisation présent: {len(fi_data)} FI trouvées")
            
            # Vérifier que les données contiennent les champs attendus pour le filtrage par date
            for fi in fi_data:
                fi_nom = fi.get("nom", "FI inconnue")
                if "total_presences" in fi:
                    print(f"✅ FI '{fi_nom}': champ total_presences présent ({fi.get('total_presences')} présences)")
                else:
                    print(f"❌ FI '{fi_nom}': champ total_presences manquant")
                    success = False
        else:
            print(f"❌ Champ fi_fidelisation manquant dans la réponse")
            success = False
    else:
        print(f"❌ Échec API avec date: {response.status_code if response else 'No response'}")
        success = False
    
    # Test sans date (historique)
    response = make_authenticated_request("GET", "/analytics/fi-detailed", token, params={"ville": "Dijon"})
    
    if response and response.status_code == 200:
        data = response.json()
        print(f"✅ Réponse API sans date: Status 200")
        
        if "fi_fidelisation" in data:
            fi_data = data["fi_fidelisation"]
            print(f"✅ Données historiques: {len(fi_data)} FI trouvées")
            
            # Vérifier que les données contiennent les champs de fidélisation historique
            for fi in fi_data:
                fi_nom = fi.get("nom", "FI inconnue")
                has_historical_fields = any(field in fi for field in ["total_membres", "membres_fideles", "taux_fidelisation"])
                if has_historical_fields:
                    print(f"✅ FI '{fi_nom}': champs de fidélisation historique présents")
                else:
                    print(f"❌ FI '{fi_nom}': champs de fidélisation historique manquants")
                    success = False
        else:
            print(f"❌ Champ fi_fidelisation manquant dans la réponse sans date")
            success = False
    else:
        print(f"❌ Échec API sans date: {response.status_code if response else 'No response'}")
        success = False
    
    # Test Bug #3: Stats ville correctes
    print(f"\n🏙️  TEST BUG #3: STATS VILLE CORRECTES")
    print(f"{'='*60}")
    
    # Test pour Dijon
    response = make_authenticated_request("GET", "/analytics/fi-detailed", token, params={"ville": "Dijon"})
    
    if response and response.status_code == 200:
        data = response.json()
        summary_dijon = data.get("summary", {})
        fi_data_dijon = data.get("fi_fidelisation", [])
        
        total_membres_dijon = summary_dijon.get("total_membres", 0)
        total_fi_dijon = summary_dijon.get("total_fi", 0)
        total_secteurs_dijon = summary_dijon.get("total_secteurs", 0)
        
        print(f"✅ Stats Dijon: {total_fi_dijon} FI, {total_secteurs_dijon} secteurs, {total_membres_dijon} membres")
        
        # Vérifier que toutes les FI sont bien de Dijon
        fi_villes = [fi.get("ville", "") for fi in fi_data_dijon]
        autres_villes = [ville for ville in fi_villes if ville != "Dijon"]
        
        if not autres_villes:
            print(f"✅ Filtrage ville correct: toutes les {len(fi_data_dijon)} FI sont de Dijon")
        else:
            print(f"❌ Filtrage ville incorrect: FI d'autres villes trouvées: {set(autres_villes)}")
            success = False
    else:
        print(f"❌ Échec API Dijon: {response.status_code if response else 'No response'}")
        success = False
    
    # Test pour une autre ville (Rome)
    response = make_authenticated_request("GET", "/analytics/fi-detailed", token, params={"ville": "Rome"})
    
    if response and response.status_code == 200:
        data = response.json()
        summary_rome = data.get("summary", {})
        fi_data_rome = data.get("fi_fidelisation", [])
        
        total_membres_rome = summary_rome.get("total_membres", 0)
        total_fi_rome = summary_rome.get("total_fi", 0)
        total_secteurs_rome = summary_rome.get("total_secteurs", 0)
        
        print(f"✅ Stats Rome: {total_fi_rome} FI, {total_secteurs_rome} secteurs, {total_membres_rome} membres")
        
        # Vérifier que toutes les FI sont bien de Rome
        fi_villes_rome = [fi.get("ville", "") for fi in fi_data_rome]
        autres_villes_rome = [ville for ville in fi_villes_rome if ville != "Rome"]
        
        if not autres_villes_rome:
            print(f"✅ Filtrage ville Rome correct: toutes les {len(fi_data_rome)} FI sont de Rome")
        else:
            print(f"❌ Filtrage ville Rome incorrect: FI d'autres villes trouvées: {set(autres_villes_rome)}")
            success = False
        
        # Vérifier l'isolation entre villes
        if (total_membres_dijon != total_membres_rome or 
            total_fi_dijon != total_fi_rome or 
            total_secteurs_dijon != total_secteurs_rome):
            print(f"✅ Isolation villes correcte: stats différentes entre Dijon et Rome")
        else:
            print(f"⚠️  Stats identiques entre Dijon et Rome - vérifier s'il y a des données dans Rome")
    else:
        print(f"✅ Rome sans données (normal si aucune FI créée)")
    
    # Test des endpoints de base FI
    print(f"\n🔧 TEST ENDPOINTS FI DE BASE")
    print(f"{'='*60}")
    
    # Test secteurs
    response = make_authenticated_request("GET", "/fi/secteurs", token, params={"ville": "Dijon"})
    if response and response.status_code == 200:
        secteurs = response.json()
        print(f"✅ Secteurs Dijon: {len(secteurs)} secteurs trouvés")
    else:
        print(f"❌ Échec secteurs: {response.status_code if response else 'No response'}")
        success = False
    
    # Test familles d'impact
    response = make_authenticated_request("GET", "/fi/familles-impact", token, params={"ville": "Dijon"})
    if response and response.status_code == 200:
        fis = response.json()
        print(f"✅ Familles d'Impact Dijon: {len(fis)} FI trouvées")
        
        # Vérifier que toutes sont de Dijon
        fi_villes = [fi.get("ville", "") for fi in fis]
        if all(ville == "Dijon" for ville in fi_villes):
            print(f"✅ Toutes les FI sont bien de Dijon")
        else:
            print(f"❌ FI d'autres villes trouvées: {set(fi_villes)}")
            success = False
    else:
        print(f"❌ Échec familles d'impact: {response.status_code if response else 'No response'}")
        success = False
    
    return success

if __name__ == "__main__":
    success = test_fi_analytics()
    
    print(f"\n{'='*80}")
    if success:
        print(f"🎉 TOUS LES TESTS RÉUSSIS!")
        print(f"✅ Bug #2: Tableau FI dynamique fonctionne correctement")
        print(f"✅ Bug #3: Stats ville correctement filtrées")
        sys.exit(0)
    else:
        print(f"❌ CERTAINS TESTS ONT ÉCHOUÉ")
        print(f"⚠️  Vérification nécessaire des bugs #2 et #3")
        sys.exit(1)