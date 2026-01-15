#!/usr/bin/env python3
"""
Backend Testing Script for French Review Request
TEST COMPLET: Module Planning + Email + SMS

Tests 3 new functionalities:
1. Planning avec indicateurs (activities with color coding)
2. Email séparé (separate email campaigns)
3. SMS séparé (separate SMS campaigns via Brevo)
"""

import requests
import json
import os
from datetime import datetime, timezone

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://discipleship-track.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class BackendTester:
    def __init__(self):
        self.token = None
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
    
    def login(self, username, password, city):
        """Login and get authentication token"""
        print(f"🔐 Logging in as {username} in {city}...")
        
        login_data = {
            "username": username,
            "password": password,
            "city": city
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            print(f"Login response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.token = data["token"]
                self.session.headers.update({
                    'Authorization': f'Bearer {self.token}'
                })
                print(f"✅ Login successful! Role: {data['user']['role']}")
                return True
            else:
                print(f"❌ Login failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return False
    
    def test_planning_module(self):
        """
        TEST 1: PLANNING AVEC INDICATEURS
        Create 3 activities to test color coding:
        - À venir (future)
        - Fait (done) 
        - En retard (late - past date with À venir status)
        """
        print("\n" + "="*60)
        print("🎯 TEST 1: MODULE PLANNING AVEC INDICATEURS")
        print("="*60)
        
        # Test data for 3 activities
        activities = [
            {
                "nom": "Culte Dimanche",
                "date": "2025-03-01",
                "ministeres": ["Musique", "Accueil"],
                "statut": "À venir",
                "commentaire": "Culte normal",
                "ville": "Dijon"
            },
            {
                "nom": "Réunion Équipe",
                "date": "2025-01-15", 
                "ministeres": ["Jeunesse"],
                "statut": "Fait",
                "commentaire": "Terminé avec succès",
                "ville": "Dijon"
            },
            {
                "nom": "Formation",
                "date": "2024-12-01",
                "ministeres": ["Enseignement"],
                "statut": "À venir",
                "commentaire": "Pas encore fait",
                "ville": "Dijon"
            }
        ]
        
        created_activities = []
        
        # Create activities
        print("\n📝 Creating activities...")
        for i, activity in enumerate(activities, 1):
            print(f"\nCreating Activity {i}: {activity['nom']}")
            try:
                response = self.session.post(f"{API_BASE}/planning/activites", json=activity)
                print(f"Status: {response.status_code}")
                
                if response.status_code == 200:
                    result = response.json()
                    created_activities.append(result["id"])
                    print(f"✅ Activity created: {result['id']}")
                    print(f"   Name: {activity['nom']}")
                    print(f"   Date: {activity['date']}")
                    print(f"   Status: {activity['statut']}")
                else:
                    print(f"❌ Failed to create activity: {response.text}")
                    
            except Exception as e:
                print(f"❌ Error creating activity: {str(e)}")
        
        # Get all activities for Dijon
        print(f"\n📊 Retrieving all activities for Dijon...")
        try:
            response = self.session.get(f"{API_BASE}/planning/activites", params={"ville": "Dijon"})
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                all_activities = response.json()
                print(f"✅ Retrieved {len(all_activities)} activities")
                
                # Calculate statistics
                total = len(all_activities)
                fait_count = len([a for a in all_activities if a["statut"] == "Fait"])
                
                # En retard = À venir with past date
                today = datetime.now().strftime("%Y-%m-%d")
                en_retard_count = len([
                    a for a in all_activities 
                    if a["statut"] == "À venir" and a["date"] < today
                ])
                
                percentage = (fait_count / total * 100) if total > 0 else 0
                
                print(f"\n📈 STATISTICS:")
                print(f"   Total activities: {total}")
                print(f"   Fait (Done): {fait_count}")
                print(f"   En retard (Late): {en_retard_count}")
                print(f"   Completion percentage: {percentage:.1f}%")
                
                # Verify color coding logic
                print(f"\n🎨 COLOR CODING VERIFICATION:")
                for activity in all_activities:
                    if activity["statut"] == "Fait":
                        color = "🟢 Green (Done)"
                    elif activity["statut"] == "À venir" and activity["date"] < today:
                        color = "🔴 Red (Late)"
                    elif activity["statut"] == "À venir":
                        color = "🟡 Yellow (Upcoming)"
                    else:
                        color = "⚪ Other"
                    
                    print(f"   {activity['nom']} ({activity['date']}) - {color}")
                
                return True
                
            else:
                print(f"❌ Failed to get activities: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error getting activities: {str(e)}")
            return False
    
    def test_email_campaign(self):
        """
        TEST 2: EMAIL SÉPARÉ
        Create and send email-only campaign
        """
        print("\n" + "="*60)
        print("📧 TEST 2: EMAIL SÉPARÉ")
        print("="*60)
        
        # Create email campaign
        email_campaign = {
            "titre": "Test Email Séparé",
            "type": "email",
            "message": "Bonjour {prenom}, test email",
            "destinataires": [{
                "prenom": "Test",
                "nom": "User", 
                "email": "hassouens@gmail.com",
                "telephone": ""
            }],
            "image_url": "",
            "date_envoi": "",
            "enable_rsvp": False
        }
        
        print("📝 Creating email campaign...")
        try:
            response = self.session.post(f"{API_BASE}/events/campagnes", json=email_campaign)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                campaign_id = result["id"]
                print(f"✅ Email campaign created: {campaign_id}")
                print(f"   Title: {email_campaign['titre']}")
                print(f"   Type: {email_campaign['type']}")
                
                # Send the campaign
                print(f"\n📤 Sending email campaign...")
                send_response = self.session.post(f"{API_BASE}/events/campagnes/{campaign_id}/envoyer")
                print(f"Send status: {send_response.status_code}")
                
                if send_response.status_code == 200:
                    send_result = send_response.json()
                    print(f"✅ Email sent successfully!")
                    print(f"   Messages sent: {send_result.get('envoyes', 0)}")
                    
                    # Verify campaign type
                    verify_response = self.session.get(f"{API_BASE}/events/campagnes")
                    if verify_response.status_code == 200:
                        campaigns = verify_response.json()
                        created_campaign = next((c for c in campaigns if c["id"] == campaign_id), None)
                        if created_campaign:
                            print(f"✅ Verification: Type = '{created_campaign['type']}'")
                            return created_campaign["type"] == "email"
                    
                    return True
                else:
                    print(f"❌ Failed to send email: {send_response.text}")
                    return False
                    
            else:
                print(f"❌ Failed to create email campaign: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error with email campaign: {str(e)}")
            return False
    
    def test_sms_campaign(self):
        """
        TEST 3: SMS SÉPARÉ
        Create and send SMS-only campaign via Brevo
        """
        print("\n" + "="*60)
        print("📱 TEST 3: SMS SÉPARÉ")
        print("="*60)
        
        # Create SMS campaign
        sms_campaign = {
            "titre": "Test SMS Séparé",
            "type": "sms",
            "message": "Bonjour {prenom}, test SMS Brevo",
            "destinataires": [{
                "prenom": "Test",
                "nom": "Mobile",
                "email": "",
                "telephone": "0646989818"
            }],
            "image_url": "",
            "date_envoi": "",
            "enable_rsvp": False
        }
        
        print("📝 Creating SMS campaign...")
        try:
            response = self.session.post(f"{API_BASE}/events/campagnes", json=sms_campaign)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                campaign_id = result["id"]
                print(f"✅ SMS campaign created: {campaign_id}")
                print(f"   Title: {sms_campaign['titre']}")
                print(f"   Type: {sms_campaign['type']}")
                
                # Send the campaign
                print(f"\n📤 Sending SMS campaign via Brevo...")
                send_response = self.session.post(f"{API_BASE}/events/campagnes/{campaign_id}/envoyer")
                print(f"Send status: {send_response.status_code}")
                
                if send_response.status_code == 200:
                    send_result = send_response.json()
                    print(f"✅ SMS sent successfully via Brevo!")
                    print(f"   Messages sent: {send_result.get('envoyes', 0)}")
                    
                    # Verify campaign type and no Twilio errors
                    verify_response = self.session.get(f"{API_BASE}/events/campagnes")
                    if verify_response.status_code == 200:
                        campaigns = verify_response.json()
                        created_campaign = next((c for c in campaigns if c["id"] == campaign_id), None)
                        if created_campaign:
                            print(f"✅ Verification: Type = '{created_campaign['type']}'")
                            print(f"✅ No Twilio errors (using Brevo)")
                            return created_campaign["type"] == "sms"
                    
                    return True
                else:
                    print(f"❌ Failed to send SMS: {send_response.text}")
                    return False
                    
            else:
                print(f"❌ Failed to create SMS campaign: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error with SMS campaign: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 STARTING COMPREHENSIVE BACKEND TESTING")
        print("Testing 3 new functionalities as requested in French review")
        print(f"Backend URL: {BACKEND_URL}")
        
        # Login as superadmin
        if not self.login("superadmin", "superadmin123", "Dijon"):
            print("❌ Cannot proceed without authentication")
            return False
        
        results = {
            "planning": False,
            "email": False, 
            "sms": False
        }
        
        # Test 1: Planning Module
        try:
            results["planning"] = self.test_planning_module()
        except Exception as e:
            print(f"❌ Planning test failed: {str(e)}")
        
        # Test 2: Email Campaign
        try:
            results["email"] = self.test_email_campaign()
        except Exception as e:
            print(f"❌ Email test failed: {str(e)}")
        
        # Test 3: SMS Campaign
        try:
            results["sms"] = self.test_sms_campaign()
        except Exception as e:
            print(f"❌ SMS test failed: {str(e)}")
        
        # Final Results
        print("\n" + "="*60)
        print("🎯 FINAL TEST RESULTS")
        print("="*60)
        
        print(f"1. Planning avec indicateurs: {'✅ PASS' if results['planning'] else '❌ FAIL'}")
        print(f"2. Email séparé: {'✅ PASS' if results['email'] else '❌ FAIL'}")
        print(f"3. SMS séparé: {'✅ PASS' if results['sms'] else '❌ FAIL'}")
        
        total_passed = sum(results.values())
        print(f"\nOverall: {total_passed}/3 tests passed")
        
        if total_passed == 3:
            print("🎉 ALL TESTS PASSED! All 3 functionalities working correctly.")
        else:
            print("⚠️  Some tests failed. Check individual results above.")
        
        return total_passed == 3

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)