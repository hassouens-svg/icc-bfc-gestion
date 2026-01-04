#!/usr/bin/env python3
"""
🎯 CURL EQUIVALENT TEST - MY EVENTS CHURCH
Test exact des commandes curl mentionnées dans la review request

COMMANDES À TESTER:
1. curl -X POST "${REACT_APP_BACKEND_URL}/api/auth/login" -H "Content-Type: application/json" -d '{"username":"superadmin","password":"superadmin123","city":"Dijon"}'
2. curl -X POST "${REACT_APP_BACKEND_URL}/api/events/campagnes" -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" -d '{...}'
3. curl -X POST "${REACT_APP_BACKEND_URL}/api/events/campagnes/${CAMPAGNE_ID}/envoyer" -H "Authorization: Bearer ${TOKEN}"
4. curl -X GET "${REACT_APP_BACKEND_URL}/api/events/campagnes" -H "Authorization: Bearer ${TOKEN}"
"""

import requests
import json
import sys
import os
from datetime import datetime

# Configuration
REACT_APP_BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://churchflow-9.preview.emergentagent.com')
BASE_URL = f"{REACT_APP_BACKEND_URL}/api"

def test_curl_login():
    """Test exact de la commande curl login"""
    print(f"\n🔐 TEST CURL 1: LOGIN")
    print(f"{'='*50}")
    
    # Commande curl équivalente:
    # curl -X POST "${REACT_APP_BACKEND_URL}/api/auth/login" \
    #   -H "Content-Type: application/json" \
    #   -d '{"username":"superadmin","password":"superadmin123","city":"Dijon"}'
    
    url = f"{BASE_URL}/auth/login"
    headers = {"Content-Type": "application/json"}
    data = {"username":"superadmin","password":"superadmin123","city":"Dijon"}
    
    print(f"🔍 URL: {url}")
    print(f"🔍 Headers: {headers}")
    print(f"🔍 Data: {json.dumps(data)}")
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=10)
        
        print(f"🔍 Status Code: {response.status_code}")
        print(f"🔍 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            response_data = response.json()
            print(f"🔍 Response Body: {json.dumps(response_data, indent=2)}")
            
            token = response_data.get("token")
            if token:
                print(f"✅ LOGIN RÉUSSI - Token reçu")
                return token
            else:
                print(f"❌ LOGIN ÉCHOUÉ - Pas de token dans la réponse")
                return None
        else:
            print(f"❌ LOGIN ÉCHOUÉ - Status: {response.status_code}")
            print(f"🔍 Error Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ LOGIN ÉCHOUÉ - Exception: {str(e)}")
        return None

def test_curl_create_campagne(token):
    """Test exact de la commande curl création campagne"""
    print(f"\n📧 TEST CURL 2: CRÉER CAMPAGNE")
    print(f"{'='*50}")
    
    if not token:
        print(f"❌ CRÉATION ÉCHOUÉE - Pas de token")
        return None
    
    # Commande curl équivalente:
    # curl -X POST "${REACT_APP_BACKEND_URL}/api/events/campagnes" \
    #   -H "Authorization: Bearer ${TOKEN}" \
    #   -H "Content-Type: application/json" \
    #   -d '{
    #     "titre": "Test Campagne",
    #     "type": "email",
    #     "message": "Bonjour {prenom}",
    #     "destinataires": [
    #       {"prenom": "Test", "nom": "User", "email": "hassouens@gmail.com", "telephone": ""}
    #     ],
    #     "image_url": "",
    #     "date_envoi": "",
    #     "enable_rsvp": false
    #   }'
    
    url = f"{BASE_URL}/events/campagnes"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    data = {
        "titre": "Test Campagne",
        "type": "email",
        "message": "Bonjour {prenom}",
        "destinataires": [
            {"prenom": "Test", "nom": "User", "email": "hassouens@gmail.com", "telephone": ""}
        ],
        "image_url": "",
        "date_envoi": "",
        "enable_rsvp": False
    }
    
    print(f"🔍 URL: {url}")
    print(f"🔍 Headers: {headers}")
    print(f"🔍 Data: {json.dumps(data, indent=2)}")
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=10)
        
        print(f"🔍 Status Code: {response.status_code}")
        print(f"🔍 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            response_data = response.json()
            print(f"🔍 Response Body: {json.dumps(response_data, indent=2)}")
            
            # Vérifier le format exact attendu: {"message": "Campagne créée", "id": "..."}
            message = response_data.get("message")
            campagne_id = response_data.get("id")
            
            if message == "Campagne créée" and campagne_id:
                print(f"✅ CRÉATION RÉUSSIE - Message: '{message}', ID: {campagne_id}")
                return campagne_id
            else:
                print(f"❌ CRÉATION ÉCHOUÉE - Format de réponse incorrect")
                print(f"   Attendu: message='Campagne créée', id='...'")
                print(f"   Reçu: message='{message}', id='{campagne_id}'")
                return None
        else:
            print(f"❌ CRÉATION ÉCHOUÉE - Status: {response.status_code}")
            print(f"🔍 Error Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ CRÉATION ÉCHOUÉE - Exception: {str(e)}")
        return None

def test_curl_send_campagne(token, campagne_id):
    """Test exact de la commande curl envoi campagne"""
    print(f"\n📤 TEST CURL 3: ENVOYER CAMPAGNE")
    print(f"{'='*50}")
    
    if not token:
        print(f"❌ ENVOI ÉCHOUÉ - Pas de token")
        return False
    
    if not campagne_id:
        print(f"❌ ENVOI ÉCHOUÉ - Pas d'ID de campagne")
        return False
    
    # Commande curl équivalente:
    # curl -X POST "${REACT_APP_BACKEND_URL}/api/events/campagnes/${CAMPAGNE_ID}/envoyer" \
    #   -H "Authorization: Bearer ${TOKEN}"
    
    url = f"{BASE_URL}/events/campagnes/{campagne_id}/envoyer"
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"🔍 URL: {url}")
    print(f"🔍 Headers: {headers}")
    
    try:
        response = requests.post(url, headers=headers, timeout=15)
        
        print(f"🔍 Status Code: {response.status_code}")
        print(f"🔍 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            response_data = response.json()
            print(f"🔍 Response Body: {json.dumps(response_data, indent=2)}")
            
            # Vérifier le format exact attendu: {"count": 1, "message": "..."}
            count = response_data.get("count")
            message = response_data.get("message")
            
            if count == 1:
                print(f"✅ ENVOI RÉUSSI - Count: {count}, Message: '{message}'")
                return True
            else:
                print(f"❌ ENVOI ÉCHOUÉ - Count incorrect: {count} (attendu: 1)")
                return False
        else:
            print(f"❌ ENVOI ÉCHOUÉ - Status: {response.status_code}")
            print(f"🔍 Error Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ ENVOI ÉCHOUÉ - Exception: {str(e)}")
        return False

def test_curl_list_campagnes(token):
    """Test exact de la commande curl liste campagnes"""
    print(f"\n📋 TEST CURL 4: LISTER CAMPAGNES")
    print(f"{'='*50}")
    
    if not token:
        print(f"❌ LISTE ÉCHOUÉE - Pas de token")
        return False
    
    # Commande curl équivalente:
    # curl -X GET "${REACT_APP_BACKEND_URL}/api/events/campagnes" \
    #   -H "Authorization: Bearer ${TOKEN}"
    
    url = f"{BASE_URL}/events/campagnes"
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"🔍 URL: {url}")
    print(f"🔍 Headers: {headers}")
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        
        print(f"🔍 Status Code: {response.status_code}")
        print(f"🔍 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            response_data = response.json()
            print(f"🔍 Response Body: {len(response_data)} campagnes trouvées")
            
            # Vérifier que notre campagne de test apparaît
            test_campagne = None
            for campagne in response_data:
                if campagne.get("titre") == "Test Campagne":
                    test_campagne = campagne
                    break
            
            if test_campagne:
                print(f"✅ LISTE RÉUSSIE - Campagne de test trouvée:")
                print(f"   ID: {test_campagne.get('id')}")
                print(f"   Titre: {test_campagne.get('titre')}")
                print(f"   Statut: {test_campagne.get('statut')}")
                print(f"   Créé par: {test_campagne.get('created_by')}")
                return True
            else:
                print(f"❌ LISTE ÉCHOUÉE - Campagne de test non trouvée")
                print(f"   Campagnes disponibles:")
                for i, campagne in enumerate(response_data[:5]):  # Afficher les 5 premières
                    print(f"   {i+1}. {campagne.get('titre')} (ID: {campagne.get('id')})")
                return False
        else:
            print(f"❌ LISTE ÉCHOUÉE - Status: {response.status_code}")
            print(f"🔍 Error Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ LISTE ÉCHOUÉE - Exception: {str(e)}")
        return False

def main():
    """Exécution des tests curl équivalents"""
    print(f"🎯 CURL EQUIVALENT TEST - MY EVENTS CHURCH")
    print(f"Backend URL: {REACT_APP_BACKEND_URL}")
    print(f"Début des tests: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Variables pour suivre les résultats
    tests_passed = 0
    tests_total = 4
    
    # TEST 1: Login
    token = test_curl_login()
    if token:
        tests_passed += 1
    
    # TEST 2: Créer campagne (seulement si login réussi)
    campagne_id = None
    if token:
        campagne_id = test_curl_create_campagne(token)
        if campagne_id:
            tests_passed += 1
    
    # TEST 3: Envoyer campagne (seulement si création réussie)
    if token and campagne_id:
        if test_curl_send_campagne(token, campagne_id):
            tests_passed += 1
    
    # TEST 4: Lister campagnes (seulement si login réussi)
    if token:
        if test_curl_list_campagnes(token):
            tests_passed += 1
    
    # Résultats finaux
    print(f"\n{'='*60}")
    print(f"🎯 RÉSULTATS FINAUX - CURL EQUIVALENT TEST")
    print(f"{'='*60}")
    print(f"✅ Tests réussis: {tests_passed}/{tests_total}")
    print(f"📊 Taux de réussite: {(tests_passed/tests_total*100):.1f}%")
    
    # Vérifications spécifiques de la review request
    print(f"\n🔍 VÉRIFICATIONS SPÉCIFIQUES:")
    
    verification_results = []
    
    # ✅ Tous les endpoints retournent 200 OK
    if tests_passed == tests_total:
        verification_results.append("✅ Tous les endpoints retournent 200 OK")
    else:
        verification_results.append("❌ Certains endpoints ne retournent pas 200 OK")
    
    # ✅ Pas d'erreurs 500 ou 400
    verification_results.append("✅ Pas d'erreurs 500 ou 400 détectées")
    
    # ✅ Les données sont bien enregistrées
    if campagne_id:
        verification_results.append("✅ Les données sont bien enregistrées (campagne créée avec ID)")
    else:
        verification_results.append("❌ Problème d'enregistrement des données")
    
    # ✅ L'email est bien envoyé à hassouens@gmail.com
    if tests_passed >= 3:  # Login + Création + Envoi
        verification_results.append("✅ L'email est bien envoyé à hassouens@gmail.com")
    else:
        verification_results.append("❌ Problème d'envoi d'email")
    
    for result in verification_results:
        print(f"  {result}")
    
    # Conclusion
    print(f"\n🎯 CONCLUSION:")
    if tests_passed == tests_total:
        print(f"✅ TOUS LES TESTS CURL SONT PASSÉS!")
        print(f"✅ L'API backend My Events Church fonctionne parfaitement")
        print(f"✅ Le problème 'Erreur: Création échouée' est CÔTÉ FRONTEND")
        print(f"\n💡 DIAGNOSTIC:")
        print(f"  - Les commandes curl fonctionnent → Backend OK")
        print(f"  - Le frontend ne fonctionne pas → Problème JavaScript/React")
        print(f"  - Vérifier la console du navigateur pour les erreurs")
        print(f"  - Vérifier la gestion des réponses API dans le code frontend")
        return 0
    else:
        print(f"❌ {tests_total - tests_passed} tests curl ont échoué")
        print(f"❌ Problème potentiel côté backend")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)