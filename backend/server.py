from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import warnings
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
from jwt.exceptions import InvalidTokenError
import io
import pandas as pd
from fastapi.responses import StreamingResponse

# Suppress warnings
warnings.filterwarnings('ignore', message='.*bcrypt.*')
warnings.filterwarnings('ignore', category=DeprecationWarning)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.environ.get("SECRET_KEY", "icc-bfc-italie-secret-key-2024-production-secure")
ALGORITHM = "HS256"

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class City(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str

class CityCreate(BaseModel):
    name: str

class ReferentPermissions(BaseModel):
    can_view_all_months: bool = False
    can_edit_visitors: bool = True
    can_stop_tracking: bool = True
    can_add_comments: bool = True
    can_mark_presence: bool = True
    can_view_analytics: bool = False

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password: str  # hashed
    city: str
    role: str  # superviseur_promos, superviseur_fi, referent, accueil, promotions, pilote_fi, responsable_secteur, pasteur, super_admin
    assigned_month: Optional[str] = None  # For referents: "2025-01"
    assigned_secteur_id: Optional[str] = None  # For responsable_secteur
    assigned_fi_id: Optional[str] = None  # For pilote_fi
    permissions: Optional[Dict[str, bool]] = None  # For referents permissions
    dashboard_permissions: Optional[Dict[str, bool]] = None  # What user can see in their dashboard (controlled by super_admin)
    is_blocked: bool = False  # For blocking users
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    password: str
    city: str
    role: str
    assigned_month: Optional[str] = None
    permissions: Optional[Dict[str, bool]] = None

class UserUpdate(BaseModel):
    username: Optional[str] = None
    assigned_month: Optional[str] = None
    assigned_fi_id: Optional[str] = None
    assigned_secteur_id: Optional[str] = None
    permissions: Optional[Dict[str, bool]] = None
    dashboard_permissions: Optional[Dict[str, bool]] = None

class UserLogin(BaseModel):
    username: str
    password: str
    city: str
    department: Optional[str] = None  # "accueil" or "promotion"

class CulteStats(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str  # Date du dimanche YYYY-MM-DD
    ville: str
    type_culte: str  # "Culte 1", "Culte 2", "EJP"
    nombre_fideles: int
    nombre_stars: int
    created_by: str  # Username de celui qui a créé
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

class CulteStatsCreate(BaseModel):
    date: str
    ville: str
    type_culte: str
    nombre_fideles: int
    nombre_stars: int

class CulteStatsUpdate(BaseModel):
    nombre_fideles: Optional[int] = None
    nombre_stars: Optional[int] = None

class PresenceEntry(BaseModel):
    date: str
    present: bool

class CommentEntry(BaseModel):
    date: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    author: str
    text: str

class Visitor(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    firstname: str
    lastname: str
    city: str
    types: List[str]  # ["Nouveau Arrivant", "Nouveau Converti", "De Passage"]
    phone: str  # Required now
    email: Optional[EmailStr] = None
    address: Optional[str] = None  # New field
    arrival_channel: str  # Comment ils ont connu ICC
    visit_date: str
    assigned_month: str  # "2025-01"
    presences_dimanche: List[PresenceEntry] = Field(default_factory=list)
    presences_jeudi: List[PresenceEntry] = Field(default_factory=list)
    formation_pcnc: bool = False
    formation_au_coeur_bible: bool = False
    formation_star: bool = False
    comments: List[CommentEntry] = Field(default_factory=list)
    tracking_stopped: bool = False
    stop_reason: Optional[str] = None
    stopped_by: Optional[str] = None
    stopped_date: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VisitorCreate(BaseModel):
    firstname: str
    lastname: str
    city: str
    types: List[str]
    phone: str  # Required
    email: Optional[EmailStr] = None
    address: Optional[str] = None  # Optional
    arrival_channel: str
    visit_date: str

class VisitorUpdate(BaseModel):
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    email: Optional[EmailStr] = None
    arrival_channel: Optional[str] = None
    types: Optional[List[str]] = None

class CommentAdd(BaseModel):
    text: str

class PresenceAdd(BaseModel):
    date: str
    present: bool
    type: str  # "dimanche" or "jeudi"

class FormationUpdate(BaseModel):
    formation_type: str  # "pcnc", "au_coeur_bible", "star"
    completed: bool

class StopTracking(BaseModel):
    reason: str

# ==================== FAMILLES D'IMPACT MODELS ====================

class Secteur(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nom: str
    ville: str
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SecteurCreate(BaseModel):
    nom: str
    ville: str

class FamilleImpact(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nom: str
    secteur_id: str
    ville: str
    pilote_id: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FamilleImpactCreate(BaseModel):
    nom: str
    secteur_id: str
    ville: str
    pilote_id: Optional[str] = None

class MembreFI(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    prenom: str
    nom: str
    fi_id: str
    date_ajout: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    source: str  # "manuel" or "nouveau_arrivant"
    nouveau_arrivant_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MembreFICreate(BaseModel):
    prenom: str
    nom: str
    fi_id: str
    source: str = "manuel"
    nouveau_arrivant_id: Optional[str] = None

class PresenceFI(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    membre_fi_id: str
    date: str  # Format: "2025-01-09" (jeudi)
    present: bool
    commentaire: Optional[str] = None
    marked_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PresenceFICreate(BaseModel):
    membre_fi_id: str
    date: str
    present: bool
    commentaire: Optional[str] = None

class AffectationFI(BaseModel):
    nouveau_arrivant_id: str
    fi_id: str


class Notification(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # Utilisateur qui reçoit la notification
    type: str  # 'presence_reminder', 'fi_stagnation', 'low_fidelisation', 'unassigned_visitor'
    message: str
    data: Optional[Dict[str, Any]] = None  # Données supplémentaires (IDs, etc.)
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NotificationCreate(BaseModel):
    user_id: str
    type: str
    message: str
    data: Optional[Dict[str, Any]] = None

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def is_super_admin(user: dict) -> bool:
    """Check if user is Super Admin"""
    return user.get("role") == "super_admin"

def is_superviseur(user: dict) -> bool:
    """Check if user is Superviseur (Promos or FI)"""
    return user.get("role") in ["superviseur_promos", "superviseur_fi"]

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Override role and city from JWT token if present (for department-based login)
        if "role" in payload:
            user["role"] = payload["role"]
        if "city" in payload:
            user["city"] = payload["city"]
        
        return user
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/login")
async def login(user_login: UserLogin):
    # Find user by username and city
    user = await db.users.find_one({
        "username": user_login.username,
        "city": user_login.city
    }, {"_id": 0})
    
    if not user or not verify_password(user_login.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if user is blocked
    if user.get("is_blocked", False):
        raise HTTPException(status_code=403, detail="Votre compte a été bloqué. Contactez l'administrateur.")
    
    # If department is specified, use it; otherwise use user's default role
    final_role = user["role"]
    if user_login.department:
        # Map department choices to roles
        dept_to_role = {
            "accueil": "accueil",  # Accueil et Intégration ensemble
            "promotions": "promotions"
        }
        final_role = dept_to_role.get(user_login.department, user["role"])
    
    # Create token
    token = create_access_token({"sub": user["id"], "role": final_role, "city": user["city"]})
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "city": user["city"],
            "role": final_role,
            "assigned_month": user.get("assigned_month"),
            "assigned_secteur_id": user.get("assigned_secteur_id"),
            "assigned_fi_id": user.get("assigned_fi_id")
        }
    }

@api_router.post("/auth/register")
async def register_visitor(visitor_data: VisitorCreate):
    """Public registration form for new visitors"""
    # Calculate assigned_month from visit_date
    try:
        visit_dt = datetime.fromisoformat(visitor_data.visit_date)
        assigned_month = visit_dt.strftime("%Y-%m")
    except:
        assigned_month = datetime.now(timezone.utc).strftime("%Y-%m")
    
    visitor = Visitor(**visitor_data.model_dump(), assigned_month=assigned_month)
    doc = visitor.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.visitors.insert_one(doc)
    return {"message": "Registration successful", "id": visitor.id}

# ==================== USER ROUTES ====================

@api_router.post("/users/referent")
async def create_referent(user_data: UserCreate, current_user: dict = Depends(get_current_user)):
    # Only admin and promotions can create referents
    if current_user["role"] not in ["superviseur_promos", "promotions"]:
        raise HTTPException(status_code=403, detail="Only admin can create referents")
    
    # Check if username already exists in this city
    existing = await db.users.find_one({
        "username": user_data.username,
        "city": user_data.city
    })
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists in this city")
    
    # Hash password and create user
    hashed_pw = hash_password(user_data.password)
    
    # Create dict from user_data and replace password with hashed version
    user_dict = user_data.model_dump()
    user_dict['password'] = hashed_pw
    
    # Set default permissions for referents if not provided
    if user_data.role == "referent" and not user_dict.get('permissions'):
        user_dict['permissions'] = {
            "can_view_all_months": False,
            "can_edit_visitors": True,
            "can_stop_tracking": True,
            "can_add_comments": True,
            "can_mark_presence": True,
            "can_view_analytics": False
        }
    
    user = User(**user_dict)
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    return {"message": "Referent created successfully", "id": user.id}

@api_router.get("/users/referents")
async def get_referents(current_user: dict = Depends(get_current_user)):
    # Get all users (pasteur and super_admin see all, others see their city)
    query = {"role": {"$in": ["referent", "accueil", "promotions", "superviseur_promos", "superviseur_fi", "pilote_fi", "responsable_secteur", "pasteur", "super_admin"]}}
    
    if current_user["role"] not in ["pasteur", "super_admin"]:
        query["city"] = current_user["city"]
    
    referents = await db.users.find(query, {"_id": 0, "password": 0}).to_list(1000)
    
    return referents

@api_router.put("/users/{user_id}")
async def update_user(user_id: str, update_data: UserUpdate, current_user: dict = Depends(get_current_user)):
    """Update user information (Admin only)"""
    if current_user["role"] not in ["superviseur_promos", "promotions", "super_admin"]:
        raise HTTPException(status_code=403, detail="Only admin can update users")
    
    # Super admin can update users from any city, others only from their city
    if current_user["role"] == "super_admin":
        user = await db.users.find_one({"id": user_id})
    else:
        user = await db.users.find_one({"id": user_id, "city": current_user["city"]})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Build update dict with only provided fields
    update_dict = {}
    if update_data.username is not None:
        # Check if new username already exists
        city_filter = {} if current_user["role"] == "super_admin" else {"city": current_user["city"]}
        existing = await db.users.find_one({
            "username": update_data.username,
            "id": {"$ne": user_id},
            **city_filter
        })
        if existing:
            raise HTTPException(status_code=400, detail="Username already exists")
        update_dict["username"] = update_data.username
    
    if update_data.assigned_month is not None:
        update_dict["assigned_month"] = update_data.assigned_month
    
    if update_data.assigned_fi_id is not None:
        update_dict["assigned_fi_id"] = update_data.assigned_fi_id
    
    if update_data.assigned_secteur_id is not None:
        update_dict["assigned_secteur_id"] = update_data.assigned_secteur_id
    
    if update_data.permissions is not None:
        update_dict["permissions"] = update_data.permissions
    
    if update_dict:
        await db.users.update_one({"id": user_id}, {"$set": update_dict})
    
    return {"message": "User updated successfully"}

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a user (Admin only)"""
    user_to_delete = await db.users.find_one({"id": user_id})
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Super admin can delete anyone
    if is_super_admin(current_user):
        await db.users.delete_one({"id": user_id})
        return {"message": "User deleted successfully"}
    
    # Regular admin or promotions can only delete users from their city (but not other admins)
    if current_user["role"] in ["superviseur_promos", "promotions"]:
        if user_to_delete["city"] != current_user["city"]:
            raise HTTPException(status_code=403, detail="Cannot delete users from other cities")
        if user_to_delete["role"] in ["superviseur_promos", "promotions"]:
            raise HTTPException(status_code=403, detail="Cannot delete other admins")
        await db.users.delete_one({"id": user_id})
        return {"message": "User deleted successfully"}
    
    raise HTTPException(status_code=403, detail="Only admin can delete users")

@api_router.put("/users/{user_id}/block")
async def block_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Block a user (Super Admin only)"""
    if not is_super_admin(current_user):
        raise HTTPException(status_code=403, detail="Only super admin can block users")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one({"id": user_id}, {"$set": {"is_blocked": True}})
    return {"message": "User blocked successfully"}

@api_router.put("/users/{user_id}/unblock")
async def unblock_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Unblock a user (Super Admin only)"""
    if not is_super_admin(current_user):
        raise HTTPException(status_code=403, detail="Only super admin can unblock users")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one({"id": user_id}, {"$set": {"is_blocked": False}})
    return {"message": "User unblocked successfully"}

class PasswordReset(BaseModel):
    new_password: str

@api_router.put("/users/{user_id}/reset-password")
async def reset_user_password(user_id: str, password_data: PasswordReset, current_user: dict = Depends(get_current_user)):
    """Reset user password (Super Admin only)"""
    if not is_super_admin(current_user):
        raise HTTPException(status_code=403, detail="Only super admin can reset passwords")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Hash new password
    hashed_password = hash_password(password_data.new_password)
    await db.users.update_one({"id": user_id}, {"$set": {"password": hashed_password}})
    return {"message": "Password reset successfully"}


# ==================== VISITOR ROUTES ====================

@api_router.post("/visitors")
async def create_visitor(visitor_data: VisitorCreate, current_user: dict = Depends(get_current_user)):
    # Restrict accueil role from creating visitors (read-only)
    if current_user["role"] == "accueil":
        raise HTTPException(status_code=403, detail="Accueil role is read-only, cannot create visitors")
    
    # Only superviseur_promos, referent, promotions, super_admin, pasteur can create
    if current_user["role"] not in ["superviseur_promos", "referent", "promotions", "super_admin", "pasteur"]:
        raise HTTPException(status_code=403, detail="Permission denied to create visitors")
    
    # Calculate assigned_month
    try:
        visit_dt = datetime.fromisoformat(visitor_data.visit_date)
        assigned_month = visit_dt.strftime("%Y-%m")
    except:
        assigned_month = datetime.now(timezone.utc).strftime("%Y-%m")
    
    visitor = Visitor(**visitor_data.model_dump(), assigned_month=assigned_month)
    doc = visitor.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.visitors.insert_one(doc)
    return visitor

@api_router.get("/visitors")
async def get_visitors(
    include_stopped: bool = False,
    current_user: dict = Depends(get_current_user)
):
    query = {
        "city": current_user["city"]
    }
    
    # Include or exclude stopped visitors
    if not include_stopped:
        query["tracking_stopped"] = False
    
    # Filter by role and permissions
    if current_user["role"] == "referent":
        # Check if referent has permission to view all months
        permissions = current_user.get("permissions", {})
        if not permissions.get("can_view_all_months", False):
            # Referents see only their assigned month (default behavior)
            query["assigned_month"] = current_user.get("assigned_month")
    
    visitors = await db.visitors.find(query, {"_id": 0}).to_list(10000)
    
    # For "accueil" role, return limited info (just for consultation)
    if current_user["role"] == "accueil":
        return [{
            "id": v["id"], 
            "firstname": v["firstname"], 
            "lastname": v["lastname"],
            "arrival_channel": v.get("arrival_channel", ""),
            "visit_date": v.get("visit_date", ""),
            "city": v["city"]
        } for v in visitors]
    
    return visitors

@api_router.get("/visitors/stopped")
async def get_stopped_visitors(current_user: dict = Depends(get_current_user)):
    # Only admin and promotions can see stopped visitors
    if current_user["role"] not in ["superviseur_promos", "promotions"]:
        raise HTTPException(status_code=403, detail="Only admin can view stopped visitors")
    
    query = {
        "city": current_user["city"],
        "tracking_stopped": True
    }
    
    visitors = await db.visitors.find(query, {"_id": 0}).to_list(10000)
    return visitors

@api_router.get("/visitors/{visitor_id}")
async def get_visitor(visitor_id: str, current_user: dict = Depends(get_current_user)):
    visitor = await db.visitors.find_one({"id": visitor_id, "city": current_user["city"]}, {"_id": 0})
    
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    
    # Check permissions
    if current_user["role"] == "referent":
        if visitor["assigned_month"] != current_user.get("assigned_month"):
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Accueil can't see details (consultation only)
    if current_user["role"] == "accueil":
        raise HTTPException(status_code=403, detail="Access denied")
    
    return visitor

@api_router.put("/visitors/{visitor_id}")
async def update_visitor(visitor_id: str, update_data: VisitorUpdate, current_user: dict = Depends(get_current_user)):
    visitor = await db.visitors.find_one({"id": visitor_id, "city": current_user["city"]})
    
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    
    # Check permissions for referents
    if current_user["role"] == "referent":
        permissions = current_user.get("permissions", {})
        if not permissions.get("can_edit_visitors", True):
            raise HTTPException(status_code=403, detail="Permission denied: cannot edit visitors")
    
    # Update only provided fields
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if update_dict:
        await db.visitors.update_one({"id": visitor_id}, {"$set": update_dict})
    
    return {"message": "Visitor updated successfully"}

@api_router.delete("/visitors/{visitor_id}")
async def delete_visitor(visitor_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a visitor"""
    visitor = await db.visitors.find_one({"id": visitor_id, "city": current_user["city"]})
    
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    
    # Check permissions based on role
    if current_user["role"] == "referent":
        # Referents can only delete visitors from their assigned month
        if visitor["assigned_month"] != current_user.get("assigned_month"):
            raise HTTPException(status_code=403, detail="Vous ne pouvez supprimer que vos visiteurs assignés")
    elif current_user["role"] not in ["superviseur_promos", "promotions"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    await db.visitors.delete_one({"id": visitor_id})
    return {"message": "Visitor deleted successfully"}

@api_router.post("/visitors/{visitor_id}/comment")
async def add_comment(visitor_id: str, comment: CommentAdd, current_user: dict = Depends(get_current_user)):
    visitor = await db.visitors.find_one({"id": visitor_id, "city": current_user["city"]})
    
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    
    # Check permissions for referents
    if current_user["role"] == "referent":
        permissions = current_user.get("permissions", {})
        if not permissions.get("can_add_comments", True):
            raise HTTPException(status_code=403, detail="Permission denied: cannot add comments")
    
    comment_entry = CommentEntry(
        author=current_user["username"],
        text=comment.text
    )
    
    await db.visitors.update_one(
        {"id": visitor_id},
        {"$push": {"comments": comment_entry.model_dump()}}
    )
    
    return {"message": "Comment added successfully"}

@api_router.post("/visitors/{visitor_id}/presence")
async def add_presence(visitor_id: str, presence: PresenceAdd, current_user: dict = Depends(get_current_user)):
    visitor = await db.visitors.find_one({"id": visitor_id, "city": current_user["city"]})
    
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    
    # Check permissions for referents
    if current_user["role"] == "referent":
        permissions = current_user.get("permissions", {})
        if not permissions.get("can_mark_presence", True):
            raise HTTPException(status_code=403, detail="Permission denied: cannot mark presence")
    
    presence_entry = PresenceEntry(date=presence.date, present=presence.present)
    
    field = "presences_dimanche" if presence.type == "dimanche" else "presences_jeudi"
    
    # Check if date already exists, update or add
    existing_presences = visitor.get(field, [])
    date_exists = False
    
    for i, p in enumerate(existing_presences):
        if p["date"] == presence.date:
            existing_presences[i] = presence_entry.model_dump()
            date_exists = True
            break
    
    if not date_exists:
        await db.visitors.update_one(
            {"id": visitor_id},
            {"$push": {field: presence_entry.model_dump()}}
        )
    else:
        await db.visitors.update_one(
            {"id": visitor_id},
            {"$set": {field: existing_presences}}
        )
    
    return {"message": "Presence updated successfully"}

@api_router.post("/visitors/{visitor_id}/formation")
async def update_formation(visitor_id: str, formation: FormationUpdate, current_user: dict = Depends(get_current_user)):
    visitor = await db.visitors.find_one({"id": visitor_id, "city": current_user["city"]})
    
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    
    field_map = {
        "pcnc": "formation_pcnc",
        "au_coeur_bible": "formation_au_coeur_bible",
        "star": "formation_star"
    }
    
    field = field_map.get(formation.formation_type)
    if not field:
        raise HTTPException(status_code=400, detail="Invalid formation type")
    
    await db.visitors.update_one(
        {"id": visitor_id},
        {"$set": {field: formation.completed}}
    )
    
    return {"message": "Formation updated successfully"}

@api_router.post("/visitors/{visitor_id}/stop-tracking")
async def stop_tracking(visitor_id: str, stop_data: StopTracking, current_user: dict = Depends(get_current_user)):
    visitor = await db.visitors.find_one({"id": visitor_id, "city": current_user["city"]})
    
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    
    # Check permissions for referents
    if current_user["role"] == "referent":
        permissions = current_user.get("permissions", {})
        if not permissions.get("can_stop_tracking", True):
            raise HTTPException(status_code=403, detail="Permission denied: cannot stop tracking")
    
    await db.visitors.update_one(
        {"id": visitor_id},
        {"$set": {
            "tracking_stopped": True,
            "stop_reason": stop_data.reason,
            "stopped_by": current_user["username"],
            "stopped_date": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Tracking stopped successfully"}

# ==================== CITY ROUTES ====================

@api_router.post("/cities")
async def create_city(city_data: CityCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["superviseur_promos", "promotions"]:
        raise HTTPException(status_code=403, detail="Only admin can create cities")
    
    # Check if city already exists
    existing = await db.cities.find_one({"name": city_data.name})
    if existing:
        raise HTTPException(status_code=400, detail="City already exists")
    
    city = City(**city_data.model_dump())
    await db.cities.insert_one(city.model_dump())
    
    return city

@api_router.get("/cities")
async def get_cities():
    cities = await db.cities.find({}, {"_id": 0}).to_list(1000)
    return cities

@api_router.put("/cities/{city_id}")
async def update_city(city_id: str, city_data: CityCreate, current_user: dict = Depends(get_current_user)):
    """Update city name (Admin only)"""
    if current_user["role"] not in ["superviseur_promos", "promotions"]:
        raise HTTPException(status_code=403, detail="Only admin can update cities")
    
    # Check if new name already exists (excluding current city)
    existing = await db.cities.find_one({
        "name": city_data.name,
        "id": {"$ne": city_id}
    })
    if existing:
        raise HTTPException(status_code=400, detail="City name already exists")
    
    # Get the old city name before updating
    old_city = await db.cities.find_one({"id": city_id})
    if not old_city:
        raise HTTPException(status_code=404, detail="City not found")
    
    old_name = old_city["name"]
    
    # Update city name
    result = await db.cities.update_one(
        {"id": city_id},
        {"$set": {"name": city_data.name}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="City not found")
    
    # Update all users with this city
    await db.users.update_many(
        {"city": old_name},
        {"$set": {"city": city_data.name}}
    )
    
    # Update all visitors with this city
    await db.visitors.update_many(
        {"city": old_name},
        {"$set": {"city": city_data.name}}
    )
    
    return {"message": "City updated successfully"}

@api_router.delete("/cities/{city_id}")
async def delete_city(city_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a city (Admin only)"""
    if current_user["role"] not in ["superviseur_promos", "promotions"]:
        raise HTTPException(status_code=403, detail="Only admin can delete cities")
    
    city = await db.cities.find_one({"id": city_id})
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    
    city_name = city["name"]
    
    # Check if city has users or visitors
    users_count = await db.users.count_documents({"city": city_name})
    visitors_count = await db.visitors.count_documents({"city": city_name})
    
    if users_count > 0 or visitors_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete city with {users_count} users and {visitors_count} visitors"
        )
    
    # Delete the city
    await db.cities.delete_one({"id": city_id})
    
    return {"message": "City deleted successfully"}

@api_router.get("/cities/{city_id}/stats")
async def get_city_stats(city_id: str, current_user: dict = Depends(get_current_user)):
    """Get detailed statistics for a specific city"""
    if current_user["role"] not in ["superviseur_promos", "promotions"]:
        raise HTTPException(status_code=403, detail="Only admin can view city stats")
    
    city = await db.cities.find_one({"id": city_id})
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    
    city_name = city["name"]
    
    # Get all referents in this city
    referents = await db.users.find({
        "city": city_name,
        "role": "referent"
    }, {"_id": 0, "password": 0}).to_list(1000)
    
    referent_stats = []
    
    for referent in referents:
        assigned_month = referent.get("assigned_month")
        if not assigned_month:
            continue
        
        # Get visitors for this referent
        visitors = await db.visitors.find({
            "city": city_name,
            "assigned_month": assigned_month,
            "tracking_stopped": False
        }).to_list(10000)
        
        # Count by type
        nouveaux_arrivants = sum(1 for v in visitors if "Nouveau Arrivant" in v.get("types", []))
        nouveaux_convertis = sum(1 for v in visitors if "Nouveau Converti" in v.get("types", []))
        de_passage = sum(1 for v in visitors if "De Passage" in v.get("types", []))
        
        # Calculate fidelity rate
        total_visitors = len(visitors)
        if total_visitors > 0:
            year, month = map(int, assigned_month.split("-"))
            weeks = get_weeks_in_month(year, month)
            
            total_rate = 0
            for week in weeks:
                total_presences = 0
                for visitor in visitors:
                    for presence in visitor.get("presences_dimanche", []) + visitor.get("presences_jeudi", []):
                        if get_week_number(presence["date"]) == week and presence.get("present", False):
                            total_presences += 1
                
                expected_presences = total_visitors * 2
                rate = (total_presences / expected_presences * 100) if expected_presences > 0 else 0
                total_rate += rate
            
            avg_fidelity = total_rate / len(weeks) if weeks else 0
        else:
            avg_fidelity = 0
        
        referent_stats.append({
            "referent_id": referent["id"],
            "referent_name": referent["username"],
            "assigned_month": assigned_month,
            "total_visitors": total_visitors,
            "nouveaux_arrivants": nouveaux_arrivants,
            "nouveaux_convertis": nouveaux_convertis,
            "de_passage": de_passage,
            "avg_fidelity_rate": round(avg_fidelity, 2)
        })
    
    return {
        "city_name": city_name,
        "total_referents": len(referents),
        "referent_stats": referent_stats
    }

# ==================== ANALYTICS ROUTES ====================

@api_router.get("/analytics/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    # Base query filter
    base_query = {"tracking_stopped": False}
    
    # For pasteur and super_admin, don't filter by city (see all)
    if current_user["role"] not in ["pasteur", "super_admin"]:
        base_query["city"] = current_user["city"]
    
    city = current_user["city"]
    
    # If referent, filter by their assigned month
    if current_user["role"] == "referent":
        assigned_month = current_user.get("assigned_month")
        if assigned_month:
            base_query["assigned_month"] = assigned_month
    
    # Total visitors
    total_visitors = await db.visitors.count_documents(base_query)
    
    # Total referents (only for admin/promotions/pasteur/super_admin)
    if current_user["role"] in ["superviseur_promos", "promotions", "pasteur", "super_admin"]:
        ref_query = {"role": {"$in": ["referent", "accueil", "promotions"]}}
        if current_user["role"] not in ["pasteur", "super_admin"]:
            ref_query["city"] = city
        total_referents = await db.users.count_documents(ref_query)
    else:
        total_referents = 0
    
    # By arrival channel
    pipeline = [
        {"$match": base_query},
        {"$group": {"_id": "$arrival_channel", "count": {"$sum": 1}}}
    ]
    by_channel = await db.visitors.aggregate(pipeline).to_list(1000)
    
    # By month
    pipeline = [
        {"$match": base_query},
        {"$group": {"_id": "$assigned_month", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    by_month = await db.visitors.aggregate(pipeline).to_list(1000)
    
    # By type
    pipeline = [
        {"$match": base_query},
        {"$unwind": "$types"},
        {"$group": {"_id": "$types", "count": {"$sum": 1}}}
    ]
    by_type = await db.visitors.aggregate(pipeline).to_list(1000)
    
    return {
        "total_visitors": total_visitors,
        "total_referents": total_referents,
        "by_channel": by_channel,
        "by_month": by_month,
        "by_type": by_type
    }

@api_router.get("/analytics/export")
async def export_excel(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["superviseur_promos", "promotions"]:
        raise HTTPException(status_code=403, detail="Only admin can export data")
    
    visitors = await db.visitors.find({"city": current_user["city"]}, {"_id": 0}).to_list(10000)
    
    # Prepare data for Excel
    data = []
    for v in visitors:
        data.append({
            "Prénom": v.get("firstname"),
            "Nom": v.get("lastname"),
            "Types": ", ".join(v.get("types", [])),
            "Téléphone": v.get("phone", ""),
            "Email": v.get("email", ""),
            "Canal d'arrivée": v.get("arrival_channel"),
            "Date de visite": v.get("visit_date"),
            "Mois assigné": v.get("assigned_month"),
            "Formation PCNC": "Oui" if v.get("formation_pcnc") else "Non",
            "Formation Au cœur de la bible": "Oui" if v.get("formation_au_coeur_bible") else "Non",
            "Formation STAR": "Oui" if v.get("formation_star") else "Non",
            "Suivi arrêté": "Oui" if v.get("tracking_stopped") else "Non",
            "Raison arrêt": v.get("stop_reason", ""),
            "Arrêté par": v.get("stopped_by", ""),
        })
    
    df = pd.DataFrame(data)
    
    # Create Excel file in memory
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Visiteurs')
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=visiteurs_{current_user['city']}_{datetime.now().strftime('%Y%m%d')}.xlsx"}
    )

# ==================== FIDELISATION ROUTES ====================

def get_week_number(date_str):
    """Get week number from date string"""
    try:
        date = datetime.fromisoformat(date_str)
        return date.isocalendar()[1]
    except:
        return None

def get_weeks_in_month(year, month):
    """Get all week numbers in a given month"""
    first_day = datetime(year, month, 1)
    if month == 12:
        last_day = datetime(year + 1, 1, 1) - timedelta(days=1)
    else:
        last_day = datetime(year, month + 1, 1) - timedelta(days=1)
    
    weeks = set()
    current = first_day
    while current <= last_day:
        weeks.add(current.isocalendar()[1])
        current += timedelta(days=1)
    return sorted(list(weeks))

@api_router.get("/fidelisation/referent")
async def get_referent_fidelisation(current_user: dict = Depends(get_current_user)):
    """Get fidelisation rate for current referent"""
    if current_user["role"] != "referent":
        raise HTTPException(status_code=403, detail="Only referents can access this")
    
    assigned_month = current_user.get("assigned_month")
    if not assigned_month:
        raise HTTPException(status_code=400, detail="No assigned month")
    
    # Get all visitors for this referent
    visitors = await db.visitors.find({
        "city": current_user["city"],
        "assigned_month": assigned_month,
        "tracking_stopped": False
    }, {"_id": 0}).to_list(10000)
    
    total_visitors = len(visitors)
    if total_visitors == 0:
        return {
            "total_visitors": 0,
            "weekly_rates": [],
            "monthly_average": 0
        }
    
    # Parse month (format: "2025-01")
    year, month = map(int, assigned_month.split("-"))
    weeks = get_weeks_in_month(year, month)
    
    weekly_rates = []
    for week in weeks:
        # Count presences for this week
        total_presences = 0
        for visitor in visitors:
            for presence in visitor.get("presences_dimanche", []) + visitor.get("presences_jeudi", []):
                if get_week_number(presence["date"]) == week and presence.get("present", False):
                    total_presences += 1
        
        # Calculate rate (2 services per week: dimanche + jeudi)
        expected_presences = total_visitors * 2
        rate = (total_presences / expected_presences * 100) if expected_presences > 0 else 0
        
        weekly_rates.append({
            "week": week,
            "rate": round(rate, 2),
            "presences": total_presences,
            "expected": expected_presences
        })
    
    # Calculate monthly average
    monthly_average = sum(w["rate"] for w in weekly_rates) / len(weekly_rates) if weekly_rates else 0
    
    return {
        "total_visitors": total_visitors,
        "weekly_rates": weekly_rates,
        "monthly_average": round(monthly_average, 2)
    }

@api_router.get("/fidelisation/admin")
async def get_admin_fidelisation(week: int = None, month: str = None, current_user: dict = Depends(get_current_user)):
    """Get fidelisation rates for all referents (admin view)"""
    if current_user["role"] not in ["superviseur_promos", "superviseur_fi", "promotions", "super_admin", "pasteur"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Get all referents (all cities for pasteur/super_admin, own city for others)
    ref_query = {"role": "referent"}
    if current_user["role"] not in ["pasteur", "super_admin"]:
        ref_query["city"] = current_user["city"]
    
    referents = await db.users.find(ref_query, {"_id": 0, "password": 0}).to_list(1000)
    
    results = []
    
    for referent in referents:
        assigned_month = referent.get("assigned_month")
        if not assigned_month:
            continue
        
        # Get visitors for this referent  
        visitors = await db.visitors.find({
            "city": referent["city"],
            "assigned_month": assigned_month,
            "tracking_stopped": False
        }, {"_id": 0}).to_list(10000)
        
        total_visitors = len(visitors)
        if total_visitors == 0:
            continue
        
        # Parse month
        year, ref_month = map(int, assigned_month.split("-"))
        
        # Filter by month if specified
        if month and assigned_month != month:
            continue
        
        weeks = get_weeks_in_month(year, ref_month)
        
        # Filter by week if specified
        if week:
            weeks = [week] if week in weeks else []
        
        weekly_rates = []
        for w in weeks:
            total_presences = 0
            for visitor in visitors:
                for presence in visitor.get("presences_dimanche", []) + visitor.get("presences_jeudi", []):
                    if get_week_number(presence["date"]) == w and presence.get("present", False):
                        total_presences += 1
            
            expected_presences = total_visitors * 2
            rate = (total_presences / expected_presences * 100) if expected_presences > 0 else 0
            
            weekly_rates.append({
                "week": w,
                "rate": round(rate, 2),
                "presences": total_presences,
                "expected": expected_presences
            })
        
        monthly_average = sum(w["rate"] for w in weekly_rates) / len(weekly_rates) if weekly_rates else 0
        
        results.append({
            "referent_username": referent["username"],
            "referent_id": referent["id"],
            "assigned_month": assigned_month,
            "total_visitors": total_visitors,
            "weekly_rates": weekly_rates,
            "monthly_average": round(monthly_average, 2)
        })
    
    return results

# ==================== INIT DATA ====================

@api_router.post("/init")
async def init_data():
    """Initialize default data"""
    # Create default cities
    default_cities = [
        "Dijon", "Chalon-Sur-Saone", "Dole", "Besançon", 
        "Sens", "Milan", "Perugia", "Rome"
    ]
    
    for city_name in default_cities:
        existing = await db.cities.find_one({"name": city_name})
        if not existing:
            city = City(name=city_name)
            await db.cities.insert_one(city.model_dump())
    
    # Create default superviseur_promos for Dijon
    existing_admin = await db.users.find_one({"username": "superviseur_promos", "city": "Dijon"})
    if not existing_admin:
        superviseur = User(
            username="superviseur_promos",
            password=hash_password("superviseur123"),
            city="Dijon",
            role="superviseur_promos"
        )
        doc = superviseur.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.users.insert_one(doc)
    
    # Create Super Admin account
    existing_superadmin = await db.users.find_one({"username": "superadmin"})
    if not existing_superadmin:
        superadmin = User(
            username="superadmin",
            password=hash_password("superadmin123"),
            city="Dijon",
            role="super_admin"
        )
        doc = superadmin.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.users.insert_one(doc)
    
    # Create Pasteur account
    existing_pasteur = await db.users.find_one({"username": "pasteur"})
    if not existing_pasteur:
        pasteur = User(
            username="pasteur",
            password=hash_password("pasteur123"),
            city="Dijon",
            role="pasteur"
        )
        doc = pasteur.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.users.insert_one(doc)
    
    # Migrate old "admin" roles to "superviseur_promos"
    await db.users.update_many(
        {"role": "admin"},
        {"$set": {"role": "superviseur_promos"}}
    )
    
    return {"message": "Initialization complete"}

# ==================== FAMILLES D'IMPACT ROUTES ====================

# ========== SECTEURS ==========

@api_router.post("/fi/secteurs")
async def create_secteur(secteur_data: SecteurCreate, current_user: dict = Depends(get_current_user)):
    # Only admin, super_admin, superviseur_fi can create secteurs
    if current_user["role"] not in ["superviseur_promos", "super_admin", "superviseur_fi"] and not is_super_admin(current_user):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    secteur = Secteur(**secteur_data.model_dump(), created_by=current_user["username"])
    doc = secteur.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.secteurs.insert_one(doc)
    return secteur

@api_router.get("/fi/secteurs")
async def get_secteurs(ville: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if ville:
        query["ville"] = ville
    
    secteurs = await db.secteurs.find(query, {"_id": 0}).to_list(length=None)
    return secteurs

@api_router.put("/fi/secteurs/{secteur_id}")
async def update_secteur(secteur_id: str, secteur_data: SecteurCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["superviseur_promos", "super_admin", "superviseur_fi"] and not is_super_admin(current_user):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    result = await db.secteurs.update_one(
        {"id": secteur_id},
        {"$set": secteur_data.model_dump()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Secteur not found")
    
    return {"message": "Secteur updated"}

@api_router.delete("/fi/secteurs/{secteur_id}")
async def delete_secteur(secteur_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["superviseur_promos", "super_admin", "superviseur_fi"] and not is_super_admin(current_user):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Check if there are FI in this secteur
    fi_count = await db.familles_impact.count_documents({"secteur_id": secteur_id})
    if fi_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete secteur with {fi_count} Familles d'Impact")
    
    result = await db.secteurs.delete_one({"id": secteur_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Secteur not found")
    
    return {"message": "Secteur deleted"}

# ========== FAMILLES D'IMPACT ==========

@api_router.post("/fi/familles-impact")
async def create_famille_impact(fi_data: FamilleImpactCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["superviseur_promos", "super_admin", "superviseur_fi", "responsable_secteur"] and not is_super_admin(current_user):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    fi = FamilleImpact(**fi_data.model_dump(), created_by=current_user["username"])
    doc = fi.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.familles_impact.insert_one(doc)
    return fi

@api_router.get("/fi/familles-impact")
async def get_familles_impact(
    secteur_id: Optional[str] = None, 
    ville: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if secteur_id:
        query["secteur_id"] = secteur_id
    if ville:
        query["ville"] = ville
    
    # Filter based on role
    if current_user["role"] == "pilote_fi" and current_user.get("assigned_fi_id"):
        query["id"] = current_user["assigned_fi_id"]
    elif current_user["role"] == "responsable_secteur" and current_user.get("assigned_secteur_id"):
        query["secteur_id"] = current_user["assigned_secteur_id"]
    
    fis = await db.familles_impact.find(query, {"_id": 0}).to_list(length=None)
    return fis

@api_router.get("/fi/familles-impact/{fi_id}")
async def get_famille_impact(fi_id: str, current_user: dict = Depends(get_current_user)):
    fi = await db.familles_impact.find_one({"id": fi_id}, {"_id": 0})
    if not fi:
        raise HTTPException(status_code=404, detail="Famille d'Impact not found")
    
    # Check permissions
    if current_user["role"] == "pilote_fi" and current_user.get("assigned_fi_id") != fi_id:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    return fi

@api_router.put("/fi/familles-impact/{fi_id}")
async def update_famille_impact(fi_id: str, fi_data: FamilleImpactCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["superviseur_promos", "super_admin", "superviseur_fi", "responsable_secteur"] and not is_super_admin(current_user):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    result = await db.familles_impact.update_one(
        {"id": fi_id},
        {"$set": fi_data.model_dump()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Famille d'Impact not found")
    
    return {"message": "Famille d'Impact updated"}

@api_router.delete("/fi/familles-impact/{fi_id}")
async def delete_famille_impact(fi_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["superviseur_promos", "super_admin", "superviseur_fi", "responsable_secteur"] and not is_super_admin(current_user):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Check if there are membres
    membre_count = await db.membres_fi.count_documents({"fi_id": fi_id})
    if membre_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete FI with {membre_count} members")
    
    result = await db.familles_impact.delete_one({"id": fi_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Famille d'Impact not found")
    
    return {"message": "Famille d'Impact deleted"}

# ========== MEMBRES FI ==========

@api_router.post("/fi/membres")
async def create_membre_fi(membre_data: MembreFICreate, current_user: dict = Depends(get_current_user)):
    # Pilote can add to their FI, others need admin permissions
    if current_user["role"] == "pilote_fi":
        if current_user.get("assigned_fi_id") != membre_data.fi_id:
            raise HTTPException(status_code=403, detail="Can only add members to your FI")
    elif current_user["role"] not in ["superviseur_promos", "super_admin", "superviseur_fi", "responsable_secteur"] and not is_super_admin(current_user):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    membre = MembreFI(**membre_data.model_dump())
    doc = membre.model_dump()
    doc['date_ajout'] = doc['date_ajout'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.membres_fi.insert_one(doc)
    return membre

@api_router.get("/fi/membres")
async def get_membres_fi(fi_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if fi_id:
        query["fi_id"] = fi_id
    
    # Filter for pilote
    if current_user["role"] == "pilote_fi" and current_user.get("assigned_fi_id"):
        query["fi_id"] = current_user["assigned_fi_id"]
    
    membres = await db.membres_fi.find(query, {"_id": 0}).to_list(length=None)
    return membres

@api_router.delete("/fi/membres/{membre_id}")
async def delete_membre_fi(membre_id: str, current_user: dict = Depends(get_current_user)):
    membre = await db.membres_fi.find_one({"id": membre_id})
    if not membre:
        raise HTTPException(status_code=404, detail="Membre not found")
    
    # Check permissions
    if current_user["role"] == "pilote_fi":
        if current_user.get("assigned_fi_id") != membre["fi_id"]:
            raise HTTPException(status_code=403, detail="Permission denied")
    elif current_user["role"] not in ["superviseur_promos", "super_admin", "superviseur_fi", "responsable_secteur"] and not is_super_admin(current_user):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Delete all presences for this member
    await db.presences_fi.delete_many({"membre_fi_id": membre_id})
    
    result = await db.membres_fi.delete_one({"id": membre_id})
    return {"message": "Membre deleted"}

# ========== PRESENCES FI ==========

@api_router.post("/fi/presences")
async def create_presence_fi(presence_data: PresenceFICreate, current_user: dict = Depends(get_current_user)):
    # Get membre to check FI
    membre = await db.membres_fi.find_one({"id": presence_data.membre_fi_id})
    if not membre:
        raise HTTPException(status_code=404, detail="Membre not found")
    
    # Check permissions
    if current_user["role"] == "pilote_fi":
        if current_user.get("assigned_fi_id") != membre["fi_id"]:
            raise HTTPException(status_code=403, detail="Permission denied")
    elif current_user["role"] not in ["superviseur_promos", "super_admin", "superviseur_fi", "responsable_secteur"] and not is_super_admin(current_user):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Check if presence already exists for this date
    existing = await db.presences_fi.find_one({
        "membre_fi_id": presence_data.membre_fi_id,
        "date": presence_data.date
    })
    
    if existing:
        # Update existing
        await db.presences_fi.update_one(
            {"id": existing["id"]},
            {"$set": {
                "present": presence_data.present,
                "commentaire": presence_data.commentaire
            }}
        )
        return {"message": "Presence updated"}
    
    presence = PresenceFI(**presence_data.model_dump(), marked_by=current_user["username"])
    doc = presence.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.presences_fi.insert_one(doc)
    return presence

@api_router.get("/fi/presences")
async def get_presences_fi(
    fi_id: Optional[str] = None,
    date: Optional[str] = None,
    membre_fi_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    
    if membre_fi_id:
        query["membre_fi_id"] = membre_fi_id
    elif fi_id:
        # Get all membres of this FI
        membres = await db.membres_fi.find({"fi_id": fi_id}, {"_id": 0}).to_list(length=None)
        membre_ids = [m["id"] for m in membres]
        query["membre_fi_id"] = {"$in": membre_ids}
    
    if date:
        query["date"] = date
    
    presences = await db.presences_fi.find(query, {"_id": 0}).to_list(length=None)
    return presences

# ========== AFFECTATION NOUVEAUX ARRIVANTS ==========

@api_router.post("/fi/affecter-visiteur")
async def affecter_visiteur_to_fi(affectation: AffectationFI, current_user: dict = Depends(get_current_user)):
    # Get visitor
    visitor = await db.visitors.find_one({"id": affectation.nouveau_arrivant_id})
    if not visitor:
        raise HTTPException(status_code=404, detail="Nouveau arrivant not found")
    
    # Get FI
    fi = await db.familles_impact.find_one({"id": affectation.fi_id})
    if not fi:
        raise HTTPException(status_code=404, detail="Famille d'Impact not found")
    
    # Check if already membre
    existing = await db.membres_fi.find_one({
        "nouveau_arrivant_id": affectation.nouveau_arrivant_id,
        "fi_id": affectation.fi_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Already membre of this FI")
    
    # Create membre
    membre = MembreFI(
        prenom=visitor["firstname"],
        nom=visitor["lastname"],
        fi_id=affectation.fi_id,
        source="nouveau_arrivant",
        nouveau_arrivant_id=affectation.nouveau_arrivant_id
    )
    
    doc = membre.model_dump()
    doc['date_ajout'] = doc['date_ajout'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.membres_fi.insert_one(doc)
    return membre

@api_router.get("/fi/indicateurs/affectation")
async def get_indicateurs_affectation(ville: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    # Get all nouveaux arrivants
    query = {}
    if ville:
        query["ville"] = ville
    
    total_visitors = await db.visitors.count_documents(query)
    
    # Get affected visitors
    membres = await db.membres_fi.find(
        {"source": "nouveau_arrivant", "nouveau_arrivant_id": {"$ne": None}},
        {"_id": 0}
    ).to_list(length=None)
    
    affected_ids = [m["nouveau_arrivant_id"] for m in membres]
    affected_count = len(set(affected_ids))
    
    non_affected_count = total_visitors - affected_count
    percentage = (affected_count / total_visitors * 100) if total_visitors > 0 else 0
    
    return {
        "total_nouveaux_arrivants": total_visitors,
        "affectes": affected_count,
        "non_affectes": non_affected_count,
        "pourcentage_affectation": round(percentage, 2)
    }

# ========== STATISTIQUES FI ==========

@api_router.get("/fi/stats/pilote")
async def get_stats_pilote(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "pilote_fi":
        raise HTTPException(status_code=403, detail="Only for pilote_fi")
    
    fi_id = current_user.get("assigned_fi_id")
    if not fi_id:
        raise HTTPException(status_code=400, detail="No FI assigned")
    
    # Get FI info
    fi = await db.familles_impact.find_one({"id": fi_id}, {"_id": 0})
    if not fi:
        raise HTTPException(status_code=404, detail="FI not found")
    
    # Get membres count and evolution
    membres = await db.membres_fi.find({"fi_id": fi_id}, {"_id": 0}).to_list(length=None)
    total_membres = len(membres)
    
    # Calculate evolution by month
    from collections import defaultdict
    evolution_membres = defaultdict(int)
    for membre in membres:
        date_ajout = membre.get("date_ajout")
        if date_ajout:
            if isinstance(date_ajout, str):
                month = date_ajout[:7]  # YYYY-MM
            else:
                month = date_ajout.strftime("%Y-%m")
            evolution_membres[month] += 1
    
    # Cumulative
    cumulative = {}
    total = 0
    for month in sorted(evolution_membres.keys()):
        total += evolution_membres[month]
        cumulative[month] = total
    
    # Get presences and calculate fidelisation
    membre_ids = [m["id"] for m in membres]
    presences = await db.presences_fi.find(
        {"membre_fi_id": {"$in": membre_ids}},
        {"_id": 0}
    ).to_list(length=None)
    
    # Calculate fidelisation by week/month/year
    from datetime import datetime
    presences_by_date = {}
    for p in presences:
        if p["present"]:
            presences_by_date[p["date"]] = presences_by_date.get(p["date"], 0) + 1
    
    # Get unique jeudis count
    unique_jeudis = len(set([p["date"] for p in presences]))
    total_presences = sum([1 for p in presences if p["present"]])
    max_possible = total_membres * unique_jeudis if unique_jeudis > 0 else 0
    fidelisation_globale = (total_presences / max_possible * 100) if max_possible > 0 else 0
    
    return {
        "fi": fi,
        "total_membres": total_membres,
        "evolution_membres": cumulative,
        "fidelisation_globale": round(fidelisation_globale, 2),
        "total_presences": total_presences,
        "jeudis_count": unique_jeudis
    }

@api_router.get("/fi/stats/secteur")
async def get_stats_secteur(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "responsable_secteur":
        raise HTTPException(status_code=403, detail="Only for responsable_secteur")
    
    secteur_id = current_user.get("assigned_secteur_id")
    if not secteur_id:
        raise HTTPException(status_code=400, detail="No secteur assigned")
    
    # Get secteur info
    secteur = await db.secteurs.find_one({"id": secteur_id}, {"_id": 0})
    if not secteur:
        raise HTTPException(status_code=404, detail="Secteur not found")
    
    # Get all FI in this secteur
    fis = await db.familles_impact.find({"secteur_id": secteur_id}, {"_id": 0}).to_list(length=None)
    
    # Stats per FI
    fi_stats = []
    for fi in fis:
        membres = await db.membres_fi.find({"fi_id": fi["id"]}, {"_id": 0}).to_list(length=None)
        total_membres = len(membres)
        
        # Get pilote info
        pilote = None
        if fi.get("pilote_id"):
            pilote = await db.users.find_one({"id": fi["pilote_id"]}, {"_id": 0, "password": 0})
        
        # Calculate fidelisation
        membre_ids = [m["id"] for m in membres]
        presences = await db.presences_fi.find(
            {"membre_fi_id": {"$in": membre_ids}},
            {"_id": 0}
        ).to_list(length=None)
        
        unique_jeudis = len(set([p["date"] for p in presences]))
        total_presences = sum([1 for p in presences if p["present"]])
        max_possible = total_membres * unique_jeudis if unique_jeudis > 0 else 0
        fidelisation = (total_presences / max_possible * 100) if max_possible > 0 else 0
        
        fi_stats.append({
            "fi": fi,
            "pilote": pilote,
            "total_membres": total_membres,
            "fidelisation": round(fidelisation, 2)
        })
    
    # Count pilotes
    pilotes_count = len([fi for fi in fis if fi.get("pilote_id")])
    
    return {
        "secteur": secteur,
        "nombre_fi": len(fis),
        "nombre_pilotes": pilotes_count,
        "fi_details": fi_stats
    }

@api_router.get("/fi/stats/superviseur")
async def get_stats_superviseur(ville: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["superviseur_fi", "superviseur_promos", "super_admin", "pasteur"] and not is_super_admin(current_user):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    query = {}
    if ville:
        query["ville"] = ville
    elif current_user["role"] == "superviseur_fi":
        query["ville"] = current_user["city"]
    
    # Get all secteurs
    secteurs = await db.secteurs.find(query, {"_id": 0}).to_list(length=None)
    
    # Get all FI
    fi_query = {}
    if ville:
        fi_query["ville"] = ville
    elif current_user["role"] == "superviseur_fi":
        fi_query["ville"] = current_user["city"]
    
    fis = await db.familles_impact.find(fi_query, {"_id": 0}).to_list(length=None)
    
    # Get all membres
    fi_ids = [fi["id"] for fi in fis]
    membres = await db.membres_fi.find({"fi_id": {"$in": fi_ids}}, {"_id": 0}).to_list(length=None)
    
    # Evolution membres by month
    from collections import defaultdict
    evolution_membres = defaultdict(int)
    for membre in membres:
        date_ajout = membre.get("date_ajout")
        if isinstance(date_ajout, str):
            month = date_ajout[:7]
        else:
            month = date_ajout.strftime("%Y-%m")
        evolution_membres[month] += 1
    
    cumulative = {}
    total = 0
    for month in sorted(evolution_membres.keys()):
        total += evolution_membres[month]
        cumulative[month] = total
    
    # Calculate global fidelisation
    membre_ids = [m["id"] for m in membres]
    presences = await db.presences_fi.find(
        {"membre_fi_id": {"$in": membre_ids}},
        {"_id": 0}
    ).to_list(length=None)
    
    unique_jeudis = len(set([p["date"] for p in presences]))
    total_presences = sum([1 for p in presences if p["present"]])
    max_possible = len(membres) * unique_jeudis if unique_jeudis > 0 else 0
    fidelisation_globale = (total_presences / max_possible * 100) if max_possible > 0 else 0
    
    # FI by secteur
    fi_by_secteur = defaultdict(int)
    for fi in fis:
        fi_by_secteur[fi["secteur_id"]] += 1
    
    secteur_details = []
    for secteur in secteurs:
        secteur_details.append({
            "secteur": secteur,
            "nombre_fi": fi_by_secteur[secteur["id"]]
        })
    
    return {
        "nombre_secteurs": len(secteurs),
        "nombre_fi_total": len(fis),
        "nombre_membres_total": len(membres),
        "evolution_membres": cumulative,
        "fidelisation_globale": round(fidelisation_globale, 2),
        "secteurs_details": secteur_details
    }

@api_router.get("/fi/stats/pasteur")
async def get_stats_pasteur(current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["pasteur", "super_admin"] and not is_super_admin(current_user):
        raise HTTPException(status_code=403, detail="Only for pasteur or super_admin")
    
    # Get all cities
    cities = await db.cities.find({}, {"_id": 0}).to_list(length=None)
    
    stats_by_city = []
    for city in cities:
        ville = city["name"]
        
        # Get stats for this city
        secteurs = await db.secteurs.find({"ville": ville}, {"_id": 0}).to_list(length=None)
        fis = await db.familles_impact.find({"ville": ville}, {"_id": 0}).to_list(length=None)
        
        fi_ids = [fi["id"] for fi in fis]
        membres = await db.membres_fi.find({"fi_id": {"$in": fi_ids}}, {"_id": 0}).to_list(length=None)
        
        # Fidelisation
        membre_ids = [m["id"] for m in membres]
        presences = await db.presences_fi.find(
            {"membre_fi_id": {"$in": membre_ids}},
            {"_id": 0}
        ).to_list(length=None)
        
        unique_jeudis = len(set([p["date"] for p in presences]))
        total_presences = sum([1 for p in presences if p["present"]])
        max_possible = len(membres) * unique_jeudis if unique_jeudis > 0 else 0
        fidelisation = (total_presences / max_possible * 100) if max_possible > 0 else 0
        
        stats_by_city.append({
            "ville": ville,
            "nombre_secteurs": len(secteurs),
            "nombre_fi": len(fis),
            "nombre_membres": len(membres),
            "fidelisation": round(fidelisation, 2)
        })
    
    return {
        "stats_by_city": stats_by_city
    }

# ==================== NOTIFICATIONS ====================

@api_router.get("/notifications")
async def get_notifications(
    unread_only: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """Get notifications for current user"""
    query = {"user_id": current_user["id"]}
    if unread_only:
        query["read"] = False
    
    notifications = await db.notifications.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return notifications

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark notification as read"""
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user["id"]},
        {"$set": {"read": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification marked as read"}

@api_router.post("/notifications/generate")
async def generate_notifications(current_user: dict = Depends(get_current_user)):
    """Generate automated notifications (Admin/Supervisor only)"""
    if current_user["role"] not in ["super_admin", "superviseur_fi", "superviseur_promos"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    notifications_created = []
    
    # 1. Rappels de présence pour Pilotes FI (tous les jeudis)
    today = datetime.now(timezone.utc)
    if today.weekday() == 3:  # Jeudi
        pilotes = await db.users.find({"role": "pilote_fi"}, {"_id": 0}).to_list(length=None)
        for pilote in pilotes:
            if pilote.get("assigned_fi_id"):
                fi = await db.familles_impact.find_one({"id": pilote["assigned_fi_id"]}, {"_id": 0})
                if fi:
                    notif = Notification(
                        user_id=pilote["id"],
                        type="presence_reminder",
                        message=f"📝 N'oubliez pas de marquer les présences pour {fi['name']} aujourd'hui!",
                        data={"fi_id": fi["id"], "fi_name": fi["name"]}
                    )
                    doc = notif.model_dump()
                    doc['created_at'] = doc['created_at'].isoformat()
                    await db.notifications.insert_one(doc)
                    notifications_created.append(notif)
    
    # 2. Alertes FI stagnantes (pas de nouvelles présences depuis 2 semaines)
    two_weeks_ago = (datetime.now(timezone.utc) - timedelta(weeks=2)).isoformat()
    fis = await db.familles_impact.find({}, {"_id": 0}).to_list(length=None)
    
    for fi in fis:
        # Check dernière présence
        last_presence = await db.presences_fi.find_one(
            {"fi_id": fi["id"]},
            {"_id": 0},
            sort=[("date", -1)]
        )
        
        if not last_presence or last_presence["date"] < two_weeks_ago:
            # Notifier responsable secteur
            secteur = await db.secteurs.find_one({"id": fi["secteur_id"]}, {"_id": 0})
            if secteur:
                responsables = await db.users.find(
                    {"role": "responsable_secteur", "assigned_secteur_id": secteur["id"]},
                    {"_id": 0}
                ).to_list(length=None)
                
                for resp in responsables:
                    notif = Notification(
                        user_id=resp["id"],
                        type="fi_stagnation",
                        message=f"⚠️ Aucune activité récente dans la FI {fi['name']} (Secteur {secteur['name']})",
                        data={"fi_id": fi["id"], "secteur_id": secteur["id"]}
                    )
                    doc = notif.model_dump()
                    doc['created_at'] = doc['created_at'].isoformat()
                    await db.notifications.insert_one(doc)
                    notifications_created.append(notif)
    
    # 3. Alertes fidélisation faible (< 50%)
    superviseurs = await db.users.find(
        {"role": {"$in": ["superviseur_fi", "superviseur_promos"]}},
        {"_id": 0}
    ).to_list(length=None)
    
    for sup in superviseurs:
        city = sup["city"]
        
        if sup["role"] == "superviseur_fi":
            # Calculer fidélisation FI
            fis_city = await db.familles_impact.find({"city": city}, {"_id": 0}).to_list(length=None)
            fi_ids = [fi["id"] for fi in fis_city]
            membres = await db.membres_fi.find({"fi_id": {"$in": fi_ids}}, {"_id": 0}).to_list(length=None)
            membre_ids = [m["id"] for m in membres]
            presences = await db.presences_fi.find(
                {"membre_fi_id": {"$in": membre_ids}},
                {"_id": 0}
            ).to_list(length=None)
            
            unique_jeudis = len(set([p["date"] for p in presences]))
            total_presences = sum([1 for p in presences if p["present"]])
            max_possible = len(membres) * unique_jeudis if unique_jeudis > 0 else 0
            fidelisation = (total_presences / max_possible * 100) if max_possible > 0 else 0
            
            if fidelisation < 50:
                notif = Notification(
                    user_id=sup["id"],
                    type="low_fidelisation",
                    message=f"📊 Taux de fidélisation FI bas: {fidelisation:.1f}% pour {city}",
                    data={"city": city, "fidelisation": round(fidelisation, 2)}
                )
                doc = notif.model_dump()
                doc['created_at'] = doc['created_at'].isoformat()
                await db.notifications.insert_one(doc)
                notifications_created.append(notif)
    
    # 4. Nouveaux arrivants non assignés
    unassigned = await db.visitors.find(
        {"assigned_fi_id": None, "tracking_stopped": False},
        {"_id": 0}
    ).to_list(length=None)
    
    if unassigned:
        superviseurs_promos = await db.users.find(
            {"role": "superviseur_promos"},
            {"_id": 0}
        ).to_list(length=None)
        
        for sup in superviseurs_promos:
            city_unassigned = [v for v in unassigned if v["city"] == sup["city"]]
            if city_unassigned:
                notif = Notification(
                    user_id=sup["id"],
                    type="unassigned_visitor",
                    message=f"👥 {len(city_unassigned)} nouveaux arrivants non assignés à une FI à {sup['city']}",
                    data={"city": sup["city"], "count": len(city_unassigned)}
                )
                doc = notif.model_dump()
                doc['created_at'] = doc['created_at'].isoformat()
                await db.notifications.insert_one(doc)
                notifications_created.append(notif)
    
    return {
        "message": f"{len(notifications_created)} notifications créées",
        "count": len(notifications_created)
    }

# ==================== ADVANCED ANALYTICS FOR SUPER ADMIN/PASTEUR ====================

@api_router.get("/analytics/promotions-detailed")
async def get_promotions_detailed(current_user: dict = Depends(get_current_user)):
    """Get detailed promotions analytics for Super Admin/Pasteur with:
    - Fidélisation par promo (12 mois)
    - Total NA vs NC
    - Évolution par mois
    """
    # Only super_admin and pasteur can access
    if current_user["role"] not in ["super_admin", "pasteur"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get all visitors (multi-ville pour super admin/pasteur)
    base_query = {"tracking_stopped": False}
    
    visitors = await db.visitors.find(base_query, {"_id": 0}).to_list(10000)
    
    # Group by assigned_month
    promos_by_month = {}
    for visitor in visitors:
        month = visitor.get("assigned_month", "N/A")
        if month not in promos_by_month:
            promos_by_month[month] = {
                "month": month,
                "total_visitors": 0,
                "na_count": 0,
                "nc_count": 0,
                "visitors": [],
                "presences_dimanche": [],
                "presences_jeudi": []
            }
        
        promos_by_month[month]["total_visitors"] += 1
        promos_by_month[month]["visitors"].append(visitor)
        
        # Count NA vs NC
        types = visitor.get("types", [])
        if "Nouveau Arrivant" in types:
            promos_by_month[month]["na_count"] += 1
        if "Nouveau Converti" in types:
            promos_by_month[month]["nc_count"] += 1
        
        # Aggregate presences
        promos_by_month[month]["presences_dimanche"].extend(visitor.get("presences_dimanche", []))
        promos_by_month[month]["presences_jeudi"].extend(visitor.get("presences_jeudi", []))
    
    # Calculate fidelisation for each promo
    promos_stats = []
    for month, data in sorted(promos_by_month.items()):
        total = data["total_visitors"]
        if total == 0:
            fidelisation = 0
        else:
            # Count visitors with at least 3 presences
            visitors_with_presences = 0
            for visitor in data["visitors"]:
                total_presences = len([p for p in visitor.get("presences_dimanche", []) if p.get("present")])
                total_presences += len([p for p in visitor.get("presences_jeudi", []) if p.get("present")])
                if total_presences >= 3:
                    visitors_with_presences += 1
            
            fidelisation = (visitors_with_presences / total) * 100
        
        promos_stats.append({
            "month": month,
            "total_visitors": total,
            "na_count": data["na_count"],
            "nc_count": data["nc_count"],
            "fidelisation": round(fidelisation, 1),
            "total_presences_dimanche": len([p for p in data["presences_dimanche"] if p.get("present")]),
            "total_presences_jeudi": len([p for p in data["presences_jeudi"] if p.get("present")])
        })
    
    # Global totals
    total_na = sum(p["na_count"] for p in promos_stats)
    total_nc = sum(p["nc_count"] for p in promos_stats)
    total_visitors = sum(p["total_visitors"] for p in promos_stats)
    avg_fidelisation = sum(p["fidelisation"] for p in promos_stats) / len(promos_stats) if promos_stats else 0
    
    return {
        "promos": promos_stats,
        "summary": {
            "total_promos": len(promos_stats),
            "total_visitors": total_visitors,
            "total_na": total_na,
            "total_nc": total_nc,
            "avg_fidelisation": round(avg_fidelisation, 1)
        }
    }

@api_router.get("/analytics/visitors-table")
async def get_visitors_table(current_user: dict = Depends(get_current_user)):
    """Get complete visitors table with all details for Super Admin/Pasteur"""
    # Only super_admin and pasteur can access
    if current_user["role"] not in ["super_admin", "pasteur"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    visitors = await db.visitors.find({}, {"_id": 0}).to_list(10000)
    
    # Enrich with assigned FI info
    enriched_visitors = []
    for visitor in visitors:
        # Calculate total presences
        presences_dimanche_count = len([p for p in visitor.get("presences_dimanche", []) if p.get("present")])
        presences_jeudi_count = len([p for p in visitor.get("presences_jeudi", []) if p.get("present")])
        
        # Check if assigned to FI
        membre = await db.membres_fi.find_one({"nouveau_arrivant_id": visitor["id"]}, {"_id": 0})
        assigned_fi = None
        assigned_fi_id = None
        if membre:
            fi = await db.familles_impact.find_one({"id": membre["fi_id"]}, {"_id": 0})
            if fi:
                assigned_fi = fi.get("nom", "N/A")
                assigned_fi_id = fi.get("id")
        
        enriched_visitors.append({
            **visitor,
            "presences_dimanche_count": presences_dimanche_count,
            "presences_jeudi_count": presences_jeudi_count,
            "total_presences": presences_dimanche_count + presences_jeudi_count,
            "assigned_fi": assigned_fi,
            "assigned_fi_id": assigned_fi_id,
            "comments_count": len(visitor.get("comments", []))
        })
    
    return enriched_visitors

@api_router.get("/analytics/fi-detailed")
async def get_fi_detailed(current_user: dict = Depends(get_current_user)):
    """Get detailed FI analytics with:
    - Nombre de secteurs, FI, membres
    - Évolution par secteur
    - Fidélisation par FI
    """
    # Only super_admin and pasteur can access
    if current_user["role"] not in ["super_admin", "pasteur"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get all secteurs
    secteurs = await db.secteurs.find({}, {"_id": 0}).to_list(1000)
    
    # Get all FI
    familles = await db.familles_impact.find({}, {"_id": 0}).to_list(1000)
    
    # Get all membres
    membres = await db.membres_fi.find({}, {"_id": 0}).to_list(10000)
    
    # Get all presences
    presences = await db.presences_fi.find({}, {"_id": 0}).to_list(100000)
    
    # Group by secteur
    secteurs_stats = []
    for secteur in secteurs:
        secteur_fi = [f for f in familles if f.get("secteur_id") == secteur["id"]]
        secteur_membres = []
        
        for fi in secteur_fi:
            fi_membres = [m for m in membres if m.get("fi_id") == fi["id"]]
            secteur_membres.extend(fi_membres)
        
        secteurs_stats.append({
            "secteur_id": secteur["id"],
            "secteur_nom": secteur.get("nom", "N/A"),
            "ville": secteur.get("ville", "N/A"),
            "nombre_fi": len(secteur_fi),
            "nombre_membres": len(secteur_membres),
            "fi_list": [{"id": f["id"], "nom": f.get("nom", "N/A")} for f in secteur_fi]
        })
    
    # Fidélisation par FI
    fi_fidelisation = []
    for fi in familles:
        fi_membres = [m for m in membres if m.get("fi_id") == fi["id"]]
        fi_presences = [p for p in presences if p.get("fi_id") == fi["id"]]
        
        total_membres = len(fi_membres)
        if total_membres == 0:
            fidelisation = 0
        else:
            # Count membres with at least 3 presences
            membres_fideles = 0
            for membre in fi_membres:
                membre_presences = [p for p in fi_presences if p.get("membre_fi_id") == membre["id"] and p.get("present")]
                if len(membre_presences) >= 3:
                    membres_fideles += 1
            
            fidelisation = (membres_fideles / total_membres) * 100
        
        fi_fidelisation.append({
            "fi_id": fi["id"],
            "fi_nom": fi.get("nom", "N/A"),
            "ville": fi.get("ville", "N/A"),
            "secteur_id": fi.get("secteur_id"),
            "total_membres": total_membres,
            "total_presences": len([p for p in fi_presences if p.get("present")]),
            "fidelisation": round(fidelisation, 1)
        })
    
    return {
        "secteurs": secteurs_stats,
        "fi_fidelisation": fi_fidelisation,
        "summary": {
            "total_secteurs": len(secteurs),
            "total_fi": len(familles),
            "total_membres": len(membres),
            "avg_fidelisation": round(sum(f["fidelisation"] for f in fi_fidelisation) / len(fi_fidelisation), 1) if fi_fidelisation else 0
        }
    }

@api_router.get("/analytics/membres-table")
async def get_membres_table(current_user: dict = Depends(get_current_user)):
    """Get complete membres table with presences for Super Admin/Pasteur"""
    # Only super_admin and pasteur can access
    if current_user["role"] not in ["super_admin", "pasteur"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    membres = await db.membres_fi.find({}, {"_id": 0}).to_list(10000)
    presences = await db.presences_fi.find({}, {"_id": 0}).to_list(100000)
    
    enriched_membres = []
    for membre in membres:
        # Get FI info
        fi = await db.familles_impact.find_one({"id": membre.get("fi_id")}, {"_id": 0})
        fi_nom = fi.get("nom", "N/A") if fi else "N/A"
        
        # Get secteur info
        secteur = await db.secteurs.find_one({"id": fi.get("secteur_id")}, {"_id": 0}) if fi else None
        secteur_nom = secteur.get("nom", "N/A") if secteur else "N/A"
        
        # Get presences for this membre
        membre_presences = [p for p in presences if p.get("membre_fi_id") == membre["id"]]
        presences_count = len([p for p in membre_presences if p.get("present")])
        
        enriched_membres.append({
            **membre,
            "fi_nom": fi_nom,
            "secteur_nom": secteur_nom,
            "presences": membre_presences,
            "presences_count": presences_count
        })
    
    return enriched_membres

@api_router.get("/analytics/presences-dimanche")
async def get_presences_dimanche(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    ville: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get presences dimanche aggregated by date with NA/NC breakdown"""
    # Only super_admin and pasteur can access
    if current_user["role"] not in ["super_admin", "pasteur"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get all visitors with presences_dimanche
    query = {"tracking_stopped": False}
    if ville and ville != "all":
        query["city"] = ville
    
    visitors = await db.visitors.find(query, {"_id": 0}).to_list(10000)
    
    # Aggregate presences by date
    presences_by_date = {}
    
    for visitor in visitors:
        types = visitor.get("types", [])
        is_na = "Nouveau Arrivant" in types
        is_nc = "Nouveau Converti" in types
        
        for presence in visitor.get("presences_dimanche", []):
            date = presence.get("date")
            is_present = presence.get("present", False)
            
            # Filter by date range
            if start_date and date < start_date:
                continue
            if end_date and date > end_date:
                continue
            
            if date not in presences_by_date:
                presences_by_date[date] = {
                    "date": date,
                    "total_present": 0,
                    "total_absent": 0,
                    "na_present": 0,
                    "na_absent": 0,
                    "nc_present": 0,
                    "nc_absent": 0,
                    "visitors_details": []
                }
            
            if is_present:
                presences_by_date[date]["total_present"] += 1
                if is_na:
                    presences_by_date[date]["na_present"] += 1
                if is_nc:
                    presences_by_date[date]["nc_present"] += 1
            else:
                presences_by_date[date]["total_absent"] += 1
                if is_na:
                    presences_by_date[date]["na_absent"] += 1
                if is_nc:
                    presences_by_date[date]["nc_absent"] += 1
            
            # Add visitor details
            presences_by_date[date]["visitors_details"].append({
                "name": f"{visitor.get('firstname')} {visitor.get('lastname')}",
                "city": visitor.get("city"),
                "types": types,
                "present": is_present
            })
    
    # Convert to sorted list
    presences_list = sorted(presences_by_date.values(), key=lambda x: x["date"], reverse=True)
    
    # Calculate totals
    total_dimanches = len(presences_list)
    total_presences = sum(p["total_present"] for p in presences_list)
    total_na = sum(p["na_present"] for p in presences_list)
    total_nc = sum(p["nc_present"] for p in presences_list)
    avg_per_dimanche = total_presences / total_dimanches if total_dimanches > 0 else 0
    
    return {
        "presences": presences_list,
        "summary": {
            "total_dimanches": total_dimanches,
            "total_presences": total_presences,
            "total_na": total_na,
            "total_nc": total_nc,
            "avg_per_dimanche": round(avg_per_dimanche, 1)
        }
    }
# ==================== CULTE STATISTICS ====================

@api_router.post("/culte-stats")
async def create_culte_stats(stats: CulteStatsCreate, current_user: dict = Depends(get_current_user)):
    """Create culte statistics - Accueil can create for their city"""
    # Accueil can only create for their city
    if current_user["role"] == "accueil" and stats.ville != current_user["city"]:
        raise HTTPException(status_code=403, detail="Can only create stats for your city")
    
    # Super admin can create for any city
    if current_user["role"] not in ["accueil", "super_admin"]:
        raise HTTPException(status_code=403, detail="Only accueil and super_admin can create culte stats")
    
    culte_stat = CulteStats(
        **stats.model_dump(),
        created_by=current_user["username"]
    )
    doc = culte_stat.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('updated_at'):
        doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.culte_stats.insert_one(doc)
    
    # Return without _id
    return {k: v for k, v in doc.items() if k != '_id'}

@api_router.get("/culte-stats")
async def get_culte_stats(
    ville: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    type_culte: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get culte statistics with filters"""
    # Build query based on role
    query = {}
    
    # Accueil can only see their city
    if current_user["role"] == "accueil":
        query["ville"] = current_user["city"]
    # Pasteur and Super Admin can see all cities
    elif current_user["role"] in ["pasteur", "super_admin"]:
        if ville:
            query["ville"] = ville
    else:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Apply filters
    if start_date:
        query["date"] = {"$gte": start_date}
    if end_date:
        if "date" in query:
            query["date"]["$lte"] = end_date
        else:
            query["date"] = {"$lte": end_date}
    if type_culte:
        query["type_culte"] = type_culte
    
    stats = await db.culte_stats.find(query, {"_id": 0}).to_list(10000)
    
    # Sort by date descending
    stats.sort(key=lambda x: x["date"], reverse=True)
    
    return stats

@api_router.get("/culte-stats/{stat_id}")
async def get_culte_stat(stat_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single culte stat"""
    stat = await db.culte_stats.find_one({"id": stat_id}, {"_id": 0})
    
    if not stat:
        raise HTTPException(status_code=404, detail="Stat not found")
    
    # Check permissions
    if current_user["role"] == "accueil" and stat["ville"] != current_user["city"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return stat

@api_router.put("/culte-stats/{stat_id}")
async def update_culte_stats(
    stat_id: str, 
    updates: CulteStatsUpdate, 
    current_user: dict = Depends(get_current_user)
):
    """Update culte statistics - Accueil and Super Admin"""
    stat = await db.culte_stats.find_one({"id": stat_id})
    
    if not stat:
        raise HTTPException(status_code=404, detail="Stat not found")
    
    # Accueil can only update their city
    if current_user["role"] == "accueil" and stat["ville"] != current_user["city"]:
        raise HTTPException(status_code=403, detail="Can only update stats for your city")
    
    # Only accueil and super_admin can update
    if current_user["role"] not in ["accueil", "super_admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_dict = {k: v for k, v in updates.dict(exclude_unset=True).items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.culte_stats.update_one({"id": stat_id}, {"$set": update_dict})
    
    updated_stat = await db.culte_stats.find_one({"id": stat_id}, {"_id": 0})
    return updated_stat

@api_router.delete("/culte-stats/{stat_id}")
async def delete_culte_stats(stat_id: str, current_user: dict = Depends(get_current_user)):
    """Delete culte statistics - Super Admin only"""
    if current_user["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Only super_admin can delete stats")
    
    result = await db.culte_stats.delete_one({"id": stat_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Stat not found")
    
    return {"message": "Stat deleted successfully"}

@api_router.get("/culte-stats/summary/all")
async def get_culte_stats_summary(
    ville: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get aggregated summary of culte stats for dashboards"""
    # Only pasteur and super_admin can access summary
    if current_user["role"] not in ["pasteur", "super_admin", "accueil"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Build query
    query = {}
    if current_user["role"] == "accueil":
        query["ville"] = current_user["city"]
    elif ville:
        query["ville"] = ville
    
    if start_date:
        query["date"] = {"$gte": start_date}
    if end_date:
        if "date" in query:
            query["date"]["$lte"] = end_date
        else:
            query["date"] = {"$lte": end_date}
    
    stats = await db.culte_stats.find(query, {"_id": 0}).to_list(10000)
    
    # Aggregate by date (dimanche)
    by_date = {}
    for stat in stats:
        date = stat["date"]
        if date not in by_date:
            by_date[date] = {
                "date": date,
                "ville": stat["ville"],
                "culte_1": {"fideles": 0, "stars": 0},
                "culte_2": {"fideles": 0, "stars": 0},
                "ejp": {"fideles": 0, "stars": 0},
                "total_fideles": 0,
                "total_stars": 0,
                "total_general": 0
            }
        
        culte_type = stat["type_culte"].lower().replace(" ", "_")
        if "ejp" in culte_type.lower():
            culte_type = "ejp"
        elif "1" in culte_type:
            culte_type = "culte_1"
        elif "2" in culte_type:
            culte_type = "culte_2"
        
        by_date[date][culte_type]["fideles"] = stat["nombre_fideles"]
        by_date[date][culte_type]["stars"] = stat["nombre_stars"]
        by_date[date]["total_fideles"] += stat["nombre_fideles"]
        by_date[date]["total_stars"] += stat["nombre_stars"]
        by_date[date]["total_general"] = by_date[date]["total_fideles"] + by_date[date]["total_stars"]
    
    # Convert to list and sort
    summary_list = sorted(by_date.values(), key=lambda x: x["date"], reverse=True)
    
    # Calculate global stats
    total_dimanches = len(summary_list)
    total_fideles = sum(s["total_fideles"] for s in summary_list)
    total_stars = sum(s["total_stars"] for s in summary_list)
    avg_fideles = total_fideles / total_dimanches if total_dimanches > 0 else 0
    avg_stars = total_stars / total_dimanches if total_dimanches > 0 else 0
    
    return {
        "summary": summary_list,
        "global_stats": {
            "total_dimanches": total_dimanches,
            "total_fideles": total_fideles,
            "total_stars": total_stars,
            "avg_fideles_per_dimanche": round(avg_fideles, 1),
            "avg_stars_per_dimanche": round(avg_stars, 1),
            "avg_total_per_dimanche": round(avg_fideles + avg_stars, 1)
        }
    }

# ==================== DATA EXPORT/IMPORT (Super Admin) ====================

@api_router.get("/admin/export-all-data")
async def export_all_data(current_user: dict = Depends(get_current_user)):
    """Export all database data - Super Admin only"""
    if current_user["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin only")
    
    # Export all collections
    data = {
        "cities": await db.cities.find({}, {"_id": 0}).to_list(10000),
        "users": await db.users.find({}, {"_id": 0}).to_list(10000),
        "visitors": await db.visitors.find({}, {"_id": 0}).to_list(10000),
        "secteurs": await db.secteurs.find({}, {"_id": 0}).to_list(10000),
        "familles_impact": await db.familles_impact.find({}, {"_id": 0}).to_list(10000),
        "membres_fi": await db.membres_fi.find({}, {"_id": 0}).to_list(10000),
        "presences_fi": await db.presences_fi.find({}, {"_id": 0}).to_list(10000),
        "culte_stats": await db.culte_stats.find({}, {"_id": 0}).to_list(10000),
        "notifications": await db.notifications.find({}, {"_id": 0}).to_list(10000)
    }
    
    return data

@api_router.post("/admin/import-all-data")
async def import_all_data(data: dict, current_user: dict = Depends(get_current_user)):
    """Import all database data - Super Admin only"""
    if current_user["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin only")
    
    try:
        # Clear existing data
        await db.cities.delete_many({})
        await db.users.delete_many({})
        await db.visitors.delete_many({})
        await db.secteurs.delete_many({})
        await db.familles_impact.delete_many({})
        await db.membres_fi.delete_many({})
        await db.presences_fi.delete_many({})
        await db.culte_stats.delete_many({})
        await db.notifications.delete_many({})
        
        # Import new data
        if data.get("cities"):
            await db.cities.insert_many(data["cities"])
        if data.get("users"):
            await db.users.insert_many(data["users"])
        if data.get("visitors"):
            await db.visitors.insert_many(data["visitors"])
        if data.get("secteurs"):
            await db.secteurs.insert_many(data["secteurs"])
        if data.get("familles_impact"):
            await db.familles_impact.insert_many(data["familles_impact"])
        if data.get("membres_fi"):
            await db.membres_fi.insert_many(data["membres_fi"])
        if data.get("presences_fi"):
            await db.presences_fi.insert_many(data["presences_fi"])
        if data.get("culte_stats"):
            await db.culte_stats.insert_many(data["culte_stats"])
        if data.get("notifications"):
            await db.notifications.insert_many(data["notifications"])
        
        return {
            "success": True,
            "message": "Data imported successfully",
            "counts": {
                "cities": len(data.get("cities", [])),
                "users": len(data.get("users", [])),
                "visitors": len(data.get("visitors", [])),
                "secteurs": len(data.get("secteurs", [])),
                "familles_impact": len(data.get("familles_impact", [])),
                "membres_fi": len(data.get("membres_fi", [])),
                "presences_fi": len(data.get("presences_fi", [])),
                "culte_stats": len(data.get("culte_stats", [])),
                "notifications": len(data.get("notifications", []))
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")

# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "ICC Dijon Connect API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging - set to ERROR level to reduce noise
logging.basicConfig(
    level=logging.ERROR,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Suppress uvicorn access logs
logging.getLogger("uvicorn.access").setLevel(logging.ERROR)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
