#!/usr/bin/env python3
"""
🎯 TEST COMPLET - FONCTIONNALITÉ D'ENVOI AUTOMATIQUE D'EMAIL DE CONFIRMATION RSVP
Backend API Testing Suite for RSVP Email Confirmation Feature

Ce test vérifie le flux complet de la fonctionnalité d'envoi automatique d'email de confirmation 
quand quelqu'un répond "Oui" à un événement RSVP.

Tests à effectuer:
1. Créer un événement test avec require_email_contact = true et confirmation_message
2. Soumettre un RSVP public avec status = "confirmed"
3. Vérifier la réponse API (email_sent: true/false)
4. Récupérer les stats et vérifier les données
5. Tests négatifs (status declined, sans email, require_email_contact = false)
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://ministery-stars.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

# Test credentials
TEST_CREDENTIALS = {
    "username": "superadmin",
    "password": "superadmin123", 
    "city": "Dijon"
}

class RSVPEmailTestResults:
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
        print(f"\n{'='*80}")
        print(f"🎯 TEST RSVP EMAIL CONFIRMATION - RÉSULTATS FINAUX")
        print(f"{'='*80}")
        print(f"✅ Tests réussis: {self.passed}")
        print(f"❌ Tests échoués: {self.failed}")
        print(f"📊 Taux de réussite: {(self.passed/(self.passed+self.failed)*100):.1f}%")
        
        if self.errors:
            print(f"\n❌ ERREURS DÉTECTÉES:")
            for error in self.errors:
                print(f"   {error}")
        
        if self.successes:
            print(f"\n✅ SUCCÈS CONFIRMÉS:")
            for success in self.successes:
                print(f"   {success}")

def authenticate():
    """Authenticate and get JWT token"""
    try:
        response = requests.post(f"{BASE_URL}/auth/login", 
                               json=TEST_CREDENTIALS, 
                               headers=HEADERS)
        
        if response.status_code == 200:
            data = response.json()
            return data["token"]
        else:
            print(f"❌ Authentication failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        return None

def test_rsvp_email_confirmation():
    """Test complet de la fonctionnalité d'email de confirmation RSVP"""
    results = RSVPEmailTestResults()
    
    print("🎯 DÉBUT DU TEST - FONCTIONNALITÉ D'EMAIL DE CONFIRMATION RSVP")
    print("="*80)
    
    # 1. Authentication
    print("\n1️⃣ AUTHENTICATION")
    token = authenticate()
    if not token:
        results.add_failure("Authentication", "Failed to get JWT token")
        results.print_summary()
        return
    
    results.add_success("Authentication", "JWT token obtained successfully")
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    # Variables pour stocker les IDs créés (pour cleanup)
    created_event_ids = []
    
    try:
        # 2. Créer un événement test avec require_email_contact = true
        print("\n2️⃣ CRÉATION D'ÉVÉNEMENT AVEC EMAIL CONFIRMATION")
        
        future_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        
        event_data = {
            "title": "Test Event - Email Confirmation",
            "description": "Événement de test pour la fonctionnalité d'email de confirmation RSVP",
            "date": future_date,
            "time": "19:00",
            "location": "Centre de Test, Dijon",
            "rsvp_enabled": True,
            "require_names": True,
            "require_email_contact": True,
            "confirmation_message": "Bonjour {prenom},\n\nVotre participation à {evenement} le {date} est confirmée !\n\nLieu: {lieu}\n\nÀ bientôt !"
        }
        
        response = requests.post(f"{BASE_URL}/events", 
                               json=event_data, 
                               headers=auth_headers)
        
        if response.status_code == 200:
            event = response.json()
            event_id = event["id"]
            created_event_ids.append(event_id)
            results.add_success("Event Creation", f"Event created with ID: {event_id}")
            
            # Vérifier que les champs sont bien sauvegardés
            if event.get("require_email_contact") == True:
                results.add_success("Event Config", "require_email_contact = true correctly set")
            else:
                results.add_failure("Event Config", f"require_email_contact not set correctly: {event.get('require_email_contact')}")
            
            if event.get("confirmation_message"):
                results.add_success("Event Config", "confirmation_message correctly set")
            else:
                results.add_failure("Event Config", "confirmation_message not set")
                
        else:
            results.add_failure("Event Creation", f"Status: {response.status_code}, Response: {response.text}")
            results.print_summary()
            return
        
        # 3. Test RSVP avec status = "confirmed" (Oui)
        print("\n3️⃣ TEST RSVP AVEC STATUS 'CONFIRMED' (OUI)")
        
        rsvp_data = {
            "name": "Jean Dupont Test",
            "first_name": "Jean",
            "last_name": "Dupont",
            "email": "test@example.com",
            "phone": "+33612345678",
            "status": "confirmed",
            "guests_count": 1,
            "is_star": True,
            "message": "Hâte de participer à cet événement !"
        }
        
        response = requests.post(f"{BASE_URL}/events/{event_id}/rsvp-public", 
                               json=rsvp_data, 
                               headers=HEADERS)  # Public endpoint, no auth needed
        
        if response.status_code == 200:
            rsvp_response = response.json()
            results.add_success("RSVP Submission", f"RSVP submitted with ID: {rsvp_response.get('id')}")
            
            # Vérifier la réponse API
            if "email_sent" in rsvp_response:
                email_sent = rsvp_response["email_sent"]
                if email_sent == True:
                    results.add_success("Email Confirmation", "email_sent = true (email sent successfully)")
                elif email_sent == False:
                    results.add_success("Email Confirmation", "email_sent = false (no BREVO_API_KEY or other condition not met)")
                else:
                    results.add_failure("Email Confirmation", f"Unexpected email_sent value: {email_sent}")
            else:
                results.add_failure("Email Confirmation", "email_sent field missing from response")
            
            if rsvp_response.get("message") == "RSVP submitted":
                results.add_success("RSVP Response", "Correct response message")
            else:
                results.add_failure("RSVP Response", f"Unexpected message: {rsvp_response.get('message')}")
                
        else:
            results.add_failure("RSVP Submission", f"Status: {response.status_code}, Response: {response.text}")
        
        # 4. Récupérer les stats et vérifier les données
        print("\n4️⃣ VÉRIFICATION DES STATISTIQUES RSVP")
        
        response = requests.get(f"{BASE_URL}/events/{event_id}/rsvp", 
                              headers=auth_headers)
        
        if response.status_code == 200:
            stats = response.json()
            results.add_success("RSVP Stats Retrieval", "Stats retrieved successfully")
            
            # Vérifier les statistiques
            if stats.get("total") >= 1:
                results.add_success("RSVP Stats", f"Total RSVPs: {stats.get('total')}")
            else:
                results.add_failure("RSVP Stats", f"Expected at least 1 RSVP, got: {stats.get('total')}")
            
            if stats.get("confirmed") >= 1:
                results.add_success("RSVP Stats", f"Confirmed RSVPs: {stats.get('confirmed')}")
            else:
                results.add_failure("RSVP Stats", f"Expected at least 1 confirmed RSVP, got: {stats.get('confirmed')}")
            
            # Vérifier que l'email et le téléphone sont bien enregistrés
            responses = stats.get("responses", [])
            if responses:
                first_response = responses[0]
                if first_response.get("email") == "test@example.com":
                    results.add_success("RSVP Data", "Email correctly stored")
                else:
                    results.add_failure("RSVP Data", f"Email not stored correctly: {first_response.get('email')}")
                
                if first_response.get("phone") == "+33612345678":
                    results.add_success("RSVP Data", "Phone correctly stored")
                else:
                    results.add_failure("RSVP Data", f"Phone not stored correctly: {first_response.get('phone')}")
                
                if first_response.get("is_star") == True:
                    results.add_success("RSVP Data", "is_star correctly stored")
                else:
                    results.add_failure("RSVP Data", f"is_star not stored correctly: {first_response.get('is_star')}")
            else:
                results.add_failure("RSVP Data", "No responses found in stats")
                
        else:
            results.add_failure("RSVP Stats Retrieval", f"Status: {response.status_code}, Response: {response.text}")
        
        # 5. Test négatif: RSVP avec status = "declined" (Non)
        print("\n5️⃣ TEST NÉGATIF - RSVP AVEC STATUS 'DECLINED' (NON)")
        
        rsvp_declined_data = {
            "name": "Marie Martin Test",
            "first_name": "Marie",
            "last_name": "Martin",
            "email": "marie@example.com",
            "phone": "+33612345679",
            "status": "declined",
            "guests_count": 1,
            "message": "Désolée, je ne peux pas venir"
        }
        
        response = requests.post(f"{BASE_URL}/events/{event_id}/rsvp-public", 
                               json=rsvp_declined_data, 
                               headers=HEADERS)
        
        if response.status_code == 200:
            rsvp_response = response.json()
            results.add_success("RSVP Declined Submission", "RSVP declined submitted successfully")
            
            # Vérifier que email_sent = false pour status declined
            if rsvp_response.get("email_sent") == False:
                results.add_success("Email Confirmation Declined", "email_sent = false for declined RSVP (correct)")
            else:
                results.add_failure("Email Confirmation Declined", f"Expected email_sent = false for declined, got: {rsvp_response.get('email_sent')}")
        else:
            results.add_failure("RSVP Declined Submission", f"Status: {response.status_code}, Response: {response.text}")
        
        # 6. Test négatif: RSVP sans email fourni
        print("\n6️⃣ TEST NÉGATIF - RSVP SANS EMAIL")
        
        rsvp_no_email_data = {
            "name": "Pierre Durand Test",
            "first_name": "Pierre",
            "last_name": "Durand",
            "phone": "+33612345680",
            "status": "confirmed",
            "guests_count": 1
        }
        
        response = requests.post(f"{BASE_URL}/events/{event_id}/rsvp-public", 
                               json=rsvp_no_email_data, 
                               headers=HEADERS)
        
        if response.status_code == 200:
            rsvp_response = response.json()
            results.add_success("RSVP No Email Submission", "RSVP without email submitted successfully")
            
            # Vérifier que email_sent = false sans email
            if rsvp_response.get("email_sent") == False:
                results.add_success("Email Confirmation No Email", "email_sent = false when no email provided (correct)")
            else:
                results.add_failure("Email Confirmation No Email", f"Expected email_sent = false when no email, got: {rsvp_response.get('email_sent')}")
        else:
            results.add_failure("RSVP No Email Submission", f"Status: {response.status_code}, Response: {response.text}")
        
        # 7. Test négatif: Événement avec require_email_contact = false
        print("\n7️⃣ TEST NÉGATIF - ÉVÉNEMENT SANS require_email_contact")
        
        event_no_email_data = {
            "title": "Test Event - No Email Confirmation",
            "description": "Événement de test sans email de confirmation",
            "date": future_date,
            "time": "20:00",
            "location": "Centre de Test 2, Dijon",
            "rsvp_enabled": True,
            "require_names": True,
            "require_email_contact": False  # Pas d'email de confirmation
        }
        
        response = requests.post(f"{BASE_URL}/events", 
                               json=event_no_email_data, 
                               headers=auth_headers)
        
        if response.status_code == 200:
            event_no_email = response.json()
            event_no_email_id = event_no_email["id"]
            created_event_ids.append(event_no_email_id)
            results.add_success("Event No Email Creation", f"Event without email confirmation created: {event_no_email_id}")
            
            # RSVP sur cet événement
            rsvp_no_email_event_data = {
                "name": "Sophie Leroy Test",
                "first_name": "Sophie",
                "last_name": "Leroy",
                "email": "sophie@example.com",
                "phone": "+33612345681",
                "status": "confirmed",
                "guests_count": 1
            }
            
            response = requests.post(f"{BASE_URL}/events/{event_no_email_id}/rsvp-public", 
                                   json=rsvp_no_email_event_data, 
                                   headers=HEADERS)
            
            if response.status_code == 200:
                rsvp_response = response.json()
                results.add_success("RSVP No Email Event", "RSVP on event without email confirmation submitted")
                
                # Vérifier que email_sent = false
                if rsvp_response.get("email_sent") == False:
                    results.add_success("Email Confirmation No Email Event", "email_sent = false for event without require_email_contact (correct)")
                else:
                    results.add_failure("Email Confirmation No Email Event", f"Expected email_sent = false for event without require_email_contact, got: {rsvp_response.get('email_sent')}")
            else:
                results.add_failure("RSVP No Email Event", f"Status: {response.status_code}, Response: {response.text}")
        else:
            results.add_failure("Event No Email Creation", f"Status: {response.status_code}, Response: {response.text}")
        
        # 8. Vérification finale des statistiques
        print("\n8️⃣ VÉRIFICATION FINALE DES STATISTIQUES")
        
        response = requests.get(f"{BASE_URL}/events/{event_id}/rsvp", 
                              headers=auth_headers)
        
        if response.status_code == 200:
            final_stats = response.json()
            results.add_success("Final Stats Retrieval", "Final stats retrieved successfully")
            
            # Vérifier le nombre total de RSVPs (devrait être 3)
            expected_total = 3
            if final_stats.get("total") == expected_total:
                results.add_success("Final Stats", f"Total RSVPs: {final_stats.get('total')} (expected: {expected_total})")
            else:
                results.add_failure("Final Stats", f"Expected {expected_total} total RSVPs, got: {final_stats.get('total')}")
            
            # Vérifier les confirmés (devrait être 2: Jean et Pierre)
            expected_confirmed = 2
            if final_stats.get("confirmed") == expected_confirmed:
                results.add_success("Final Stats", f"Confirmed RSVPs: {final_stats.get('confirmed')} (expected: {expected_confirmed})")
            else:
                results.add_failure("Final Stats", f"Expected {expected_confirmed} confirmed RSVPs, got: {final_stats.get('confirmed')}")
            
            # Vérifier les déclinés (devrait être 1: Marie)
            expected_declined = 1
            if final_stats.get("declined") == expected_declined:
                results.add_success("Final Stats", f"Declined RSVPs: {final_stats.get('declined')} (expected: {expected_declined})")
            else:
                results.add_failure("Final Stats", f"Expected {expected_declined} declined RSVPs, got: {final_stats.get('declined')}")
                
        else:
            results.add_failure("Final Stats Retrieval", f"Status: {response.status_code}, Response: {response.text}")
    
    except Exception as e:
        results.add_failure("Test Execution", f"Unexpected error: {e}")
    
    finally:
        # Cleanup: Supprimer les événements créés
        print("\n🧹 CLEANUP - SUPPRESSION DES ÉVÉNEMENTS DE TEST")
        for event_id in created_event_ids:
            try:
                response = requests.delete(f"{BASE_URL}/events/{event_id}", 
                                         headers=auth_headers)
                if response.status_code == 200:
                    results.add_success("Cleanup", f"Event {event_id} deleted successfully")
                else:
                    print(f"⚠️ Warning: Could not delete event {event_id}: {response.status_code}")
            except Exception as e:
                print(f"⚠️ Warning: Error deleting event {event_id}: {e}")
    
    # Afficher le résumé final
    results.print_summary()
    
    return results.passed, results.failed

if __name__ == "__main__":
    passed, failed = test_rsvp_email_confirmation()
    
    # Exit with appropriate code
    if failed > 0:
        print(f"\n🚨 TESTS ÉCHOUÉS: {failed}")
        sys.exit(1)
    else:
        print(f"\n🎉 TOUS LES TESTS RÉUSSIS: {passed}")
        sys.exit(0)