#!/usr/bin/env python3
"""
SCRIPT DE CORRECTION DES URLs APRÈS DÉPLOIEMENT
À lancer après avoir déployé sur le nouveau site

Ce script met à jour automatiquement les URLs dans les fichiers .env
"""

import os
import sys

def fix_urls_after_deployment():
    print("=" * 80)
    print("CORRECTION DES URLs APRÈS DÉPLOIEMENT")
    print("=" * 80)
    
    # Détecter l'URL actuelle depuis les variables d'environnement Emergent
    # Emergent injecte automatiquement EMERGENT_APP_URL lors du déploiement
    deployed_url = os.environ.get('EMERGENT_APP_URL', '')
    
    if not deployed_url:
        print("\n⚠️  EMERGENT_APP_URL non trouvé dans l'environnement")
        print("Veuillez entrer l'URL de votre site déployé:")
        print("Exemple: https://icc-management.emergent.host")
        deployed_url = input("URL du site: ").strip()
    
    if not deployed_url:
        print("❌ URL non fournie. Abandon.")
        return False
    
    # Enlever le trailing slash si présent
    deployed_url = deployed_url.rstrip('/')
    
    print(f"\n✅ URL du site déployé: {deployed_url}")
    
    # Chemins des fichiers .env
    backend_env_path = '/app/backend/.env'
    frontend_env_path = '/app/frontend/.env'
    
    # ====================
    # 1. MISE À JOUR FRONTEND .ENV
    # ====================
    print("\n1. MISE À JOUR DU FRONTEND...")
    print("-" * 80)
    
    try:
        # Lire le fichier frontend .env
        with open(frontend_env_path, 'r') as f:
            frontend_env_content = f.read()
        
        # Remplacer l'ancienne URL par la nouvelle
        # Chercher toutes les variantes possibles
        old_urls = [
            'https://multi-city-faith.preview.emergentagent.com',
            'http://localhost:8001',
            'http://localhost:3000',
        ]
        
        updated = False
        for old_url in old_urls:
            if old_url in frontend_env_content:
                frontend_env_content = frontend_env_content.replace(old_url, deployed_url)
                print(f"   ✅ Remplacé: {old_url} → {deployed_url}")
                updated = True
        
        # Si REACT_APP_BACKEND_URL n'existe pas, l'ajouter
        if 'REACT_APP_BACKEND_URL' not in frontend_env_content:
            frontend_env_content += f'\nREACT_APP_BACKEND_URL={deployed_url}\n'
            print(f"   ✅ Ajouté: REACT_APP_BACKEND_URL={deployed_url}")
            updated = True
        
        if updated:
            # Écrire le nouveau contenu
            with open(frontend_env_path, 'w') as f:
                f.write(frontend_env_content)
            print("   ✅ Frontend .env mis à jour")
        else:
            print("   ℹ️  Aucune modification nécessaire (déjà à jour)")
        
    except Exception as e:
        print(f"   ❌ Erreur lors de la mise à jour du frontend: {str(e)}")
        return False
    
    # ====================
    # 2. VÉRIFICATION BACKEND .ENV
    # ====================
    print("\n2. VÉRIFICATION DU BACKEND...")
    print("-" * 80)
    
    try:
        with open(backend_env_path, 'r') as f:
            backend_env_content = f.read()
        
        # Vérifier MONGO_URL
        if 'MONGO_URL' in backend_env_content:
            print("   ✅ MONGO_URL présent")
        else:
            print("   ⚠️  MONGO_URL manquant - ajout par défaut")
            backend_env_content += '\nMONGO_URL="mongodb://localhost:27017"\n'
            with open(backend_env_path, 'w') as f:
                f.write(backend_env_content)
        
        # Vérifier DB_NAME
        if 'DB_NAME' in backend_env_content:
            print("   ✅ DB_NAME présent")
        else:
            print("   ⚠️  DB_NAME manquant - ajout par défaut")
            backend_env_content += '\nDB_NAME="test_database"\n'
            with open(backend_env_path, 'w') as f:
                f.write(backend_env_content)
        
        # Vérifier CORS_ORIGINS
        if 'CORS_ORIGINS' in backend_env_content:
            print("   ✅ CORS_ORIGINS présent")
        else:
            print("   ⚠️  CORS_ORIGINS manquant - ajout")
            backend_env_content += '\nCORS_ORIGINS="*"\n'
            with open(backend_env_path, 'w') as f:
                f.write(backend_env_content)
        
    except Exception as e:
        print(f"   ❌ Erreur lors de la vérification du backend: {str(e)}")
        return False
    
    # ====================
    # 3. AFFICHAGE DES FICHIERS .ENV FINAUX
    # ====================
    print("\n3. CONFIGURATION FINALE...")
    print("-" * 80)
    
    print("\nBackend .env:")
    try:
        with open(backend_env_path, 'r') as f:
            print(f.read())
    except:
        print("   ❌ Impossible de lire le fichier")
    
    print("\nFrontend .env:")
    try:
        with open(frontend_env_path, 'r') as f:
            print(f.read())
    except:
        print("   ❌ Impossible de lire le fichier")
    
    # ====================
    # 4. REDÉMARRAGE DES SERVICES
    # ====================
    print("\n4. REDÉMARRAGE DES SERVICES...")
    print("-" * 80)
    
    try:
        import subprocess
        
        print("   Redémarrage du backend...")
        subprocess.run(['sudo', 'supervisorctl', 'restart', 'backend'], check=True)
        print("   ✅ Backend redémarré")
        
        print("   Redémarrage du frontend...")
        subprocess.run(['sudo', 'supervisorctl', 'restart', 'frontend'], check=True)
        print("   ✅ Frontend redémarré")
        
    except Exception as e:
        print(f"   ⚠️  Erreur lors du redémarrage: {str(e)}")
        print("   Veuillez redémarrer manuellement:")
        print("   sudo supervisorctl restart backend")
        print("   sudo supervisorctl restart frontend")
    
    print("\n" + "=" * 80)
    print("CORRECTION TERMINÉE ✅")
    print("=" * 80)
    print(f"\nVotre site devrait maintenant fonctionner sur:")
    print(f"  {deployed_url}")
    print(f"\nPages à tester:")
    print(f"  - {deployed_url}/acces-specifiques")
    print(f"  - {deployed_url}/login")
    print("\n⚠️  N'OUBLIEZ PAS de lancer ensuite:")
    print("  python3 INIT_DATABASE_PRODUCTION.py")
    print("\nPour initialiser la base de données avec les utilisateurs et villes.")
    print("")
    
    return True

if __name__ == "__main__":
    success = fix_urls_after_deployment()
    sys.exit(0 if success else 1)
