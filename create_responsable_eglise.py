#!/usr/bin/env python3
"""
Créer le compte Responsable d'Église berger_dijon
"""

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from frontend env
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://agenda-ministry.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

def create_responsable_eglise():
    """Créer le compte berger_dijon avec le rôle responsable_eglise"""
    
    print("🔧 CRÉATION DU COMPTE RESPONSABLE D'ÉGLISE")
    print("=" * 50)
    
    # 1. Se connecter en tant que super admin
    print("\n1. Connexion en tant que Super Admin...")
    
    admin_login_data = {
        "username": "superadmin",
        "password": "superadmin123", 
        "city": "Dijon"
    }
    
    try:
        admin_response = requests.post(f"{API_BASE}/auth/login", json=admin_login_data, timeout=30)
        
        if admin_response.status_code != 200:
            print(f"   ❌ Erreur de connexion admin: {admin_response.status_code}")
            print(f"   Réponse: {admin_response.text}")
            return False
            
        admin_token = admin_response.json()["token"]
        headers = {"Authorization": f"Bearer {admin_token}"}
        print(f"   ✅ Connexion admin réussie")
        
        # 2. Créer le compte berger_dijon
        print(f"\n2. Création du compte berger_dijon...")
        
        user_data = {
            "username": "berger_dijon",
            "password": "test123",
            "city": "Dijon",
            "role": "responsable_eglise"
        }
        
        print(f"   Données utilisateur: {json.dumps(user_data, indent=2)}")
        
        create_response = requests.post(f"{API_BASE}/users", json=user_data, headers=headers, timeout=30)
        
        print(f"   Status Code: {create_response.status_code}")
        
        if create_response.status_code == 200:
            result = create_response.json()
            print(f"   ✅ Compte créé avec succès!")
            print(f"   Réponse: {json.dumps(result, indent=2)}")
            return True
        else:
            print(f"   ❌ Erreur lors de la création: {create_response.status_code}")
            print(f"   Message: {create_response.text}")
            
            try:
                error_data = create_response.json()
                print(f"   Erreur JSON: {json.dumps(error_data, indent=2)}")
            except:
                pass
            
            return False
            
    except Exception as e:
        print(f"   ❌ Erreur: {str(e)}")
        return False

def test_login_after_creation():
    """Tester la connexion après création"""
    
    print(f"\n3. Test de connexion après création...")
    
    login_data = {
        "username": "berger_dijon",
        "password": "test123",
        "city": "Dijon"
    }
    
    try:
        response = requests.post(f"{API_BASE}/auth/login", json=login_data, timeout=30)
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ CONNEXION RÉUSSIE!")
            
            user = data.get("user", {})
            print(f"   Token présent: {'✅' if data.get('token') else '❌'}")
            print(f"   User.role: {user.get('role')} {'✅' if user.get('role') == 'responsable_eglise' else '❌'}")
            print(f"   User.city: {user.get('city')} {'✅' if user.get('city') == 'Dijon' else '❌'}")
            
            return True
        else:
            print(f"   ❌ Échec de connexion: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Erreur: {str(e)}")
        return False

def main():
    """Fonction principale"""
    print(f"🚀 CRÉATION ET TEST DU COMPTE RESPONSABLE D'ÉGLISE")
    print(f"Backend URL: {BACKEND_URL}")
    
    # Créer le compte
    creation_success = create_responsable_eglise()
    
    if creation_success:
        # Tester la connexion
        login_success = test_login_after_creation()
        
        print(f"\n" + "=" * 50)
        if login_success:
            print(f"✅ SUCCÈS COMPLET: Compte créé et connexion fonctionnelle")
        else:
            print(f"⚠️  Compte créé mais problème de connexion")
    else:
        print(f"\n" + "=" * 50)
        print(f"❌ ÉCHEC: Impossible de créer le compte")
    
    print(f"=" * 50)

if __name__ == "__main__":
    main()