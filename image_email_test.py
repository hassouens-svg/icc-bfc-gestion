#!/usr/bin/env python3
"""
🎯 TEST UPLOAD IMAGE ET EMAIL AVEC IMAGE - ICC BFC-ITALIE
Test spécifique pour vérifier l'upload d'image et l'envoi d'email avec image
"""

import requests
import json
import sys
import base64
import tempfile
import os
from datetime import datetime

# Configuration
BASE_URL = "https://shepherd-track.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

# Test account
TEST_ACCOUNT = {"username": "superadmin", "password": "superadmin123", "city": "Dijon"}

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
        print(f"🎯 TEST UPLOAD IMAGE ET EMAIL - RÉSULTATS FINAUX")
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

def login_user():
    """Login and return JWT token"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json=TEST_ACCOUNT,
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

def create_test_image():
    """Créer une image test simple (1x1 pixel rouge en base64)"""
    # Image 1x1 pixel rouge en PNG base64
    base64_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    
    # Décoder et créer un fichier temporaire
    image_data = base64.b64decode(base64_image)
    
    # Créer un fichier temporaire
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
    temp_file.write(image_data)
    temp_file.close()
    
    return temp_file.name, base64_image

def test_image_upload(results, token):
    """TEST UPLOAD IMAGE"""
    print(f"\n📷 TEST 1: UPLOAD IMAGE")
    print(f"{'='*50}")
    
    try:
        # Créer une image test
        temp_file_path, base64_image = create_test_image()
        
        # Préparer les headers pour l'upload
        headers = {"Authorization": f"Bearer {token}"}
        
        # Upload l'image
        with open(temp_file_path, 'rb') as f:
            files = {'file': ('test.png', f, 'image/png')}
            
            response = requests.post(
                f"{BASE_URL}/events/upload-image",
                headers=headers,
                files=files,
                timeout=30
            )
        
        # Nettoyer le fichier temporaire
        os.unlink(temp_file_path)
        
        if response.status_code == 200:
            data = response.json()
            image_url = data.get("image_url")
            
            if image_url and image_url.startswith("https://") and "/uploads/" in image_url:
                results.add_success("Upload image", f"Image uploadée avec succès, URL: {image_url}")
                return image_url
            else:
                results.add_failure("Upload image", f"Format de réponse incorrect: {data}")
                return None
        else:
            results.add_failure("Upload image", f"Status: {response.status_code}, Response: {response.text}")
            return None
            
    except Exception as e:
        results.add_failure("Upload image", f"Exception: {str(e)}")
        return None

def test_email_with_image(results, token, image_url):
    """TEST EMAIL AVEC IMAGE"""
    print(f"\n📧 TEST 2: EMAIL AVEC IMAGE")
    print(f"{'='*50}")
    
    try:
        # Créer campagne avec URL image base64
        campaign_data = {
            "titre": "Test Image Complete",
            "type": "email",
            "message": "Bonjour {prenom}, voici l'affiche du camp.",
            "destinataires": [
                {
                    "prenom": "Test",
                    "nom": "Image", 
                    "email": "hassouens@gmail.com",
                    "telephone": ""
                }
            ],
            "image_url": image_url,
            "enable_rsvp": False,
            "date_envoi": ""
        }
        
        headers = {**HEADERS, "Authorization": f"Bearer {token}"}
        
        # Créer la campagne
        response = requests.post(
            f"{BASE_URL}/events/campagnes",
            headers=headers,
            json=campaign_data,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            campaign_id = data.get("id")
            
            if campaign_id:
                results.add_success("Créer campagne avec image", f"Campagne créée avec ID: {campaign_id}")
                
                # Envoyer la campagne
                send_response = requests.post(
                    f"{BASE_URL}/events/campagnes/{campaign_id}/envoyer",
                    headers=headers,
                    timeout=30
                )
                
                if send_response.status_code == 200:
                    send_data = send_response.json()
                    results.add_success("Envoyer campagne avec image", f"Campagne envoyée: {send_data}")
                    return campaign_id
                else:
                    results.add_failure("Envoyer campagne avec image", f"Status: {send_response.status_code}, Response: {send_response.text}")
                    return campaign_id
            else:
                results.add_failure("Créer campagne avec image", f"Pas d'ID retourné: {data}")
                return None
        else:
            results.add_failure("Créer campagne avec image", f"Status: {response.status_code}, Response: {response.text}")
            return None
            
    except Exception as e:
        results.add_failure("Email avec image", f"Exception: {str(e)}")
        return None

def check_backend_logs(results):
    """VÉRIFIER LOGS BACKEND"""
    print(f"\n📋 TEST 3: VÉRIFICATION LOGS BACKEND")
    print(f"{'='*50}")
    
    try:
        # Essayer de lire les logs backend
        import subprocess
        
        # Chercher les logs de debug pour l'image
        log_command = ["tail", "-n", "100", "/var/log/supervisor/backend.err.log"]
        
        try:
            result = subprocess.run(log_command, capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                log_content = result.stdout
                
                # Chercher les messages de debug spécifiques
                if "DEBUG: Ajout image dans email" in log_content:
                    results.add_success("Logs backend - image ajoutée", "Trouvé: 'DEBUG: Ajout image dans email'")
                elif "DEBUG: Pas d'image_url" in log_content:
                    results.add_failure("Logs backend - pas d'image", "Trouvé: 'DEBUG: Pas d'image_url' - image_url est vide")
                else:
                    results.add_failure("Logs backend - debug manquant", "Aucun message DEBUG trouvé pour l'image")
                
                # Afficher les dernières lignes des logs pour diagnostic
                print(f"📋 Dernières lignes des logs backend:")
                print(log_content[-500:])  # Derniers 500 caractères
                
            else:
                results.add_failure("Logs backend - lecture", f"Erreur lecture logs: {result.stderr}")
                
        except subprocess.TimeoutExpired:
            results.add_failure("Logs backend - timeout", "Timeout lors de la lecture des logs")
        except FileNotFoundError:
            results.add_failure("Logs backend - fichier", "Fichier de logs non trouvé")
            
    except Exception as e:
        results.add_failure("Logs backend", f"Exception: {str(e)}")

def test_campaign_verification(results, token, campaign_id):
    """TEST 4: VÉRIFICATION CAMPAGNE"""
    print(f"\n🔍 TEST 4: VÉRIFICATION CAMPAGNE")
    print(f"{'='*50}")
    
    if not campaign_id:
        results.add_failure("Vérification campagne", "Pas de campaign_id disponible")
        return
    
    try:
        headers = {**HEADERS, "Authorization": f"Bearer {token}"}
        
        # Récupérer les détails de la campagne
        response = requests.get(
            f"{BASE_URL}/events/campagnes/{campaign_id}",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # Vérifier que image_url est bien présent
            image_url = data.get("image_url")
            if image_url and (image_url.startswith("https://") or image_url.startswith("data:image/")):
                results.add_success("Vérification campagne - image_url", f"image_url présent et valide: {image_url}")
            else:
                results.add_failure("Vérification campagne - image_url", f"image_url manquant ou invalide: {image_url}")
            
            # Vérifier les destinataires
            destinataires = data.get("destinataires", [])
            if len(destinataires) > 0:
                results.add_success("Vérification campagne - destinataires", f"{len(destinataires)} destinataire(s) trouvé(s)")
            else:
                results.add_failure("Vérification campagne - destinataires", "Aucun destinataire trouvé")
            
            # Vérifier le statut
            statut = data.get("statut")
            if statut == "envoye":
                results.add_success("Vérification campagne - statut", f"Statut: {statut}")
            else:
                results.add_failure("Vérification campagne - statut", f"Statut incorrect: {statut}")
                
        else:
            results.add_failure("Vérification campagne", f"Status: {response.status_code}, Response: {response.text}")
            
    except Exception as e:
        results.add_failure("Vérification campagne", f"Exception: {str(e)}")

def main():
    """Main test execution"""
    print(f"🎯 TEST UPLOAD IMAGE ET EMAIL AVEC IMAGE - ICC BFC-ITALIE")
    print(f"Backend URL: {BASE_URL}")
    print(f"Début des tests: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = TestResults()
    
    # Login
    print(f"\n🔐 AUTHENTIFICATION")
    print(f"{'='*50}")
    
    token, user_or_error = login_user()
    
    if not token:
        print(f"❌ ARRÊT CRITIQUE: {user_or_error}")
        return 1
    
    results.add_success("Login superadmin", f"JWT token généré, role: {user_or_error.get('role', 'N/A')}")
    
    # Test 1: Upload image
    image_url = test_image_upload(results, token)
    
    # Test 2: Email avec image
    campaign_id = None
    if image_url:
        campaign_id = test_email_with_image(results, token, image_url)
    else:
        # Skip email test if image upload failed
        results.add_failure("Email avec image", "Skipped due to image upload failure")
        campaign_id = None
    
    # Test 3: Vérifier logs backend
    check_backend_logs(results)
    
    # Test 4: Vérification campagne
    test_campaign_verification(results, token, campaign_id)
    
    # Résultats finaux
    results.print_summary()
    
    # Instructions pour vérification manuelle
    print(f"\n📧 VÉRIFICATION MANUELLE REQUISE:")
    print(f"{'='*50}")
    print(f"1. Vérifier l'email reçu à: hassouens@gmail.com")
    print(f"2. L'email doit contenir:")
    print(f"   ✅ Logo ICC en haut")
    print(f"   ✅ Texte personnalisé 'Bonjour Test'")
    print(f"   ✅ **IMAGE DE L'AFFICHE EN BAS DU TEXTE** (c'est ça qui manque)")
    print(f"   ✅ Pas de bouton RSVP (enable_rsvp=false)")
    
    if results.failed == 0:
        print(f"\n🎉 TOUS LES TESTS BACKEND SONT PASSÉS!")
        print(f"⚠️  Vérification manuelle de l'email requise pour confirmer que l'image apparaît.")
        return 0
    else:
        print(f"\n⚠️  {results.failed} tests ont échoué. Vérification nécessaire.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)