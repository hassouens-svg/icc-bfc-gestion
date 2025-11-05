================================================================================
  ICC BFC-ITALIE - INSTRUCTIONS RAPIDES APRÈS DÉPLOIEMENT
================================================================================

🔴 PROBLÈME : Aucun identifiant ne fonctionne après déploiement ?
                Vous voyez deux "Dijon" ?

✅ SOLUTION EN 3 ÉTAPES :

1. Accéder au terminal du site déployé

2. Lancer cette commande :
   
   cd /app && python3 INIT_DATABASE_PRODUCTION.py

3. Attendre le message "INITIALISATION TERMINÉE AVEC SUCCÈS ✅"

================================================================================

RÉSULTAT :
- 8 villes créées (PAS de doublon)
- 9 utilisateurs créés avec mots de passe fonctionnels

TESTER :
- Aller sur : https://votre-site.com/acces-specifiques
- Login : pasteur
- Password : pasteur123
- ✅ Devrait fonctionner !

================================================================================

IDENTIFIANTS PAR DÉFAUT :

Accès Spécifiques (/acces-specifiques) :
- superadmin / superadmin123
- pasteur / pasteur123

Login Normal (/login → Dijon) :
- admin / admin123
- superviseur_fi / superviseur123
- referent1 / referent123
- pilote1 / pilote123
- responsable_secteur1 / resp123
- accueil1 / accueil123
- promotions1 / promo123

================================================================================

FICHIERS IMPORTANTS :
- INIT_DATABASE_PRODUCTION.py        → Script d'initialisation
- INSTRUCTIONS_APRES_DEPLOIEMENT.md  → Guide complet
- IDENTIFIANTS_COMPLETS.md           → Liste de tous les identifiants
- TEST_APRES_DEPLOIEMENT.sh          → Tests automatiques

================================================================================

EN CAS DE PROBLÈME :
1. Relancer : python3 INIT_DATABASE_PRODUCTION.py
2. Vérifier : sudo supervisorctl status
3. Redémarrer : sudo supervisorctl restart backend
4. Voir logs : tail -50 /var/log/supervisor/backend.err.log

================================================================================
