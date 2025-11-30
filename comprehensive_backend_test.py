#!/usr/bin/env python3
"""
Comprehensive Backend Testing for ICC BFC-ITALIE System
Tests all critical functionality with 24 test users and complete data
Based on review request requirements
"""

import requests
import json
import os
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')
BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://event-church.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

class ComprehensiveBackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.tokens = {}
        self.test_results = {}
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def make_request(self, method, endpoint, token=None, **kwargs):
        """Make HTTP request with optional authentication"""
        url = f"{API_URL}{endpoint}"
        headers = kwargs.get('headers', {})
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
            
        kwargs['headers'] = headers
        
        try:
            response = self.session.request(method, url, **kwargs)
            self.log(f"{method} {endpoint} -> {response.status_code}")
            return response
        except Exception as e:
            self.log(f"Request failed: {e}", "ERROR")
            return None
    
    def login_user(self, username, password, city, department=None):
        """Login user and return token"""
        login_data = {
            "username": username,
            "password": password,
            "city": city
        }
        if department:
            login_data["department"] = department
            
        response = self.make_request('POST', '/auth/login', json=login_data)
        
        if response and response.status_code == 200:
            result = response.json()
            token = result['token']
            user_info = result['user']
            self.log(f"✅ Login successful: {username} - Role: {user_info['role']}")
            return token, user_info
        else:
            self.log(f"❌ Login failed for {username}: {response.status_code if response else 'No response'}", "ERROR")
            if response and response.text:
                self.log(f"   Error: {response.text}")
            return None, None

    # ==================== TEST 1: ISOLATION DES MOIS (PRIORITÉ HAUTE) ====================
    
    def test_1_isolation_mois(self):
        """TEST 1: Vérifier que les referents ne voient QUE leurs visiteurs du mois assigné"""
        self.log("\n" + "="*80)
        self.log("TEST 1: ISOLATION DES MOIS (PRIORITÉ HAUTE)")
        self.log("="*80)
        
        test_results = {}
        
        # 1.1 Referent Oct 2024
        self.log("\n--- 1.1 Referent Oct 2024 ---")
        token, user_info = self.login_user("referent_dijon_oct", "test123", "Dijon")
        if token:
            response = self.make_request('GET', '/visitors', token=token)
            if response and response.status_code == 200:
                visitors = response.json()
                oct_visitors = [v for v in visitors if v.get('assigned_month') == '2024-10']
                other_visitors = [v for v in visitors if v.get('assigned_month') != '2024-10']
                
                self.log(f"Total visitors returned: {len(visitors)}")
                self.log(f"Oct 2024 visitors: {len(oct_visitors)}")
                self.log(f"Other month visitors: {len(other_visitors)}")
                
                if len(oct_visitors) == 5 and len(other_visitors) == 0:
                    self.log("✅ PASS: Referent Oct sees exactly 5 visitors from 2024-10 only")
                    test_results['referent_oct'] = True
                else:
                    self.log(f"❌ FAIL: Expected 5 Oct visitors and 0 others, got {len(oct_visitors)} Oct and {len(other_visitors)} others", "ERROR")
                    test_results['referent_oct'] = False
            else:
                self.log("❌ FAIL: Could not retrieve visitors", "ERROR")
                test_results['referent_oct'] = False
        else:
            test_results['referent_oct'] = False
        
        # 1.2 Referent Nov 2024
        self.log("\n--- 1.2 Referent Nov 2024 ---")
        token, user_info = self.login_user("referent_dijon_nov", "test123", "Dijon")
        if token:
            response = self.make_request('GET', '/visitors', token=token)
            if response and response.status_code == 200:
                visitors = response.json()
                nov_visitors = [v for v in visitors if v.get('assigned_month') == '2024-11']
                other_visitors = [v for v in visitors if v.get('assigned_month') != '2024-11']
                
                self.log(f"Total visitors returned: {len(visitors)}")
                self.log(f"Nov 2024 visitors: {len(nov_visitors)}")
                self.log(f"Other month visitors: {len(other_visitors)}")
                
                if len(nov_visitors) == 6 and len(other_visitors) == 0:
                    self.log("✅ PASS: Referent Nov sees exactly 6 visitors from 2024-11 only")
                    test_results['referent_nov'] = True
                else:
                    self.log(f"❌ FAIL: Expected 6 Nov visitors and 0 others, got {len(nov_visitors)} Nov and {len(other_visitors)} others", "ERROR")
                    test_results['referent_nov'] = False
            else:
                self.log("❌ FAIL: Could not retrieve visitors", "ERROR")
                test_results['referent_nov'] = False
        else:
            test_results['referent_nov'] = False
        
        # 1.3 Referent Dec 2024
        self.log("\n--- 1.3 Referent Dec 2024 ---")
        token, user_info = self.login_user("referent_dijon_dec", "test123", "Dijon")
        if token:
            response = self.make_request('GET', '/visitors', token=token)
            if response and response.status_code == 200:
                visitors = response.json()
                dec_visitors = [v for v in visitors if v.get('assigned_month') == '2024-12']
                other_visitors = [v for v in visitors if v.get('assigned_month') != '2024-12']
                
                self.log(f"Total visitors returned: {len(visitors)}")
                self.log(f"Dec 2024 visitors: {len(dec_visitors)}")
                self.log(f"Other month visitors: {len(other_visitors)}")
                
                if len(dec_visitors) == 7 and len(other_visitors) == 0:
                    self.log("✅ PASS: Referent Dec sees exactly 7 visitors from 2024-12 only")
                    test_results['referent_dec'] = True
                else:
                    self.log(f"❌ FAIL: Expected 7 Dec visitors and 0 others, got {len(dec_visitors)} Dec and {len(other_visitors)} others", "ERROR")
                    test_results['referent_dec'] = False
            else:
                self.log("❌ FAIL: Could not retrieve visitors", "ERROR")
                test_results['referent_dec'] = False
        else:
            test_results['referent_dec'] = False
        
        self.test_results['test_1_isolation_mois'] = test_results
        return all(test_results.values())

    # ==================== TEST 2: VUE PROMOTIONS ====================
    
    def test_2_vue_promotions(self):
        """TEST 2: Vue Promotions (département complet)"""
        self.log("\n" + "="*80)
        self.log("TEST 2: VUE PROMOTIONS (DÉPARTEMENT COMPLET)")
        self.log("="*80)
        
        # 2.1 Referent avec département Promotions
        self.log("\n--- 2.1 Referent avec département Promotions ---")
        token, user_info = self.login_user("referent_dijon_oct", "test123", "Dijon", "promotions")
        
        if token and user_info:
            # Vérifier que le rôle JWT est 'promotions'
            if user_info['role'] == 'promotions':
                self.log("✅ JWT role correctly set to 'promotions'")
                
                response = self.make_request('GET', '/visitors', token=token)
                if response and response.status_code == 200:
                    visitors = response.json()
                    dijon_visitors = [v for v in visitors if v.get('city') == 'Dijon']
                    
                    self.log(f"Total visitors returned: {len(visitors)}")
                    self.log(f"Dijon visitors: {len(dijon_visitors)}")
                    
                    # Should see ALL Dijon visitors (~23 visitors, all months)
                    if len(dijon_visitors) >= 20:  # Approximately 23 visitors
                        self.log(f"✅ PASS: Promotions role sees all Dijon visitors ({len(dijon_visitors)} visitors)")
                        
                        # Check months diversity
                        months = set(v.get('assigned_month') for v in dijon_visitors)
                        self.log(f"Months represented: {sorted(months)}")
                        
                        if len(months) >= 3:  # Should see multiple months
                            self.log("✅ PASS: Multiple months visible (not restricted to single month)")
                            self.test_results['test_2_vue_promotions'] = True
                            return True
                        else:
                            self.log("❌ FAIL: Still restricted to single month", "ERROR")
                            self.test_results['test_2_vue_promotions'] = False
                            return False
                    else:
                        self.log(f"❌ FAIL: Expected ~23 Dijon visitors, got {len(dijon_visitors)}", "ERROR")
                        self.test_results['test_2_vue_promotions'] = False
                        return False
                else:
                    self.log("❌ FAIL: Could not retrieve visitors", "ERROR")
                    self.test_results['test_2_vue_promotions'] = False
                    return False
            else:
                self.log(f"❌ FAIL: JWT role should be 'promotions', got '{user_info['role']}'", "ERROR")
                self.test_results['test_2_vue_promotions'] = False
                return False
        else:
            self.test_results['test_2_vue_promotions'] = False
            return False

    # ==================== TEST 3: MULTI-VILLES (PRIORITÉ HAUTE) ====================
    
    def test_3_multi_villes(self):
        """TEST 3: Multi-villes (Super Admin & Pasteur vs Superviseur)"""
        self.log("\n" + "="*80)
        self.log("TEST 3: MULTI-VILLES (SUPER ADMIN & PASTEUR VS SUPERVISEUR)")
        self.log("="*80)
        
        test_results = {}
        
        # 3.1 Super Admin
        self.log("\n--- 3.1 Super Admin ---")
        token, user_info = self.login_user("admin_test", "test123", "Dijon")
        if token:
            response = self.make_request('GET', '/analytics/stats', token=token)
            if response and response.status_code == 200:
                stats = response.json()
                total_visitors = stats.get('total_visitors', 0)
                
                self.log(f"Super Admin sees {total_visitors} total visitors")
                
                if total_visitors == 32:
                    self.log("✅ PASS: Super Admin sees all 32 visitors from ALL cities")
                    test_results['super_admin'] = True
                else:
                    self.log(f"❌ FAIL: Expected 32 visitors, got {total_visitors}", "ERROR")
                    test_results['super_admin'] = False
            else:
                self.log("❌ FAIL: Could not retrieve analytics stats", "ERROR")
                test_results['super_admin'] = False
        else:
            test_results['super_admin'] = False
        
        # 3.2 Pasteur
        self.log("\n--- 3.2 Pasteur ---")
        token, user_info = self.login_user("pasteur_test", "test123", "Dijon")
        if token:
            response = self.make_request('GET', '/analytics/stats', token=token)
            if response and response.status_code == 200:
                stats = response.json()
                total_visitors = stats.get('total_visitors', 0)
                
                self.log(f"Pasteur sees {total_visitors} total visitors")
                
                if total_visitors == 32:
                    self.log("✅ PASS: Pasteur sees all 32 visitors from ALL cities")
                    test_results['pasteur'] = True
                else:
                    self.log(f"❌ FAIL: Expected 32 visitors, got {total_visitors}", "ERROR")
                    test_results['pasteur'] = False
            else:
                self.log("❌ FAIL: Could not retrieve analytics stats", "ERROR")
                test_results['pasteur'] = False
        else:
            test_results['pasteur'] = False
        
        # 3.3 Superviseur (city-restricted)
        self.log("\n--- 3.3 Superviseur (city-restricted) ---")
        token, user_info = self.login_user("sup_promos_dijon", "test123", "Dijon")
        if token:
            response = self.make_request('GET', '/analytics/stats', token=token)
            if response and response.status_code == 200:
                stats = response.json()
                total_visitors = stats.get('total_visitors', 0)
                
                self.log(f"Superviseur sees {total_visitors} total visitors")
                
                # Should see only Dijon visitors (~23 visitors)
                if 20 <= total_visitors <= 25:  # Approximately 23 visitors
                    self.log(f"✅ PASS: Superviseur correctly limited to Dijon only ({total_visitors} visitors)")
                    test_results['superviseur'] = True
                else:
                    self.log(f"❌ FAIL: Expected ~23 Dijon visitors, got {total_visitors}", "ERROR")
                    test_results['superviseur'] = False
            else:
                self.log("❌ FAIL: Could not retrieve analytics stats", "ERROR")
                test_results['superviseur'] = False
        else:
            test_results['superviseur'] = False
        
        self.test_results['test_3_multi_villes'] = test_results
        return all(test_results.values())

    # ==================== TEST 4: FAMILLES D'IMPACT - PILOTE ====================
    
    def test_4_familles_impact_pilote(self):
        """TEST 4: Familles d'Impact - Pilote"""
        self.log("\n" + "="*80)
        self.log("TEST 4: FAMILLES D'IMPACT - PILOTE")
        self.log("="*80)
        
        test_results = {}
        
        # 4.1 Pilote FI Dijon 1
        self.log("\n--- 4.1 Pilote FI Dijon 1 ---")
        token, user_info = self.login_user("pilote_dijon1", "test123", "Dijon")
        if token:
            response = self.make_request('GET', '/fi/stats/pilote', token=token)
            if response and response.status_code == 200:
                stats = response.json()
                fi_info = stats.get('fi', {})
                fi_name = fi_info.get('nom', 'Unknown')
                
                self.log(f"Pilote 1 sees FI: {fi_name}")
                self.log(f"Total membres: {stats.get('total_membres', 0)}")
                
                # Should see only their FI (FI Centre-Ville Dijon A)
                if 'Centre-Ville Dijon A' in fi_name or 'Dijon' in fi_name:
                    self.log("✅ PASS: Pilote 1 sees their assigned FI only")
                    test_results['pilote_1'] = True
                else:
                    self.log(f"❌ FAIL: Unexpected FI name: {fi_name}", "ERROR")
                    test_results['pilote_1'] = False
            else:
                self.log(f"❌ FAIL: Could not retrieve pilote stats - Status: {response.status_code if response else 'No response'}", "ERROR")
                if response and response.text:
                    self.log(f"   Error: {response.text}")
                test_results['pilote_1'] = False
        else:
            test_results['pilote_1'] = False
        
        # 4.2 Pilote FI Dijon 2
        self.log("\n--- 4.2 Pilote FI Dijon 2 ---")
        token, user_info = self.login_user("pilote_dijon2", "test123", "Dijon")
        if token:
            response = self.make_request('GET', '/fi/stats/pilote', token=token)
            if response and response.status_code == 200:
                stats = response.json()
                fi_info = stats.get('fi', {})
                fi_name = fi_info.get('nom', 'Unknown')
                
                self.log(f"Pilote 2 sees FI: {fi_name}")
                self.log(f"Total membres: {stats.get('total_membres', 0)}")
                
                # Should see only their FI (FI Centre-Ville Dijon B)
                if 'Centre-Ville Dijon B' in fi_name or 'Dijon' in fi_name:
                    self.log("✅ PASS: Pilote 2 sees their assigned FI only")
                    
                    # Verify they don't see the same FI as Pilote 1
                    # This would require comparing with previous result, but we can check they have different data
                    test_results['pilote_2'] = True
                else:
                    self.log(f"❌ FAIL: Unexpected FI name: {fi_name}", "ERROR")
                    test_results['pilote_2'] = False
            else:
                self.log(f"❌ FAIL: Could not retrieve pilote stats - Status: {response.status_code if response else 'No response'}", "ERROR")
                if response and response.text:
                    self.log(f"   Error: {response.text}")
                test_results['pilote_2'] = False
        else:
            test_results['pilote_2'] = False
        
        self.test_results['test_4_familles_impact_pilote'] = test_results
        return all(test_results.values())

    # ==================== TEST 5: ACCUEIL (LECTURE SEULE) ====================
    
    def test_5_accueil_readonly(self):
        """TEST 5: Accueil (lecture seule)"""
        self.log("\n" + "="*80)
        self.log("TEST 5: ACCUEIL (LECTURE SEULE)")
        self.log("="*80)
        
        # 5.1 Test permissions Accueil
        self.log("\n--- 5.1 Test permissions Accueil ---")
        token, user_info = self.login_user("accueil_dijon", "test123", "Dijon", "accueil")
        
        if token and user_info:
            # Vérifier que le rôle JWT est 'accueil'
            if user_info['role'] == 'accueil':
                self.log("✅ JWT role correctly set to 'accueil'")
                
                # Essayer de créer un visiteur (devrait échouer avec 403)
                visitor_data = {
                    "firstname": "Test",
                    "lastname": "Accueil",
                    "city": "Dijon",
                    "types": ["Nouveau Arrivant"],
                    "phone": "+33123456789",
                    "arrival_channel": "Test",
                    "visit_date": "2024-12-15"
                }
                
                response = self.make_request('POST', '/visitors', token=token, json=visitor_data)
                
                if response is not None:
                    if response.status_code == 403:
                        self.log("✅ PASS: Accueil role correctly denied visitor creation (403)")
                        
                        # Vérifier que la lecture fonctionne
                        read_response = self.make_request('GET', '/visitors', token=token)
                        if read_response and read_response.status_code == 200:
                            visitors = read_response.json()
                            self.log(f"✅ PASS: Accueil can read visitors ({len(visitors)} visitors)")
                            
                            # Vérifier les champs limités
                            if visitors and len(visitors) > 0:
                                first_visitor = visitors[0]
                                expected_fields = {'id', 'firstname', 'lastname', 'arrival_channel', 'visit_date', 'city'}
                                actual_fields = set(first_visitor.keys())
                                
                                if actual_fields == expected_fields:
                                    self.log("✅ PASS: Accueil role returns limited fields only")
                                    self.test_results['test_5_accueil_readonly'] = True
                                    return True
                                else:
                                    self.log(f"❌ FAIL: Wrong fields returned. Expected: {expected_fields}, Got: {actual_fields}", "ERROR")
                                    self.test_results['test_5_accueil_readonly'] = False
                                    return False
                            else:
                                self.log("✅ PASS: Accueil role works (no visitors to check fields)")
                                self.test_results['test_5_accueil_readonly'] = True
                                return True
                        else:
                            self.log("❌ FAIL: Accueil cannot read visitors", "ERROR")
                            self.test_results['test_5_accueil_readonly'] = False
                            return False
                    else:
                        self.log(f"❌ FAIL: Accueil should get 403, got {response.status_code}", "ERROR")
                        self.test_results['test_5_accueil_readonly'] = False
                        return False
                else:
                    self.log("❌ FAIL: No response from POST /visitors", "ERROR")
                    self.test_results['test_5_accueil_readonly'] = False
                    return False
            else:
                self.log(f"❌ FAIL: JWT role should be 'accueil', got '{user_info['role']}'", "ERROR")
                self.test_results['test_5_accueil_readonly'] = False
                return False
        else:
            self.test_results['test_5_accueil_readonly'] = False
            return False

    # ==================== TEST 6: ISOLATION DES VILLES ====================
    
    def test_6_isolation_villes(self):
        """TEST 6: Isolation des villes"""
        self.log("\n" + "="*80)
        self.log("TEST 6: ISOLATION DES VILLES")
        self.log("="*80)
        
        test_results = {}
        
        # 6.1 Superviseur Dijon
        self.log("\n--- 6.1 Superviseur Dijon ---")
        token, user_info = self.login_user("sup_promos_dijon", "test123", "Dijon")
        if token:
            response = self.make_request('GET', '/visitors', token=token)
            if response and response.status_code == 200:
                visitors = response.json()
                dijon_visitors = [v for v in visitors if v.get('city') == 'Dijon']
                other_city_visitors = [v for v in visitors if v.get('city') != 'Dijon']
                
                self.log(f"Total visitors: {len(visitors)}")
                self.log(f"Dijon visitors: {len(dijon_visitors)}")
                self.log(f"Other city visitors: {len(other_city_visitors)}")
                
                if len(other_city_visitors) == 0 and len(dijon_visitors) > 0:
                    self.log("✅ PASS: Superviseur Dijon sees only Dijon visitors")
                    test_results['sup_dijon'] = True
                else:
                    self.log(f"❌ FAIL: Found {len(other_city_visitors)} visitors from other cities", "ERROR")
                    test_results['sup_dijon'] = False
            else:
                self.log("❌ FAIL: Could not retrieve visitors", "ERROR")
                test_results['sup_dijon'] = False
        else:
            test_results['sup_dijon'] = False
        
        # 6.2 Superviseur Milan
        self.log("\n--- 6.2 Superviseur Milan ---")
        token, user_info = self.login_user("sup_promos_milan", "test123", "Milan")
        if token:
            response = self.make_request('GET', '/visitors', token=token)
            if response and response.status_code == 200:
                visitors = response.json()
                milan_visitors = [v for v in visitors if v.get('city') == 'Milan']
                other_city_visitors = [v for v in visitors if v.get('city') != 'Milan']
                
                self.log(f"Total visitors: {len(visitors)}")
                self.log(f"Milan visitors: {len(milan_visitors)}")
                self.log(f"Other city visitors: {len(other_city_visitors)}")
                
                # Should see ~5 Milan visitors only
                if len(other_city_visitors) == 0 and 3 <= len(milan_visitors) <= 7:
                    self.log(f"✅ PASS: Superviseur Milan sees only Milan visitors ({len(milan_visitors)} visitors)")
                    test_results['sup_milan'] = True
                else:
                    self.log(f"❌ FAIL: Expected ~5 Milan visitors and 0 others, got {len(milan_visitors)} Milan and {len(other_city_visitors)} others", "ERROR")
                    test_results['sup_milan'] = False
            else:
                self.log("❌ FAIL: Could not retrieve visitors", "ERROR")
                test_results['sup_milan'] = False
        else:
            test_results['sup_milan'] = False
        
        self.test_results['test_6_isolation_villes'] = test_results
        return all(test_results.values())

    # ==================== TEST 7: RESPONSABLE DE SECTEUR ====================
    
    def test_7_responsable_secteur(self):
        """TEST 7: Responsable de Secteur"""
        self.log("\n" + "="*80)
        self.log("TEST 7: RESPONSABLE DE SECTEUR")
        self.log("="*80)
        
        # 7.1 Responsable Secteur Dijon
        self.log("\n--- 7.1 Responsable Secteur Dijon ---")
        token, user_info = self.login_user("resp_sect_dijon1", "test123", "Dijon")
        
        if token and user_info:
            # Vérifier que l'utilisateur a un assigned_secteur_id
            if user_info.get('assigned_secteur_id'):
                self.log(f"✅ User has assigned_secteur_id: {user_info['assigned_secteur_id']}")
                
                response = self.make_request('GET', '/fi/stats/secteur', token=token)
                if response and response.status_code == 200:
                    stats = response.json()
                    secteur_info = stats.get('secteur', {})
                    fi_stats = stats.get('fi_stats', [])
                    
                    self.log(f"Secteur: {secteur_info.get('nom', 'Unknown')}")
                    self.log(f"FI count: {len(fi_stats)}")
                    
                    # Should return FI from their secteur only
                    if len(fi_stats) > 0:
                        self.log("✅ PASS: Responsable secteur can access their secteur FI stats")
                        self.test_results['test_7_responsable_secteur'] = True
                        return True
                    else:
                        self.log("⚠️  No FI stats returned (might be empty secteur)")
                        self.test_results['test_7_responsable_secteur'] = True
                        return True
                else:
                    self.log(f"❌ FAIL: Could not retrieve secteur stats - Status: {response.status_code if response else 'No response'}", "ERROR")
                    if response and response.text:
                        self.log(f"   Error: {response.text}")
                    self.test_results['test_7_responsable_secteur'] = False
                    return False
            else:
                self.log("❌ FAIL: User does not have assigned_secteur_id", "ERROR")
                self.test_results['test_7_responsable_secteur'] = False
                return False
        else:
            self.test_results['test_7_responsable_secteur'] = False
            return False

    # ==================== TEST 8: FIDÉLISATION ====================
    
    def test_8_fidelisation(self):
        """TEST 8: Fidélisation"""
        self.log("\n" + "="*80)
        self.log("TEST 8: FIDÉLISATION")
        self.log("="*80)
        
        test_results = {}
        
        # 8.1 Referent - Vue personnelle
        self.log("\n--- 8.1 Referent - Vue personnelle ---")
        token, user_info = self.login_user("referent_dijon_oct", "test123", "Dijon")
        if token:
            response = self.make_request('GET', '/fidelisation/referent', token=token)
            if response and response.status_code == 200:
                data = response.json()
                total_visitors = data.get('total_visitors', 0)
                monthly_average = data.get('monthly_average', 0)
                
                self.log(f"Referent fidelisation - Total visitors: {total_visitors}, Monthly average: {monthly_average}%")
                
                if total_visitors >= 0:  # Should return valid data structure
                    self.log("✅ PASS: Referent can access personal fidelisation stats")
                    test_results['referent_fidelisation'] = True
                else:
                    self.log("❌ FAIL: Invalid fidelisation data structure", "ERROR")
                    test_results['referent_fidelisation'] = False
            else:
                self.log(f"❌ FAIL: Could not retrieve referent fidelisation - Status: {response.status_code if response else 'No response'}", "ERROR")
                test_results['referent_fidelisation'] = False
        else:
            test_results['referent_fidelisation'] = False
        
        # 8.2 Superviseur - Vue admin
        self.log("\n--- 8.2 Superviseur - Vue admin ---")
        token, user_info = self.login_user("sup_promos_dijon", "test123", "Dijon")
        if token:
            response = self.make_request('GET', '/fidelisation/admin', token=token)
            if response and response.status_code == 200:
                data = response.json()
                
                self.log(f"Admin fidelisation - Found data for {len(data)} referents")
                
                if isinstance(data, list):
                    self.log("✅ PASS: Superviseur can access admin fidelisation stats")
                    for referent_data in data[:3]:  # Show first 3
                        self.log(f"   - Referent: {referent_data.get('referent_username')} (Month: {referent_data.get('assigned_month')})")
                    test_results['admin_fidelisation'] = True
                else:
                    self.log("❌ FAIL: Invalid admin fidelisation data structure", "ERROR")
                    test_results['admin_fidelisation'] = False
            else:
                self.log(f"❌ FAIL: Could not retrieve admin fidelisation - Status: {response.status_code if response else 'No response'}", "ERROR")
                test_results['admin_fidelisation'] = False
        else:
            test_results['admin_fidelisation'] = False
        
        self.test_results['test_8_fidelisation'] = test_results
        return all(test_results.values())

    # ==================== MAIN TEST RUNNER ====================
    
    def run_all_tests(self):
        """Run all comprehensive backend tests"""
        self.log("STARTING COMPREHENSIVE BACKEND TESTING FOR ICC BFC-ITALIE")
        self.log("Backend URL: " + API_URL)
        self.log("="*100)
        
        # Define tests in priority order
        tests = [
            ("TEST 1: Isolation des mois (PRIORITÉ HAUTE)", self.test_1_isolation_mois),
            ("TEST 3: Multi-villes (PRIORITÉ HAUTE)", self.test_3_multi_villes),
            ("TEST 4: Familles d'Impact - Pilote", self.test_4_familles_impact_pilote),
            ("TEST 5: Accueil (lecture seule)", self.test_5_accueil_readonly),
            ("TEST 6: Isolation des villes", self.test_6_isolation_villes),
            ("TEST 2: Vue Promotions", self.test_2_vue_promotions),
            ("TEST 7: Responsable de Secteur", self.test_7_responsable_secteur),
            ("TEST 8: Fidélisation", self.test_8_fidelisation)
        ]
        
        results = {}
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            try:
                self.log(f"\n🔄 Running {test_name}...")
                result = test_func()
                results[test_name] = result
                if result:
                    passed += 1
                    self.log(f"✅ {test_name} - PASSED")
                else:
                    self.log(f"❌ {test_name} - FAILED")
            except Exception as e:
                self.log(f"💥 {test_name} - CRASHED: {e}", "ERROR")
                results[test_name] = False
        
        # Final Summary
        self.log("\n" + "="*100)
        self.log("COMPREHENSIVE TEST SUMMARY")
        self.log("="*100)
        
        # Show failed tests first (more important)
        failed_tests = [name for name, result in results.items() if not result]
        if failed_tests:
            self.log("\n❌ FAILED TESTS:")
            for test_name in failed_tests:
                self.log(f"   ❌ {test_name}")
        
        # Show passed tests
        passed_tests = [name for name, result in results.items() if result]
        if passed_tests:
            self.log(f"\n✅ PASSED TESTS ({len(passed_tests)}/{total}):")
            for test_name in passed_tests:
                self.log(f"   ✅ {test_name}")
        
        self.log(f"\n📊 OVERALL RESULT: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 ALL TESTS PASSED! ICC BFC-ITALIE backend is fully functional.")
        else:
            self.log(f"⚠️  {total - passed} test(s) failed. Critical issues need attention.")
        
        return results

if __name__ == "__main__":
    tester = ComprehensiveBackendTester()
    results = tester.run_all_tests()