#!/usr/bin/env python3
"""
Debug Test for the 3 Issues - Detailed Investigation
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Configuration
BACKEND_URL = "https://ministery-stars.preview.emergentagent.com/api"
USERNAME = "superadmin"
PASSWORD = "superadmin123"
CITY = "Dijon"

def authenticate():
    """Authenticate with the backend"""
    login_data = {
        "username": USERNAME,
        "password": PASSWORD,
        "city": CITY
    }
    
    response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data)
    
    if response.status_code == 200:
        data = response.json()
        token = data["token"]
        headers = {"Authorization": f"Bearer {token}"}
        print(f"✅ Authenticated as {USERNAME}")
        return headers
    else:
        print(f"❌ Authentication failed: {response.status_code}")
        return None

def debug_issue_1_rsvp_star():
    """Debug Issue 1: RSVP STAR label"""
    print("\n🔍 Debugging Issue 1: RSVP STAR Label")
    
    headers = authenticate()
    if not headers:
        return
    
    # Create event
    event_data = {
        "title": "Debug STAR Event",
        "description": "Debug STAR label",
        "date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
        "time": "19:00",
        "location": "Debug Location",
        "rsvp_enabled": True
    }
    
    response = requests.post(f"{BACKEND_URL}/events", json=event_data, headers=headers)
    print(f"Event creation status: {response.status_code}")
    
    if response.status_code == 200:
        event_id = response.json().get("id")
        print(f"Event ID: {event_id}")
        
        # Add STAR RSVP
        rsvp_data = {
            "name": "Jean Dupont STAR",
            "first_name": "Jean",
            "last_name": "Dupont",
            "is_star": True,
            "email": "jean@test.com",
            "status": "confirmed",
            "guests_count": 1
        }
        
        response = requests.post(f"{BACKEND_URL}/events/{event_id}/rsvp-public", json=rsvp_data)
        print(f"STAR RSVP creation status: {response.status_code}")
        print(f"STAR RSVP response: {response.text}")
        
        # Get RSVP stats
        response = requests.get(f"{BACKEND_URL}/events/{event_id}/rsvp", headers=headers)
        print(f"RSVP stats status: {response.status_code}")
        
        if response.status_code == 200:
            stats = response.json()
            print(f"RSVP Stats: {json.dumps(stats, indent=2)}")
            
            # Check for STAR RSVPs
            rsvps = stats.get("rsvps", [])
            print(f"Total RSVPs: {len(rsvps)}")
            
            for i, rsvp in enumerate(rsvps):
                print(f"RSVP {i+1}: name={rsvp.get('name')}, is_star={rsvp.get('is_star')}")
        
        # Cleanup
        requests.delete(f"{BACKEND_URL}/events/{event_id}", headers=headers)

def debug_issue_2_archived_projects():
    """Debug Issue 2: Archived projects"""
    print("\n🔍 Debugging Issue 2: Archived Projects")
    
    headers = authenticate()
    if not headers:
        return
    
    # Create project
    project_data = {
        "titre": "Debug Archive Project",
        "description": "Debug archived projects",
        "statut": "planifie",
        "ville": CITY
    }
    
    response = requests.post(f"{BACKEND_URL}/events/projets", json=project_data, headers=headers)
    print(f"Project creation status: {response.status_code}")
    
    if response.status_code == 200:
        project_id = response.json().get("id")
        print(f"Project ID: {project_id}")
        
        # Check normal list
        response = requests.get(f"{BACKEND_URL}/events/projets", headers=headers)
        print(f"Normal projects list status: {response.status_code}")
        
        if response.status_code == 200:
            projects = response.json()
            test_project = next((p for p in projects if p.get("id") == project_id), None)
            print(f"Project in normal list: {test_project is not None}")
            if test_project:
                print(f"Project archived status: {test_project.get('archived', False)}")
        
        # Archive project
        response = requests.put(f"{BACKEND_URL}/events/projets/{project_id}/archive", headers=headers)
        print(f"Archive project status: {response.status_code}")
        print(f"Archive response: {response.text}")
        
        # Check archived list
        response = requests.get(f"{BACKEND_URL}/events/projets?archived=true", headers=headers)
        print(f"Archived projects list status: {response.status_code}")
        
        if response.status_code == 200:
            archived_projects = response.json()
            archived_project = next((p for p in archived_projects if p.get("id") == project_id), None)
            print(f"Project in archived list: {archived_project is not None}")
            if archived_project:
                print(f"Archived project status: {archived_project.get('archived', False)}")
        
        # Check normal list again
        response = requests.get(f"{BACKEND_URL}/events/projets", headers=headers)
        print(f"Normal projects list after archive status: {response.status_code}")
        
        if response.status_code == 200:
            normal_projects = response.json()
            normal_project = next((p for p in normal_projects if p.get("id") == project_id), None)
            print(f"Project still in normal list: {normal_project is not None}")
            if normal_project:
                print(f"Normal project archived status: {normal_project.get('archived', False)}")
        
        # Cleanup
        requests.delete(f"{BACKEND_URL}/events/projets/{project_id}", headers=headers)

def debug_issue_3_tasks():
    """Debug Issue 3: Multi-assigned tasks"""
    print("\n🔍 Debugging Issue 3: Multi-assigned Tasks")
    
    headers = authenticate()
    if not headers:
        return
    
    # Check if tasks endpoint exists
    response = requests.get(f"{BACKEND_URL}/events/taches", headers=headers)
    print(f"Tasks endpoint status: {response.status_code}")
    
    if response.status_code == 404:
        print("❌ Tasks endpoint not found - checking alternative endpoints")
        
        # Try different endpoints
        endpoints_to_try = [
            "/events/tasks",
            "/projets/taches", 
            "/taches"
        ]
        
        for endpoint in endpoints_to_try:
            response = requests.get(f"{BACKEND_URL}{endpoint}", headers=headers)
            print(f"Endpoint {endpoint} status: {response.status_code}")

def main():
    """Main debug function"""
    print("🔍 Starting Debug Investigation for 3 Issues")
    print("=" * 60)
    
    debug_issue_1_rsvp_star()
    debug_issue_2_archived_projects()
    debug_issue_3_tasks()

if __name__ == "__main__":
    main()