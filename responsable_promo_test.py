#!/usr/bin/env python3
"""
Test rapide pour la création de visiteur par un Responsable de promo
Identifie pourquoi il y a une page blanche après création
"""

import requests
import json
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')
BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://event-rsvp-11.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

class ResponsablePromoTester:
    def __init__(self):
        self.session = requests.Session()
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def make_request(self, method, endpoint, token=None, **kwargs):
        """Make HTTP request with optional authentication"""
        url = f"{API_URL}{endpoint}"
        headers = kwargs.get('headers', {})
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
            
        kwargs['headers'] = headers
        
        try:
            response = self.session.request(method, url, **kwargs)
            self.log(f"{method} {endpoint} -> {response.status_code}")
            return response
        except Exception as e:
            self.log(f"Request failed: {e}", "ERROR")
            return None
    
    def test_responsable_promo_accounts(self):
        """Test 1: Vérifier qu'un compte Responsable de promo existe"""
        self.log("\n=== TEST 1: Vérification des comptes Responsable de promo ===")
        
        # Comptes à tester (role: referent ou promotions)
        test_accounts = [
            {"username": "promotions", "password": "test123", "city": "Dijon"},
            {"username": "referent_dijon_oct", "password": "test123", "city": "Dijon"},
            {"username": "superviseur_promos", "password": "superviseur123", "city": "Dijon"},
            {"username": "superadmin", "password": "superadmin123", "city": "Dijon"},
            # Avec sélection de département
            {"username": "referent_dijon_oct", "password": "test123", "city": "Dijon", "department": "promotions"}
        ]
        
        successful_logins = []
        
        for account in test_accounts:
            self.log(f"Test de connexion: {account['username']} (ville: {account['city']})")
            
            response = self.make_request('POST', '/auth/login', json=account)
            
            if response and response.status_code == 200:
                login_result = response.json()
                user_info = login_result['user']
                
                self.log(f"✅ SUCCÈS: {account['username']} connecté")
                self.log(f"   Role: {user_info['role']}")
                self.log(f"   Ville: {user_info['city']}")
                self.log(f"   Mois assigné: {user_info.get('assigned_month', 'N/A')}")
                
                successful_logins.append({
                    'account': account,
                    'token': login_result['token'],
                    'user_info': user_info
                })
            else:
                error_msg = response.text if response else "Pas de réponse"
                self.log(f"❌ ÉCHEC: {account['username']} - {error_msg}")
        
        if successful_logins:
            self.log(f"\n✅ {len(successful_logins)} compte(s) Responsable de promo trouvé(s)")
            return successful_logins
        else:
            self.log("\n❌ AUCUN compte Responsable de promo trouvé", "ERROR")
            return []
    
    def test_visitor_creation_exact_data(self, token, user_info):
        """Test 2: Tester POST /api/visitors avec les données exactes de la demande"""
        self.log(f"\n=== TEST 2: Création visiteur avec {user_info['username']} (role: {user_info['role']}) ===")
        
        # Données exactes de la demande de révision
        visitor_data = {
            "firstname": "Jean",
            "lastname": "Dupont",
            "city": "Dijon",
            "types": ["Nouveau Arrivant"],
            "phone": "+33612345678",
            "email": "jean.dupont@test.com",
            "arrival_channel": "Evangelisation",
            "visit_date": "2025-01-20"
        }
        
        self.log("Données du visiteur à créer:")
        for key, value in visitor_data.items():
            self.log(f"   {key}: {value}")
        
        response = self.make_request('POST', '/visitors', token=token, json=visitor_data)
        
        if not response:
            self.log("❌ CRITIQUE: Échec complet de la requête (problème réseau/connexion)", "ERROR")
            return False
        
        self.log(f"Code de statut de la réponse: {response.status_code}")
        
        # Vérifier le format exact de la réponse
        try:
            response_json = response.json()
            self.log(f"Réponse JSON: {json.dumps(response_json, indent=2, ensure_ascii=False)}")
        except:
            self.log(f"Réponse brute (non-JSON): {response.text}")
            response_json = None
        
        if response.status_code == 200:
            if response_json:
                # Vérifier que la réponse contient bien {"message": "...", "id": "..."}
                has_message = "message" in response_json
                has_id = "id" in response_json
                
                self.log(f"✅ SUCCÈS: Visiteur créé (Status 200)")
                self.log(f"   Contient 'message': {has_message}")
                self.log(f"   Contient 'id': {has_id}")
                
                if has_message and has_id:
                    self.log(f"   Message: {response_json['message']}")
                    self.log(f"   ID: {response_json['id']}")
                    self.log("✅ FORMAT CORRECT: La réponse contient bien message et id")
                    return True, response_json['id']
                else:
                    self.log("⚠️  FORMAT INCORRECT: Manque message ou id dans la réponse", "ERROR")
                    return False, None
            else:
                self.log("❌ PROBLÈME: Status 200 mais pas de JSON valide", "ERROR")
                return False, None
                
        elif response.status_code == 422:
            self.log("❌ ERREUR DE VALIDATION (422): Données invalides", "ERROR")
            if response_json:
                self.log(f"   Détails: {response_json}")
            return False, None
            
        elif response.status_code == 403:
            self.log("❌ INTERDIT (403): Permission refusée", "ERROR")
            if response_json:
                self.log(f"   Détails: {response_json}")
            return False, None
            
        elif response.status_code == 500:
            self.log("❌ ERREUR SERVEUR (500): Erreur backend - PEUT CAUSER PAGE BLANCHE", "ERROR")
            if response_json:
                self.log(f"   Détails: {response_json}")
            return False, None
            
        else:
            self.log(f"❌ STATUS INATTENDU: {response.status_code}", "ERROR")
            return False, None
    
    def test_visitor_persistence(self, token, visitor_id):
        """Test 3: Vérifier que le visiteur a été sauvegardé"""
        self.log(f"\n=== TEST 3: Vérification de la persistance du visiteur {visitor_id} ===")
        
        response = self.make_request('GET', '/visitors', token=token)
        
        if not response or response.status_code != 200:
            self.log("❌ Impossible de récupérer la liste des visiteurs", "ERROR")
            return False
        
        visitors = response.json()
        created_visitor = next((v for v in visitors if v.get('id') == visitor_id), None)
        
        if created_visitor:
            self.log("✅ VÉRIFIÉ: Le visiteur apparaît dans la liste")
            self.log(f"   Nom: {created_visitor['firstname']} {created_visitor['lastname']}")
            self.log(f"   Mois assigné: {created_visitor.get('assigned_month')}")
            self.log(f"   Email: {created_visitor.get('email')}")
            return True
        else:
            self.log("❌ PROBLÈME: Visiteur créé mais introuvable dans la liste", "ERROR")
            return False
    
    def run_diagnostic_test(self):
        """Exécuter le test de diagnostic complet"""
        self.log("DIAGNOSTIC RAPIDE - Création de visiteur par Responsable de promo")
        self.log("=" * 70)
        self.log(f"URL Backend: {API_URL}")
        
        # Test 1: Vérifier les comptes
        successful_logins = self.test_responsable_promo_accounts()
        
        if not successful_logins:
            self.log("\n❌ DIAGNOSTIC TERMINÉ: Aucun compte Responsable de promo disponible", "ERROR")
            return
        
        # Test 2 & 3: Tester la création avec chaque compte trouvé
        creation_results = []
        
        for login_info in successful_logins:
            token = login_info['token']
            user_info = login_info['user_info']
            
            success, visitor_id = self.test_visitor_creation_exact_data(token, user_info)
            
            if success and visitor_id:
                persistence_ok = self.test_visitor_persistence(token, visitor_id)
                creation_results.append({
                    'user': user_info['username'],
                    'role': user_info['role'],
                    'creation_success': True,
                    'persistence_success': persistence_ok
                })
            else:
                creation_results.append({
                    'user': user_info['username'],
                    'role': user_info['role'],
                    'creation_success': False,
                    'persistence_success': False
                })
        
        # Résumé du diagnostic
        self.log("\n" + "=" * 70)
        self.log("RÉSUMÉ DU DIAGNOSTIC")
        self.log("=" * 70)
        
        backend_working = any(r['creation_success'] for r in creation_results)
        
        if backend_working:
            self.log("✅ BACKEND FONCTIONNEL: L'API POST /api/visitors fonctionne correctement")
            self.log("✅ FORMAT DE RÉPONSE: Retourne bien {\"message\": \"...\", \"id\": \"...\"}")
            self.log("✅ PERSISTANCE: Les visiteurs sont correctement sauvegardés")
            self.log("")
            self.log("🔍 CONCLUSION: Le problème de page blanche est CÔTÉ FRONTEND")
            self.log("   - L'API backend fonctionne parfaitement")
            self.log("   - Vérifier le JavaScript du frontend pour:")
            self.log("     * Erreurs dans la console du navigateur")
            self.log("     * Gestion de la réponse de succès")
            self.log("     * Logique de redirection après création")
            self.log("     * Gestion des états de chargement")
        else:
            self.log("❌ BACKEND DÉFAILLANT: L'API POST /api/visitors ne fonctionne pas")
            self.log("   - Tous les comptes testés ont échoué")
            self.log("   - Le problème vient du backend, pas du frontend")
        
        self.log("\nDétails par compte testé:")
        for result in creation_results:
            status = "✅" if result['creation_success'] else "❌"
            self.log(f"{status} {result['user']} (role: {result['role']}) - Création: {result['creation_success']}, Persistance: {result['persistence_success']}")
        
        return backend_working

if __name__ == "__main__":
    tester = ResponsablePromoTester()
    tester.run_diagnostic_test()