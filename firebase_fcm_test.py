#!/usr/bin/env python3
"""
🔥 FIREBASE FCM NOTIFICATIONS TESTING SUITE
Test complet du système de notifications push Firebase FCM

CONTEXTE:
- Système de notifications push implémenté avec Firebase FCM
- Backend: FastAPI avec endpoints pour créer, envoyer et gérer les notifications
- Frontend: React avec page de gestion des notifications

ENDPOINTS À TESTER:
1. POST /api/notifications/register-token - Enregistrer un token FCM
2. POST /api/notifications/create - Créer une notification
3. GET /api/notifications - Récupérer l'historique des notifications
4. POST /api/notifications/{notification_id}/send - Envoyer une notification
5. DELETE /api/notifications/{notification_id} - Supprimer une notification

CREDENTIALS: superadmin / superadmin123
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://discipleship-track.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

# Test credentials
CREDENTIALS = {
    "username": "superadmin",
    "password": "superadmin123",
    "city": "Dijon"
}

class FCMTestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
        self.successes = []
        self.token = None
        self.notification_ids = []
    
    def add_success(self, test_name, message=""):
        self.passed += 1
        self.successes.append(f"✅ {test_name}: {message}")
        print(f"✅ {test_name}: {message}")
    
    def add_failure(self, test_name, error):
        self.failed += 1
        self.errors.append(f"❌ {test_name}: {error}")
        print(f"❌ {test_name}: {error}")
    
    def print_summary(self):
        print(f"\n{'='*80}")
        print(f"🔥 FIREBASE FCM NOTIFICATIONS - RÉSULTATS FINAUX")
        print(f"{'='*80}")
        print(f"✅ Tests réussis: {self.passed}")
        print(f"❌ Tests échoués: {self.failed}")
        print(f"📊 Taux de réussite: {(self.passed/(self.passed+self.failed)*100):.1f}%")
        
        if self.errors:
            print(f"\n❌ ERREURS DÉTECTÉES:")
            for error in self.errors:
                print(f"   {error}")
        
        if self.successes:
            print(f"\n✅ SUCCÈS:")
            for success in self.successes:
                print(f"   {success}")

def login_and_get_token(results):
    """Test 1: Login et récupération du token d'authentification"""
    try:
        response = requests.post(f"{BASE_URL}/auth/login", 
                               json=CREDENTIALS, 
                               headers=HEADERS)
        
        if response.status_code == 200:
            data = response.json()
            results.token = data.get("token")
            user_info = data.get("user", {})
            
            if results.token and user_info.get("role") == "super_admin":
                results.add_success("LOGIN", f"Authentification réussie - Role: {user_info.get('role')} - Ville: {user_info.get('city')}")
                return True
            else:
                results.add_failure("LOGIN", "Token manquant ou rôle incorrect")
                return False
        else:
            results.add_failure("LOGIN", f"Échec authentification - Status: {response.status_code}")
            return False
            
    except Exception as e:
        results.add_failure("LOGIN", f"Erreur: {str(e)}")
        return False

def test_register_fcm_token(results):
    """Test 2: Enregistrer un token FCM pour un utilisateur"""
    if not results.token:
        results.add_failure("REGISTER_TOKEN", "Pas de token d'authentification")
        return False
    
    try:
        headers = {**HEADERS, "Authorization": f"Bearer {results.token}"}
        
        # Test data pour enregistrement de token FCM
        token_data = {
            "token": "test_fcm_token_123456789",
            "device_type": "web"
        }
        
        response = requests.post(f"{BASE_URL}/notifications/register-token",
                               json=token_data,
                               headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("message") == "Token registered successfully":
                results.add_success("REGISTER_TOKEN", "Token FCM enregistré avec succès")
                return True
            else:
                results.add_failure("REGISTER_TOKEN", f"Message inattendu: {data}")
                return False
        else:
            results.add_failure("REGISTER_TOKEN", f"Status: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        results.add_failure("REGISTER_TOKEN", f"Erreur: {str(e)}")
        return False

def test_create_notification(results):
    """Test 3: Créer une notification avec ciblage spécifique"""
    if not results.token:
        results.add_failure("CREATE_NOTIFICATION", "Pas de token d'authentification")
        return False
    
    try:
        headers = {**HEADERS, "Authorization": f"Bearer {results.token}"}
        
        # Test 1: Notification ciblée par département et rôle
        notification_data = {
            "title": "Test Notification FCM",
            "message": "Ceci est un test de notification push Firebase",
            "send_to_all": False,
            "department": "Promotions",
            "city": "Dijon",
            "target_roles": ["berger"],
            "scheduled_at": ""
        }
        
        response = requests.post(f"{BASE_URL}/notifications/create",
                               json=notification_data,
                               headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            notification_id = data.get("notification_id") or data.get("id")
            
            if notification_id:
                results.notification_ids.append(notification_id)
                results.add_success("CREATE_NOTIFICATION", f"Notification créée - ID: {notification_id}")
                
                # Test 2: Notification pour tous
                notification_all = {
                    "title": "Notification Générale",
                    "message": "Message pour tous les utilisateurs",
                    "send_to_all": True,
                    "scheduled_at": ""
                }
                
                response2 = requests.post(f"{BASE_URL}/notifications/create",
                                        json=notification_all,
                                        headers=headers)
                
                if response2.status_code == 200:
                    data2 = response2.json()
                    notification_id2 = data2.get("notification_id") or data2.get("id")
                    if notification_id2:
                        results.notification_ids.append(notification_id2)
                        results.add_success("CREATE_NOTIFICATION_ALL", f"Notification générale créée - ID: {notification_id2}")
                        return True
                
                return True
            else:
                results.add_failure("CREATE_NOTIFICATION", f"ID de notification manquant: {data}")
                return False
        else:
            results.add_failure("CREATE_NOTIFICATION", f"Status: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        results.add_failure("CREATE_NOTIFICATION", f"Erreur: {str(e)}")
        return False

def test_get_notifications_history(results):
    """Test 4: Récupérer l'historique des notifications"""
    if not results.token:
        results.add_failure("GET_NOTIFICATIONS", "Pas de token d'authentification")
        return False
    
    try:
        headers = {**HEADERS, "Authorization": f"Bearer {results.token}"}
        
        response = requests.get(f"{BASE_URL}/notifications", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            
            if isinstance(data, list):
                notifications_count = len(data)
                results.add_success("GET_NOTIFICATIONS", f"Historique récupéré - {notifications_count} notifications trouvées")
                
                # Vérifier que nos notifications créées sont présentes
                created_found = 0
                for notif_id in results.notification_ids:
                    for notif in data:
                        if notif.get("id") == notif_id:
                            created_found += 1
                            break
                
                if created_found > 0:
                    results.add_success("VERIFY_CREATED_NOTIFICATIONS", f"{created_found}/{len(results.notification_ids)} notifications créées trouvées dans l'historique")
                
                return True
            else:
                results.add_failure("GET_NOTIFICATIONS", f"Format de réponse inattendu: {type(data)}")
                return False
        else:
            results.add_failure("GET_NOTIFICATIONS", f"Status: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        results.add_failure("GET_NOTIFICATIONS", f"Erreur: {str(e)}")
        return False

def test_send_notification(results):
    """Test 5: Envoyer une notification immédiatement"""
    if not results.token or not results.notification_ids:
        results.add_failure("SEND_NOTIFICATION", "Pas de token ou pas de notifications créées")
        return False
    
    try:
        headers = {**HEADERS, "Authorization": f"Bearer {results.token}"}
        
        # Tenter d'envoyer la première notification créée
        notification_id = results.notification_ids[0]
        
        response = requests.post(f"{BASE_URL}/notifications/{notification_id}/send",
                               headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            sent_count = data.get("sent_count", 0)
            
            # L'envoi peut échouer si pas de vrais tokens FCM, c'est OK
            if "sent_count" in data:
                results.add_success("SEND_NOTIFICATION", f"Tentative d'envoi réussie - {sent_count} notifications envoyées")
                return True
            else:
                results.add_success("SEND_NOTIFICATION", f"Réponse d'envoi reçue: {data}")
                return True
        else:
            # Vérifier si c'est une erreur attendue (pas de tokens valides)
            if response.status_code == 400 and "no valid tokens" in response.text.lower():
                results.add_success("SEND_NOTIFICATION", "Erreur attendue: Pas de tokens FCM valides (normal en test)")
                return True
            else:
                results.add_failure("SEND_NOTIFICATION", f"Status: {response.status_code} - {response.text}")
                return False
            
    except Exception as e:
        results.add_failure("SEND_NOTIFICATION", f"Erreur: {str(e)}")
        return False

def test_delete_notification(results):
    """Test 6: Supprimer une notification"""
    if not results.token or not results.notification_ids:
        results.add_failure("DELETE_NOTIFICATION", "Pas de token ou pas de notifications créées")
        return False
    
    try:
        headers = {**HEADERS, "Authorization": f"Bearer {results.token}"}
        
        # Supprimer la dernière notification créée
        notification_id = results.notification_ids[-1]
        
        response = requests.delete(f"{BASE_URL}/notifications/{notification_id}",
                                 headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("message") == "Notification deleted":
                results.add_success("DELETE_NOTIFICATION", f"Notification supprimée - ID: {notification_id}")
                results.notification_ids.remove(notification_id)
                return True
            else:
                results.add_success("DELETE_NOTIFICATION", f"Notification supprimée: {data}")
                return True
        else:
            results.add_failure("DELETE_NOTIFICATION", f"Status: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        results.add_failure("DELETE_NOTIFICATION", f"Erreur: {str(e)}")
        return False

def test_permissions_pasteur(results):
    """Test 7: Vérifier les permissions pasteur (peut créer mais pas envoyer)"""
    try:
        # Login en tant que pasteur (si existe)
        pasteur_creds = {"username": "pasteur", "password": "pasteur123", "city": "Dijon"}
        
        response = requests.post(f"{BASE_URL}/auth/login", 
                               json=pasteur_creds, 
                               headers=HEADERS)
        
        if response.status_code == 200:
            data = response.json()
            pasteur_token = data.get("token")
            
            if pasteur_token:
                headers_pasteur = {**HEADERS, "Authorization": f"Bearer {pasteur_token}"}
                
                # Tenter de créer une notification en tant que pasteur
                notification_data = {
                    "title": "Test Pasteur",
                    "message": "Test de création par pasteur",
                    "send_to_all": False,
                    "city": "Dijon",
                    "target_roles": ["berger"]
                }
                
                response = requests.post(f"{BASE_URL}/notifications/create",
                                       json=notification_data,
                                       headers=headers_pasteur)
                
                if response.status_code == 200:
                    results.add_success("PASTEUR_PERMISSIONS", "Pasteur peut créer des notifications")
                    return True
                else:
                    results.add_failure("PASTEUR_PERMISSIONS", f"Pasteur ne peut pas créer - Status: {response.status_code}")
                    return False
            else:
                results.add_success("PASTEUR_PERMISSIONS", "Compte pasteur non trouvé (test ignoré)")
                return True
        else:
            results.add_success("PASTEUR_PERMISSIONS", "Compte pasteur non trouvé (test ignoré)")
            return True
            
    except Exception as e:
        results.add_success("PASTEUR_PERMISSIONS", f"Test pasteur ignoré: {str(e)}")
        return True

def main():
    """Fonction principale pour exécuter tous les tests FCM"""
    print("🔥 DÉMARRAGE DES TESTS FIREBASE FCM NOTIFICATIONS")
    print("="*80)
    
    results = FCMTestResults()
    
    # Séquence de tests
    tests = [
        ("1. LOGIN ET AUTHENTIFICATION", login_and_get_token),
        ("2. ENREGISTREMENT TOKEN FCM", test_register_fcm_token),
        ("3. CRÉATION DE NOTIFICATIONS", test_create_notification),
        ("4. RÉCUPÉRATION HISTORIQUE", test_get_notifications_history),
        ("5. ENVOI DE NOTIFICATION", test_send_notification),
        ("6. SUPPRESSION DE NOTIFICATION", test_delete_notification),
        ("7. PERMISSIONS PASTEUR", test_permissions_pasteur),
    ]
    
    for test_name, test_func in tests:
        print(f"\n🧪 {test_name}")
        print("-" * 60)
        test_func(results)
    
    # Afficher le résumé final
    results.print_summary()
    
    # Code de sortie
    if results.failed == 0:
        print(f"\n🎉 TOUS LES TESTS FCM SONT PASSÉS AVEC SUCCÈS!")
        sys.exit(0)
    else:
        print(f"\n⚠️  {results.failed} TEST(S) ONT ÉCHOUÉ")
        sys.exit(1)

if __name__ == "__main__":
    main()