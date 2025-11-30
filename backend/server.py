from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
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
from fastapi.responses import StreamingResponse, FileResponse
import base64
import mimetypes

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
    country: Optional[str] = "France"

class CityCreate(BaseModel):
    name: str
    country: Optional[str] = "France"

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
    plain_password: Optional[str] = None  # Mot de passe en clair pour export (super_admin only)
    city: str
    role: str  # superviseur_promos, superviseur_fi, referent, accueil, promotions, pilote_fi, responsable_secteur, pasteur, super_admin, responsable_eglise, gestion_projet
    telephone: Optional[str] = None  # Phone number (especially for pilote_fi)
    assigned_month: Optional[str] = None  # For referents: "2025-01"
    promo_name: Optional[str] = None  # Custom name for promo (instead of "2025-01")
    assigned_secteur_id: Optional[str] = None  # For responsable_secteur
    assigned_fi_id: Optional[str] = None  # DEPRECATED: Use assigned_fi_ids instead
    assigned_fi_ids: Optional[List[str]] = []  # For pilote_fi - multiple FIs
    permissions: Optional[Dict[str, bool]] = None  # For referents permissions
    dashboard_permissions: Optional[Dict[str, bool]] = None  # What user can see in their dashboard (controlled by super_admin)
    is_blocked: bool = False  # For blocking users
    team_members: Optional[List[Dict[str, str]]] = []  # For responsable_promo - list of team members with firstname/lastname
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    password: str
    city: str
    role: str
    telephone: Optional[str] = None
    assigned_month: Optional[str] = None
    permissions: Optional[Dict[str, bool]] = None

class UserUpdate(BaseModel):
    username: Optional[str] = None
    city: Optional[str] = None
    role: Optional[str] = None
    assigned_month: Optional[str] = None
    promo_name: Optional[str] = None  # Custom name for promo
    assigned_fi_id: Optional[str] = None  # DEPRECATED
    assigned_fi_ids: Optional[List[str]] = None  # Multiple FIs for pilote_fi
    assigned_secteur_id: Optional[str] = None
    permissions: Optional[Dict[str, bool]] = None
    team_members: Optional[List[Dict[str, str]]] = None  # For responsable_promo team
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
    type_culte: str  # "Culte 1", "Culte 2", "EJP", "Événements spéciaux"
    nombre_fideles: int
    nombre_adultes: int = 0  # Nombre d'adultes
    nombre_enfants: int = 0  # Nombre d'enfants
    nombre_stars: int
    commentaire: Optional[str] = None  # Commentaire pour chaque type de culte
    created_by: str  # Username de celui qui a créé
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

class CulteStatsCreate(BaseModel):
    date: str
    ville: str
    type_culte: str
    nombre_fideles: int
    nombre_adultes: int = 0
    nombre_enfants: int = 0
    nombre_stars: int
    commentaire: Optional[str] = None

class CulteStatsUpdate(BaseModel):
    nombre_fideles: Optional[int] = None
    nombre_adultes: Optional[int] = None
    nombre_enfants: Optional[int] = None
    nombre_stars: Optional[int] = None
    commentaire: Optional[str] = None

class PresenceEntry(BaseModel):
    date: str
    present: Optional[bool] = None  # Optionnel: peut être null si seulement commentaire
    commentaire: Optional[str] = None

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
    photo_url: Optional[str] = None  # Photo du visiteur
    arrival_channel: str  # Comment ils ont connu ICC
    age_range: Optional[str] = None  # "13-18 ans", "18-25 ans", etc.
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
    is_ancien: bool = False  # True si ajouté via "Ancien Visiteur"
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
    age_range: Optional[str] = None
    visit_date: str
    is_ancien: bool = False
    ejp: bool = False

class VisitorUpdate(BaseModel):
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    email: Optional[EmailStr] = None
    arrival_channel: Optional[str] = None
    age_range: Optional[str] = None
    types: Optional[List[str]] = None
    type: Optional[str] = None
    city: Optional[str] = None
    formation_pcnc: Optional[bool] = None
    formation_au_coeur_bible: Optional[bool] = None
    formation_star: Optional[bool] = None
    ejp: Optional[bool] = None

class CommentAdd(BaseModel):
    text: str

class PresenceAdd(BaseModel):
    date: str
    present: Optional[bool] = None  # Optionnel: peut être null si seulement commentaire
    type: str  # "dimanche" or "jeudi"
    commentaire: Optional[str] = None

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
    adresse: Optional[str] = None
    pilote_id: Optional[str] = None  # DEPRECATED: Use pilote_ids
    pilote_ids: Optional[List[str]] = []  # Multiple pilotes per FI
    heure_debut: Optional[str] = None  # Heure de début de la FI (format HH:MM)
    heure_fin: Optional[str] = None  # Heure de fin de la FI (format HH:MM)
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FamilleImpactCreate(BaseModel):
    nom: str
    secteur_id: str
    ville: str
    adresse: Optional[str] = None
    pilote_id: Optional[str] = None  # DEPRECATED
    pilote_ids: Optional[List[str]] = []  # Multiple pilotes
    heure_debut: Optional[str] = None  # Heure de début (HH:MM)
    heure_fin: Optional[str] = None  # Heure de fin (HH:MM)

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

# ==================== EVENTS & PROJECTS MODELS ====================

class Projet(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    titre: str
    description: Optional[str] = None
    statut: str = "planifie"  # planifie, en_cours, termine, annule
    date_debut: Optional[str] = None  # Format: "2025-01-15"
    date_fin: Optional[str] = None
    budget_prevu: Optional[float] = 0.0
    budget_reel: Optional[float] = 0.0
    ville: str
    created_by: str  # username
    team_members: Optional[List[Dict[str, str]]] = []  # [{"nom": "Jean Dupont", "email": "jean@email.com"}]
    archived: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProjetCreate(BaseModel):
    titre: str
    description: Optional[str] = None
    statut: str = "planifie"
    date_debut: Optional[str] = None
    date_fin: Optional[str] = None
    budget_prevu: Optional[float] = 0.0
    ville: str
    team_members: Optional[List[Dict[str, str]]] = []

class ProjetUpdate(BaseModel):
    titre: Optional[str] = None
    description: Optional[str] = None
    statut: Optional[str] = None
    date_debut: Optional[str] = None
    date_fin: Optional[str] = None
    budget_prevu: Optional[float] = None
    budget_reel: Optional[float] = None
    team_members: Optional[List[Dict[str, str]]] = None

class Tache(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    projet_id: str
    titre: str
    description: Optional[str] = None
    assigne_a: Optional[str] = None  # username
    statut: str = "a_faire"  # a_faire, en_cours, termine
    deadline: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TacheCreate(BaseModel):
    projet_id: str
    titre: str
    description: Optional[str] = None
    assigne_a: Optional[str] = None
    deadline: Optional[str] = None

class TacheUpdate(BaseModel):
    titre: Optional[str] = None
    description: Optional[str] = None
    assigne_a: Optional[str] = None
    statut: Optional[str] = None
    deadline: Optional[str] = None

class CommentaireProjet(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    projet_id: str
    user: str  # username
    texte: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CommentaireProjetCreate(BaseModel):
    projet_id: str
    texte: str

class FichierProjet(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    projet_id: str
    nom: str
    url: str
    type: str  # "document", "image", "autre"
    uploaded_by: str  # username
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CampagneCommunication(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    titre: str
    type: str  # "email", "sms", "both"
    message: str
    image_url: Optional[str] = None  # URL de l'image/affiche jointe
    destinataires: List[Dict[str, str]]  # [{"prenom": "...", "nom": "...", "email": "...", "telephone": "..."}]
    statut: str = "brouillon"  # brouillon, planifie, envoye
    date_envoi: Optional[str] = None  # Pour envoi planifié
    projet_id: Optional[str] = None  # Lier à un projet si besoin
    created_by: str  # username
    enable_rsvp: bool = False  # Activer les réponses Oui/Non/Peut-être
    stats: Optional[Dict[str, int]] = {"envoyes": 0, "oui": 0, "non": 0, "peut_etre": 0}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CampagneCommunicationCreate(BaseModel):
    titre: str
    type: str
    message: str
    image_url: Optional[str] = None
    destinataires: List[Dict[str, str]]
    date_envoi: Optional[str] = None
    projet_id: Optional[str] = None
    enable_rsvp: bool = False

class RSVP(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    campagne_id: str
    contact_email: Optional[str] = None
    contact_telephone: Optional[str] = None
    reponse: str  # "oui", "non", "peut_etre"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def is_super_admin(user: dict) -> bool:
    """Check if user is Super Admin or Pasteur (same permissions)"""
    return user.get("role") in ["super_admin", "pasteur"]

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
            "assigned_fi_id": user.get("assigned_fi_id"),
            "team_members": user.get("team_members", [])
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

@api_router.post("/users")
async def create_user(user_data: UserCreate, current_user: dict = Depends(get_current_user)):
    """Create a new user - Super Admin can create any role, others can create referents only"""
    # Permission checks
    if current_user["role"] == "super_admin":
        # Super admin can create any user
        pass
    elif current_user["role"] == "responsable_eglise":
        # Responsable d'église can create all user types EXCEPT super_admin, pasteur, and other responsable_eglise
        if user_data.role in ["super_admin", "pasteur", "responsable_eglise"]:
            raise HTTPException(status_code=403, detail="You cannot create super_admin, pasteur, or responsable_eglise users")
        # Force city to be the same as responsable_eglise's city
        user_data.city = current_user["city"]
    elif current_user["role"] in ["superviseur_promos", "promotions"]:
        # Superviseurs can only create referents
        if user_data.role not in ["referent", "accueil", "promotions"]:
            raise HTTPException(status_code=403, detail="You can only create referent, accueil, or promotions users")
    elif current_user["role"] == "responsable_secteur":
        # Responsable secteur can only create pilotes
        if user_data.role != "pilote_fi":
            raise HTTPException(status_code=403, detail="You can only create pilote_fi users")
        # Force city to be the same
        user_data.city = current_user["city"]
    elif current_user["role"] == "superviseur_fi":
        # Superviseur FI can create pilotes and responsable_secteur
        if user_data.role not in ["pilote_fi", "responsable_secteur"]:
            raise HTTPException(status_code=403, detail="You can only create pilote_fi or responsable_secteur users")
        # Force city to be the same
        user_data.city = current_user["city"]
    else:
        raise HTTPException(status_code=403, detail="Not authorized to create users")
    
    # Check if username already exists
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
    plain_password = user_dict['password']  # Sauvegarder le mot de passe en clair
    user_dict['password'] = hashed_pw
    user_dict['plain_password'] = plain_password  # Stocker aussi en clair pour l'export
    
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
    return {"message": "User created successfully", "id": user.id}

@api_router.post("/users/referent")
async def create_referent(user_data: UserCreate, current_user: dict = Depends(get_current_user)):
    """Legacy endpoint for creating referents - redirects to /users"""
    return await create_user(user_data, current_user)

@api_router.get("/users/referents")
async def get_referents(current_user: dict = Depends(get_current_user)):
    # Get all users - seul super_admin voit toutes les villes
    query = {"role": {"$in": ["referent", "accueil", "promotions", "superviseur_promos", "superviseur_fi", "pilote_fi", "responsable_secteur", "pasteur", "super_admin", "responsable_eglise"]}}
    
    # Seul super_admin peut voir toutes les villes, tous les autres voient uniquement leur ville
    if current_user["role"] != "super_admin":
        query["city"] = current_user["city"]
    
    referents = await db.users.find(query, {"_id": 0, "password": 0}).to_list(1000)
    
    return referents

@api_router.put("/users/{user_id}")
async def update_user(user_id: str, update_data: UserUpdate, current_user: dict = Depends(get_current_user)):
    """Update user information"""
    
    # Cas spécial : permettre aux users de mettre à jour leur propre team_members
    is_self_update = (user_id == current_user["id"])
    is_team_members_only = (
        update_data.team_members is not None and
        update_data.username is None and
        update_data.city is None and
        update_data.role is None and
        update_data.assigned_month is None and
        update_data.promo_name is None and
        update_data.assigned_fi_id is None and
        update_data.assigned_fi_ids is None and
        update_data.assigned_secteur_id is None and
        update_data.permissions is None
    )
    
    # Si c'est une mise à jour de team_members par soi-même, autoriser
    if is_self_update and is_team_members_only:
        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        # Mettre à jour uniquement team_members
        await db.users.update_one({"id": user_id}, {"$set": {"team_members": update_data.team_members}})
        return {"message": "Team members updated successfully"}
    
    # Sinon, vérifier les permissions normales
    if current_user["role"] not in ["superviseur_promos", "promotions", "super_admin", "superviseur_fi", "responsable_secteur"]:
        raise HTTPException(status_code=403, detail="Only admin can update users")
    
    # Super admin can update users from any city, others only from their city
    if current_user["role"] == "super_admin":
        user = await db.users.find_one({"id": user_id})
    else:
        user = await db.users.find_one({"id": user_id, "city": current_user["city"]})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Responsable secteur and superviseur_fi can only update pilotes
    if current_user["role"] in ["responsable_secteur", "superviseur_fi"]:
        if user["role"] != "pilote_fi":
            raise HTTPException(status_code=403, detail="Can only update pilotes")
    
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
    
    if update_data.promo_name is not None:
        update_dict["promo_name"] = update_data.promo_name
    
    if update_data.assigned_fi_id is not None:
        update_dict["assigned_fi_id"] = update_data.assigned_fi_id
    
    if update_data.assigned_fi_ids is not None:
        update_dict["assigned_fi_ids"] = update_data.assigned_fi_ids
    
    if update_data.assigned_secteur_id is not None:
        update_dict["assigned_secteur_id"] = update_data.assigned_secteur_id
    
    if update_data.permissions is not None:
        update_dict["permissions"] = update_data.permissions
    
    if update_data.team_members is not None:
        update_dict["team_members"] = update_data.team_members
    
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
    
    # Superviseur FI can delete pilote_fi and responsable_secteur from their city
    if current_user["role"] == "superviseur_fi":
        if user_to_delete["city"] != current_user["city"]:
            raise HTTPException(status_code=403, detail="Cannot delete users from other cities")
        if user_to_delete["role"] not in ["pilote_fi", "responsable_secteur"]:
            raise HTTPException(status_code=403, detail="Can only delete pilotes and responsables de secteur")
        await db.users.delete_one({"id": user_id})
        return {"message": "User deleted successfully"}
    
    # Responsable secteur can delete pilote_fi from their city (even if assigned to FI)
    if current_user["role"] == "responsable_secteur":
        if user_to_delete["city"] != current_user["city"]:
            raise HTTPException(status_code=403, detail="Cannot delete users from other cities")
        if user_to_delete["role"] != "pilote_fi":
            raise HTTPException(status_code=403, detail="Can only delete pilotes")
        
        # Désassigner le pilote de toutes les FI avant de le supprimer
        await db.familles_impact.update_many(
            {"pilote_ids": user_id},
            {"$pull": {"pilote_ids": user_id}}
        )
        
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


# ==================== MY EVENT CHURCH MODELS ====================
class ChurchEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    date: str  # Format: YYYY-MM-DD
    time: Optional[str] = None  # Format: HH:MM
    location: Optional[str] = None
    image_url: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    rsvp_enabled: bool = True
    max_participants: Optional[int] = None

class ChurchEventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    date: str
    time: Optional[str] = None
    location: Optional[str] = None
    image_url: Optional[str] = None
    rsvp_enabled: bool = True
    max_participants: Optional[int] = None

class EventRSVP(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    status: str = "confirmed"  # confirmed, declined, maybe
    guests_count: int = 1
    message: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    source: Optional[str] = None  # whatsapp, email, sms, facebook, direct

class EventRSVPCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    status: str = "confirmed"
    guests_count: int = 1
    message: Optional[str] = None
    source: Optional[str] = None

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
    await db.users.update_one(
        {"id": user_id}, 
        {"$set": {
            "password": hashed_password,
            "plain_password": password_data.new_password  # Stocker aussi en clair
        }}
    )
    return {"message": "Password reset successfully"}


# ==================== VISITOR ROUTES ====================

@api_router.post("/visitors")
async def create_visitor(visitor_data: VisitorCreate, current_user: dict = Depends(get_current_user)):
    # Restrict accueil role from creating visitors (read-only)
    if current_user["role"] == "accueil":
        raise HTTPException(status_code=403, detail="Accueil role is read-only, cannot create visitors")
    
    # Only superviseur_promos, responsable_promo, referent, super_admin, pasteur can create
    if current_user["role"] not in ["superviseur_promos", "responsable_promo", "referent", "promotions", "super_admin", "pasteur"]:
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
    return {"message": "Visitor created successfully", "id": visitor.id}

@api_router.post("/visitors/bulk-ancien")
async def create_bulk_ancien_visitors(visitors_data: List[VisitorCreate], current_user: dict = Depends(get_current_user)):
    # Only superviseur_promos, responsable_promo, referent, super_admin, pasteur can create
    if current_user["role"] not in ["superviseur_promos", "responsable_promo", "referent", "promotions", "super_admin", "pasteur"]:
        raise HTTPException(status_code=403, detail="Permission denied to create visitors")
    
    if len(visitors_data) > 40:
        raise HTTPException(status_code=400, detail="Maximum 40 visitors can be added at once")
    
    created_ids = []
    for visitor_data in visitors_data:
        # Calculate assigned_month
        try:
            visit_dt = datetime.fromisoformat(visitor_data.visit_date)
            assigned_month = visit_dt.strftime("%Y-%m")
        except:
            assigned_month = datetime.now(timezone.utc).strftime("%Y-%m")
        
        # Force is_ancien to True
        visitor_dict = visitor_data.model_dump()
        visitor_dict['is_ancien'] = True
        
        visitor = Visitor(**visitor_dict, assigned_month=assigned_month)
        doc = visitor.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        
        await db.visitors.insert_one(doc)
        created_ids.append(visitor.id)
    
    return {"message": f"{len(created_ids)} anciens visiteurs créés avec succès", "ids": created_ids}

@api_router.get("/visitors")
async def get_visitors(
    include_stopped: bool = False,
    current_user: dict = Depends(get_current_user)
):
    # Super Admin and Pasteur can see all cities
    if current_user["role"] in ["super_admin", "pasteur"]:
        query = {}
    else:
        query = {
            "city": current_user["city"]
        }
    
    # Include or exclude stopped visitors
    if not include_stopped:
        query["tracking_stopped"] = False
    
    # Filter by role and permissions
    # Both referent and responsable_promo should see all visitors from their assigned month regardless of year
    if current_user["role"] in ["referent", "responsable_promo", "promotions"]:
        # Check if referent/responsable has permission to view all months
        permissions = current_user.get("permissions") or {}
        if not permissions.get("can_view_all_months", False):
            # Extract month from their assigned_month and match all years
            user_assigned_month = current_user.get("assigned_month")
            if user_assigned_month:
                # Support multiple months separated by commas (e.g., "2024-08,2025-08,2026-08")
                months_list = [m.strip() for m in user_assigned_month.split(',')]
                if len(months_list) > 1:
                    # Multiple months: use $in to match any of them
                    query["assigned_month"] = {"$in": months_list}
                else:
                    # Single month: Extract month part only (MM from YYYY-MM) to match all years
                    month_part = user_assigned_month.split("-")[-1] if "-" in user_assigned_month else user_assigned_month
                    # Use regex to match any year with this month
                    # Example: referent with assigned_month="2024-08" sees ALL august visitors (2024-08, 2025-08, etc.)
                    query["assigned_month"] = {"$regex": f"-{month_part}$"}
    
    # superviseur_promos sees ALL visitors from their city (no month filter)
    
    # Exclure les visiteurs supprimés (sauf pour super_admin qui peut les voir avec endpoint dédié)
    query["deleted"] = {"$ne": True}
    
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
    # Admin, pasteur, responsable_eglise, superviseur_promos can see stopped visitors
    if current_user["role"] not in ["super_admin", "pasteur", "responsable_eglise", "superviseur_promos", "promotions"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Pour responsable_eglise, filtrer par leur ville
    if current_user["role"] == "responsable_eglise":
        query = {
            "city": current_user["city"],
            "tracking_stopped": True
        }
    else:
        # Super admin et pasteur voient toutes les villes (pas de filtre)
        query = {
            "tracking_stopped": True
        }
    
    visitors = await db.visitors.find(query, {"_id": 0}).to_list(10000)
    return visitors

@api_router.get("/visitors/{visitor_id}")
async def get_visitor(visitor_id: str, current_user: dict = Depends(get_current_user)):
    # Super admin and pasteur can view visitors from all cities
    if current_user["role"] in ["super_admin", "pasteur"]:
        visitor = await db.visitors.find_one({"id": visitor_id}, {"_id": 0})
    else:
        visitor = await db.visitors.find_one({"id": visitor_id, "city": current_user["city"]}, {"_id": 0})
    
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    
    # Check permissions for referent and responsable_promo
    if current_user["role"] in ["referent", "responsable_promo", "promotions"]:
        permissions = current_user.get("permissions") or {}
        if not permissions.get("can_view_all_months", False):
            # Check if visitor's month matches user's month(s) (regardless of year)
            user_assigned = current_user.get("assigned_month", "")
            if user_assigned:
                # Support multiple months separated by commas
                user_months_list = [m.strip() for m in user_assigned.split(',')]
                visitor_month = visitor.get("assigned_month", "")
                # Check if visitor's month matches any of user's assigned months
                allowed = False
                for um in user_months_list:
                    user_month_part = um.split("-")[-1] if "-" in um else um
                    visitor_month_part = visitor_month.split("-")[-1] if "-" in visitor_month else visitor_month
                    if user_month_part == visitor_month_part:
                        allowed = True
                        break
                if not allowed:
                    raise HTTPException(status_code=403, detail="Access denied")
    
    # Accueil can't see details (consultation only)
    if current_user["role"] == "accueil":
        raise HTTPException(status_code=403, detail="Access denied")
    
    return visitor

@api_router.put("/visitors/{visitor_id}")
async def update_visitor(visitor_id: str, update_data: VisitorUpdate, current_user: dict = Depends(get_current_user)):
    # Allow promotions, accueil, admin, super_admin, referent, and responsable_promo to update visitors
    allowed_roles = ["promotions", "accueil", "admin", "super_admin", "referent", "responsable_promo"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    visitor = await db.visitors.find_one({"id": visitor_id, "city": current_user["city"]})
    
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    
    # Check permissions for referents/responsables
    if current_user["role"] in ["referent", "responsable_promo", "promotions"]:
        permissions = current_user.get("permissions") or {}
        if not permissions.get("can_edit_visitors", True):
            raise HTTPException(status_code=403, detail="Permission denied: cannot edit visitors")
    
    # Update only provided fields
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if update_dict:
        await db.visitors.update_one({"id": visitor_id}, {"$set": update_dict})
    
    return {"message": "Visitor updated successfully"}

@api_router.get("/visitors/deleted/all")
async def get_deleted_visitors(current_user: dict = Depends(get_current_user)):
    """Get all deleted visitors (super_admin only)"""
    if current_user["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Only super_admin can view deleted visitors")
    
    deleted_visitors = await db.visitors.find(
        {"deleted": True}, 
        {"_id": 0}
    ).to_list(10000)
    
    return deleted_visitors

@api_router.delete("/visitors/{visitor_id}")
async def delete_visitor(visitor_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a visitor (soft delete - mark as deleted)"""
    visitor = await db.visitors.find_one({"id": visitor_id, "city": current_user["city"]})
    
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    
    # Check permissions based on role
    allowed_roles = ["super_admin", "responsable_eglise", "superviseur_promos", "promotions", "referent", "responsable_promo"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    if current_user["role"] in ["referent", "responsable_promo", "promotions"]:
        # Referents/Responsables can only delete visitors from their assigned month
        if visitor["assigned_month"] != current_user.get("assigned_month"):
            raise HTTPException(status_code=403, detail="Vous ne pouvez supprimer que vos visiteurs assignés")
    
    # Soft delete: marquer comme supprimé au lieu de supprimer physiquement
    await db.visitors.update_one(
        {"id": visitor_id},
        {"$set": {
            "deleted": True,
            "deleted_at": datetime.now(timezone.utc).isoformat(),
            "deleted_by": current_user["username"]
        }}
    )
    return {"message": "Visitor deleted successfully"}

@api_router.post("/visitors/{visitor_id}/comment")
async def add_comment(visitor_id: str, comment: CommentAdd, current_user: dict = Depends(get_current_user)):
    visitor = await db.visitors.find_one({"id": visitor_id, "city": current_user["city"]})
    
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    
    # Check permissions for referents/responsables
    if current_user["role"] in ["referent", "responsable_promo", "promotions"]:
        permissions = current_user.get("permissions") or {}
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
    
    # Check permissions for referents/responsables
    if current_user["role"] in ["referent", "responsable_promo", "promotions"]:
        permissions = current_user.get("permissions") or {}
        if not permissions.get("can_mark_presence", True):
            raise HTTPException(status_code=403, detail="Permission denied: cannot mark presence")
    
    presence_entry = PresenceEntry(
        date=presence.date, 
        present=presence.present,
        commentaire=presence.commentaire
    )
    
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

@api_router.get("/presences/by-date")
async def get_presences_by_date(date: str, current_user: dict = Depends(get_current_user)):
    """Get all presences for a specific date"""
    # Filter visitors by city if not admin/super_admin
    city_filter = {} if current_user["role"] in ["admin", "super_admin", "pasteur"] else {"city": current_user["city"]}
    
    visitors = await db.visitors.find(city_filter).to_list(length=None)
    
    result = []
    for visitor in visitors:
        # Check both dimanche and jeudi presences
        all_presences = visitor.get("presences_dimanche", []) + visitor.get("presences_jeudi", [])
        presence_for_date = next((p for p in all_presences if p.get("date") == date), None)
        
        if presence_for_date:
            result.append({
                "visitor_id": visitor["id"],
                "firstname": visitor["firstname"],
                "lastname": visitor["lastname"],
                "present": presence_for_date.get("present"),
                "commentaire": presence_for_date.get("commentaire")
            })
    
    return result

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
    
    # Check permissions for referents/responsables
    if current_user["role"] in ["referent", "responsable_promo", "promotions"]:
        permissions = current_user.get("permissions") or {}
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
    if current_user["role"] not in ["superviseur_promos", "promotions", "super_admin"]:
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

@api_router.post("/cities/initialize")
async def initialize_cities(current_user: dict = Depends(get_current_user)):
    """Initialize all cities with their countries - Creates cities if they don't exist"""
    if current_user["role"] not in ["super_admin"]:
        raise HTTPException(status_code=403, detail="Only super_admin can initialize cities")
    
    from uuid import uuid4
    
    # Define all cities with their countries
    cities_data = [
        {'name': 'Milan', 'country': 'Italie'},
        {'name': 'Rome', 'country': 'Italie'},
        {'name': 'Perugia', 'country': 'Italie'},
        {'name': 'Bologne', 'country': 'Italie'},
        {'name': 'Turin', 'country': 'Italie'},
        {'name': 'Dijon', 'country': 'France'},
        {'name': 'Auxerre', 'country': 'France'},
        {'name': 'Besançon', 'country': 'France'},
        {'name': 'Chalon-Sur-Saone', 'country': 'France'},
        {'name': 'Dole', 'country': 'France'},
        {'name': 'Sens', 'country': 'France'}
    ]
    
    created_count = 0
    updated_count = 0
    
    for city_data in cities_data:
        # Check if city exists (case-insensitive)
        existing = await db.cities.find_one({
            'name': {'$regex': f'^{city_data["name"]}$', '$options': 'i'}
        })
        
        if existing:
            # Update existing city
            result = await db.cities.update_one(
                {'_id': existing['_id']},
                {'$set': {'country': city_data['country']}}
            )
            if result.modified_count > 0:
                updated_count += 1
        else:
            # Create new city
            new_city = {
                'id': str(uuid4()),
                'name': city_data['name'],
                'country': city_data['country']
            }
            await db.cities.insert_one(new_city)
            created_count += 1
    
    return {
        "success": True,
        "message": f"{created_count} villes créées, {updated_count} villes mises à jour",
        "created_count": created_count,
        "updated_count": updated_count,
        "total_cities": await db.cities.count_documents({})
    }

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
async def get_city_stats(
    city_id: str,
    year: Optional[int] = None,
    month: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get comprehensive statistics for a specific city with year/month filters"""
    if current_user["role"] not in ["superviseur_promos", "promotions", "super_admin", "pasteur"]:
        raise HTTPException(status_code=403, detail="Only admin can view city stats")
    
    city = await db.cities.find_one({"id": city_id})
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    
    city_name = city["name"]
    
    # Build query with filters
    query = {"city": city_name}
    if year and month:
        query["assigned_month"] = f"{year}-{month:02d}"
    elif year:
        query["assigned_month"] = {"$regex": f"^{year}-"}
    elif month:
        query["assigned_month"] = {"$regex": f"-{month:02d}$"}
    
    # PROMOTIONS STATS
    visitors = await db.visitors.find(query).to_list(10000)
    na_count = sum(1 for v in visitors if "Nouveau Arrivant" in v.get("types", []))
    nc_count = sum(1 for v in visitors if "Nouveau Converti" in v.get("types", []))
    dp_count = sum(1 for v in visitors if "De Passage" in v.get("types", []))
    
    # Calculate average fidelisation for promotions
    total_fidelisation = 0
    promo_count = 0
    for visitor in visitors:
        if visitor.get("presences_dimanche") or visitor.get("presences_jeudi"):
            total_presences = len([p for p in visitor.get("presences_dimanche", []) if p.get("present")]) + len([p for p in visitor.get("presences_jeudi", []) if p.get("present")])
            expected = (len(visitor.get("presences_dimanche", [])) + len(visitor.get("presences_jeudi", [])))
            if expected > 0:
                total_fidelisation += (total_presences / expected) * 100
                promo_count += 1
    avg_fidelisation_promos = (total_fidelisation / promo_count) if promo_count > 0 else 0
    
    # FAMILLE D'IMPACT STATS
    fi_query = {"ville": city_name}  # Note: FI uses "ville" not "city"
    fis = await db.familles_impact.find(fi_query, {"_id": 0}).to_list(10000)
    secteurs = await db.secteurs.find({"ville": city_name}, {"_id": 0}).to_list(1000)
    
    # Count FI members from membres_fi collection
    fi_ids = [fi["id"] for fi in fis]
    membres_query = {"fi_id": {"$in": fi_ids}} if fi_ids else {"fi_id": None}
    membres = await db.membres_fi.find(membres_query, {"_id": 0}).to_list(10000)
    total_fi_members = len(membres)
    
    # Calculate FI fidelisation from presences_fi collection
    presences_query = {"fi_id": {"$in": fi_ids}} if fi_ids else {"fi_id": None}
    if year and month:
        presences_query["date"] = {"$regex": f"^{year}-{month:02d}"}
    elif year:
        presences_query["date"] = {"$regex": f"^{year}"}
    
    presences = await db.presences_fi.find(presences_query, {"_id": 0}).to_list(100000)
    
    # Calculate fidelisation per member
    fi_fidelisation = 0
    fi_count = 0
    for membre in membres:
        membre_presences = [p for p in presences if p.get("membre_fi_id") == membre["id"]]
        if membre_presences:
            present_count = sum(1 for p in membre_presences if p.get("present"))
            if len(membre_presences) > 0:
                fi_fidelisation += (present_count / len(membre_presences)) * 100
                fi_count += 1
    
    avg_fidelisation_fi = (fi_fidelisation / fi_count) if fi_count > 0 else 0
    
    # CULTE STATS
    culte_query = {"ville": city_name}
    if year and month:
        culte_query["date"] = {"$regex": f"^{year}-{month:02d}"}
    elif year:
        culte_query["date"] = {"$regex": f"^{year}"}
    
    culte_stats = await db.culte_stats.find(culte_query).to_list(10000)
    
    total_adultes = sum(s.get("nombre_adultes", 0) for s in culte_stats)
    total_enfants = sum(s.get("nombre_enfants", 0) for s in culte_stats)
    total_stars = sum(s.get("nombre_stars", 0) for s in culte_stats)
    culte_count = len(culte_stats)
    
    avg_adultes = (total_adultes / culte_count) if culte_count > 0 else 0
    avg_enfants = (total_enfants / culte_count) if culte_count > 0 else 0
    avg_stars = (total_stars / culte_count) if culte_count > 0 else 0
    
    return {
        "city_name": city_name,
        "filters": {
            "year": year,
            "month": month
        },
        "promotions": {
            "nouveaux_arrivants": na_count,
            "nouveaux_convertis": nc_count,
            "de_passage": dp_count,
            "avg_fidelisation": round(avg_fidelisation_promos, 2)
        },
        "familles_impact": {
            "nombre_secteurs": len(secteurs),
            "nombre_familles": len(fis),
            "total_membres": total_fi_members,
            "avg_fidelisation": round(avg_fidelisation_fi, 2)
        },
        "culte_stats": {
            "avg_adultes": round(avg_adultes, 1),
            "avg_enfants": round(avg_enfants, 1),
            "avg_stars": round(avg_stars, 1),
            "total_services": culte_count
        },
        "evangelisation": await get_evangelisation_stats_for_city(city_name, year, month)
    }

async def get_evangelisation_stats_for_city(city_name: str, year: Optional[int], month: Optional[int]):
    """Helper to get evangelisation stats for a city"""
    query = {"ville": city_name}
    
    if year and month:
        query["date"] = {"$regex": f"^{year}-{month:02d}"}
    elif year:
        query["date"] = {"$regex": f"^{year}"}
    
    records = await db.evangelisation.find(query).to_list(1000)
    
    stats = {
        "eglise": {
            "nombre_gagneurs_ame": 0,
            "nombre_personnes_receptives": 0,
            "nombre_priere_salut": 0,
            "nombre_contacts_pris": 0,
            "nombre_ames_invitees": 0,
            "nombre_miracles": 0
        },
        "familles_impact": {
            "nombre_gagneurs_ame": 0,
            "nombre_personnes_receptives": 0,
            "nombre_priere_salut": 0,
            "nombre_contacts_pris": 0,
            "nombre_ames_invitees": 0,
            "nombre_miracles": 0
        }
    }
    
    for record in records:
        if record.get("eglise"):
            for key in stats["eglise"]:
                stats["eglise"][key] += record["eglise"].get(key, 0)
        
        if record.get("familles_impact"):
            for key in stats["familles_impact"]:
                stats["familles_impact"][key] += record["familles_impact"].get(key, 0)
    
    return stats

# ==================== ANALYTICS ROUTES ====================

@api_router.get("/analytics/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    # Base query filter
    base_query = {"tracking_stopped": False}
    
    # For pasteur, super_admin, and responsable_eglise: responsable_eglise sees only their city
    if current_user["role"] == "responsable_eglise":
        base_query["city"] = current_user["city"]
    elif current_user["role"] not in ["pasteur", "super_admin"]:
        base_query["city"] = current_user["city"]
    
    city = current_user["city"]
    
    # If referent or responsable_promo, filter by their assigned month (all years)
    if current_user["role"] in ["referent", "responsable_promo", "promotions"]:
        permissions = current_user.get("permissions") or {}
        if not permissions.get("can_view_all_months", False):
            assigned_month = current_user.get("assigned_month")
            if assigned_month:
                # Extract month part only (MM from YYYY-MM)
                month_part = assigned_month.split("-")[-1] if "-" in assigned_month else assigned_month
                # Use regex to match any year with this month
                base_query["assigned_month"] = {"$regex": f"-{month_part}$"}
    
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
    
    # Formations stats
    formation_pcnc_count = await db.visitors.count_documents({**base_query, "formation_pcnc": True})
    formation_au_coeur_bible_count = await db.visitors.count_documents({**base_query, "formation_au_coeur_bible": True})
    formation_star_count = await db.visitors.count_documents({**base_query, "formation_star": True})
    
    return {
        "total_visitors": total_visitors,
        "total_referents": total_referents,
        "by_channel": by_channel,
        "by_month": by_month,
        "by_type": by_type,
        "formation_pcnc": formation_pcnc_count,
        "formation_au_coeur_bible": formation_au_coeur_bible_count,
        "formation_star": formation_star_count
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
    """Get fidelisation rate for referent, responsable_promo, superviseur_promos, and promotions roles"""
    allowed_roles = ["referent", "responsable_promo", "superviseur_promos", "promotions", "super_admin", "pasteur"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    assigned_month = current_user.get("assigned_month")
    # Pour les rôles sans assigned_month, utiliser tous les visiteurs de la ville
    if not assigned_month and current_user["role"] in ["superviseur_promos", "super_admin", "pasteur"]:
        # Ces rôles voient tous les visiteurs de leur ville
        pass
    elif not assigned_month:
        raise HTTPException(status_code=400, detail="No assigned month")
    
    # Get all visitors for this user
    query = {"city": current_user["city"]}
    
    # Pour referent, responsable_promo ET promotions, filtrer par assigned_month
    # Les superviseurs et admins voient toute la ville
    if assigned_month and current_user["role"] in ["referent", "responsable_promo", "promotions"]:
        # Support multiple months separated by commas (e.g., "2024-08,2025-08,2026-08")
        months_list = [m.strip() for m in assigned_month.split(',')]
        if len(months_list) > 1:
            query["assigned_month"] = {"$in": months_list}
        else:
            query["assigned_month"] = assigned_month
    
    all_visitors = await db.visitors.find(query, {"_id": 0}).to_list(10000)

    
    # Pour la fidélisation, on ne compte que les visiteurs actifs
    visitors = [v for v in all_visitors if not v.get("tracking_stopped")]
    
    # Mais total_visitors compte TOUS (actifs + arrêtés)
    total_visitors = len(all_visitors)
    total_visitors_actifs = len(visitors)
    if total_visitors_actifs == 0:
        # Retourner quand même total_visitors pour affichage
        return {
            "total_visitors": total_visitors,
            "total_visitors_actifs": 0,
            "weekly_rates": [],
            "monthly_average": 0
        }
    
    # Déterminer la plage de dates basée sur les présences réelles
    # Trouver la date min et max des présences
    all_presence_dates = []
    for visitor in visitors:
        for p in visitor.get("presences_dimanche", []):
            date_val = p.get("date")
            if date_val and isinstance(date_val, str):
                all_presence_dates.append(date_val)
        for p in visitor.get("presences_jeudi", []):
            date_val = p.get("date")
            if date_val and isinstance(date_val, str):
                all_presence_dates.append(date_val)
    
    # Parse and validate dates
    valid_dates = []
    from datetime import datetime as dt
    for date_str in all_presence_dates:
        try:
            parsed = dt.strptime(date_str, "%Y-%m-%d")
            valid_dates.append(parsed)
        except (ValueError, TypeError):
            # Skip invalid dates
            continue
    
    if not valid_dates:
        # Pas de présences valides - générer quand même les 52 semaines
        weeks = list(range(1, 53))
    else:
        # Utiliser toutes les 52 semaines de l'année mais ne calculer le taux que pour celles qui ont des présences
        weeks = list(range(1, 53))
    
    weekly_rates = []
    for week in weeks:
        # Count presences for this week with WEIGHTED LOGIC (dimanche x2, jeudi x1)
        total_presences_dimanche = 0
        total_presences_jeudi = 0
        for visitor in visitors:
            for presence in visitor.get("presences_dimanche", []):
                if get_week_number(presence["date"]) == week and presence.get("present", False):
                    total_presences_dimanche += 1
            for presence in visitor.get("presences_jeudi", []):
                if get_week_number(presence["date"]) == week and presence.get("present", False):
                    total_presences_jeudi += 1
        
        # Calculate rate with PONDÉRATION: dimanche x2, jeudi x1
        expected_dimanche = total_visitors_actifs * 1  # 1 dimanche par semaine
        expected_jeudi = total_visitors_actifs * 1  # 1 jeudi par semaine
        max_weighted = (expected_dimanche * 2) + (expected_jeudi * 1)
        actual_weighted = (total_presences_dimanche * 2) + (total_presences_jeudi * 1)
        rate = (actual_weighted / max_weighted * 100) if max_weighted > 0 else 0
        
        weekly_rates.append({
            "week": week,
            "rate": round(rate, 2),
            "presences": total_presences_dimanche + total_presences_jeudi,
            "expected": expected_dimanche + expected_jeudi
        })
    
    # Calculate monthly average
    monthly_average = sum(w["rate"] for w in weekly_rates) / len(weekly_rates) if weekly_rates else 0
    
    # Compter NA et NC de TOUS les visiteurs
    total_na = len([v for v in all_visitors if "Nouveau Arrivant" in v.get("types", [])])
    total_nc = len([v for v in all_visitors if "Nouveau Converti" in v.get("types", [])])
    
    return {
        "total_visitors": total_visitors,
        "total_visitors_actifs": total_visitors_actifs,
        "total_na": total_na,
        "total_nc": total_nc,
        "weekly_rates": weekly_rates,
        "monthly_average": round(monthly_average, 2)
    }

@api_router.get("/fidelisation/admin")
async def get_admin_fidelisation(week: int = None, month: str = None, current_user: dict = Depends(get_current_user)):
    """Get fidelisation rates for all referents (admin view)"""
    if current_user["role"] not in ["superviseur_promos", "superviseur_fi", "promotions", "super_admin", "pasteur"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Get all referents (all cities for pasteur/super_admin, own city for responsable_eglise and others)
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
        
        # Déterminer la plage de dates basée sur les présences réelles
        # Trouver la date min et max des présences
        all_presence_dates = []
        for visitor in visitors:
            for p in visitor.get("presences_dimanche", []):
                if p.get("date"):
                    all_presence_dates.append(p["date"])
            for p in visitor.get("presences_jeudi", []):
                if p.get("date"):
                    all_presence_dates.append(p["date"])
        
        if not all_presence_dates:
            # Pas de présences, utiliser le mois assigné
            year, ref_month = map(int, assigned_month.split("-"))
            weeks = get_weeks_in_month(year, ref_month)
        else:
            # Utiliser la date la plus ancienne des présences pour déterminer les semaines
            min_date_str = min(all_presence_dates)
            max_date_str = max(all_presence_dates)
            min_date = datetime.strptime(min_date_str, "%Y-%m-%d")
            max_date = datetime.strptime(max_date_str, "%Y-%m-%d")
            
            # Calculer toutes les semaines entre min et max
            weeks = set()
            current = min_date
            while current <= max_date:
                weeks.add(current.isocalendar()[1])
                current += timedelta(days=1)
            weeks = sorted(list(weeks))
        
        # Filter by month if specified
        if month and assigned_month != month:
            continue
        
        # Filter by week if specified
        if week:
            weeks = [week] if week in weeks else []
        
        weekly_rates = []
        for w in weeks:
            # Count presences with WEIGHTED LOGIC (dimanche x2, jeudi x1)
            total_presences_dimanche = 0
            total_presences_jeudi = 0
            for visitor in visitors:
                for presence in visitor.get("presences_dimanche", []):
                    if get_week_number(presence["date"]) == w and presence.get("present", False):
                        total_presences_dimanche += 1
                for presence in visitor.get("presences_jeudi", []):
                    if get_week_number(presence["date"]) == w and presence.get("present", False):
                        total_presences_jeudi += 1
            
            # Calculate rate with PONDÉRATION: dimanche x2, jeudi x1
            expected_dimanche = total_visitors * 1  # 1 dimanche par semaine
            expected_jeudi = total_visitors * 1  # 1 jeudi par semaine
            max_weighted = (expected_dimanche * 2) + (expected_jeudi * 1)
            actual_weighted = (total_presences_dimanche * 2) + (total_presences_jeudi * 1)
            rate = (actual_weighted / max_weighted * 100) if max_weighted > 0 else 0
            
            weekly_rates.append({
                "week": w,
                "rate": round(rate, 2),
                "presences": total_presences_dimanche + total_presences_jeudi,
                "expected": expected_dimanche + expected_jeudi
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
    
    # Super admin peut voir toutes les villes, autres utilisateurs seulement leur ville
    if current_user["role"] == "super_admin":
        if ville:
            query["ville"] = ville
    else:
        # Forcer la ville de l'utilisateur connecté
        query["ville"] = current_user["city"]
    
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
        raise HTTPException(status_code=400, detail=f"Impossible de supprimer le secteur : il contient encore {fi_count} Famille(s) d'Impact. Veuillez d'abord supprimer ou réassigner les FI.")
    
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
    
    # Super admin peut voir toutes les villes, autres utilisateurs seulement leur ville
    if current_user["role"] == "super_admin":
        if ville:
            query["ville"] = ville
    else:
        # Forcer la ville de l'utilisateur connecté
        query["ville"] = current_user["city"]
    
    if secteur_id:
        query["secteur_id"] = secteur_id
    
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
    return fi

# Endpoint PUBLIC pour trouver les FI (sans authentification)
@api_router.get("/public/fi/all")
async def get_all_fi_public(ville: Optional[str] = None):
    """Get all FI with addresses (public access for finding nearest FI)"""
    query = {}
    if ville:
        query["ville"] = ville
    
    fis = await db.familles_impact.find(
        query, 
        {"_id": 0, "id": 1, "nom": 1, "ville": 1, "adresse": 1, "secteur_id": 1, "pilote_id": 1, "pilote_ids": 1, "heure_debut": 1, "heure_fin": 1}
    ).to_list(length=None)
    
    # Only return FIs with addresses
    fis_with_address = [fi for fi in fis if fi.get("adresse")]
    
    # Enrichir avec les infos du/des pilote(s)
    for fi in fis_with_address:
        pilotes_info = []
        
        # Handle both old (pilote_id) and new (pilote_ids) format
        pilote_ids = fi.get("pilote_ids", [])
        if fi.get("pilote_id"):
            pilote_ids.append(fi["pilote_id"])
        
        # Get info for all pilots
        for pilote_id in pilote_ids:
            pilote = await db.users.find_one(
                {"id": pilote_id}, 
                {"_id": 0, "username": 1, "telephone": 1}
            )
            if pilote:
                pilotes_info.append({
                    "nom": pilote.get("username"),
                    "telephone": pilote.get("telephone")
                })
        
        fi["pilotes"] = pilotes_info
        # Keep backward compatibility
        if pilotes_info:
            fi["pilote_nom"] = pilotes_info[0]["nom"]
            fi["pilote_telephone"] = pilotes_info[0]["telephone"]
    
    return fis_with_address

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
    
    # Filter for pilote
    if current_user["role"] == "pilote_fi" and current_user.get("assigned_fi_id"):
        query["fi_id"] = current_user["assigned_fi_id"]
    elif fi_id:
        query["fi_id"] = fi_id
    else:
        # Si pas de fi_id spécifique, filtrer par ville (sauf super_admin)
        if current_user["role"] != "super_admin":
            # Récupérer les FI de la ville de l'utilisateur
            fi_query = {"ville": current_user["city"]}
            fis = await db.familles_impact.find(fi_query, {"_id": 0, "id": 1}).to_list(length=None)
            fi_ids = [fi["id"] for fi in fis]
            if fi_ids:
                query["fi_id"] = {"$in": fi_ids}
            else:
                # Aucune FI dans cette ville, retourner vide
                return []
    
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
    
    # Support both old (assigned_fi_id) and new (assigned_fi_ids) format
    fi_id = current_user.get("assigned_fi_id")
    if not fi_id:
        assigned_fi_ids = current_user.get("assigned_fi_ids", [])
        if assigned_fi_ids:
            fi_id = assigned_fi_ids[0]  # Use first FI if multiple assigned
    
    if not fi_id:
        raise HTTPException(status_code=400, detail="No FI assigned to your account")
    
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
async def get_promotions_detailed(ville: str = None, mois: str = None, annee: str = None, current_user: dict = Depends(get_current_user)):
    """Get detailed promotions analytics for Super Admin/Pasteur with:
    - Fidélisation par promo (TOUTES les promos)
    - Filtres mois/année appliqués sur les PRÉSENCES et données, pas sur les promos
    - Total NA vs NC vs DP
    - Canal d'arrivée (4 canaux spécifiques)
    - Détails quotidiens par date
    """
    from datetime import datetime
    import calendar
    
    # Only super_admin, pasteur, and responsable_eglise can access
    if current_user["role"] not in ["super_admin", "pasteur", "responsable_eglise"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get all visitors INCLUDING tracking_stopped (pour compter les suivis arrêtés)
    base_query = {}
    
    # For responsable_eglise, force filter by their city
    if current_user["role"] == "responsable_eglise":
        base_query["city"] = current_user["city"]
    # Filtrer par ville si spécifié
    elif ville and ville != "all":
        base_query["city"] = ville
    
    # Get ALL visitors (y compris tracking_stopped pour les statistiques)
    all_visitors = await db.visitors.find(base_query, {"_id": 0}).to_list(10000)
    
    # Filtrer les visiteurs pour les indicateurs globaux si mois/année spécifiés
    visitors_for_summary = all_visitors
    if mois and mois != "all" and annee and annee != "all":
        # Filtrer les visiteurs dont assigned_month correspond au mois/année
        visitors_for_summary = [v for v in all_visitors if v.get("assigned_month", "").startswith(f"{annee}-{mois}")]
    
    # Utiliser all_visitors pour les stats détaillées (toutes les promos)
    visitors = all_visitors
    
    # Déterminer le mois filtré pour le calcul des dimanches/jeudis
    if mois and mois != "all" and annee and annee != "all":
        filter_year = int(annee)
        filter_month = int(mois)
        # Compter le nombre de dimanches et jeudis dans ce mois
        num_days = calendar.monthrange(filter_year, filter_month)[1]
        num_sundays = sum(1 for day in range(1, num_days + 1) if datetime(filter_year, filter_month, day).weekday() == 6)
        num_thursdays = sum(1 for day in range(1, num_days + 1) if datetime(filter_year, filter_month, day).weekday() == 3)
    else:
        # Par défaut: 4 dimanches et 4 jeudis
        num_sundays = 4
        num_thursdays = 4
    
    # Group by assigned_month (Promo) - on garde TOUTES les promos
    promos_by_month = {}
    for visitor in visitors:
        month = visitor.get("assigned_month", "N/A")
        if month not in promos_by_month:
            promos_by_month[month] = {
                "month": month,
                "total_visitors": 0,
                "total_visitors_all": 0,  # Inclut les suivis arrêtés
                "na_count": 0,
                "nc_count": 0,
                "dp_count": 0,
                "residents_count": 0,
                "visitors": [],
                "visitors_actifs": [],  # Seulement ceux avec suivi actif
                "suivis_arretes": []
            }
        
        # Compter TOUS les visiteurs (y compris arrêtés) pour les stats globales
        promos_by_month[month]["total_visitors_all"] += 1
        promos_by_month[month]["visitors"].append(visitor)
        
        # LOGIQUE NOUVELLE: NA = TOUTES les personnes reçues (car toute personne reçue est NA)
        promos_by_month[month]["na_count"] += 1
        
        # Compter seulement les visiteurs actifs (pas arrêtés) pour "nbre_pers_suivis"
        if not visitor.get("tracking_stopped"):
            promos_by_month[month]["total_visitors"] += 1
            promos_by_month[month]["visitors_actifs"].append(visitor)
        
        # Count NC vs DP (tous, même arrêtés)
        types = visitor.get("types", [])
        if "Nouveau Converti" in types:
            promos_by_month[month]["nc_count"] += 1
        if "De Passage" in types:
            promos_by_month[month]["dp_count"] += 1
        
        # Count residents (not DP)
        if "De Passage" not in types:
            promos_by_month[month]["residents_count"] += 1
        
        # Track stopped tracking
        if visitor.get("tracking_stopped"):
            promos_by_month[month]["suivis_arretes"].append({
                "name": f"{visitor.get('firstname', '')} {visitor.get('lastname', '')}",
                "reason": visitor.get("stop_reason", "Non spécifié")
            })
    
    # Calculate fidelisation for each promo based on FILTERED month
    promos_stats = []
    for month, data in sorted(promos_by_month.items()):
        total = data["total_visitors"]
        
        # Filtrer les présences par mois/année si spécifié
        total_presences_dimanche = 0
        total_presences_jeudi = 0
        
        if total > 0:
            # Compter seulement les présences des visiteurs ACTIFS (pas arrêtés)
            for visitor in data["visitors_actifs"]:
                # Filtrer les présences dimanche par mois/année
                presences_dim = visitor.get("presences_dimanche", [])
                if mois and mois != "all" and annee and annee != "all":
                    # Normaliser le mois avec zéro devant si nécessaire
                    mois_padded = mois.zfill(2)
                    # Filtrer d'abord par date, puis compter les présents
                    presences_dim_filtered = [p for p in presences_dim if p.get("date", "").startswith(f"{annee}-{mois_padded}") and p.get("present")]
                    total_presences_dimanche += len(presences_dim_filtered)
                else:
                    total_presences_dimanche += len([p for p in presences_dim if p.get("present")])
                
                # Filtrer les présences jeudi par mois/année
                presences_jeu = visitor.get("presences_jeudi", [])
                if mois and mois != "all" and annee and annee != "all":
                    # Normaliser le mois avec zéro devant si nécessaire
                    mois_padded = mois.zfill(2)
                    # Filtrer d'abord par date, puis compter les présents
                    presences_jeu_filtered = [p for p in presences_jeu if p.get("date", "").startswith(f"{annee}-{mois_padded}") and p.get("present")]
                    total_presences_jeudi += len(presences_jeu_filtered)
                else:
                    total_presences_jeudi += len([p for p in presences_jeu if p.get("present")])
        
        # Expected = nombre de personnes × nombre de dimanches/jeudis dans le mois filtré
        expected_dimanche = total * num_sundays
        expected_jeudi = total * num_thursdays
        
        # Fidélisation: ((Présences Dim / Attendues Dim) × 2 + (Présences Jeu / Attendues Jeu) × 1) / 2
        taux_dimanche = (total_presences_dimanche / expected_dimanche) if expected_dimanche > 0 else 0
        taux_jeudi = (total_presences_jeudi / expected_jeudi) if expected_jeudi > 0 else 0
        fidelisation = ((taux_dimanche * 2) + (taux_jeudi * 1)) / 2 * 100
        
        # CORRECTION: Pers. Suivies = Pers. Reçues (total_all) - Suivis Arrêtés
        nbre_pers_suivis = data["total_visitors_all"] - len(data["suivis_arretes"])
        
        promos_stats.append({
            "month": month,
            "nbre_pers_suivis": nbre_pers_suivis,  # Pers. Reçues - Arrêtés
            "total_visitors": data["total_visitors_all"],  # Total incluant arrêtés
            "na_count": data["na_count"],
            "nc_count": data["nc_count"],
            "dp_count": data["dp_count"],
            "residents_count": data["residents_count"],
            "suivis_arretes_count": len(data["suivis_arretes"]),
            "suivis_arretes_details": data["suivis_arretes"],
            "fidelisation": round(fidelisation, 1),
            "total_presences_dimanche": total_presences_dimanche,
            "expected_presences_dimanche": expected_dimanche,
            "total_presences_jeudi": total_presences_jeudi,
            "expected_presences_jeudi": expected_jeudi
        })
    
    # Calculate Canal d'arrivée statistics (4 canaux spécifiques) - FILTRÉ par mois/année
    canal_counts = {
        "Evangelisation": 0,
        "Réseaux sociaux": 0,
        "Invitation par un membre (hors evangelisation)": 0,
        "Par soi même": 0
    }
    for visitor in visitors_for_summary:
        canal = visitor.get("arrival_channel", "")
        if canal in canal_counts:
            canal_counts[canal] += 1
    
    # Global totals - FILTRÉS par mois/année
    # LOGIQUE NOUVELLE: NA = Total personnes reçues (tous sont NA au départ)
    total_personnes_recues = len(visitors_for_summary)  # Tous les visiteurs (même arrêtés)
    total_na = total_personnes_recues  # NA = Total personnes reçues
    total_nc = len([v for v in visitors_for_summary if "Nouveau Converti" in v.get("types", [])])
    total_dp = len([v for v in visitors_for_summary if "De Passage" in v.get("types", [])])
    total_suivis_arretes = len([v for v in visitors_for_summary if v.get("tracking_stopped")])
    total_personnes_suivies = total_na - total_suivis_arretes  # Personnes suivies = NA - Suivis arrêtés
    
    # Avg fidelisation reste basé sur promos_stats (toutes les promos visibles)
    avg_fidelisation = sum(p["fidelisation"] for p in promos_stats) / len(promos_stats) if promos_stats else 0
    
    # Détail des personnes reçues par jour (TOUJOURS affiché)
    from datetime import datetime
    from collections import defaultdict
    daily_data = defaultdict(lambda: {
        "total": 0, "dp": 0, "residents": 0, "na": 0, "nc": 0
    })
    
    # Group by visit_date avec filtre optionnel par mois/année
    for visitor in visitors:
        visit_date = visitor.get("visit_date", "")
        if visit_date:
            # Appliquer filtre mois/année si spécifié
            if mois and mois != "all" and annee and annee != "all":
                if not visit_date.startswith(f"{annee}-{mois}"):
                    continue
            
            types = visitor.get("types", [])
            daily_data[visit_date]["total"] += 1
            if "De Passage" in types:
                daily_data[visit_date]["dp"] += 1
            else:
                daily_data[visit_date]["residents"] += 1
            if "Nouveau Arrivant" in types:
                daily_data[visit_date]["na"] += 1
            if "Nouveau Converti" in types:
                daily_data[visit_date]["nc"] += 1
    
    # Sort by date
    daily_details = []
    for date_str, data in sorted(daily_data.items()):
        daily_details.append({
            "date": date_str,
            "total_personnes_recues": data["total"],
            "nbre_de_passage": data["dp"],
            "nbre_residents": data["residents"],
            "nbre_na": data["na"],
            "nbre_nc": data["nc"]
        })
    
    return {
        "promos": promos_stats,
        "summary": {
            "total_promos": len(promos_stats),
            "total_personnes_recues": total_personnes_recues,  # Nouveau: Total personnes reçues
            "total_na": total_na,  # = total_personnes_recues
            "total_nc": total_nc,
            "total_dp": total_dp,
            "total_suivis_arretes": total_suivis_arretes,  # Nouveau
            "total_personnes_suivies": total_personnes_suivies,  # Nouveau: NA - Suivis arrêtés
            "avg_fidelisation": round(avg_fidelisation, 1),
            "canal_evangelisation": canal_counts["Evangelisation"],
            "canal_reseaux_sociaux": canal_counts["Réseaux sociaux"],
            "canal_invitation_membre": canal_counts["Invitation par un membre (hors evangelisation)"],
            "canal_par_soi_meme": canal_counts["Par soi même"]
        },
        "daily_details": daily_details
    }

@api_router.get("/analytics/visitors-table")
async def get_visitors_table(ville: str = None, current_user: dict = Depends(get_current_user)):
    """Get complete visitors table with all details for Super Admin/Pasteur"""
    # Only super_admin, pasteur, and responsable_eglise can access
    if current_user["role"] not in ["super_admin", "pasteur", "responsable_eglise"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Filtrer par ville si spécifié
    query = {}
    if ville:
        query["city"] = ville
    
    visitors = await db.visitors.find(query, {"_id": 0}).to_list(10000)
    
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
async def get_fi_detailed(ville: str = None, date: str = None, current_user: dict = Depends(get_current_user)):
    """Get detailed FI analytics with:
    - Nombre de secteurs, FI, membres
    - Évolution par secteur
    - Fidélisation par FI (filtrée par date si spécifiée)
    """
    # Only super_admin, pasteur, and responsable_eglise can access
    if current_user["role"] not in ["super_admin", "pasteur", "responsable_eglise"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Filtrer par ville si spécifié
    query = {}
    # For responsable_eglise, force filter by their city
    if current_user["role"] == "responsable_eglise":
        query["ville"] = current_user["city"]
    elif ville:
        query["ville"] = ville
    
    # Get all secteurs
    secteurs = await db.secteurs.find(query, {"_id": 0}).to_list(1000)
    
    # Get all FI
    familles = await db.familles_impact.find(query, {"_id": 0}).to_list(1000)
    
    # Get all membres - ONLY for the FIs in the filtered familles
    fi_ids = [f["id"] for f in familles]
    membres_query = {"fi_id": {"$in": fi_ids}} if fi_ids else {"fi_id": None}
    membres = await db.membres_fi.find(membres_query, {"_id": 0}).to_list(10000)
    
    # Get all presences (filtered by date if specified and by FI)
    presences_query = {}
    if date:
        presences_query["date"] = date
    if fi_ids:
        presences_query["fi_id"] = {"$in": fi_ids}
    presences = await db.presences_fi.find(presences_query, {"_id": 0}).to_list(100000)
    
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
    
    # Fidélisation par FI (based on selected date or all-time)
    fi_fidelisation = []
    for fi in familles:
        fi_membres = [m for m in membres if m.get("fi_id") == fi["id"]]
        fi_presences = [p for p in presences if p.get("fi_id") == fi["id"]]
        
        total_membres = len(fi_membres)
        if total_membres == 0:
            fidelisation = 0
        else:
            if date:
                # Pour une date spécifique : taux de présence ce jour-là
                presents = len([p for p in fi_presences if p.get("present")])
                fidelisation = (presents / total_membres) * 100 if total_membres > 0 else 0
            else:
                # Sans date : Compte les membres avec au moins 3 présences (historique)
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
async def get_membres_table(ville: str = None, current_user: dict = Depends(get_current_user)):
    """Get complete membres table with presences for Super Admin/Pasteur"""
    # Only super_admin, pasteur, and responsable_eglise can access
    if current_user["role"] not in ["super_admin", "pasteur", "responsable_eglise"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # For responsable_eglise, force filter by their city
    if current_user["role"] == "responsable_eglise":
        ville = current_user["city"]
    
    # Filtrer par ville si spécifié
    membre_query = {}
    if ville:
        # Besoin de filtrer les membres par FI qui appartiennent à la ville
        # On récupère d'abord les FI de la ville
        fi_query = {"ville": ville}
        fis = await db.familles_impact.find(fi_query, {"id": 1, "_id": 0}).to_list(1000)
        fi_ids = [fi["id"] for fi in fis]
        if fi_ids:
            membre_query["famille_impact_id"] = {"$in": fi_ids}
        else:
            # Aucune FI dans cette ville, retour vide
            return []
    
    membres = await db.membres_fi.find(membre_query, {"_id": 0}).to_list(10000)
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
    # Only super_admin, pasteur, and responsable_eglise can access
    if current_user["role"] not in ["super_admin", "pasteur", "responsable_eglise"]:
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
    """Create culte statistics - Accueil, Pasteur, and Responsable Église can create for their city"""
    # Accueil, Responsable Église can only create for their city
    if current_user["role"] in ["accueil", "responsable_eglise"] and stats.ville != current_user["city"]:
        raise HTTPException(status_code=403, detail="Can only create stats for your city")
    
    # Check role permissions
    if current_user["role"] not in ["accueil", "super_admin", "pasteur", "responsable_eglise"]:
        raise HTTPException(status_code=403, detail="Not authorized to create culte stats")
    
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
    
    # Accueil and Responsable Église can only see their city
    if current_user["role"] in ["accueil", "responsable_eglise"]:
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
    
    # Accueil and Responsable Église can only update their city
    if current_user["role"] in ["accueil", "responsable_eglise"] and stat["ville"] != current_user["city"]:
        raise HTTPException(status_code=403, detail="Can only update stats for your city")
    
    # Only accueil, pasteur, responsable_eglise and super_admin can update
    if current_user["role"] not in ["accueil", "super_admin", "pasteur", "responsable_eglise"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_dict = {k: v for k, v in updates.dict(exclude_unset=True).items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.culte_stats.update_one({"id": stat_id}, {"$set": update_dict})
    
    updated_stat = await db.culte_stats.find_one({"id": stat_id}, {"_id": 0})
    return updated_stat

@api_router.delete("/culte-stats/{stat_id}")
async def delete_culte_stats(stat_id: str, current_user: dict = Depends(get_current_user)):
    """Delete culte statistics - Super Admin and Pasteur"""
    if current_user["role"] not in ["super_admin", "pasteur"]:
        raise HTTPException(status_code=403, detail="Only super_admin and pasteur can delete stats")
    
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
    # Only pasteur, super_admin, responsable_eglise and accueil can access summary
    if current_user["role"] not in ["pasteur", "super_admin", "accueil", "responsable_eglise"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Build query
    query = {}
    if current_user["role"] in ["accueil", "responsable_eglise"]:
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
                "evenements_speciaux": {"fideles": 0, "stars": 0},
                "total_fideles": 0,
                "total_stars": 0,
                "total_general": 0
            }
        
        culte_type = stat["type_culte"].lower().replace(" ", "_").replace("é", "e")
        if "ejp" in culte_type.lower():
            culte_type = "ejp"
        elif "1" in culte_type:
            culte_type = "culte_1"
        elif "2" in culte_type:
            culte_type = "culte_2"
        elif "evenement" in culte_type or "spéciaux" in stat["type_culte"].lower():
            culte_type = "evenements_speciaux"
        
        # Only add to known types to avoid KeyError
        if culte_type in by_date[date]:
            by_date[date][culte_type]["fideles"] = stat["nombre_fideles"]
            by_date[date][culte_type]["stars"] = stat["nombre_stars"]
        
        # Always add to totals
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
    cities = await db.cities.find({}, {"_id": 0}).to_list(10000)
    users = await db.users.find({}, {"_id": 0}).to_list(10000)
    visitors = await db.visitors.find({}, {"_id": 0}).to_list(10000)
    secteurs = await db.secteurs.find({}, {"_id": 0}).to_list(10000)
    familles_impact = await db.familles_impact.find({}, {"_id": 0}).to_list(10000)
    membres_fi = await db.membres_fi.find({}, {"_id": 0}).to_list(10000)
    presences_fi = await db.presences_fi.find({}, {"_id": 0}).to_list(10000)
    culte_stats = await db.culte_stats.find({}, {"_id": 0}).to_list(10000)
    notifications = await db.notifications.find({}, {"_id": 0}).to_list(10000)
    
    data = {
        "cities": cities,
        "users": users,
        "visitors": visitors,
        "secteurs": secteurs,
        "familles_impact": familles_impact,
        "membres_fi": membres_fi,
        "presences_fi": presences_fi,
        "culte_stats": culte_stats,
        "notifications": notifications,
        "metadata": {
            "export_date": datetime.now(timezone.utc).isoformat(),
            "exported_by": current_user["username"],
            "total_records": (
                len(cities) + len(users) + len(visitors) + 
                len(secteurs) + len(familles_impact) + len(membres_fi) + 
                len(presences_fi) + len(culte_stats) + len(notifications)
            ),
            "collections": {
                "cities": len(cities),
                "users": len(users),
                "visitors": len(visitors),
                "secteurs": len(secteurs),
                "familles_impact": len(familles_impact),
                "membres_fi": len(membres_fi),
                "presences_fi": len(presences_fi),
                "culte_stats": len(culte_stats),
                "notifications": len(notifications)
            }
        }
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

# ==================== ANALYTICS - AGE & CHANNEL ====================

@api_router.get("/analytics/age-distribution")
async def get_age_distribution(
    ville: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Get age range distribution for visitors"""
    # Permissions
    if current_user["role"] not in ["super_admin", "pasteur", "responsable_eglise", "responsable_promo", "promotions", "superviseur_promos"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Build query
    query = {}
    
    # For responsable_eglise, force their city
    if current_user["role"] == "responsable_eglise":
        query["city"] = current_user["city"]
    # For responsable_promo, filter by city and assigned_month
    elif current_user["role"] == "responsable_promo":
        query["city"] = current_user["city"]
        if current_user.get("assigned_month"):
            # Support multiple months separated by commas
            months_list = [m.strip() for m in current_user["assigned_month"].split(',')]
            if len(months_list) > 1:
                query["assigned_month"] = {"$in": months_list}
            else:
                query["assigned_month"] = current_user["assigned_month"]
    # For others, use ville parameter
    elif ville:
        query["city"] = ville
    
    # Get visitors
    visitors = await db.visitors.find(query, {"_id": 0, "age_range": 1}).to_list(10000)
    
    # Count by age range
    age_counts = {}
    for v in visitors:
        age = v.get("age_range", "Non renseigné")
        if not age:
            age = "Non renseigné"
        age_counts[age] = age_counts.get(age, 0) + 1
    
    # Format for PieChart
    result = [{"name": age, "value": count} for age, count in age_counts.items()]
    
    return result


@api_router.get("/analytics/arrival-channel-distribution")
async def get_arrival_channel_distribution(
    ville: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Get arrival channel distribution for visitors"""
    # Permissions
    if current_user["role"] not in ["super_admin", "pasteur", "responsable_eglise", "responsable_promo", "promotions", "superviseur_promos"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Build query
    query = {}
    
    # For responsable_eglise, force their city
    if current_user["role"] == "responsable_eglise":
        query["city"] = current_user["city"]
    # For responsable_promo, filter by city and assigned_month
    elif current_user["role"] == "responsable_promo":
        query["city"] = current_user["city"]
        if current_user.get("assigned_month"):
            # Support multiple months separated by commas
            months_list = [m.strip() for m in current_user["assigned_month"].split(',')]
            if len(months_list) > 1:
                query["assigned_month"] = {"$in": months_list}
            else:
                query["assigned_month"] = current_user["assigned_month"]
    # For others, use ville parameter
    elif ville:
        query["city"] = ville
    
    # Get visitors
    visitors = await db.visitors.find(query, {"_id": 0, "arrival_channel": 1}).to_list(10000)
    
    # Count by arrival channel
    channel_counts = {}
    for v in visitors:
        channel = v.get("arrival_channel", "Non renseigné")
        if not channel:
            channel = "Non renseigné"
        channel_counts[channel] = channel_counts.get(channel, 0) + 1
    
    # Format for PieChart
    result = [{"name": channel, "value": count} for channel, count in channel_counts.items()]
    
    return result

@api_router.post("/admin/generate-missing-passwords")
async def generate_missing_passwords(current_user: dict = Depends(get_current_user)):
    """
    Generate new passwords for all users who don't have plain_password stored
    Accessible only to super_admin
    """
    if current_user["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Only super_admin can generate passwords")
    
    try:
        import random
        import string
        
        # Get all users without plain_password
        users = await db.users.find({
            "$or": [
                {"plain_password": {"$exists": False}},
                {"plain_password": None},
                {"plain_password": ""}
            ]
        }).to_list(10000)
        
        updated_count = 0
        
        for user in users:
            # Générer un mot de passe : Prenom + 3 chiffres aléatoires
            firstname = user.get('username', 'User')
            # Prendre les 4 premiers caractères du username et capitaliser
            base = firstname[:4].capitalize()
            # Ajouter 3 chiffres aléatoires
            random_digits = ''.join(random.choices(string.digits, k=3))
            new_password = f"{base}{random_digits}"
            
            # Hash le nouveau mot de passe
            hashed_pwd = hash_password(new_password)
            
            # Mettre à jour l'utilisateur
            await db.users.update_one(
                {"id": user["id"]},
                {"$set": {
                    "password": hashed_pwd,
                    "plain_password": new_password
                }}
            )
            updated_count += 1
        
        return {
            "message": f"Passwords generated for {updated_count} users",
            "updated_count": updated_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating passwords: {str(e)}")

@api_router.get("/admin/export-credentials")
async def export_credentials(current_user: dict = Depends(get_current_user)):
    """
    Export all user credentials (logins and passwords) to Excel
    Accessible only to super_admin
    """
    if current_user["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Only super_admin can export credentials")
    
    try:
        import io
        from openpyxl import Workbook
        from openpyxl.styles import Font, PatternFill, Alignment
        
        # Get all users
        users = await db.users.find({}, {"_id": 0}).to_list(10000)
        
        # Create workbook
        wb = Workbook()
        ws = wb.active
        ws.title = "Credentials"
        
        # Headers
        headers = ["Nom d'utilisateur", "Mot de passe", "Rôle", "Ville", "Email"]
        ws.append(headers)
        
        # Style headers
        header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
        header_font = Font(bold=True, color="FFFFFF")
        
        for cell in ws[1]:
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center")
        
        # Add data
        for user in users:
            ws.append([
                user.get("username", ""),
                user.get("plain_password", "********"),  # Plain password if stored, otherwise masked
                user.get("role", ""),
                user.get("city", ""),
                user.get("email", "")
            ])
        
        # Adjust column widths
        ws.column_dimensions['A'].width = 25
        ws.column_dimensions['B'].width = 20
        ws.column_dimensions['C'].width = 25
        ws.column_dimensions['D'].width = 20
        ws.column_dimensions['E'].width = 30
        
        # Save to BytesIO
        excel_file = io.BytesIO()
        wb.save(excel_file)
        excel_file.seek(0)
        
        from fastapi.responses import StreamingResponse
        
        return StreamingResponse(
            excel_file,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=credentials_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'export: {str(e)}")

@api_router.post("/admin/migrate-presences")
async def migrate_presences(current_user: dict = Depends(get_current_user)):
    """
    Endpoint pour migrer les présences mal attribuées (jeudi dans dimanche)
    Accessible uniquement aux super_admin
    """
    if current_user["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Only super_admin can run migration")
    
    try:
        # Get all visitors
        visitors = await db.visitors.find({}, {"_id": 0}).to_list(10000)
        
        total_visitors = len(visitors)
        visitors_updated = 0
        presences_moved = 0
        migration_details = []
        
        for visitor in visitors:
            visitor_id = visitor.get("id")
            presences_dim = visitor.get("presences_dimanche", [])
            presences_jeu = visitor.get("presences_jeudi", [])
            
            if not presences_dim:
                continue
            
            # Séparer les présences dimanche et jeudi
            real_dimanche = []
            real_jeudi = []
            
            for presence in presences_dim:
                date_str = presence.get("date", "")
                if not date_str:
                    real_dimanche.append(presence)
                    continue
                
                try:
                    year, month, day = date_str.split('-')
                    date_obj = datetime(int(year), int(month), int(day))
                    day_of_week = date_obj.weekday()  # 0=Monday, 6=Sunday
                    
                    if day_of_week == 6:  # Sunday
                        real_dimanche.append(presence)
                    else:  # Thursday or other days → jeudi
                        real_jeudi.append(presence)
                        presences_moved += 1
                except Exception as e:
                    # En cas d'erreur, garder dans dimanche
                    real_dimanche.append(presence)
            
            # Si des présences doivent être déplacées
            if real_jeudi:
                visitors_updated += 1
                
                # Fusionner avec les présences jeudi existantes (éviter les doublons)
                existing_jeudi_dates = {p.get("date") for p in presences_jeu}
                for p in real_jeudi:
                    if p.get("date") not in existing_jeudi_dates:
                        presences_jeu.append(p)
                
                # Update visitor
                await db.visitors.update_one(
                    {"id": visitor_id},
                    {
                        "$set": {
                            "presences_dimanche": real_dimanche,
                            "presences_jeudi": presences_jeu
                        }
                    }
                )
                
                visitor_name = f"{visitor.get('firstname', '')} {visitor.get('lastname', '')}"
                migration_details.append({
                    "visitor": visitor_name,
                    "presences_moved": len(real_jeudi)
                })
        
        return {
            "success": True,
            "message": "Migration terminée avec succès",
            "total_visitors": total_visitors,
            "visitors_updated": visitors_updated,
            "presences_moved": presences_moved,
            "details": migration_details[:20]  # Limiter à 20 pour ne pas surcharger la réponse
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la migration: {str(e)}")

# ==================== EVENTS & PROJECTS ENDPOINTS ====================

@api_router.get("/events/projets")
async def get_projets(ville: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Get all projects - filtered by city for non-super_admin"""
    allowed_roles = ["super_admin", "pasteur", "responsable_eglise", "gestion_projet"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = {}
    # Super admin can see all, others only their city
    if current_user["role"] != "super_admin":
        query["ville"] = current_user["city"]
    elif ville:
        query["ville"] = ville
    
    projets = await db.projets.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return projets

@api_router.post("/events/projets")
async def create_projet(projet: ProjetCreate, current_user: dict = Depends(get_current_user)):
    """Create a new project"""
    allowed_roles = ["super_admin", "pasteur", "responsable_eglise", "gestion_projet"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    projet_dict = projet.model_dump()
    projet_dict["id"] = str(uuid.uuid4())
    projet_dict["created_by"] = current_user["username"]
    projet_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    projet_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.projets.insert_one(projet_dict)
    return {"message": "Projet créé avec succès", "id": projet_dict["id"]}

@api_router.get("/events/projets/{projet_id}")
async def get_projet(projet_id: str, current_user: dict = Depends(get_current_user)):
    """Get project details"""
    allowed_roles = ["super_admin", "pasteur", "responsable_eglise", "gestion_projet"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    projet = await db.projets.find_one({"id": projet_id}, {"_id": 0})
    if not projet:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    # Check city access for non-super_admin
    if current_user["role"] != "super_admin" and projet["ville"] != current_user["city"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return projet

@api_router.put("/events/projets/{projet_id}")
async def update_projet(projet_id: str, updates: ProjetUpdate, current_user: dict = Depends(get_current_user)):
    """Update a project"""
    allowed_roles = ["super_admin", "pasteur", "responsable_eglise", "gestion_projet"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    projet = await db.projets.find_one({"id": projet_id})
    if not projet:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    # Check city access
    if current_user["role"] != "super_admin" and projet["ville"] != current_user["city"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_dict = {k: v for k, v in updates.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.projets.update_one({"id": projet_id}, {"$set": update_dict})
    return {"message": "Projet mis à jour"}

@api_router.delete("/events/projets/{projet_id}")
async def delete_projet(projet_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a project"""
    allowed_roles = ["super_admin", "pasteur", "responsable_eglise", "gestion_projet"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    projet = await db.projets.find_one({"id": projet_id})
    if not projet:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    if current_user["role"] != "super_admin" and projet["ville"] != current_user["city"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Delete related data
    await db.taches.delete_many({"projet_id": projet_id})
    await db.commentaires_projet.delete_many({"projet_id": projet_id})
    await db.fichiers_projet.delete_many({"projet_id": projet_id})
    await db.projets.delete_one({"id": projet_id})
    
    return {"message": "Projet supprimé"}

# TÂCHES
@api_router.get("/events/taches")
async def get_taches(projet_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Get tasks"""
    allowed_roles = ["super_admin", "pasteur", "responsable_eglise", "gestion_projet"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = {}
    if projet_id:
        query["projet_id"] = projet_id
    
    taches = await db.taches.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return taches

@api_router.put("/events/projets/{projet_id}/archive")
async def archive_projet(projet_id: str, current_user: dict = Depends(get_current_user)):
    """Archive/Unarchive a project"""
    allowed_roles = ["super_admin", "pasteur", "responsable_eglise", "gestion_projet"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    projet = await db.projets.find_one({"id": projet_id})
    if not projet:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    # Toggle archive status
    is_archived = projet.get("archived", False)
    await db.projets.update_one(
        {"id": projet_id},
        {"$set": {"archived": not is_archived, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Projet archivé" if not is_archived else "Projet désarchivé"}


@api_router.post("/events/taches")
async def create_tache(tache: TacheCreate, current_user: dict = Depends(get_current_user)):
    """Create a task"""
    allowed_roles = ["super_admin", "pasteur", "responsable_eglise", "gestion_projet"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    tache_dict = tache.model_dump()
    tache_dict["id"] = str(uuid.uuid4())
    tache_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    tache_dict["statut"] = "a_faire"
    
    await db.taches.insert_one(tache_dict)
    return {"message": "Tâche créée", "id": tache_dict["id"]}

@api_router.put("/events/taches/{tache_id}")
async def update_tache(tache_id: str, updates: TacheUpdate, current_user: dict = Depends(get_current_user)):
    """Update a task"""
    allowed_roles = ["super_admin", "pasteur", "responsable_eglise", "gestion_projet"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_dict = {k: v for k, v in updates.model_dump().items() if v is not None}
    await db.taches.update_one({"id": tache_id}, {"$set": update_dict})
    return {"message": "Tâche mise à jour"}

@api_router.delete("/events/taches/{tache_id}")
async def delete_tache(tache_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a task"""
    allowed_roles = ["super_admin", "pasteur", "responsable_eglise", "gestion_projet"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.taches.delete_one({"id": tache_id})
    return {"message": "Tâche supprimée"}

# COMMENTAIRES
@api_router.get("/events/commentaires")
async def get_commentaires(projet_id: str, current_user: dict = Depends(get_current_user)):
    """Get project comments"""
    allowed_roles = ["super_admin", "pasteur", "responsable_eglise", "gestion_projet"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    commentaires = await db.commentaires_projet.find(
        {"projet_id": projet_id}, 
        {"_id": 0}
    ).sort("created_at", 1).to_list(1000)
    return commentaires

@api_router.post("/events/commentaires")
async def create_commentaire(commentaire: CommentaireProjetCreate, current_user: dict = Depends(get_current_user)):
    """Add a comment"""
    allowed_roles = ["super_admin", "pasteur", "responsable_eglise", "gestion_projet"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    commentaire_dict = commentaire.model_dump()
    commentaire_dict["id"] = str(uuid.uuid4())
    commentaire_dict["user"] = current_user["username"]
    commentaire_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.commentaires_projet.insert_one(commentaire_dict)
    return {"message": "Commentaire ajouté", "id": commentaire_dict["id"]}

# CAMPAGNES COMMUNICATION
@api_router.get("/events/campagnes")
async def get_campagnes(current_user: dict = Depends(get_current_user)):
    """Get communication campaigns"""
    allowed_roles = ["super_admin", "pasteur", "responsable_eglise", "gestion_projet"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    campagnes = await db.campagnes_communication.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return campagnes

@api_router.post("/events/campagnes")
async def create_campagne(campagne: CampagneCommunicationCreate, current_user: dict = Depends(get_current_user)):
    """Create a communication campaign"""
    allowed_roles = ["super_admin", "pasteur", "responsable_eglise", "gestion_projet"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    campagne_dict = campagne.model_dump()
    campagne_dict["id"] = str(uuid.uuid4())
    campagne_dict["created_by"] = current_user["username"]
    campagne_dict["statut"] = "brouillon"
    campagne_dict["stats"] = {"envoyes": 0, "oui": 0, "non": 0, "peut_etre": 0}
    campagne_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.campagnes_communication.insert_one(campagne_dict)
    return {"message": "Campagne créée", "id": campagne_dict["id"]}

@api_router.put("/events/campagnes/{campagne_id}/archive")
async def archive_campagne(campagne_id: str, current_user: dict = Depends(get_current_user)):
    """Archiver/désarchiver une campagne"""
    allowed_roles = ["super_admin", "pasteur", "responsable_eglise", "gestion_projet"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    campagne = await db.campagnes_communication.find_one({"id": campagne_id})
    if not campagne:
        raise HTTPException(status_code=404, detail="Campagne non trouvée")
    
    # Toggle archived status
    new_status = not campagne.get("archived", False)
    await db.campagnes_communication.update_one(
        {"id": campagne_id},
        {"$set": {"archived": new_status}}
    )
    
    return {"message": "Campagne archivée" if new_status else "Campagne désarchivée"}

@api_router.delete("/events/campagnes/{campagne_id}")
async def delete_campagne(campagne_id: str, current_user: dict = Depends(get_current_user)):
    """Supprimer une campagne"""
    allowed_roles = ["super_admin", "pasteur", "responsable_eglise", "gestion_projet"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.campagnes_communication.delete_one({"id": campagne_id})
    return {"message": "Campagne supprimée"}

@api_router.post("/events/campagnes/{campagne_id}/envoyer")
async def envoyer_campagne(campagne_id: str, current_user: dict = Depends(get_current_user)):
    """Send a communication campaign"""
    allowed_roles = ["super_admin", "pasteur", "responsable_eglise", "gestion_projet"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    campagne = await db.campagnes_communication.find_one({"id": campagne_id})
    if not campagne:
        raise HTTPException(status_code=404, detail="Campagne non trouvée")
    
    # Envoi via Brevo (Email) et/ou Twilio (SMS)
    import sib_api_v3_sdk
    from sib_api_v3_sdk.rest import ApiException
    
    envois_reussis = 0
    
    # Configuration Brevo
    brevo_api_key = os.getenv('BREVO_API_KEY')
    rsvp_enabled = campagne.get('enable_rsvp', False)
    
    if campagne["type"] in ["email", "both"] and brevo_api_key:
        configuration = sib_api_v3_sdk.Configuration()
        configuration.api_key['api-key'] = brevo_api_key
        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
        
        for destinataire in campagne["destinataires"]:
            if not destinataire.get("email"):
                continue
            
            # Personnaliser le message AVANT de créer le HTML
            message = campagne["message"]
            prenom = destinataire.get("prenom", "")
            nom = destinataire.get("nom", "")
            message = message.replace("{prenom}", prenom)
            message = message.replace("{nom}", nom)
            
            # Créer un email HTML avec le logo ICC
            logo_url = "https://customer-assets.emergentagent.com/job_dijon-icc-hub/artifacts/foeikpvk_IMG_2590.png"
            
            # Construire le contenu du message avec l'image en bas
            message_html = message.replace('\n', '<br>')
            
            # Ajouter l'image de la campagne EN BAS du texte si présente
            image_html = ""
            image_url = (campagne.get("image_url") or "").strip()
            if image_url:
                print(f"DEBUG: Ajout image dans email - URL: {image_url[:100]}...")
                image_html = f'''
                <div style="text-align: center; margin-top: 20px; margin-bottom: 20px;">
                    <img src="{image_url}" alt="Affiche" style="max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 0 auto;" />
                </div>
                '''
            else:
                print("DEBUG: Pas d'image_url dans la campagne")
            
            # Ajouter UN SEUL lien RSVP si activé
            rsvp_html = ""
            if rsvp_enabled:
                # Utiliser l'URL depuis REACT_APP_BACKEND_URL mais en remplaçant par le frontend
                backend_url = os.getenv('REACT_APP_BACKEND_URL', 'https://event-church.preview.emergentagent.com')
                # L'URL frontend est la même que le backend (le backend est accessible via /api)
                base_url = backend_url
                contact_identifier = destinataire.get("email")
                rsvp_link = f"{base_url}/rsvp/{campagne_id}?contact={contact_identifier}"
                rsvp_html = f'''
                <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #e0e7ff; border-radius: 8px;">
                    <p style="color: #1e40af; font-weight: bold; margin-bottom: 15px;">📋 Merci de confirmer votre présence</p>
                    <a href="{rsvp_link}" style="display: inline-block; padding: 12px 30px; background-color: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Répondre maintenant
                    </a>
                </div>
                '''
            
            html_content = f'''
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <img src="{logo_url}" alt="ICC BFC-Italie" style="width: 120px; height: 120px; border-radius: 60px; border: 4px solid white;" />
                    <h2 style="color: white; margin-top: 10px;">Impact Centre Chrétien BFC-Italie</h2>
                </div>
                <div style="padding: 30px; background-color: #f9fafb;">
                    {message_html}
                    {image_html}
                    {rsvp_html}
                </div>
                <div style="padding: 20px; text-align: center; background-color: #667eea; color: white; font-size: 12px;">
                    <p>© {datetime.now().year} Impact Centre Chrétien BFC-Italie</p>
                    <p>My Events Church - Gestion d'Événements</p>
                </div>
            </div>
            '''
            
            # Configuration expéditeur depuis .env ou valeurs par défaut
            sender_email = os.environ.get('SENDER_EMAIL', 'impactcentrechretienbfcitalie@gmail.com')
            sender_name = os.environ.get('SENDER_NAME', 'Impact Centre Chrétien BFC-Italie')
            
            send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
                to=[{"email": destinataire.get("email"), "name": f"{destinataire.get('prenom', '')} {destinataire.get('nom', '')}"}],
                subject=campagne["titre"],
                html_content=html_content,
                sender={"name": sender_name, "email": sender_email}
            )
            
            try:
                api_instance.send_transac_email(send_smtp_email)
                envois_reussis += 1
                print(f"✅ Email envoyé à {destinataire.get('email')}")
            except ApiException as e:
                print(f"❌ Erreur envoi email à {destinataire.get('email')}: {str(e)}")
                import traceback
                traceback.print_exc()
    
    # SMS via Brevo
    if campagne["type"] in ["sms", "both"]:
        import sib_api_v3_sdk
        from sib_api_v3_sdk.rest import ApiException
        
        brevo_api_key = os.environ.get('BREVO_API_KEY')
        brevo_sender = os.environ.get('BREVO_SMS_SENDER', '0646989818')
        
        if not brevo_api_key:
            print("Brevo non configuré - SMS ignorés")
        else:
            configuration = sib_api_v3_sdk.Configuration()
            configuration.api_key['api-key'] = brevo_api_key
            api_instance = sib_api_v3_sdk.TransactionalSMSApi(sib_api_v3_sdk.ApiClient(configuration))
            
            for destinataire in campagne["destinataires"]:
                if not destinataire.get("telephone"):
                    continue
                
                # Personnaliser le message
                message = campagne["message"]
                message = message.replace('{prenom}', destinataire.get('prenom', ''))
                message = message.replace('{nom}', destinataire.get('nom', ''))
                
                # Ajouter lien RSVP si activé
                if campagne.get("enable_rsvp"):
                    rsvp_base = f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/rsvp/{campagne_id}"
                    message += f"\n\nRépondez: {rsvp_base}/oui (Oui) | {rsvp_base}/non (Non) | {rsvp_base}/peut_etre (Peut-être)"
                
                # Format phone number (Brevo format: +33XXXXXXXXX)
                phone = destinataire.get("telephone", "").strip()
                if phone.startswith("0"):
                    phone = "+33" + phone[1:]
                elif not phone.startswith("+"):
                    phone = "+33" + phone
                
                try:
                    send_sms = sib_api_v3_sdk.SendTransacSms(
                        sender=brevo_sender,
                        recipient=phone,
                        content=message,
                        type="transactional"
                    )
                    api_instance.send_transac_sms(send_sms)
                    envois_reussis += 1
                except ApiException as e:
                    print(f"Erreur envoi SMS Brevo à {phone}: {e}")
                except Exception as e:
                    print(f"Erreur envoi SMS à {phone}: {e}")
    
    await db.campagnes_communication.update_one(
        {"id": campagne_id},
        {"$set": {
            "statut": "envoye",
            "stats.envoyes": envois_reussis
        }}
    )
    
    return {"message": "Campagne envoyée", "count": envois_reussis}

# RSVP PUBLIC (sans authentification)
@api_router.get("/public/campagne/{campagne_id}")
async def get_public_campagne(campagne_id: str):
    """Récupérer les détails d'une campagne (public)"""
    try:
        campagne = await db.campagnes_communication.find_one(
            {"id": campagne_id},
            {"_id": 0, "titre": 1, "message": 1, "date_envoi": 1, "image_url": 1}
        )
        if not campagne:
            raise HTTPException(status_code=404, detail="Campagne non trouvée")
        return campagne
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/public/rsvp")
async def enregistrer_rsvp(data: dict):
    """Enregistrer une réponse RSVP (endpoint public)"""
    campagne_id = data.get("campagne_id")
    contact = data.get("contact")
    reponse = data.get("reponse")
    
    if not campagne_id or not contact or not reponse:
        raise HTTPException(status_code=400, detail="Données manquantes")
    
    if reponse not in ["oui", "non", "peut_etre"]:
        raise HTTPException(status_code=400, detail="Réponse invalide")
    
    # Vérifier si RSVP existe déjà
    existing = await db.rsvp.find_one({"campagne_id": campagne_id, "$or": [
        {"contact_email": contact},
        {"contact_telephone": contact}
    ]})
    
    if existing:
        # Mettre à jour RSVP existant
        await db.rsvp.update_one(
            {"id": existing["id"]},
            {"$set": {"reponse": reponse, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    else:
        # Créer nouveau RSVP
        rsvp = {
            "id": str(uuid.uuid4()),
            "campagne_id": campagne_id,
            "contact_email": contact if "@" in contact else None,
            "contact_telephone": contact if "@" not in contact else None,
            "reponse": reponse,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.rsvp.insert_one(rsvp)
    
    # Update campaign stats
    campagne = await db.campagnes_communication.find_one({"id": campagne_id})
    if campagne:
        # Recount all RSVPs
        oui_count = await db.rsvp.count_documents({"campagne_id": campagne_id, "reponse": "oui"})
        non_count = await db.rsvp.count_documents({"campagne_id": campagne_id, "reponse": "non"})
        peut_etre_count = await db.rsvp.count_documents({"campagne_id": campagne_id, "reponse": "peut_etre"})
        
        await db.campagnes_communication.update_one(
            {"id": campagne_id},
            {"$set": {
                "stats.oui": oui_count,
                "stats.non": non_count,
                "stats.peut_etre": peut_etre_count
            }}
        )
    

@api_router.post("/events/upload-image")
async def upload_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload an image and save it to backend uploads folder"""
    allowed_roles = ["super_admin", "pasteur", "responsable_eglise", "gestion_projet"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Le fichier doit être une image")
    
    # Generate unique filename
    import hashlib
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_hash = hashlib.md5(file.filename.encode()).hexdigest()[:8]
    extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    new_filename = f"campaign_{timestamp}_{file_hash}.{extension}"
    
    # Save to backend uploads folder (accessible via API)
    upload_dir = "/app/backend/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, new_filename)
    
    # Write file
    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Return API URL (served by backend, accessible publicly)
    backend_url = os.getenv('REACT_APP_BACKEND_URL', 'https://event-church.preview.emergentagent.com')
    public_url = f"{backend_url}/api/uploads/{new_filename}"
    
    return {"image_url": public_url}

@api_router.post("/visitors/upload-photo")
async def upload_visitor_photo(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload photo for a visitor"""
    # Check file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Le fichier doit être une image")
    
    # Generate unique filename
    import hashlib
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_hash = hashlib.md5(file.filename.encode()).hexdigest()[:8]
    extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    new_filename = f"visitor_{timestamp}_{file_hash}.{extension}"
    
    # Save to backend uploads folder
    upload_dir = "/app/backend/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, new_filename)
    
    # Write file
    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Return API URL
    backend_url = os.getenv('REACT_APP_BACKEND_URL', 'https://event-church.preview.emergentagent.com')
    public_url = f"{backend_url}/api/uploads/{new_filename}"
    
    return {"photo_url": public_url}

@api_router.get("/uploads/{filename}")
async def get_uploaded_image(filename: str):
    """Serve uploaded images publicly (no authentication required)"""
    file_path = f"/app/backend/uploads/{filename}"
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Detect MIME type
    mime_type, _ = mimetypes.guess_type(file_path)
    if not mime_type:
        mime_type = "image/jpeg"
    
    return FileResponse(file_path, media_type=mime_type)

    return {"message": "Réponse enregistrée"}

@api_router.get("/events/campagnes/{campagne_id}/rsvp")
async def get_rsvp_stats(campagne_id: str, current_user: dict = Depends(get_current_user)):
    """Get RSVP responses for a campaign"""
    allowed_roles = ["super_admin", "pasteur", "responsable_eglise", "gestion_projet"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    responses = await db.rsvp.find(
        {"campagne_id": campagne_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    return responses

@api_router.delete("/events/rsvp/{reponse_id}")
async def delete_rsvp_response(reponse_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an RSVP response"""
    allowed_roles = ["super_admin", "pasteur", "responsable_eglise", "gestion_projet"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = await db.rsvp.delete_one({"id": reponse_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Réponse non trouvée")
    
    return {"message": "Réponse RSVP supprimée"}


# ==================== RSVP LINKS - STANDALONE EVENTS ====================

@api_router.post("/events")
async def create_event(event: ChurchEventCreate, current_user: dict = Depends(get_current_user)):
    """Create a new event with RSVP link"""
    allowed_roles = ["super_admin", "pasteur", "responsable_eglise", "gestion_projet"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    event_data = event.model_dump()
    event_data["id"] = str(uuid.uuid4())
    event_data["created_by"] = current_user["id"]
    event_data["created_at"] = datetime.now(timezone.utc)
    
    await db.church_events.insert_one(event_data)
    
    return event_data

@api_router.get("/events")
async def get_events(current_user: dict = Depends(get_current_user)):
    """Get all events created by user"""
    allowed_roles = ["super_admin", "pasteur", "responsable_eglise", "gestion_projet"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    events = await db.church_events.find(
        {"created_by": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return events

@api_router.get("/events/{event_id}")
async def get_event(event_id: str):
    """Get a specific event (public access for RSVP page)"""
    event = await db.church_events.find_one({"id": event_id}, {"_id": 0})
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return event

@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an event"""
    allowed_roles = ["super_admin", "pasteur", "responsable_eglise", "gestion_projet"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    result = await db.church_events.delete_one({"id": event_id, "created_by": current_user["id"]})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Also delete associated RSVPs
    await db.event_rsvps.delete_many({"event_id": event_id})
    
    return {"message": "Event deleted"}

@api_router.post("/events/{event_id}/rsvp-public")
async def create_event_rsvp_public(event_id: str, rsvp: EventRSVPCreate):
    """Public endpoint - Submit RSVP for an event"""
    # Verify event exists
    event = await db.church_events.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if not event.get("rsvp_enabled", True):
        raise HTTPException(status_code=400, detail="RSVP not enabled for this event")
    
    # Check max participants
    if event.get("max_participants"):
        current_count = await db.event_rsvps.count_documents({
            "event_id": event_id,
            "status": "confirmed"
        })
        if current_count >= event["max_participants"]:
            raise HTTPException(status_code=400, detail="Event is full")
    
    rsvp_data = rsvp.model_dump()
    rsvp_data["id"] = str(uuid.uuid4())
    rsvp_data["event_id"] = event_id
    rsvp_data["created_at"] = datetime.now(timezone.utc)
    
    await db.event_rsvps.insert_one(rsvp_data)
    
    return {"message": "RSVP submitted", "id": rsvp_data["id"]}

@api_router.get("/events/{event_id}/rsvp")
async def get_event_rsvps(event_id: str, current_user: dict = Depends(get_current_user)):
    """Get all RSVPs for an event with statistics"""
    allowed_roles = ["super_admin", "pasteur", "responsable_eglise", "gestion_projet"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Verify event belongs to user
    event = await db.church_events.find_one({"id": event_id, "created_by": current_user["id"]})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    rsvps = await db.event_rsvps.find({"event_id": event_id}, {"_id": 0}).to_list(1000)
    
    # Calculate stats
    total = len(rsvps)
    confirmed = len([r for r in rsvps if r.get("status") == "confirmed"])
    declined = len([r for r in rsvps if r.get("status") == "declined"])
    maybe = len([r for r in rsvps if r.get("status") == "maybe"])
    
    return {
        "total": total,
        "confirmed": confirmed,
        "declined": declined,
        "maybe": maybe,
        "responses": rsvps
    }

@api_router.post("/upload-event-image")
async def upload_event_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload an image for an event"""
    allowed_roles = ["super_admin", "pasteur", "responsable_eglise", "gestion_projet"]
    if current_user["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate unique filename
    import hashlib
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_hash = hashlib.md5(file.filename.encode()).hexdigest()[:8]
    extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    new_filename = f"event_{timestamp}_{file_hash}.{extension}"
    
    # Save to uploads folder
    upload_dir = "/app/backend/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, new_filename)
    
    # Write file
    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Return public URL
    backend_url = os.getenv('REACT_APP_BACKEND_URL', 'https://event-church.preview.emergentagent.com')
    public_url = f"{backend_url}/api/uploads/{new_filename}"
    
    return {"image_url": public_url}

# ==================== CONTACT GROUPS (BOXES) ====================

class ContactGroup(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    contacts: List[Dict[str, str]]
    created_by: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

@api_router.get("/contact-groups")
async def get_contact_groups(user: dict = Depends(get_current_user)):
    """Récupérer toutes les boxes de contacts"""
    try:
        groups = await db.contact_groups.find(
            {}, 
            {"_id": 0}
        ).to_list(1000)
        return groups
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/contact-groups")
async def create_contact_group(group: ContactGroup, user: dict = Depends(get_current_user)):
    """Créer une nouvelle box de contacts"""
    try:
        group_dict = group.model_dump()
        group_dict["created_by"] = user["username"]
        await db.contact_groups.insert_one(group_dict)
        return {"message": "Box créée", "id": group.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/contact-groups/{group_id}")
async def delete_contact_group(group_id: str, user: dict = Depends(get_current_user)):
    """Supprimer une box de contacts"""
    try:
        await db.contact_groups.delete_one({"id": group_id})
        return {"message": "Box supprimée"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== CONTACT GROUPS SMS ====================

@api_router.get("/contact-groups-sms")
async def get_contact_groups_sms(user: dict = Depends(get_current_user)):
    """Récupérer toutes les boxes SMS"""
    try:
        groups = await db.contact_groups_sms.find(
            {}, 
            {"_id": 0}
        ).to_list(1000)
        return groups
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/contact-groups-sms")
async def create_contact_group_sms(group: ContactGroup, user: dict = Depends(get_current_user)):
    """Créer une nouvelle box SMS"""
    try:
        group_dict = group.model_dump()
        group_dict["created_by"] = user["username"]
        await db.contact_groups_sms.insert_one(group_dict)
        return {"message": "Box SMS créée", "id": group.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/contact-groups-sms/{group_id}")
async def delete_contact_group_sms(group_id: str, user: dict = Depends(get_current_user)):
    """Supprimer une box SMS"""
    try:
        await db.contact_groups_sms.delete_one({"id": group_id})
        return {"message": "Box SMS supprimée"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== PLANNING DES ACTIVITÉS ====================

class PlanningActivite(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nom: str
    annee: int  # Année du planning (2025-2035)
    semestre: int  # 1 ou 2
    date_debut: str  # Date de début
    date_fin: str  # Date de fin
    date: Optional[str] = None  # DEPRECATED - Pour compatibilité
    ministeres: str  # Texte libre au lieu de List[str]
    statut: str  # "À venir", "Reporté", "Annulé", "Fait"
    commentaire: str = ""
    ville: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

@api_router.get("/planning/activites")
async def get_activites_planning(ville: str, annee: Optional[int] = None, user: dict = Depends(get_current_user)):
    """Récupérer toutes les activités pour une ville et une année"""
    try:
        query = {"ville": ville}
        if annee:
            query["annee"] = annee
        
        activites = await db.planning_activites.find(
            query, 
            {"_id": 0}
        ).sort([("semestre", 1), ("date_debut", 1)]).to_list(1000)
        return activites
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/planning/activites")
async def create_activite(activite: PlanningActivite, user: dict = Depends(get_current_user)):
    """Créer une nouvelle activité"""
    try:
        activite_dict = activite.model_dump()
        activite_dict["created_by"] = user["username"]
        await db.planning_activites.insert_one(activite_dict)
        return {"message": "Activité créée", "id": activite.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/planning/activites/{activite_id}")
async def update_activite(activite_id: str, activite: PlanningActivite, user: dict = Depends(get_current_user)):
    """Modifier une activité existante"""
    try:
        activite_dict = activite.model_dump()
        activite_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.planning_activites.update_one(
            {"id": activite_id},
            {"$set": activite_dict}
        )
        return {"message": "Activité mise à jour"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/planning/activites/{activite_id}")
async def delete_activite(activite_id: str, user: dict = Depends(get_current_user)):
    """Supprimer une activité"""
    try:
        await db.planning_activites.delete_one({"id": activite_id})
        return {"message": "Activité supprimée"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

@app.on_event("startup")
async def startup_initialize_cities():
    """Initialize cities automatically on startup - ALWAYS update countries"""
    try:
        print("🏙️ Initializing cities system...")
        
        # Clean up invalid cities (with null or empty name)
        deleted = await db.cities.delete_many({'$or': [{'name': None}, {'name': ''}]})
        if deleted.deleted_count > 0:
            print(f"🗑️ Cleaned {deleted.deleted_count} invalid cities")
        
        # Define cities with countries
        cities_mapping = {
            'Milan': 'Italie',
            'Rome': 'Italie', 
            'Perugia': 'Italie',
            'Bologne': 'Italie',
            'Turin': 'Italie',
            'Dijon': 'France',
            'Auxerre': 'France',
            'Besançon': 'France',
            'Chalon-Sur-Saone': 'France',
            'Dole': 'France',
            'Sens': 'France'
        }
        
        # ALWAYS update or create each city (not just when count is 0)
        created = 0
        updated = 0
        
        for city_name, country in cities_mapping.items():
            # Check if city exists (case-insensitive)
            existing = await db.cities.find_one({'name': {'$regex': f'^{city_name}$', '$options': 'i'}})
            
            if existing:
                # Update existing city - FORCE country update
                result = await db.cities.update_one(
                    {'_id': existing['_id']},
                    {'$set': {'country': country}}
                )
                if result.modified_count > 0:
                    updated += 1
                    print(f"  ✅ {city_name} → {country}")
            else:
                # Create new city
                new_city = {
                    'id': str(uuid.uuid4()),
                    'name': city_name,
                    'country': country
                }
                await db.cities.insert_one(new_city)
                created += 1
                print(f"  ➕ {city_name} → {country} (created)")
        
        total_cities = await db.cities.count_documents({})
        print(f"✅ Cities initialized: {created} created, {updated} updated, {total_cities} total")
        
    except Exception as e:
        print(f"⚠️ Warning: Could not initialize cities: {e}")
        import traceback
        traceback.print_exc()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# ==================== EVANGELISATION MODELS ====================

class EvangelisationData(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    type: str  # "eglise" or "familles_impact"
    nombre_gagneurs_ame: int = 0
    nombre_personnes_receptives: int = 0
    nombre_priere_salut: int = 0
    nombre_contacts_pris: int = 0
    nombre_ames_invitees: int = 0
    nombre_miracles: int = 0
    commentaire: Optional[str] = None

class EvangelisationRecord(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str
    ville: str
    created_by: str
    eglise: Optional[EvangelisationData] = None
    familles_impact: Optional[EvangelisationData] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ==================== EVANGELISATION ENDPOINTS ====================

@api_router.post("/evangelisation")
async def create_evangelisation_record(record: EvangelisationRecord, current_user: dict = Depends(get_current_user)):
    """Create evangelisation record"""
    if current_user["role"] not in ["responsable_evangelisation", "super_admin", "pasteur", "responsable_eglise"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Set ville and created_by
    record.ville = current_user.get("city", record.ville)
    record.created_by = current_user["username"]
    
    # Convert to dict and save
    record_dict = record.model_dump()
    await db.evangelisation.insert_one(record_dict)
    
    return {"message": "Record created successfully", "id": record.id}

@api_router.get("/evangelisation")
async def get_evangelisation_records(
    ville: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get evangelisation records with filters"""
    if current_user["role"] not in ["responsable_evangelisation", "super_admin", "pasteur", "responsable_eglise"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    query = {}
    
    # Filter by ville
    if current_user["role"] in ["responsable_eglise", "responsable_evangelisation"]:
        query["ville"] = current_user.get("city")
    elif ville:
        query["ville"] = ville
    
    # Date filters
    if date_from and date_to:
        query["date"] = {"$gte": date_from, "$lte": date_to}
    elif date_from:
        query["date"] = {"$gte": date_from}
    elif date_to:
        query["date"] = {"$lte": date_to}
    
    records = await db.evangelisation.find(query, {"_id": 0}).to_list(1000)
    return records

@api_router.get("/evangelisation/stats")
async def get_evangelisation_stats(
    ville: Optional[str] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get evangelisation statistics"""
    if current_user["role"] not in ["super_admin", "pasteur", "responsable_eglise"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    query = {}
    
    # Filter by ville
    if current_user["role"] == "responsable_eglise":
        query["ville"] = current_user.get("city")
    elif ville:
        query["ville"] = ville
    
    # Date filters
    if year and month:
        query["date"] = {"$regex": f"^{year}-{month:02d}"}
    elif year:
        query["date"] = {"$regex": f"^{year}"}
    
    records = await db.evangelisation.find(query).to_list(1000)
    
    # Calculate totals
    stats = {
        "eglise": {
            "nombre_gagneurs_ame": 0,
            "nombre_personnes_receptives": 0,
            "nombre_priere_salut": 0,
            "nombre_contacts_pris": 0,
            "nombre_ames_invitees": 0,
            "nombre_miracles": 0
        },
        "familles_impact": {
            "nombre_gagneurs_ame": 0,
            "nombre_personnes_receptives": 0,
            "nombre_priere_salut": 0,
            "nombre_contacts_pris": 0,
            "nombre_ames_invitees": 0,
            "nombre_miracles": 0
        },
        "total_records": len(records)
    }
    
    for record in records:
        if record.get("eglise"):
            for key in stats["eglise"]:
                stats["eglise"][key] += record["eglise"].get(key, 0)
        
        if record.get("familles_impact"):
            for key in stats["familles_impact"]:
                stats["familles_impact"][key] += record["familles_impact"].get(key, 0)
    
    return stats


