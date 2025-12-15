#!/usr/bin/env python3
"""
🎯 TEST COMPLET AVEC BREVO API - FONCTIONNALITÉ D'EMAIL DE CONFIRMATION RSVP
Test avec vraie API Brevo pour vérifier l'envoi d'emails

Ce test vérifie que les emails sont réellement envoyés quand toutes les conditions sont remplies.
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://dailymanna-1.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

# Test credentials
TEST_CREDENTIALS = {
    "username": "superadmin",
    "password": "superadmin123", 
    "city": "Dijon"
}

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

def test_email_sending_with_brevo():
    """Test email sending with real Brevo API"""
    print("🎯 TEST COMPLET AVEC BREVO API - EMAIL DE CONFIRMATION RSVP")
    print("="*80)
    
    # Authentication
    print("\n1️⃣ AUTHENTICATION")
    token = authenticate()
    if not token:
        print("❌ Cannot proceed without authentication")
        return False
    
    print("✅ Authentication successful")
    auth_headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    
    created_event_ids = []
    
    try:
        # Create event with email confirmation enabled
        print("\n2️⃣ CRÉATION D'ÉVÉNEMENT AVEC EMAIL CONFIRMATION ACTIVÉE")
        
        future_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        
        event_data = {
            "title": "Test Event - Email Brevo",
            "description": "Test de l'envoi d'email avec Brevo API",
            "date": future_date,
            "time": "19:00",
            "location": "Centre de Test Brevo, Dijon",
            "rsvp_enabled": True,
            "require_names": True,
            "require_email_contact": True,
            "confirmation_message": "Bonjour {prenom},\n\nVotre participation à {evenement} le {date} est confirmée !\n\nLieu: {lieu}\n\nÀ bientôt !\n\nÉquipe ICC BFC-Italie"
        }
        
        response = requests.post(f"{BASE_URL}/events", 
                               json=event_data, 
                               headers=auth_headers)
        
        if response.status_code != 200:
            print(f"❌ Event creation failed: {response.status_code} - {response.text}")
            return False
        
        event = response.json()
        event_id = event["id"]
        created_event_ids.append(event_id)
        
        print(f"✅ Event created with ID: {event_id}")
        print(f"✅ require_email_contact: {event.get('require_email_contact')}")
        print(f"✅ confirmation_message: {event.get('confirmation_message')[:50]}...")
        
        # Test RSVP with valid email (should trigger email sending)
        print("\n3️⃣ TEST RSVP AVEC EMAIL VALIDE (DEVRAIT ENVOYER EMAIL)")
        
        rsvp_data = {
            "name": "Jean Dupont Test Brevo",
            "first_name": "Jean",
            "last_name": "Dupont",
            "email": "impactcentrechretienbfcitalie@gmail.com",  # Using the sender email for testing
            "phone": "+33612345678",
            "status": "confirmed",
            "guests_count": 1,
            "is_star": True,
            "message": "Test d'envoi d'email avec Brevo"
        }
        
        response = requests.post(f"{BASE_URL}/events/{event_id}/rsvp-public", 
                               json=rsvp_data, 
                               headers=HEADERS)
        
        if response.status_code != 200:
            print(f"❌ RSVP submission failed: {response.status_code} - {response.text}")
            return False
        
        rsvp_response = response.json()
        print(f"✅ RSVP submitted with ID: {rsvp_response.get('id')}")
        
        # Check if email was sent
        email_sent = rsvp_response.get("email_sent")
        print(f"📧 Email sent status: {email_sent}")
        
        if email_sent == True:
            print("🎉 SUCCESS: Email was sent successfully via Brevo API!")
            print("📧 Check the email inbox for: impactcentrechretienbfcitalie@gmail.com")
        elif email_sent == False:
            print("⚠️  Email not sent - possible reasons:")
            print("   - BREVO_API_KEY not configured or invalid")
            print("   - Brevo API error")
            print("   - Missing confirmation_message")
            print("   - Email conditions not met")
        else:
            print(f"❌ Unexpected email_sent value: {email_sent}")
            return False
        
        # Verify RSVP data was stored correctly
        print("\n4️⃣ VÉRIFICATION DES DONNÉES RSVP")
        
        response = requests.get(f"{BASE_URL}/events/{event_id}/rsvp", 
                              headers=auth_headers)
        
        if response.status_code != 200:
            print(f"❌ Stats retrieval failed: {response.status_code} - {response.text}")
            return False
        
        stats = response.json()
        print(f"✅ Total RSVPs: {stats.get('total')}")
        print(f"✅ Confirmed RSVPs: {stats.get('confirmed')}")
        
        responses = stats.get("responses", [])
        if responses:
            first_response = responses[0]
            print(f"✅ Email stored: {first_response.get('email')}")
            print(f"✅ Phone stored: {first_response.get('phone')}")
            print(f"✅ is_star stored: {first_response.get('is_star')}")
        
        # Test with different email to avoid spam detection
        print("\n5️⃣ TEST AVEC DEUXIÈME EMAIL (DIFFÉRENT)")
        
        rsvp_data_2 = {
            "name": "Marie Martin Test",
            "first_name": "Marie", 
            "last_name": "Martin",
            "email": "test.rsvp.confirmation@gmail.com",  # Different email
            "phone": "+33612345679",
            "status": "confirmed",
            "guests_count": 2,
            "message": "Test avec deuxième email"
        }
        
        response = requests.post(f"{BASE_URL}/events/{event_id}/rsvp-public", 
                               json=rsvp_data_2, 
                               headers=HEADERS)
        
        if response.status_code == 200:
            rsvp_response_2 = response.json()
            email_sent_2 = rsvp_response_2.get("email_sent")
            print(f"✅ Second RSVP submitted")
            print(f"📧 Second email sent status: {email_sent_2}")
            
            if email_sent_2 == True:
                print("🎉 Second email also sent successfully!")
        else:
            print(f"⚠️  Second RSVP failed: {response.status_code}")
        
        return True
        
    except Exception as e:
        print(f"❌ Test error: {e}")
        return False
    
    finally:
        # Cleanup
        print("\n🧹 CLEANUP")
        for event_id in created_event_ids:
            try:
                response = requests.delete(f"{BASE_URL}/events/{event_id}", 
                                         headers=auth_headers)
                if response.status_code == 200:
                    print(f"✅ Event {event_id} deleted")
                else:
                    print(f"⚠️  Could not delete event {event_id}")
            except Exception as e:
                print(f"⚠️  Error deleting event {event_id}: {e}")

if __name__ == "__main__":
    success = test_email_sending_with_brevo()
    
    if success:
        print(f"\n🎉 TEST COMPLET RÉUSSI")
        print("📧 Vérifiez les boîtes email pour confirmer la réception des emails")
        sys.exit(0)
    else:
        print(f"\n🚨 TEST ÉCHOUÉ")
        sys.exit(1)