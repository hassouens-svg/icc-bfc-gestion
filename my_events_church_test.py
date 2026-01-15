#!/usr/bin/env python3
"""
🎯 MY EVENTS CHURCH - TEST CAMPAGNE EMAIL
Test spécifique pour la création et envoi de campagnes email My Events Church

CONTEXTE:
L'utilisateur rapporte que la création de campagne échoue avec "Erreur: Création échouée"
L'API curl fonctionne mais le frontend ne fonctionne pas

OBJECTIF:
Tester tous les endpoints de campagne pour identifier si le problème est backend ou frontend
"""

import requests
import json
import sys
import os
from datetime import datetime

# Configuration depuis les variables d'environnement
REACT_APP_BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://disciple-tracker.preview.emergentagent.com')
BASE_URL = f"{REACT_APP_BACKEND_URL}/api"
HEADERS = {"Content-Type": "application/json"}

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
        self.successes = []
        self.campagne_id = None
        self.token = None
    
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
        print(f"🎯 MY EVENTS CHURCH - RÉSULTATS FINAUX")
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

def test_login(results):
    """TEST 1: Login My Events Church"""
    print(f"\n🔐 TEST 1: LOGIN MY EVENTS CHURCH")
    print(f"{'='*50}")
    
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
        
        print(f"🔍 Login request: POST {BASE_URL}/auth/login")
        print(f"🔍 Login data: {login_data}")
        print(f"🔍 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("token")
            user = data.get("user")
            
            if token:
                results.token = token
                results.add_success("Login superadmin", f"JWT token reçu, role: {user.get('role', 'N/A')}")
                print(f"🔍 Token: {token[:50]}...")
                return token
            else:
                results.add_failure("Login superadmin", "Pas de token dans la réponse")
                return None
        else:
            error_text = response.text[:200] if response.text else "Pas de message d'erreur"
            results.add_failure("Login superadmin", f"Status {response.status_code}: {error_text}")
            return None
            
    except Exception as e:
        results.add_failure("Login superadmin", f"Exception: {str(e)}")
        return None

def test_create_campagne(results, token):
    """TEST 2: Créer une campagne"""
    print(f"\n📧 TEST 2: CRÉER UNE CAMPAGNE")
    print(f"{'='*50}")
    
    if not token:
        results.add_failure("Créer campagne", "Pas de token disponible")
        return None
    
    campagne_data = {
        "titre": "Test Campagne",
        "type": "email",
        "message": "Bonjour {prenom}",
        "destinataires": [
            {
                "prenom": "Test",
                "nom": "User", 
                "email": "hassouens@gmail.com",
                "telephone": ""
            }
        ],
        "image_url": "",
        "date_envoi": "",
        "enable_rsvp": False
    }
    
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    try:
        response = requests.post(
            f"{BASE_URL}/events/campagnes",
            json=campagne_data,
            headers=headers,
            timeout=10
        )
        
        print(f"🔍 Create request: POST {BASE_URL}/events/campagnes")
        print(f"🔍 Campagne data: {json.dumps(campagne_data, indent=2)}")
        print(f"🔍 Response status: {response.status_code}")
        print(f"🔍 Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            campagne_id = data.get("id")
            message = data.get("message")
            
            print(f"🔍 Response data: {data}")
            
            if campagne_id and message == "Campagne créée":
                results.campagne_id = campagne_id
                results.add_success("Créer campagne", f"Campagne créée avec ID: {campagne_id}")
                return campagne_id
            else:
                results.add_failure("Créer campagne", f"Réponse incorrecte: {data}")
                return None
        else:
            error_text = response.text[:500] if response.text else "Pas de message d'erreur"
            results.add_failure("Créer campagne", f"Status {response.status_code}: {error_text}")
            return None
            
    except Exception as e:
        results.add_failure("Créer campagne", f"Exception: {str(e)}")
        return None

def test_send_campagne(results, token, campagne_id):
    """TEST 3: Envoyer la campagne"""
    print(f"\n📤 TEST 3: ENVOYER LA CAMPAGNE")
    print(f"{'='*50}")
    
    if not token:
        results.add_failure("Envoyer campagne", "Pas de token disponible")
        return False
    
    if not campagne_id:
        results.add_failure("Envoyer campagne", "Pas d'ID de campagne disponible")
        return False
    
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    try:
        response = requests.post(
            f"{BASE_URL}/events/campagnes/{campagne_id}/envoyer",
            headers=headers,
            timeout=15  # Plus de temps pour l'envoi d'email
        )
        
        print(f"🔍 Send request: POST {BASE_URL}/events/campagnes/{campagne_id}/envoyer")
        print(f"🔍 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            count = data.get("count")
            message = data.get("message")
            
            print(f"🔍 Response data: {data}")
            
            if count == 1:
                results.add_success("Envoyer campagne", f"Email envoyé à {count} destinataire: {message}")
                return True
            else:
                results.add_failure("Envoyer campagne", f"Count incorrect: {count}, attendu: 1")
                return False
        else:
            error_text = response.text[:500] if response.text else "Pas de message d'erreur"
            results.add_failure("Envoyer campagne", f"Status {response.status_code}: {error_text}")
            return False
            
    except Exception as e:
        results.add_failure("Envoyer campagne", f"Exception: {str(e)}")
        return False

def test_list_campagnes(results, token):
    """TEST 4: Lister les campagnes"""
    print(f"\n📋 TEST 4: LISTER LES CAMPAGNES")
    print(f"{'='*50}")
    
    if not token:
        results.add_failure("Lister campagnes", "Pas de token disponible")
        return False
    
    headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(
            f"{BASE_URL}/events/campagnes",
            headers=headers,
            timeout=10
        )
        
        print(f"🔍 List request: GET {BASE_URL}/events/campagnes")
        print(f"🔍 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"🔍 Response data: {len(data)} campagnes trouvées")
            
            if isinstance(data, list):
                # Chercher notre campagne de test
                test_campagne = None
                for campagne in data:
                    if campagne.get("titre") == "Test Campagne":
                        test_campagne = campagne
                        break
                
                if test_campagne:
                    results.add_success("Lister campagnes", f"Campagne de test trouvée dans la liste (ID: {test_campagne.get('id')})")
                    return True
                else:
                    results.add_failure("Lister campagnes", "Campagne de test non trouvée dans la liste")
                    return False
            else:
                results.add_failure("Lister campagnes", f"Format de réponse incorrect: {type(data)}")
                return False
        else:
            error_text = response.text[:500] if response.text else "Pas de message d'erreur"
            results.add_failure("Lister campagnes", f"Status {response.status_code}: {error_text}")
            return False
            
    except Exception as e:
        results.add_failure("Lister campagnes", f"Exception: {str(e)}")
        return False

def test_backend_logs(results):
    """TEST 5: Vérifier les logs backend"""
    print(f"\n📝 TEST 5: VÉRIFIER LES LOGS BACKEND")
    print(f"{'='*50}")
    
    try:
        # Vérifier les logs supervisor backend
        import subprocess
        
        log_files = [
            "/var/log/supervisor/backend.out.log",
            "/var/log/supervisor/backend.err.log"
        ]
        
        for log_file in log_files:
            try:
                result = subprocess.run(
                    ["tail", "-n", "20", log_file],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                
                if result.returncode == 0:
                    log_content = result.stdout
                    if log_content.strip():
                        print(f"🔍 Logs {log_file}:")
                        print(log_content)
                        
                        # Chercher des erreurs
                        error_keywords = ["error", "exception", "traceback", "failed", "500"]
                        has_errors = any(keyword.lower() in log_content.lower() for keyword in error_keywords)
                        
                        if has_errors:
                            results.add_failure(f"Logs backend {log_file}", "Erreurs trouvées dans les logs")
                        else:
                            results.add_success(f"Logs backend {log_file}", "Pas d'erreurs critiques")
                    else:
                        results.add_success(f"Logs backend {log_file}", "Fichier de log vide")
                else:
                    results.add_failure(f"Logs backend {log_file}", f"Impossible de lire le fichier: {result.stderr}")
                    
            except subprocess.TimeoutExpired:
                results.add_failure(f"Logs backend {log_file}", "Timeout lors de la lecture")
            except Exception as e:
                results.add_failure(f"Logs backend {log_file}", f"Exception: {str(e)}")
                
    except Exception as e:
        results.add_failure("Vérifier logs backend", f"Exception générale: {str(e)}")

def test_email_configuration(results):
    """TEST 6: Vérifier la configuration email"""
    print(f"\n⚙️ TEST 6: VÉRIFIER LA CONFIGURATION EMAIL")
    print(f"{'='*50}")
    
    try:
        # Vérifier les variables d'environnement
        backend_env_file = "/app/backend/.env"
        
        with open(backend_env_file, 'r') as f:
            env_content = f.read()
            
        print(f"🔍 Contenu .env backend:")
        print(env_content)
        
        # Vérifier la présence de BREVO_API_KEY
        if "BREVO_API_KEY" in env_content:
            brevo_line = [line for line in env_content.split('\n') if 'BREVO_API_KEY' in line][0]
            if brevo_line.strip() and not brevo_line.startswith('#'):
                results.add_success("Configuration email", "BREVO_API_KEY configuré")
            else:
                results.add_failure("Configuration email", "BREVO_API_KEY commenté ou vide")
        else:
            results.add_failure("Configuration email", "BREVO_API_KEY manquant")
            
    except Exception as e:
        results.add_failure("Configuration email", f"Exception: {str(e)}")

def main():
    """Main test execution"""
    print(f"🎯 MY EVENTS CHURCH - TEST CAMPAGNE EMAIL")
    print(f"Backend URL: {BASE_URL}")
    print(f"Début des tests: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = TestResults()
    
    # TEST 1: Login
    token = test_login(results)
    
    if not token:
        print("❌ ARRÊT CRITIQUE: Impossible de se connecter")
        results.print_summary()
        return 1
    
    # TEST 2: Créer campagne
    campagne_id = test_create_campagne(results, token)
    
    # TEST 3: Envoyer campagne (seulement si création réussie)
    if campagne_id:
        test_send_campagne(results, token, campagne_id)
    
    # TEST 4: Lister campagnes
    test_list_campagnes(results, token)
    
    # TEST 5: Vérifier logs backend
    test_backend_logs(results)
    
    # TEST 6: Configuration email
    test_email_configuration(results)
    
    # Résultats finaux
    results.print_summary()
    
    # Diagnostic final
    print(f"\n🎯 DIAGNOSTIC FINAL:")
    
    if results.failed == 0:
        print(f"✅ TOUS LES TESTS BACKEND SONT PASSÉS!")
        print(f"✅ L'API backend fonctionne correctement")
        print(f"✅ Le problème 'Erreur: Création échouée' est CÔTÉ FRONTEND")
        print(f"\n🔧 RECOMMANDATIONS:")
        print(f"  1. Vérifier les erreurs JavaScript dans la console du navigateur")
        print(f"  2. Vérifier la gestion des réponses API dans le frontend")
        print(f"  3. Vérifier les états de chargement et d'erreur dans l'interface")
        return 0
    else:
        print(f"❌ {results.failed} tests backend ont échoué")
        print(f"❌ Le problème peut être CÔTÉ BACKEND")
        print(f"\n🔧 RECOMMANDATIONS:")
        print(f"  1. Corriger les erreurs backend identifiées")
        print(f"  2. Vérifier la configuration des services (MongoDB, Email)")
        print(f"  3. Redémarrer les services si nécessaire")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)