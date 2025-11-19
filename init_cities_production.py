#!/usr/bin/env python3
"""
Script d'initialisation des villes pour la production
Exécutez ce script avec vos informations de production
"""

import requests
import json

# ⚠️ CONFIGUREZ VOS INFORMATIONS ICI ⚠️
PRODUCTION_URL = "https://VOTRE-URL.emergent.host"  # Remplacez par votre URL
SUPERADMIN_USERNAME = "superadmin"
SUPERADMIN_PASSWORD = "VOTRE_MOT_DE_PASSE"  # Remplacez par votre mot de passe

def main():
    print("🚀 Initialisation des villes en production...")
    print(f"📍 URL: {PRODUCTION_URL}")
    
    # Étape 1: Login
    print("\n1️⃣ Connexion en tant que superadmin...")
    login_url = f"{PRODUCTION_URL}/api/auth/login"
    login_data = {
        "username": SUPERADMIN_USERNAME,
        "password": SUPERADMIN_PASSWORD,
        "city": "Dijon"
    }
    
    try:
        response = requests.post(login_url, json=login_data)
        response.raise_for_status()
        token = response.json().get('token')
        
        if not token:
            print("❌ Erreur: Impossible d'obtenir le token")
            return
        
        print("✅ Connexion réussie")
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Erreur de connexion: {e}")
        return
    
    # Étape 2: Initialiser les villes
    print("\n2️⃣ Initialisation des villes...")
    init_url = f"{PRODUCTION_URL}/api/cities/initialize"
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.post(init_url, headers=headers)
        response.raise_for_status()
        result = response.json()
        
        print("\n✅ SUCCÈS!")
        print(f"   📊 Résultat:")
        print(f"      - Villes créées: {result.get('created_count', 0)}")
        print(f"      - Villes mises à jour: {result.get('updated_count', 0)}")
        print(f"      - Total de villes: {result.get('total_cities', 0)}")
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Erreur lors de l'initialisation: {e}")
        if hasattr(e.response, 'text'):
            print(f"   Détails: {e.response.text}")
        return
    
    # Étape 3: Vérifier les villes
    print("\n3️⃣ Vérification des villes...")
    cities_url = f"{PRODUCTION_URL}/api/cities"
    
    try:
        response = requests.get(cities_url)
        response.raise_for_status()
        cities = response.json()
        
        print(f"\n✅ {len(cities)} villes disponibles:")
        for city in sorted(cities, key=lambda x: x.get('name', '')):
            country = city.get('country', 'N/A')
            name = city.get('name', 'N/A')
            print(f"   • {name}: {country}")
        
    except requests.exceptions.RequestException as e:
        print(f"⚠️ Avertissement: Impossible de vérifier les villes: {e}")
    
    print("\n✅ Terminé! Vous pouvez maintenant redéployer l'application.")

if __name__ == "__main__":
    # Vérifier que l'URL et le mot de passe ont été configurés
    if "VOTRE-URL" in PRODUCTION_URL or "VOTRE_MOT_DE_PASSE" in SUPERADMIN_PASSWORD:
        print("❌ ERREUR: Veuillez configurer PRODUCTION_URL et SUPERADMIN_PASSWORD dans le script")
        print("   Modifiez les lignes 9-11 du fichier")
        exit(1)
    
    main()
