#!/usr/bin/env python3
"""
Test spécifique pour la connexion du Responsable d'Église
Test rapide pour identifier pourquoi "Invalid credentials" apparaît.
"""

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from frontend env
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://ministery-stars.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

def test_responsable_eglise_login():
    """Test la connexion du Responsable d'Église berger_dijon"""
    
    print("🔍 TEST CONNEXION RESPONSABLE D'ÉGLISE")
    print("=" * 50)
    
    # 1. Vérifier que le compte existe dans la base
    print("\n1. Vérification de l'existence du compte dans la base...")
    
    # First, let's try to get all users to see what exists
    try:
        # We need to login as admin first to check users
        admin_login_data = {
            "username": "superadmin",
            "password": "superadmin123", 
            "city": "Dijon"
        }
        
        print(f"   Tentative de connexion admin pour vérifier les utilisateurs...")
        admin_response = requests.post(f"{API_BASE}/auth/login", json=admin_login_data, timeout=30)
        
        if admin_response.status_code == 200:
            admin_token = admin_response.json()["token"]
            headers = {"Authorization": f"Bearer {admin_token}"}
            
            # Get all users
            users_response = requests.get(f"{API_BASE}/users/referents", headers=headers, timeout=30)
            if users_response.status_code == 200:
                users = users_response.json()
                
                # Look for berger_dijon
                berger_user = None
                for user in users:
                    if user.get("username") == "berger_dijon" and user.get("city") == "Dijon":
                        berger_user = user
                        break
                
                if berger_user:
                    print(f"   ✅ Compte trouvé:")
                    print(f"      - Username: {berger_user.get('username')}")
                    print(f"      - City: {berger_user.get('city')}")
                    print(f"      - Role: {berger_user.get('role')}")
                    print(f"      - ID: {berger_user.get('id')}")
                    
                    if berger_user.get('role') != 'responsable_eglise':
                        print(f"   ⚠️  ATTENTION: Le rôle est '{berger_user.get('role')}' au lieu de 'responsable_eglise'")
                else:
                    print(f"   ❌ Compte 'berger_dijon' non trouvé dans la ville 'Dijon'")
                    print(f"   📋 Utilisateurs existants à Dijon:")
                    dijon_users = [u for u in users if u.get('city') == 'Dijon']
                    for user in dijon_users[:10]:  # Show first 10
                        print(f"      - {user.get('username')} (role: {user.get('role')})")
                    
                    if len(dijon_users) > 10:
                        print(f"      ... et {len(dijon_users) - 10} autres utilisateurs")
            else:
                print(f"   ❌ Erreur lors de la récupération des utilisateurs: {users_response.status_code}")
                print(f"   Réponse: {users_response.text}")
        else:
            print(f"   ❌ Erreur de connexion admin: {admin_response.status_code}")
            print(f"   Réponse: {admin_response.text}")
            
    except Exception as e:
        print(f"   ❌ Erreur lors de la vérification: {str(e)}")
    
    # 2. Tester le login avec les credentials spécifiés
    print(f"\n2. Test de connexion avec berger_dijon...")
    
    login_data = {
        "username": "berger_dijon",
        "password": "test123",
        "city": "Dijon"
    }
    
    try:
        print(f"   Envoi de la requête POST {API_BASE}/auth/login")
        print(f"   Données: {json.dumps(login_data, indent=2)}")
        
        response = requests.post(f"{API_BASE}/auth/login", json=login_data, timeout=30)
        
        print(f"\n   Status Code: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ CONNEXION RÉUSSIE!")
            print(f"   Réponse complète: {json.dumps(data, indent=2)}")
            
            # 3. Vérifier la réponse
            print(f"\n3. Vérification de la réponse...")
            
            token = data.get("token")
            user = data.get("user", {})
            
            print(f"   Token présent: {'✅' if token else '❌'}")
            print(f"   User.role: {user.get('role')} {'✅' if user.get('role') == 'responsable_eglise' else '❌'}")
            print(f"   User.city: {user.get('city')} {'✅' if user.get('city') == 'Dijon' else '❌'}")
            
            if token and user.get('role') == 'responsable_eglise' and user.get('city') == 'Dijon':
                print(f"\n   🎉 TOUS LES CRITÈRES SONT SATISFAITS!")
                return True
            else:
                print(f"\n   ⚠️  Certains critères ne sont pas satisfaits")
                return False
                
        else:
            print(f"   ❌ ÉCHEC DE CONNEXION")
            print(f"   Message d'erreur exact: {response.text}")
            
            try:
                error_data = response.json()
                print(f"   Erreur JSON: {json.dumps(error_data, indent=2)}")
            except:
                print(f"   Réponse brute: {response.text}")
            
            return False
            
    except Exception as e:
        print(f"   ❌ Erreur lors de la requête: {str(e)}")
        return False

def main():
    """Fonction principale"""
    print(f"🚀 DÉMARRAGE DU TEST RESPONSABLE D'ÉGLISE")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"API Base: {API_BASE}")
    
    success = test_responsable_eglise_login()
    
    print(f"\n" + "=" * 50)
    if success:
        print(f"✅ TEST RÉUSSI: La connexion fonctionne correctement")
    else:
        print(f"❌ TEST ÉCHOUÉ: Problème identifié avec la connexion")
    print(f"=" * 50)

if __name__ == "__main__":
    main()