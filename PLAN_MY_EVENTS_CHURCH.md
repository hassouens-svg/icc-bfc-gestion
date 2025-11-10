# 📅 Plan Complet : My Events Church

## 🎯 Vue d'ensemble

Système de gestion d'événements d'église avec :
- 📅 Planning événements à venir
- 🖼️ Affiches/images
- ✅ Statut (fait/pas fait)
- 📱 Notifications SMS automatiques avant l'événement
- 👥 Gestion des participants avec numéros de téléphone

---

## 📋 Spécifications Fonctionnelles

### **Fonctionnalités Principales**

1. **Créer un événement**
   - Titre
   - Description
   - Date et heure
   - Lieu
   - Ville
   - Affiche (upload image)
   - Responsable
   - Liste de numéros de téléphone (participants)

2. **Visualiser les événements**
   - Vue calendrier
   - Vue liste
   - Filtrer par ville, statut, date

3. **Gérer statut**
   - À venir (orange)
   - En cours (bleu)
   - Terminé (vert)
   - Annulé (rouge)

4. **Notifications SMS automatiques**
   - 7 jours avant : "Il reste 7 jours pour [Événement]"
   - 3 jours avant : "Il reste 3 jours pour [Événement]"
   - 1 jour avant : "C'est demain : [Événement]"
   - Jour J : "C'est aujourd'hui : [Événement]"

5. **Permissions**
   - Super Admin : Tout gérer
   - Superviseur : Créer/Modifier événements de sa ville
   - Accueil : Voir événements de sa ville
   - Public : Voir événements publics

---

## 🗄️ Modèle de Données (Backend)

### **Collection : `events`**

```python
class EventStatus(str, Enum):
    upcoming = "upcoming"      # À venir
    ongoing = "ongoing"        # En cours
    completed = "completed"    # Terminé
    cancelled = "cancelled"    # Annulé

class Event(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Informations de base
    title: str
    description: str
    date: str  # ISO format YYYY-MM-DD
    time: str  # HH:MM
    location: str  # Lieu physique
    ville: str
    
    # Média
    poster_url: Optional[str] = None  # URL de l'affiche
    
    # Organisation
    responsable: str  # Username du responsable
    category: str = "general"  # culte, formation, jeunesse, etc.
    
    # Participants & Notifications
    phone_numbers: List[str] = []  # Liste numéros pour SMS
    participant_count: int = 0
    
    # Statut
    status: EventStatus = EventStatus.upcoming
    is_public: bool = True  # Visible par tous ou membres seulement
    
    # Notifications envoyées (tracking)
    notifications_sent: Dict[str, bool] = {
        "7_days": False,
        "3_days": False,
        "1_day": False,
        "day_of": False
    }
    
    # Métadonnées
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class EventCreate(BaseModel):
    title: str
    description: str
    date: str
    time: str
    location: str
    ville: str
    poster_url: Optional[str] = None
    responsable: str
    category: str = "general"
    phone_numbers: List[str] = []
    is_public: bool = True

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    location: Optional[str] = None
    poster_url: Optional[str] = None
    responsable: Optional[str] = None
    phone_numbers: Optional[List[str]] = None
    status: Optional[EventStatus] = None
    is_public: Optional[bool] = None
```

---

## 🔧 Backend API Endpoints

### **CRUD Events**

```python
# Créer événement
@api_router.post("/events")
async def create_event(
    event_data: EventCreate, 
    current_user: dict = Depends(get_current_user)
):
    # Permissions : super_admin, superviseur, responsable
    if current_user["role"] not in ["super_admin", "superviseur_promos", "superviseur_fi"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    event = Event(
        **event_data.model_dump(),
        created_by=current_user["username"]
    )
    
    doc = event.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.events.insert_one(doc)
    
    return {"message": "Event created", "id": event.id}

# Lister événements
@api_router.get("/events")
async def get_events(
    ville: str = None,
    status: str = None,
    start_date: str = None,
    end_date: str = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    
    # Filtrer par ville si pas super_admin
    if current_user["role"] != "super_admin":
        query["ville"] = current_user["city"]
    elif ville:
        query["ville"] = ville
    
    # Filtrer par statut
    if status:
        query["status"] = status
    
    # Filtrer par date
    if start_date:
        query["date"] = {"$gte": start_date}
    if end_date:
        if "date" in query:
            query["date"]["$lte"] = end_date
        else:
            query["date"] = {"$lte": end_date}
    
    events = await db.events.find(query, {"_id": 0}).to_list(1000)
    return events

# Obtenir un événement
@api_router.get("/events/{event_id}")
async def get_event(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

# Mettre à jour événement
@api_router.put("/events/{event_id}")
async def update_event(
    event_id: str,
    event_data: EventUpdate,
    current_user: dict = Depends(get_current_user)
):
    event = await db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Permissions
    if current_user["role"] != "super_admin" and event["created_by"] != current_user["username"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in event_data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if event_data.status == "completed":
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.events.update_one({"id": event_id}, {"$set": update_data})
    return {"message": "Event updated"}

# Supprimer événement
@api_router.delete("/events/{event_id}")
async def delete_event(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    # Seul super_admin peut supprimer
    if current_user["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Only super admin can delete")
    
    result = await db.events.delete_one({"id": event_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return {"message": "Event deleted"}

# Upload affiche
@api_router.post("/events/{event_id}/upload-poster")
async def upload_poster(
    event_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    # Valider format image
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Sauvegarder fichier (dans /static/posters/)
    import os
    poster_dir = "/app/static/posters"
    os.makedirs(poster_dir, exist_ok=True)
    
    file_extension = file.filename.split(".")[-1]
    filename = f"{event_id}.{file_extension}"
    file_path = os.path.join(poster_dir, filename)
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    poster_url = f"/static/posters/{filename}"
    
    # Mettre à jour event
    await db.events.update_one(
        {"id": event_id},
        {"$set": {"poster_url": poster_url}}
    )
    
    return {"poster_url": poster_url}
```

---

## 📱 Service de Notification SMS

### **Option 1 : Twilio (Recommandé)**

**Installation** :
```bash
pip install twilio
```

**Configuration** :
```python
# /app/backend/.env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+33123456789
```

**Code Service** :
```python
# /app/backend/sms_service.py
from twilio.rest import Client
import os

class SMSService:
    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.from_number = os.getenv("TWILIO_PHONE_NUMBER")
        self.client = Client(self.account_sid, self.auth_token)
    
    def send_sms(self, to_number: str, message: str):
        """Envoyer un SMS à un numéro"""
        try:
            message = self.client.messages.create(
                body=message,
                from_=self.from_number,
                to=to_number
            )
            return {"success": True, "sid": message.sid}
        except Exception as e:
            print(f"Error sending SMS: {e}")
            return {"success": False, "error": str(e)}
    
    def send_bulk_sms(self, phone_numbers: list, message: str):
        """Envoyer SMS à plusieurs numéros"""
        results = []
        for number in phone_numbers:
            result = self.send_sms(number, message)
            results.append({"number": number, **result})
        return results

# Instance globale
sms_service = SMSService()
```

### **Option 2 : OVH SMS (Europe)**

Plus économique pour l'Europe, configuration similaire.

---

## ⏰ Système de Notifications Automatiques

### **Cron Job Backend (APScheduler)**

**Installation** :
```bash
pip install apscheduler
```

**Code Scheduler** :
```python
# /app/backend/event_scheduler.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os

scheduler = AsyncIOScheduler()

async def check_upcoming_events():
    """Vérifier les événements et envoyer notifications"""
    db = AsyncIOMotorClient(os.getenv("MONGO_URL")).get_database()
    today = datetime.now().date()
    
    # Chercher événements à venir
    events = await db.events.find({
        "status": "upcoming",
        "date": {"$gte": today.isoformat()}
    }).to_list(1000)
    
    for event in events:
        event_date = datetime.fromisoformat(event["date"]).date()
        days_until = (event_date - today).days
        
        # 7 jours avant
        if days_until == 7 and not event["notifications_sent"].get("7_days"):
            message = f"🔔 Rappel : Il reste 7 jours pour '{event['title']}' le {event['date']} à {event['time']}. Lieu : {event['location']}"
            send_event_notifications(event, message)
            await db.events.update_one(
                {"id": event["id"]},
                {"$set": {"notifications_sent.7_days": True}}
            )
        
        # 3 jours avant
        elif days_until == 3 and not event["notifications_sent"].get("3_days"):
            message = f"🔔 Rappel : Plus que 3 jours pour '{event['title']}' le {event['date']} à {event['time']}. Lieu : {event['location']}"
            send_event_notifications(event, message)
            await db.events.update_one(
                {"id": event["id"]},
                {"$set": {"notifications_sent.3_days": True}}
            )
        
        # 1 jour avant
        elif days_until == 1 and not event["notifications_sent"].get("1_day"):
            message = f"🔔 C'est demain ! '{event['title']}' le {event['date']} à {event['time']}. Lieu : {event['location']}"
            send_event_notifications(event, message)
            await db.events.update_one(
                {"id": event["id"]},
                {"$set": {"notifications_sent.1_day": True}}
            )
        
        # Jour J
        elif days_until == 0 and not event["notifications_sent"].get("day_of"):
            message = f"🔔 C'est aujourd'hui ! '{event['title']}' à {event['time']}. Lieu : {event['location']}. À tout de suite !"
            send_event_notifications(event, message)
            await db.events.update_one(
                {"id": event["id"]},
                {"$set": {"notifications_sent.day_of": True, "status": "ongoing"}}
            )

def send_event_notifications(event, message):
    """Envoyer notifications SMS pour un événement"""
    from sms_service import sms_service
    phone_numbers = event.get("phone_numbers", [])
    if phone_numbers:
        sms_service.send_bulk_sms(phone_numbers, message)

def start_scheduler():
    """Démarrer le scheduler"""
    # Vérifier tous les jours à 9h00
    scheduler.add_job(
        check_upcoming_events,
        'cron',
        hour=9,
        minute=0
    )
    scheduler.start()
    print("✅ Event scheduler started")
```

**Intégration dans server.py** :
```python
# /app/backend/server.py
from event_scheduler import start_scheduler

@app.on_event("startup")
async def startup_event():
    start_scheduler()
```

---

## 🎨 Frontend - Pages & Composants

### **Page : MyEventsPage.jsx**

**Route** : `/my-events`

**Fonctionnalités** :
- Vue calendrier (react-big-calendar)
- Vue liste avec filtres
- Carte événement avec affiche
- Boutons : Créer, Modifier, Supprimer, Marquer terminé

**Structure** :
```jsx
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const MyEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [view, setView] = useState('calendar'); // 'calendar' ou 'list'
  const [filterVille, setFilterVille] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // ... logique
  
  return (
    <Layout>
      {/* Header avec boutons */}
      {/* Filtres */}
      {/* Vue calendrier OU vue liste */}
      {/* Modal création/édition */}
    </Layout>
  );
};
```

### **Composant : EventCard.jsx**

```jsx
const EventCard = ({ event, canEdit, onEdit, onDelete, onComplete }) => {
  const daysUntil = calculateDaysUntil(event.date);
  
  return (
    <Card>
      {/* Affiche */}
      {event.poster_url && (
        <img src={event.poster_url} alt={event.title} />
      )}
      
      {/* Infos */}
      <CardHeader>
        <CardTitle>{event.title}</CardTitle>
        <Badge color={getStatusColor(event.status)}>
          {getStatusLabel(event.status)}
        </Badge>
      </CardHeader>
      
      <CardContent>
        <p>{event.description}</p>
        <div>📅 {event.date} à {event.time}</div>
        <div>📍 {event.location}, {event.ville}</div>
        <div>👤 {event.responsable}</div>
        <div>📱 {event.phone_numbers.length} participants</div>
        
        {daysUntil > 0 && (
          <Alert>⏰ Dans {daysUntil} jour(s)</Alert>
        )}
      </CardContent>
      
      {canEdit && (
        <CardFooter>
          <Button onClick={onEdit}>Modifier</Button>
          <Button onClick={onComplete}>Marquer terminé</Button>
          <Button variant="destructive" onClick={onDelete}>Supprimer</Button>
        </CardFooter>
      )}
    </Card>
  );
};
```

### **Modal : CreateEventModal.jsx**

```jsx
const CreateEventModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    ville: '',
    responsable: '',
    category: 'general',
    phone_numbers: [],
    is_public: true
  });
  
  const [posterFile, setPosterFile] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Créer événement
    const event = await createEvent(formData);
    
    // Upload affiche si présente
    if (posterFile) {
      await uploadEventPoster(event.id, posterFile);
    }
    
    onSubmit();
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Créer un événement</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Titre */}
          <Input
            label="Titre"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
          />
          
          {/* Description */}
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
          />
          
          {/* Date et Heure */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              required
            />
            <Input
              label="Heure"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({...formData, time: e.target.value})}
              required
            />
          </div>
          
          {/* Lieu et Ville */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Lieu"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              required
            />
            <Select
              label="Ville"
              value={formData.ville}
              onChange={(e) => setFormData({...formData, ville: e.target.value})}
            >
              <option value="">Sélectionner...</option>
              <option value="Dijon">Dijon</option>
              <option value="Milan">Milan</option>
              {/* ... */}
            </Select>
          </div>
          
          {/* Affiche */}
          <div>
            <label>Affiche (optionnel)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPosterFile(e.target.files[0])}
            />
          </div>
          
          {/* Numéros de téléphone */}
          <PhoneNumbersInput
            value={formData.phone_numbers}
            onChange={(numbers) => setFormData({...formData, phone_numbers: numbers})}
          />
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit">Créer l'événement</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
```

---

## 📊 Intégration dans l'App

### **1. Ajouter la route**

```jsx
// /app/frontend/src/App.js
import MyEventsPage from './pages/MyEventsPage';

<Route path="/my-events" element={<MyEventsPage />} />
```

### **2. Ajouter dans la navigation**

```jsx
// /app/frontend/src/components/Layout.jsx
{ 
  path: '/my-events', 
  label: 'Événements', 
  icon: Calendar, 
  roles: ['super_admin', 'superviseur_promos', 'superviseur_fi', 'accueil', 'pasteur'],
  department: null 
}
```

---

## 💰 Coûts SMS (Twilio)

| Destination | Coût par SMS |
|-------------|--------------|
| France | ~0.08 € |
| Italie | ~0.08 € |
| Europe | ~0.07-0.10 € |

**Exemple** : 
- 50 événements/an
- 30 participants/événement
- 4 notifications/événement
- **Total** : 50 × 30 × 4 = 6000 SMS/an ≈ **480 €/an**

**Alternative** : WhatsApp Business API (moins cher pour volume élevé)

---

## ⏱️ Timeline d'Implémentation

| Phase | Durée | Tâches |
|-------|-------|--------|
| **Phase 1 : Backend** | 2 jours | Modèle Event, endpoints CRUD, upload image |
| **Phase 2 : Frontend** | 3 jours | Pages, composants, formulaires |
| **Phase 3 : SMS** | 1 jour | Service Twilio, intégration |
| **Phase 4 : Scheduler** | 1 jour | Cron job, notifications auto |
| **Phase 5 : Tests** | 1 jour | Test complet, ajustements |
| **TOTAL** | **8 jours** | - |

---

## ✅ Checklist d'Implémentation

### Backend
- [ ] Créer modèle Event dans server.py
- [ ] Endpoints CRUD events
- [ ] Upload affiche (POST /events/{id}/upload-poster)
- [ ] Service SMS (sms_service.py)
- [ ] Scheduler notifications (event_scheduler.py)
- [ ] Intégration scheduler dans startup

### Frontend
- [ ] Installer react-big-calendar : `yarn add react-big-calendar moment`
- [ ] Page MyEventsPage.jsx
- [ ] Composant EventCard.jsx
- [ ] Modal CreateEventModal.jsx
- [ ] Composant PhoneNumbersInput.jsx
- [ ] API client functions (utils/api.js)
- [ ] Ajouter route dans App.js
- [ ] Ajouter navigation dans Layout.jsx

### Configuration
- [ ] Créer compte Twilio
- [ ] Ajouter variables env (.env)
- [ ] Créer dossier /static/posters/
- [ ] Tester SMS en développement

### Tests
- [ ] Créer événement
- [ ] Upload affiche
- [ ] Voir calendrier et liste
- [ ] Filtrer par ville/statut
- [ ] Marquer terminé
- [ ] Tester notifications (mock dates)

---

## 🎉 Résultat Final

Une fois implémenté, vous aurez :
- ✅ **Calendrier visuel** des événements
- ✅ **Gestion complète** (CRUD) des événements
- ✅ **Upload d'affiches** pour chaque événement
- ✅ **Notifications SMS automatiques** aux participants
- ✅ **Statuts** et suivi d'événements
- ✅ **Multi-villes** avec permissions

**Les membres recevront automatiquement des rappels SMS pour ne jamais manquer un événement ! 📱**

---

**Voulez-vous que je commence l'implémentation maintenant ?** 🚀
