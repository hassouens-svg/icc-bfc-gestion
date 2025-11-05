#!/bin/bash

# Script de test à lancer après le déploiement
# Usage: ./TEST_APRES_DEPLOIEMENT.sh <URL_DU_NOUVEAU_SITE>

if [ -z "$1" ]; then
    echo "❌ Usage: ./TEST_APRES_DEPLOIEMENT.sh <URL>"
    echo "   Exemple: ./TEST_APRES_DEPLOIEMENT.sh https://icc-management.emergent.host"
    exit 1
fi

BASE_URL="$1"
API_URL="${BASE_URL}/api"

echo "=============================================================================="
echo "TEST DES IDENTIFIANTS APRÈS DÉPLOIEMENT"
echo "URL: $BASE_URL"
echo "=============================================================================="

# Fonction de test de login
test_login() {
    local username=$1
    local password=$2
    local city=$3
    local expected_role=$4
    
    echo -n "Test $username... "
    
    response=$(curl -s -X POST "${API_URL}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$username\",\"password\":\"$password\",\"city\":\"$city\"}")
    
    if echo "$response" | grep -q "token"; then
        role=$(echo "$response" | grep -o '"role":"[^"]*"' | cut -d'"' -f4)
        if [ "$role" = "$expected_role" ]; then
            echo "✅ OK ($role)"
            return 0
        else
            echo "⚠️  OK mais rôle incorrect (attendu: $expected_role, reçu: $role)"
            return 1
        fi
    else
        echo "❌ ÉCHEC"
        echo "   Réponse: $response"
        return 1
    fi
}

# Tests de tous les comptes
echo ""
echo "1. TEST ACCÈS SPÉCIFIQUES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_login "superadmin" "superadmin123" "Dijon" "super_admin"
test_login "pasteur" "pasteur123" "Dijon" "pasteur"

echo ""
echo "2. TEST SUPERVISEURS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_login "admin" "admin123" "Dijon" "superviseur_promos"
test_login "superviseur_fi" "superviseur123" "Dijon" "superviseur_fi"

echo ""
echo "3. TEST RÔLES FI"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_login "pilote1" "pilote123" "Dijon" "pilote_fi"
test_login "responsable_secteur1" "resp123" "Dijon" "responsable_secteur"

echo ""
echo "4. TEST RÔLES PROMOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_login "referent1" "referent123" "Dijon" "referent"
test_login "accueil1" "accueil123" "Dijon" "accueil"
test_login "promotions1" "promo123" "Dijon" "promotions"

echo ""
echo "5. TEST VILLES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -n "Récupération des villes... "
cities_response=$(curl -s "${API_URL}/cities")
city_count=$(echo "$cities_response" | grep -o '"name"' | wc -l)
echo "✅ $city_count villes trouvées"

# Vérifier les doublons
echo -n "Vérification des doublons... "
if echo "$cities_response" | grep -o '"name":"[^"]*"' | sort | uniq -d | grep -q .; then
    echo "❌ DOUBLONS DÉTECTÉS!"
    echo "$cities_response" | grep -o '"name":"[^"]*"' | sort | uniq -d
else
    echo "✅ Aucun doublon"
fi

echo ""
echo "=============================================================================="
echo "TESTS TERMINÉS"
echo "=============================================================================="
echo ""
echo "📋 RÉSUMÉ:"
echo "- 9 comptes utilisateurs testés"
echo "- $city_count villes dans la base"
echo ""
echo "Pour tester manuellement:"
echo "  Accès Spécifiques: ${BASE_URL}/acces-specifiques"
echo "  Login Normal:      ${BASE_URL}/login"
echo ""
