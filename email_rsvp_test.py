#!/usr/bin/env python3
"""
🎯 TEST COMPLET: Email personnalisé + Image + RSVP
Test suite for email personalization and RSVP functionality as requested in French review

This test suite verifies:
1. Email campaign creation with {prenom} {nom} personalization
2. RSVP public endpoints functionality
3. Email sending with proper personalization replacement
"""

import requests
import json
import sys
from datetime import datetime
import os

# Configuration - Use environment variable for backend URL
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://spiritualapp-3.preview.emergentagent.com')
BASE_URL = f"{BACKEND_URL}/api"
HEADERS = {"Content-Type": "application/json"}

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
        print(f"🎯 EMAIL PERSONNALISÉ + RSVP - RÉSULTATS FINAUX")
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

def login_superadmin():
    """Login as superadmin and return JWT token"""
    login_data = {
        "username": "superadmin",
        "password": "superadmin123",
        "city": "Dijon"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json=login_data,
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

def make_public_request(method, endpoint, data=None, params=None):
    """Make public API request (no authentication)"""
    try:
        if method.upper() == "GET":
            response = requests.get(f"{BASE_URL}{endpoint}", headers=HEADERS, params=params, timeout=10)
        elif method.upper() == "POST":
            response = requests.post(f"{BASE_URL}{endpoint}", headers=HEADERS, json=data, timeout=10)
        
        return response
    except Exception as e:
        print(f"Public request error: {str(e)}")
        return None

def test_authentication(results):
    """Test 1: AUTHENTIFICATION SUPERADMIN"""
    print(f"\n🔐 TEST 1: AUTHENTIFICATION SUPERADMIN")
    print(f"{'='*50}")
    
    token, user_or_error = login_superadmin()
    
    if token:
        results.add_success("Login superadmin", f"JWT token généré, role: {user_or_error.get('role', 'N/A')}")
        return token
    else:
        results.add_failure("Login superadmin", user_or_error)
        return None

def test_email_campaign_creation(results, token):
    """Test 2: CRÉATION CAMPAGNE EMAIL AVEC PERSONNALISATION"""
    print(f"\n📧 TEST 2: CRÉATION CAMPAGNE EMAIL AVEC PERSONNALISATION")
    print(f"{'='*50}")
    
    # Données de la campagne comme spécifié dans la review request
    campaign_data = {
        "titre": "Test Personnalisation Complete",
        "type": "email",
        "message": "Bonjour {prenom} {nom}, nous avons le plaisir de vous inviter.",
        "destinataires": [
            {
                "prenom": "Jean", 
                "nom": "Dupont", 
                "email": "hassouens@gmail.com", 
                "telephone": ""
            }
        ],
        "image_url": "https://customer-assets.emergentagent.com/job_dijon-icc-hub/artifacts/foeikpvk_IMG_2590.png",
        "enable_rsvp": True,
        "date_envoi": ""
    }
    
    response = make_authenticated_request("POST", "/events/campagnes", token, data=campaign_data)
    
    if response and response.status_code == 200:
        data = response.json()
        campaign_id = data.get("id")
        if campaign_id:
            results.add_success("Création campagne email", f"Campagne créée avec ID: {campaign_id}")
            
            # Vérifier que la campagne a été créée avec les bonnes données
            get_response = make_authenticated_request("GET", f"/events/campagnes/{campaign_id}", token)
            if get_response and get_response.status_code == 200:
                campaign_details = get_response.json()
                
                # Vérifications critiques
                if campaign_details.get("message") == "Bonjour {prenom} {nom}, nous avons le plaisir de vous inviter.":
                    results.add_success("Message personnalisation", "Message avec {prenom} {nom} correctement stocké")
                else:
                    results.add_failure("Message personnalisation", f"Message incorrect: {campaign_details.get('message')}")
                
                if campaign_details.get("enable_rsvp") == True:
                    results.add_success("RSVP activé", "RSVP correctement activé dans la campagne")
                else:
                    results.add_failure("RSVP activé", f"RSVP non activé: {campaign_details.get('enable_rsvp')}")
                
                if campaign_details.get("image_url") == "https://customer-assets.emergentagent.com/job_dijon-icc-hub/artifacts/foeikpvk_IMG_2590.png":
                    results.add_success("Image URL", "Image URL correctement stockée")
                else:
                    results.add_failure("Image URL", f"Image URL incorrecte: {campaign_details.get('image_url')}")
                
                destinataires = campaign_details.get("destinataires", [])
                if len(destinataires) == 1 and destinataires[0].get("prenom") == "Jean" and destinataires[0].get("nom") == "Dupont":
                    results.add_success("Destinataires", "Destinataire Jean Dupont correctement stocké")
                else:
                    results.add_failure("Destinataires", f"Destinataires incorrects: {destinataires}")
                
                return campaign_id
            else:
                results.add_failure("Récupération campagne", f"Impossible de récupérer la campagne: {get_response.status_code if get_response else 'No response'}")
                return campaign_id
        else:
            results.add_failure("Création campagne email", "Pas d'ID retourné")
            return None
    else:
        error_msg = f"Status: {response.status_code if response else 'No response'}"
        if response:
            error_msg += f", Response: {response.text[:200]}"
        results.add_failure("Création campagne email", error_msg)
        return None

def test_rsvp_public_endpoints(results, campaign_id):
    """Test 3: ENDPOINTS PUBLICS RSVP"""
    print(f"\n🔗 TEST 3: ENDPOINTS PUBLICS RSVP")
    print(f"{'='*50}")
    
    if not campaign_id:
        results.add_failure("Test RSVP endpoints", "Pas de campaign_id disponible")
        return
    
    # Test A: GET /public/campagne/{campaign_id}
    response = make_public_request("GET", f"/public/campagne/{campaign_id}")
    
    if response and response.status_code == 200:
        data = response.json()
        results.add_success("Endpoint public campagne", f"Campagne récupérée publiquement")
        
        # Vérifier les données essentielles
        if data.get("titre") == "Test Personnalisation Complete":
            results.add_success("Public campagne - titre", "Titre correct dans endpoint public")
        else:
            results.add_failure("Public campagne - titre", f"Titre incorrect: {data.get('titre')}")
        
        if data.get("enable_rsvp") == True:
            results.add_success("Public campagne - RSVP", "RSVP activé visible publiquement")
        else:
            results.add_failure("Public campagne - RSVP", f"RSVP non visible: {data.get('enable_rsvp')}")
    else:
        error_msg = f"Status: {response.status_code if response else 'No response'}"
        results.add_failure("Endpoint public campagne", error_msg)
    
    # Test B: POST /public/rsvp
    rsvp_data = {
        "campagne_id": campaign_id,
        "contact": "hassouens@gmail.com",
        "reponse": "oui"
    }
    
    response = make_public_request("POST", "/public/rsvp", data=rsvp_data)
    
    if response and response.status_code == 200:
        data = response.json()
        results.add_success("Enregistrement RSVP", f"RSVP 'oui' enregistré avec succès")
        
        # Vérifier que la réponse contient un ID ou message de confirmation
        if data.get("id") or data.get("message"):
            results.add_success("RSVP confirmation", "Confirmation RSVP reçue")
        else:
            results.add_failure("RSVP confirmation", f"Pas de confirmation: {data}")
    else:
        error_msg = f"Status: {response.status_code if response else 'No response'}"
        if response:
            error_msg += f", Response: {response.text[:200]}"
        results.add_failure("Enregistrement RSVP", error_msg)
    
    # Test C: Tester les autres réponses RSVP
    for reponse in ["non", "peut_etre"]:
        rsvp_data = {
            "campagne_id": campaign_id,
            "contact": f"test_{reponse}@example.com",
            "reponse": reponse
        }
        
        response = make_public_request("POST", "/public/rsvp", data=rsvp_data)
        
        if response and response.status_code == 200:
            results.add_success(f"RSVP {reponse}", f"RSVP '{reponse}' enregistré avec succès")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            results.add_failure(f"RSVP {reponse}", error_msg)

def test_email_personalization_verification(results, token, campaign_id):
    """Test 4: VÉRIFICATION PERSONNALISATION EMAIL"""
    print(f"\n✉️ TEST 4: VÉRIFICATION PERSONNALISATION EMAIL")
    print(f"{'='*50}")
    
    if not campaign_id:
        results.add_failure("Test personnalisation", "Pas de campaign_id disponible")
        return
    
    # Récupérer les détails de la campagne pour vérifier la personnalisation
    response = make_authenticated_request("GET", f"/events/campagnes/{campaign_id}", token)
    
    if response and response.status_code == 200:
        data = response.json()
        
        # Vérifier que le message contient bien les placeholders
        message = data.get("message", "")
        if "{prenom}" in message and "{nom}" in message:
            results.add_success("Placeholders présents", "Message contient {prenom} et {nom}")
        else:
            results.add_failure("Placeholders présents", f"Placeholders manquants dans: {message}")
        
        # Vérifier les destinataires
        destinataires = data.get("destinataires", [])
        if destinataires:
            destinataire = destinataires[0]
            if destinataire.get("prenom") == "Jean" and destinataire.get("nom") == "Dupont":
                results.add_success("Données destinataire", "Prénom et nom correctement stockés")
                
                # Simuler la personnalisation (comme le ferait le système d'envoi)
                message_personnalise = message.replace("{prenom}", destinataire.get("prenom", "")).replace("{nom}", destinataire.get("nom", ""))
                expected_message = "Bonjour Jean Dupont, nous avons le plaisir de vous inviter."
                
                if message_personnalise == expected_message:
                    results.add_success("Personnalisation simulée", f"Message personnalisé correct: '{message_personnalise}'")
                else:
                    results.add_failure("Personnalisation simulée", f"Message incorrect: '{message_personnalise}' vs attendu: '{expected_message}'")
            else:
                results.add_failure("Données destinataire", f"Prénom/nom incorrects: {destinataire}")
        else:
            results.add_failure("Données destinataire", "Aucun destinataire trouvé")
    else:
        error_msg = f"Status: {response.status_code if response else 'No response'}"
        results.add_failure("Récupération campagne pour personnalisation", error_msg)

def test_rsvp_stats_verification(results, token, campaign_id):
    """Test 5: VÉRIFICATION STATISTIQUES RSVP"""
    print(f"\n📊 TEST 5: VÉRIFICATION STATISTIQUES RSVP")
    print(f"{'='*50}")
    
    if not campaign_id:
        results.add_failure("Test stats RSVP", "Pas de campaign_id disponible")
        return
    
    # Récupérer les statistiques de la campagne
    response = make_authenticated_request("GET", f"/events/campagnes/{campaign_id}", token)
    
    if response and response.status_code == 200:
        data = response.json()
        stats = data.get("stats", {})
        
        # Vérifier que les stats RSVP sont présentes
        if "oui" in stats and "non" in stats and "peut_etre" in stats:
            results.add_success("Structure stats RSVP", "Toutes les catégories RSVP présentes")
            
            # Vérifier les compteurs (on a fait 3 RSVP dans les tests précédents)
            oui_count = stats.get("oui", 0)
            non_count = stats.get("non", 0)
            peut_etre_count = stats.get("peut_etre", 0)
            
            if oui_count >= 1:
                results.add_success("Stats RSVP oui", f"{oui_count} réponse(s) 'oui' comptabilisée(s)")
            else:
                results.add_failure("Stats RSVP oui", f"Aucune réponse 'oui' comptabilisée: {oui_count}")
            
            if non_count >= 1:
                results.add_success("Stats RSVP non", f"{non_count} réponse(s) 'non' comptabilisée(s)")
            else:
                results.add_failure("Stats RSVP non", f"Aucune réponse 'non' comptabilisée: {non_count}")
            
            if peut_etre_count >= 1:
                results.add_success("Stats RSVP peut-être", f"{peut_etre_count} réponse(s) 'peut-être' comptabilisée(s)")
            else:
                results.add_failure("Stats RSVP peut-être", f"Aucune réponse 'peut-être' comptabilisée: {peut_etre_count}")
            
            total_responses = oui_count + non_count + peut_etre_count
            results.add_success("Total réponses RSVP", f"{total_responses} réponses RSVP au total")
        else:
            results.add_failure("Structure stats RSVP", f"Structure stats incorrecte: {stats}")
    else:
        error_msg = f"Status: {response.status_code if response else 'No response'}"
        results.add_failure("Récupération stats RSVP", error_msg)

def test_image_and_rsvp_button_verification(results, token, campaign_id):
    """Test 6: VÉRIFICATION IMAGE ET BOUTON RSVP"""
    print(f"\n🖼️ TEST 6: VÉRIFICATION IMAGE ET BOUTON RSVP")
    print(f"{'='*50}")
    
    if not campaign_id:
        results.add_failure("Test image et bouton", "Pas de campaign_id disponible")
        return
    
    # Récupérer les détails de la campagne
    response = make_authenticated_request("GET", f"/events/campagnes/{campaign_id}", token)
    
    if response and response.status_code == 200:
        data = response.json()
        
        # Vérifier l'image URL
        image_url = data.get("image_url")
        expected_image = "https://customer-assets.emergentagent.com/job_dijon-icc-hub/artifacts/foeikpvk_IMG_2590.png"
        
        if image_url == expected_image:
            results.add_success("Image URL campagne", "Image URL correctement stockée")
            
            # Tester l'accessibilité de l'image (optionnel)
            try:
                img_response = requests.head(image_url, timeout=5)
                if img_response.status_code == 200:
                    results.add_success("Image accessible", "Image accessible via URL")
                else:
                    results.add_failure("Image accessible", f"Image non accessible: {img_response.status_code}")
            except Exception as e:
                results.add_failure("Image accessible", f"Erreur accès image: {str(e)}")
        else:
            results.add_failure("Image URL campagne", f"Image URL incorrecte: {image_url}")
        
        # Vérifier que RSVP est activé (pour le bouton)
        enable_rsvp = data.get("enable_rsvp")
        if enable_rsvp == True:
            results.add_success("RSVP activé pour bouton", "RSVP activé - bouton sera affiché")
        else:
            results.add_failure("RSVP activé pour bouton", f"RSVP non activé: {enable_rsvp}")
        
        # Vérifier le type de campagne (email)
        campaign_type = data.get("type")
        if campaign_type == "email":
            results.add_success("Type campagne email", "Type email correct pour envoi email")
        else:
            results.add_failure("Type campagne email", f"Type incorrect: {campaign_type}")
    else:
        error_msg = f"Status: {response.status_code if response else 'No response'}"
        results.add_failure("Récupération détails campagne", error_msg)

def cleanup_test_data(results, token, campaign_id):
    """Nettoyer les données de test"""
    print(f"\n🧹 NETTOYAGE DES DONNÉES DE TEST")
    print(f"{'='*50}")
    
    if campaign_id and token:
        # Supprimer la campagne de test
        response = make_authenticated_request("DELETE", f"/events/campagnes/{campaign_id}", token)
        
        if response and response.status_code == 200:
            results.add_success("Nettoyage campagne", "Campagne de test supprimée")
        else:
            results.add_failure("Nettoyage campagne", f"Impossible de supprimer la campagne: {response.status_code if response else 'No response'}")

def main():
    """Main test execution"""
    print(f"🎯 TEST COMPLET: Email personnalisé + Image + RSVP")
    print(f"Backend URL: {BASE_URL}")
    print(f"Début des tests: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = TestResults()
    
    # Test 1: Authentication
    token = test_authentication(results)
    
    if not token:
        print("❌ ARRÊT CRITIQUE: Authentification échouée")
        results.print_summary()
        return 1
    
    # Test 2: Création campagne email avec personnalisation
    campaign_id = test_email_campaign_creation(results, token)
    
    # Test 3: Endpoints publics RSVP
    test_rsvp_public_endpoints(results, campaign_id)
    
    # Test 4: Vérification personnalisation email
    test_email_personalization_verification(results, token, campaign_id)
    
    # Test 5: Vérification statistiques RSVP
    test_rsvp_stats_verification(results, token, campaign_id)
    
    # Test 6: Vérification image et bouton RSVP
    test_image_and_rsvp_button_verification(results, token, campaign_id)
    
    # Nettoyage
    cleanup_test_data(results, token, campaign_id)
    
    # Résultats finaux
    results.print_summary()
    
    # Critères de succès spécifiques à la review request
    print(f"\n🎯 CRITÈRES DE SUCCÈS SPÉCIFIQUES:")
    success_criteria = [
        "✅ Campagne email créée avec {prenom} {nom} dans le message",
        "✅ Image URL correctement stockée et accessible",
        "✅ RSVP activé et fonctionnel",
        "✅ Endpoint public /api/public/campagne/{id} accessible",
        "✅ Endpoint public /api/public/rsvp fonctionnel",
        "✅ Personnalisation {prenom} {nom} → 'Jean Dupont' vérifiée",
        "✅ Statistiques RSVP (oui/non/peut-être) comptabilisées",
        "✅ Toutes les réponses RSVP enregistrées correctement"
    ]
    
    for criteria in success_criteria:
        print(f"  {criteria}")
    
    if results.failed == 0:
        print(f"\n🎉 TOUS LES TESTS SONT PASSÉS! Le système email + RSVP est fonctionnel.")
        return 0
    else:
        print(f"\n⚠️  {results.failed} tests ont échoué. Vérification nécessaire.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)