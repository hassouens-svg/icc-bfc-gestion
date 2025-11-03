from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from passlib.context import CryptContext
import jwt
from jwt.exceptions import InvalidTokenError
import io
import pandas as pd
from fastapi.responses import StreamingResponse

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-change-in-production")
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

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password: str  # hashed
    city: str
    role: str  # admin, referent, accueil, promotion
    assigned_month: Optional[str] = None  # For referents: "2025-01"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    password: str
    city: str
    role: str
    assigned_month: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str
    city: str
    department: Optional[str] = None  # "accueil" or "promotion"

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
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
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
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    arrival_channel: str
    visit_date: str

class VisitorUpdate(BaseModel):
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    phone: Optional[str] = None
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

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

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
    
    # If department is specified, use it; otherwise use user's default role
    final_role = user["role"]
    if user_login.department:
        # Map department choices to roles
        dept_to_role = {
            "accueil": "accueil",
            "integration": "integration",
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
            "assigned_month": user.get("assigned_month")
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
    if current_user["role"] not in ["admin", "promotions"]:
        raise HTTPException(status_code=403, detail="Only admin can create referents")
    
    # Check if username already exists in this city
    existing = await db.users.find_one({
        "username": user_data.username,
        "city": user_data.city
    })
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists in this city")
    
    # Hash password
    hashed_pw = hash_password(user_data.password)
    user = User(**user_data.model_dump(), password=hashed_pw)
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    return {"message": "Referent created successfully", "id": user.id}

@api_router.get("/users/referents")
async def get_referents(current_user: dict = Depends(get_current_user)):
    # Get all referents in current user's city
    referents = await db.users.find({
        "city": current_user["city"],
        "role": {"$in": ["referent", "accueil", "integration", "promotions"]}
    }, {"_id": 0, "password": 0}).to_list(1000)
    
    return referents

# ==================== VISITOR ROUTES ====================

@api_router.post("/visitors")
async def create_visitor(visitor_data: VisitorCreate, current_user: dict = Depends(get_current_user)):
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
async def get_visitors(current_user: dict = Depends(get_current_user)):
    query = {
        "city": current_user["city"],
        "tracking_stopped": False
    }
    
    # Filter by role
    if current_user["role"] == "referent":
        # Referents see only their assigned month
        query["assigned_month"] = current_user.get("assigned_month")
    
    visitors = await db.visitors.find(query, {"_id": 0}).to_list(10000)
    
    # For "accueil" and "integration" roles, return limited info
    if current_user["role"] in ["accueil", "integration"]:
        return [{
            "id": v["id"], 
            "firstname": v["firstname"], 
            "lastname": v["lastname"],
            "arrival_channel": v.get("arrival_channel", ""),
            "city": v["city"]
        } for v in visitors]
    
    return visitors

@api_router.get("/visitors/stopped")
async def get_stopped_visitors(current_user: dict = Depends(get_current_user)):
    # Only admin and promotions can see stopped visitors
    if current_user["role"] not in ["admin", "promotions"]:
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
    
    # Accueil and integration can't see details
    if current_user["role"] in ["accueil", "integration"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return visitor

@api_router.put("/visitors/{visitor_id}")
async def update_visitor(visitor_id: str, update_data: VisitorUpdate, current_user: dict = Depends(get_current_user)):
    visitor = await db.visitors.find_one({"id": visitor_id, "city": current_user["city"]})
    
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    
    # Update only provided fields
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if update_dict:
        await db.visitors.update_one({"id": visitor_id}, {"$set": update_dict})
    
    return {"message": "Visitor updated successfully"}

@api_router.post("/visitors/{visitor_id}/comment")
async def add_comment(visitor_id: str, comment: CommentAdd, current_user: dict = Depends(get_current_user)):
    visitor = await db.visitors.find_one({"id": visitor_id, "city": current_user["city"]})
    
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    
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
    if current_user["role"] not in ["admin", "promotions"]:
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

# ==================== ANALYTICS ROUTES ====================

@api_router.get("/analytics/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    city = current_user["city"]
    
    # Total visitors (not stopped)
    total_visitors = await db.visitors.count_documents({"city": city, "tracking_stopped": False})
    
    # Total referents
    total_referents = await db.users.count_documents({"city": city, "role": {"$in": ["referent", "accueil", "promotion"]}})
    
    # By arrival channel
    pipeline = [
        {"$match": {"city": city, "tracking_stopped": False}},
        {"$group": {"_id": "$arrival_channel", "count": {"$sum": 1}}}
    ]
    by_channel = await db.visitors.aggregate(pipeline).to_list(1000)
    
    # By month
    pipeline = [
        {"$match": {"city": city, "tracking_stopped": False}},
        {"$group": {"_id": "$assigned_month", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    by_month = await db.visitors.aggregate(pipeline).to_list(1000)
    
    # By type
    pipeline = [
        {"$match": {"city": city, "tracking_stopped": False}},
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
    if current_user["role"] not in ["admin", "promotions"]:
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
    
    # Create default admin for Dijon
    existing_admin = await db.users.find_one({"username": "admin", "city": "Dijon"})
    if not existing_admin:
        admin = User(
            username="admin",
            password=hash_password("admin123"),
            city="Dijon",
            role="admin"
        )
        doc = admin.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.users.insert_one(doc)
    
    return {"message": "Initialization complete"}

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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
