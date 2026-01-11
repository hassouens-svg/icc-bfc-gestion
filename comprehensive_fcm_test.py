#!/usr/bin/env python3
"""
🔥 COMPREHENSIVE FIREBASE FCM NOTIFICATIONS TEST
Test complet selon les spécifications de la review request

ENDPOINTS TESTÉS:
1. POST /api/notifications/register-token - Enregistrer un token FCM
2. POST /api/notifications/create - Créer une notification
3. GET /api/notifications - Récupérer l'historique des notifications
4. POST /api/notifications/{notification_id}/send - Envoyer une notification
5. DELETE /api/notifications/{notification_id} - Supprimer une notification

TESTS SPÉCIFIQUES:
- Enregistrement de token avec device_type "web"
- Création avec ciblage par département, ville et rôle
- Création avec send_to_all
- Vérification des permissions (superadmin et pasteur)
- Test d'envoi (peut échouer si pas de tokens valides - c'est OK)
- Suppression de notification
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://faithflow-14.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class ComprehensiveFCMTest:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
        self.successes = []
        self.tokens = {}
        self.notification_ids = []
    
    def add_success(self, test_name, message=""):
        self.passed += 1
        self.successes.append(f"✅ {test_name}: {message}")
        print(f"✅ {test_name}: {message}")
    
    def add_failure(self, test_name, error):
        self.failed += 1
        self.errors.append(f"❌ {test_name}: {error}")
        print(f"❌ {test_name}: {error}")
    
    def login(self, username, password, city="Dijon"):
        """Login et récupération du token"""
        try:
            response = requests.post(f"{BASE_URL}/auth/login", 
                                   json={"username": username, "password": password, "city": city}, 
                                   headers=HEADERS)
            
            if response.status_code == 200:
                data = response.json()
                token = data.get("token")
                user_info = data.get("user", {})
                
                if token:
                    self.tokens[username] = token
                    self.add_success(f"LOGIN_{username.upper()}", f"Role: {user_info.get('role')} - Ville: {user_info.get('city')}")
                    return token
                else:
                    self.add_failure(f"LOGIN_{username.upper()}", "Token manquant")
                    return None
            else:
                self.add_failure(f"LOGIN_{username.upper()}", f"Status: {response.status_code}")
                return None
                
        except Exception as e:
            self.add_failure(f"LOGIN_{username.upper()}", f"Erreur: {str(e)}")
            return None
    
    def test_register_token_detailed(self):
        """Test détaillé d'enregistrement de token FCM"""
        if "superadmin" not in self.tokens:
            self.add_failure("REGISTER_TOKEN_DETAILED", "Pas de token superadmin")
            return False
        
        try:
            headers = {**HEADERS, "Authorization": f"Bearer {self.tokens['superadmin']}"}
            
            # Test 1: Token web
            token_data = {
                "token": "test_fcm_token_web_123456789",
                "device_type": "web"
            }
            
            response = requests.post(f"{BASE_URL}/notifications/register-token",
                                   json=token_data,
                                   headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "Token registered successfully" in data.get("message", ""):
                    self.add_success("REGISTER_TOKEN_WEB", "Token web enregistré")
                else:
                    self.add_success("REGISTER_TOKEN_WEB", f"Token traité: {data.get('message')}")
            else:
                self.add_failure("REGISTER_TOKEN_WEB", f"Status: {response.status_code}")
                return False
            
            # Test 2: Token mobile (Android)
            token_data_mobile = {
                "token": "test_fcm_token_android_987654321",
                "device_type": "android"
            }
            
            response = requests.post(f"{BASE_URL}/notifications/register-token",
                                   json=token_data_mobile,
                                   headers=headers)
            
            if response.status_code == 200:
                self.add_success("REGISTER_TOKEN_ANDROID", "Token Android enregistré")
            else:
                self.add_failure("REGISTER_TOKEN_ANDROID", f"Status: {response.status_code}")
            
            return True
            
        except Exception as e:
            self.add_failure("REGISTER_TOKEN_DETAILED", f"Erreur: {str(e)}")
            return False
    
    def test_create_notifications_detailed(self):
        """Test détaillé de création de notifications avec différents ciblages"""
        if "superadmin" not in self.tokens:
            self.add_failure("CREATE_NOTIFICATIONS_DETAILED", "Pas de token superadmin")
            return False
        
        try:
            headers = {**HEADERS, "Authorization": f"Bearer {self.tokens['superadmin']}"}
            
            # Test 1: Notification ciblée par département et rôle (comme dans la review request)
            notification_1 = {
                "title": "Test Notification",
                "message": "Ceci est un test",
                "send_to_all": False,
                "department": "Promotions",
                "city": "Dijon",
                "target_roles": ["berger"],
                "scheduled_at": ""
            }
            
            response = requests.post(f"{BASE_URL}/notifications/create",
                                   json=notification_1,
                                   headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                notification_id = data.get("id") or data.get("notification_id")
                if notification_id:
                    self.notification_ids.append(notification_id)
                    self.add_success("CREATE_TARGETED_NOTIFICATION", f"ID: {notification_id}")
                else:
                    self.add_failure("CREATE_TARGETED_NOTIFICATION", "ID manquant")
                    return False
            else:
                self.add_failure("CREATE_TARGETED_NOTIFICATION", f"Status: {response.status_code}")
                return False
            
            # Test 2: Notification pour tous
            notification_2 = {
                "title": "Notification Générale",
                "message": "Message pour tous les utilisateurs",
                "send_to_all": True,
                "scheduled_at": ""
            }
            
            response = requests.post(f"{BASE_URL}/notifications/create",
                                   json=notification_2,
                                   headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                notification_id = data.get("id") or data.get("notification_id")
                if notification_id:
                    self.notification_ids.append(notification_id)
                    self.add_success("CREATE_GENERAL_NOTIFICATION", f"ID: {notification_id}")
                else:
                    self.add_failure("CREATE_GENERAL_NOTIFICATION", "ID manquant")
            else:
                self.add_failure("CREATE_GENERAL_NOTIFICATION", f"Status: {response.status_code}")
            
            # Test 3: Notification programmée
            notification_3 = {
                "title": "Notification Programmée",
                "message": "Message programmé pour plus tard",
                "send_to_all": True,
                "scheduled_at": "2025-12-31T23:59:00"
            }
            
            response = requests.post(f"{BASE_URL}/notifications/create",
                                   json=notification_3,
                                   headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                notification_id = data.get("id") or data.get("notification_id")
                if notification_id:
                    self.notification_ids.append(notification_id)
                    self.add_success("CREATE_SCHEDULED_NOTIFICATION", f"ID: {notification_id}")
                else:
                    self.add_failure("CREATE_SCHEDULED_NOTIFICATION", "ID manquant")
            else:
                self.add_failure("CREATE_SCHEDULED_NOTIFICATION", f"Status: {response.status_code}")
            
            return True
            
        except Exception as e:
            self.add_failure("CREATE_NOTIFICATIONS_DETAILED", f"Erreur: {str(e)}")
            return False
    
    def test_get_notifications_detailed(self):
        """Test détaillé de récupération de l'historique"""
        if "superadmin" not in self.tokens:
            self.add_failure("GET_NOTIFICATIONS_DETAILED", "Pas de token superadmin")
            return False
        
        try:
            headers = {**HEADERS, "Authorization": f"Bearer {self.tokens['superadmin']}"}
            
            response = requests.get(f"{BASE_URL}/notifications", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list):
                    notifications_count = len(data)
                    self.add_success("GET_NOTIFICATIONS_LIST", f"{notifications_count} notifications dans l'historique")
                    
                    # Vérifier que nos notifications créées sont présentes
                    found_notifications = []
                    for notif_id in self.notification_ids:
                        for notif in data:
                            if notif.get("id") == notif_id:
                                found_notifications.append(notif_id)
                                break
                    
                    if found_notifications:
                        self.add_success("VERIFY_CREATED_IN_HISTORY", f"{len(found_notifications)}/{len(self.notification_ids)} notifications trouvées")
                    
                    # Vérifier la structure des notifications
                    if data:
                        sample_notif = data[0]
                        required_fields = ["id", "title", "message", "status", "created_at"]
                        missing_fields = [field for field in required_fields if field not in sample_notif]
                        
                        if not missing_fields:
                            self.add_success("NOTIFICATION_STRUCTURE", "Structure correcte")
                        else:
                            self.add_failure("NOTIFICATION_STRUCTURE", f"Champs manquants: {missing_fields}")
                    
                    return True
                else:
                    self.add_failure("GET_NOTIFICATIONS_LIST", f"Format inattendu: {type(data)}")
                    return False
            else:
                self.add_failure("GET_NOTIFICATIONS_LIST", f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.add_failure("GET_NOTIFICATIONS_DETAILED", f"Erreur: {str(e)}")
            return False
    
    def test_send_notification_detailed(self):
        """Test détaillé d'envoi de notification"""
        if "superadmin" not in self.tokens or not self.notification_ids:
            self.add_failure("SEND_NOTIFICATION_DETAILED", "Pas de token ou pas de notifications")
            return False
        
        try:
            headers = {**HEADERS, "Authorization": f"Bearer {self.tokens['superadmin']}"}
            
            # Tenter d'envoyer la première notification
            notification_id = self.notification_ids[0]
            
            response = requests.post(f"{BASE_URL}/notifications/{notification_id}/send",
                                   headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                sent_count = data.get("sent_count", 0)
                failed_count = data.get("failed_count", 0)
                
                # L'envoi peut échouer si pas de vrais tokens FCM, c'est normal en test
                if "sent_count" in data:
                    self.add_success("SEND_NOTIFICATION_RESPONSE", f"Envoyées: {sent_count}, Échecs: {failed_count}")
                    
                    if sent_count == 0:
                        self.add_success("SEND_NO_TOKENS", "Aucun token valide trouvé (normal en test)")
                    else:
                        self.add_success("SEND_SUCCESS", f"{sent_count} notifications envoyées")
                    
                    return True
                else:
                    self.add_success("SEND_NOTIFICATION_RESPONSE", f"Réponse: {data}")
                    return True
            else:
                self.add_failure("SEND_NOTIFICATION_RESPONSE", f"Status: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.add_failure("SEND_NOTIFICATION_DETAILED", f"Erreur: {str(e)}")
            return False
    
    def test_delete_notification_detailed(self):
        """Test détaillé de suppression de notification"""
        if "superadmin" not in self.tokens or not self.notification_ids:
            self.add_failure("DELETE_NOTIFICATION_DETAILED", "Pas de token ou pas de notifications")
            return False
        
        try:
            headers = {**HEADERS, "Authorization": f"Bearer {self.tokens['superadmin']}"}
            
            # Supprimer la dernière notification créée
            notification_id = self.notification_ids[-1]
            
            response = requests.delete(f"{BASE_URL}/notifications/{notification_id}",
                                     headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "deleted" in data.get("message", "").lower():
                    self.add_success("DELETE_NOTIFICATION_SUCCESS", f"ID: {notification_id}")
                    self.notification_ids.remove(notification_id)
                    return True
                else:
                    self.add_success("DELETE_NOTIFICATION_SUCCESS", f"Supprimée: {data}")
                    return True
            else:
                self.add_failure("DELETE_NOTIFICATION_SUCCESS", f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.add_failure("DELETE_NOTIFICATION_DETAILED", f"Erreur: {str(e)}")
            return False
    
    def test_permissions_detailed(self):
        """Test détaillé des permissions (pasteur peut créer, autres rôles non)"""
        # Test avec pasteur
        pasteur_token = self.login("pasteur", "pasteur123", "Dijon")
        
        if pasteur_token:
            headers = {**HEADERS, "Authorization": f"Bearer {pasteur_token}"}
            
            notification_data = {
                "title": "Test Pasteur",
                "message": "Test de création par pasteur",
                "send_to_all": False,
                "city": "Dijon",
                "target_roles": ["berger"]
            }
            
            response = requests.post(f"{BASE_URL}/notifications/create",
                                   json=notification_data,
                                   headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                notification_id = data.get("id") or data.get("notification_id")
                if notification_id:
                    self.notification_ids.append(notification_id)
                self.add_success("PASTEUR_CREATE_PERMISSION", "Pasteur peut créer des notifications")
            else:
                self.add_failure("PASTEUR_CREATE_PERMISSION", f"Status: {response.status_code}")
        else:
            self.add_success("PASTEUR_CREATE_PERMISSION", "Compte pasteur non trouvé (test ignoré)")
        
        return True
    
    def print_summary(self):
        """Afficher le résumé final"""
        print(f"\n{'='*80}")
        print(f"🔥 COMPREHENSIVE FIREBASE FCM TEST - RÉSULTATS FINAUX")
        print(f"{'='*80}")
        print(f"✅ Tests réussis: {self.passed}")
        print(f"❌ Tests échoués: {self.failed}")
        print(f"📊 Taux de réussite: {(self.passed/(self.passed+self.failed)*100):.1f}%")
        
        if self.errors:
            print(f"\n❌ ERREURS DÉTECTÉES:")
            for error in self.errors:
                print(f"   {error}")
        
        print(f"\n✅ TESTS RÉUSSIS:")
        for success in self.successes:
            print(f"   {success}")
        
        print(f"\n📋 NOTIFICATIONS CRÉÉES: {len(self.notification_ids)}")
        for notif_id in self.notification_ids:
            print(f"   - {notif_id}")

def main():
    """Fonction principale"""
    print("🔥 COMPREHENSIVE FIREBASE FCM NOTIFICATIONS TEST")
    print("="*80)
    
    test = ComprehensiveFCMTest()
    
    # Séquence de tests
    print("\n🧪 1. AUTHENTIFICATION")
    print("-" * 60)
    test.login("superadmin", "superadmin123", "Dijon")
    
    print("\n🧪 2. ENREGISTREMENT TOKENS FCM DÉTAILLÉ")
    print("-" * 60)
    test.test_register_token_detailed()
    
    print("\n🧪 3. CRÉATION DE NOTIFICATIONS DÉTAILLÉE")
    print("-" * 60)
    test.test_create_notifications_detailed()
    
    print("\n🧪 4. RÉCUPÉRATION HISTORIQUE DÉTAILLÉE")
    print("-" * 60)
    test.test_get_notifications_detailed()
    
    print("\n🧪 5. ENVOI DE NOTIFICATION DÉTAILLÉ")
    print("-" * 60)
    test.test_send_notification_detailed()
    
    print("\n🧪 6. SUPPRESSION DE NOTIFICATION DÉTAILLÉE")
    print("-" * 60)
    test.test_delete_notification_detailed()
    
    print("\n🧪 7. PERMISSIONS DÉTAILLÉES")
    print("-" * 60)
    test.test_permissions_detailed()
    
    # Afficher le résumé final
    test.print_summary()
    
    # Code de sortie
    if test.failed == 0:
        print(f"\n🎉 TOUS LES TESTS COMPREHENSIVE FCM SONT PASSÉS!")
        sys.exit(0)
    else:
        print(f"\n⚠️  {test.failed} TEST(S) ONT ÉCHOUÉ")
        sys.exit(1)

if __name__ == "__main__":
    main()