"""
Pain du Jour - Standalone Backend
Application de méditation quotidienne pour ICC BFC-ITALIE
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Dict
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import os
import re
import uuid

# Configuration
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "pain_du_jour")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

# MongoDB Client
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# FastAPI App
app = FastAPI(
    title="Pain du Jour API",
    description="API pour l'application de méditation quotidienne",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ PYDANTIC MODELS ============

class PainDuJourContent(BaseModel):
    date: str
    lien_priere: Optional[str] = None
    titre_priere: Optional[str] = None
    thumbnail_priere: Optional[str] = None
    duration_priere: Optional[str] = None
    lien_enseignement: Optional[str] = None
    titre_enseignement: Optional[str] = None
    thumbnail_enseignement: Optional[str] = None
    duration_enseignement: Optional[str] = None
    versets: Optional[List[Dict]] = []
    resume: Optional[Dict] = None
    quiz: Optional[List[Dict]] = None
    created_by: Optional[str] = None
    created_at: Optional[str] = None

class PainDuJourProgrammation(BaseModel):
    semaine: str
    jours: Dict
    created_by: Optional[str] = None
    created_at: Optional[str] = None

class QuizSubmission(BaseModel):
    date: str
    answers: List[int]
    score: int

class SondagePainDuJour(BaseModel):
    date: str
    lecture_reponse: str
    video_reponse: str

class ClickTrack(BaseModel):
    type: str
    date: str

class YouTubeVideoRequest(BaseModel):
    url: str

class LoginRequest(BaseModel):
    username: str
    password: str

class FetchTranscriptionRequest(BaseModel):
    youtube_url: str

class GenerateResumeQuizRequest(BaseModel):
    transcription: str
    titre_message: str
    minute_debut: int = 0

# ============ AUTH (Simple) ============

ADMIN_USERS = {
    "superadmin": {"password": "superadmin123", "role": "super_admin"},
    "pasteur": {"password": "pasteur123", "role": "pasteur"},
    "admin": {"password": "admin123", "role": "gestion_projet"}
}

@app.post("/api/auth/login")
async def login(request: LoginRequest):
    user = ADMIN_USERS.get(request.username)
    if not user or user["password"] != request.password:
        raise HTTPException(status_code=401, detail="Identifiants invalides")
    
    return {
        "token": f"token_{request.username}_{uuid.uuid4()}",
        "user": {
            "username": request.username,
            "role": user["role"]
        }
    }

def get_current_user_optional(authorization: str = None):
    if not authorization:
        return None
    return {"role": "super_admin", "username": "admin"}

# ============ YOUTUBE UTILS ============

def get_youtube_video_id(url: str) -> Optional[str]:
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})',
        r'(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})',
        r'(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def parse_duration(duration: str) -> str:
    match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration)
    if not match:
        return "0:00"
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    if hours > 0:
        return f"{hours}:{minutes:02d}:{seconds:02d}"
    return f"{minutes}:{seconds:02d}"

# ============ LIVRES DE LA BIBLE ============

LIVRES_BIBLE = [
    "Genèse", "Exode", "Lévitique", "Nombres", "Deutéronome",
    "Josué", "Juges", "Ruth", "1 Samuel", "2 Samuel",
    "1 Rois", "2 Rois", "1 Chroniques", "2 Chroniques",
    "Esdras", "Néhémie", "Esther", "Job", "Psaumes",
    "Proverbes", "Ecclésiaste", "Cantique des Cantiques",
    "Ésaïe", "Jérémie", "Lamentations", "Ézéchiel", "Daniel",
    "Osée", "Joël", "Amos", "Abdias", "Jonas", "Michée",
    "Nahum", "Habakuk", "Sophonie", "Aggée", "Zacharie", "Malachie",
    "Matthieu", "Marc", "Luc", "Jean", "Actes",
    "Romains", "1 Corinthiens", "2 Corinthiens", "Galates",
    "Éphésiens", "Philippiens", "Colossiens",
    "1 Thessaloniciens", "2 Thessaloniciens",
    "1 Timothée", "2 Timothée", "Tite", "Philémon",
    "Hébreux", "Jacques", "1 Pierre", "2 Pierre",
    "1 Jean", "2 Jean", "3 Jean", "Jude", "Apocalypse"
]

# ============ ENDPOINTS ============

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "pain-du-jour"}

@app.get("/api/pain-du-jour/livres")
async def get_livres():
    return LIVRES_BIBLE

@app.post("/api/pain-du-jour/youtube-info")
async def get_youtube_info(request: YouTubeVideoRequest):
    video_id = get_youtube_video_id(request.url)
    if not video_id:
        raise HTTPException(status_code=400, detail="URL YouTube invalide")
    
    # Utiliser yt-dlp pour récupérer les infos
    try:
        import subprocess
        import json
        
        result = subprocess.run(
            ['yt-dlp', '--dump-json', '--no-download', request.url],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            data = json.loads(result.stdout)
            duration_seconds = data.get('duration', 0)
            hours = duration_seconds // 3600
            minutes = (duration_seconds % 3600) // 60
            seconds = duration_seconds % 60
            
            if hours > 0:
                duration_str = f"{hours}:{minutes:02d}:{seconds:02d}"
            else:
                duration_str = f"{minutes}:{seconds:02d}"
            
            return {
                "video_id": video_id,
                "title": data.get('title', 'Titre non disponible'),
                "thumbnail_url": data.get('thumbnail', f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"),
                "duration": duration_str,
                "view_count": data.get('view_count', 0),
                "like_count": data.get('like_count', 0),
                "channel_title": data.get('uploader', 'Chaîne inconnue')
            }
    except Exception as e:
        print(f"yt-dlp error: {e}")
    
    # Fallback basique
    return {
        "video_id": video_id,
        "title": "Vidéo YouTube",
        "thumbnail_url": f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg",
        "duration": "?:??",
        "view_count": 0,
        "like_count": 0,
        "channel_title": "YouTube"
    }

@app.get("/api/pain-du-jour/today")
async def get_pain_du_jour_today():
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    content = await db.pain_du_jour.find_one({"date": today}, {"_id": 0})
    return content or {"date": today, "versets": []}

@app.get("/api/pain-du-jour/{date}")
async def get_pain_du_jour(date: str):
    content = await db.pain_du_jour.find_one({"date": date}, {"_id": 0})
    return content or {"date": date, "versets": []}

@app.post("/api/pain-du-jour")
async def save_pain_du_jour(content: PainDuJourContent):
    doc = content.model_dump()
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.pain_du_jour.update_one(
        {"date": content.date},
        {"$set": doc},
        upsert=True
    )
    return {"message": "Contenu enregistré", "date": content.date}

@app.post("/api/pain-du-jour/click")
async def track_click(data: ClickTrack):
    week = datetime.strptime(data.date, "%Y-%m-%d").strftime("%Y-S%W")
    field = f"clicks_{data.type}"
    
    await db.pain_du_jour_stats.update_one(
        {"semaine": week},
        {"$inc": {field: 1}},
        upsert=True
    )
    return {"message": "Click tracked"}

@app.post("/api/pain-du-jour/sondage")
async def submit_sondage(sondage: SondagePainDuJour):
    week = datetime.strptime(sondage.date, "%Y-%m-%d").strftime("%Y-S%W")
    
    update = {"$inc": {"total_reponses": 1}}
    
    if sondage.lecture_reponse == "Oui":
        update["$inc"]["lecture_oui"] = 1
    elif sondage.lecture_reponse == "Non":
        update["$inc"]["lecture_non"] = 1
    else:
        update["$inc"]["lecture_partiel"] = 1
    
    if sondage.video_reponse == "Oui":
        update["$inc"]["video_oui"] = 1
    elif sondage.video_reponse == "Non":
        update["$inc"]["video_non"] = 1
    else:
        update["$inc"]["video_partiel"] = 1
    
    await db.pain_du_jour_stats.update_one(
        {"semaine": week},
        update,
        upsert=True
    )
    return {"message": "Sondage enregistré"}

@app.get("/api/pain-du-jour/stats/{annee}")
async def get_pain_du_jour_stats(annee: int):
    stats = await db.pain_du_jour_stats.find(
        {"semaine": {"$regex": f"^{annee}-"}},
        {"_id": 0}
    ).to_list(100)
    return stats

@app.get("/api/pain-du-jour/programmation/{semaine}")
async def get_programmation_semaine(semaine: str):
    programmation = await db.pain_du_jour_programmation.find_one(
        {"semaine": semaine},
        {"_id": 0}
    )
    
    if not programmation:
        return {
            "semaine": semaine,
            "jours": {
                "lundi": {"lien_enseignement": "", "titre_enseignement": "", "versets": []},
                "mardi": {"lien_enseignement": "", "titre_enseignement": "", "versets": []},
                "mercredi": {"lien_enseignement": "", "titre_enseignement": "", "versets": []},
                "jeudi": {"lien_enseignement": "", "titre_enseignement": "", "versets": []},
                "vendredi": {"lien_enseignement": "", "titre_enseignement": "", "versets": []}
            }
        }
    
    return programmation

@app.post("/api/pain-du-jour/programmation")
async def save_programmation_semaine(data: dict):
    semaine = data.get("semaine")
    jours = data.get("jours", {})
    
    if not semaine:
        raise HTTPException(status_code=400, detail="Semaine requise")
    
    await db.pain_du_jour_programmation.update_one(
        {"semaine": semaine},
        {"$set": {
            "semaine": semaine,
            "jours": jours,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    # Appliquer aux dates correspondantes
    try:
        match = re.match(r'(\d{4})-W(\d{2})', semaine)
        if match:
            year = int(match.group(1))
            week = int(match.group(2))
            
            jan1 = datetime(year, 1, 1)
            days_to_first_monday = (7 - jan1.weekday()) % 7
            first_monday = jan1 + timedelta(days=days_to_first_monday)
            target_monday = first_monday + timedelta(weeks=week - 1)
            if jan1.weekday() <= 3:
                target_monday -= timedelta(weeks=1)
            
            jour_mapping = {"lundi": 0, "mardi": 1, "mercredi": 2, "jeudi": 3, "vendredi": 4}
            
            for jour_nom, jour_data in jours.items():
                if jour_nom in jour_mapping and jour_data.get("lien_enseignement"):
                    jour_offset = jour_mapping[jour_nom]
                    date_jour = target_monday + timedelta(days=jour_offset)
                    date_str = date_jour.strftime("%Y-%m-%d")
                    
                    await db.pain_du_jour.update_one(
                        {"date": date_str},
                        {"$set": {
                            "date": date_str,
                            "lien_enseignement": jour_data.get("lien_enseignement", ""),
                            "titre_enseignement": jour_data.get("titre_enseignement", ""),
                            "versets": jour_data.get("versets", []),
                            "lien_priere": jour_data.get("lien_priere", ""),
                            "titre_priere": jour_data.get("titre_priere", ""),
                            "programmation_auto": True,
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }},
                        upsert=True
                    )
    except Exception as e:
        print(f"Error applying programmation: {e}")
    
    return {"message": "Programmation enregistrée et appliquée aux dates"}

@app.get("/api/pain-du-jour/programmations")
async def get_all_programmations():
    programmations = await db.pain_du_jour_programmation.find(
        {},
        {"_id": 0}
    ).sort("semaine", -1).to_list(52)
    return programmations

# Quiz endpoints
@app.post("/api/pain-du-jour/quiz/submit")
async def submit_quiz(submission: QuizSubmission):
    doc = {
        "date": submission.date,
        "answers": submission.answers,
        "score": submission.score,
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }
    await db.pain_du_jour_quiz_submissions.insert_one(doc)
    
    # Update stats
    await db.pain_du_jour_quiz_stats.update_one(
        {"date": submission.date},
        {
            "$inc": {"total_submissions": 1, "total_score": submission.score},
            "$push": {"scores": submission.score}
        },
        upsert=True
    )
    
    return {"message": "Quiz soumis", "score": submission.score}

@app.get("/api/pain-du-jour/quiz/stats/{date}")
async def get_quiz_stats(date: str):
    stats = await db.pain_du_jour_quiz_stats.find_one({"date": date}, {"_id": 0})
    if not stats:
        return {"date": date, "total_submissions": 0, "average_score": 0}
    
    avg = stats.get("total_score", 0) / max(stats.get("total_submissions", 1), 1)
    return {
        "date": date,
        "total_submissions": stats.get("total_submissions", 0),
        "average_score": round(avg, 1)
    }

# Transcription (YouTube-transcript-api)
@app.post("/api/pain-du-jour/transcription")
async def fetch_transcription(request: FetchTranscriptionRequest):
    video_id = get_youtube_video_id(request.youtube_url)
    if not video_id:
        raise HTTPException(status_code=400, detail="URL YouTube invalide")
    
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        
        # Essayer français d'abord
        try:
            transcript = transcript_list.find_transcript(['fr'])
        except:
            try:
                transcript = transcript_list.find_generated_transcript(['fr'])
            except:
                transcript = transcript_list.find_transcript(['en'])
        
        transcript_data = transcript.fetch()
        full_text = " ".join([entry['text'] for entry in transcript_data])
        
        return {
            "video_id": video_id,
            "transcript": full_text,
            "language": transcript.language,
            "segments_count": len(transcript_data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur transcription: {str(e)}")

# Génération résumé et quiz avec IA
@app.post("/api/pain-du-jour/generate-resume-quiz")
async def generate_resume_quiz(request: GenerateResumeQuizRequest):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="Clé LLM non configurée")
    
    try:
        from emergentintegrations.llm.chat import chat, UserMessage
        
        prompt = f"""Tu es un assistant chrétien expert en théologie.

Analyse cet enseignement biblique et génère:
1. Un résumé structuré
2. Un quiz de 5 questions

TITRE: {request.titre_message}

TRANSCRIPTION (à partir de la minute {request.minute_debut}):
{request.transcription[:8000]}

Réponds en JSON avec cette structure exacte:
{{
  "resume": {{
    "titre": "Titre de l'enseignement",
    "resume": "Résumé en 3-4 paragraphes",
    "points_cles": ["Point 1", "Point 2", "Point 3"],
    "versets_cites": ["Jean 3:16", "Romains 8:28"],
    "citations": ["Citation mémorable 1", "Citation 2"]
  }},
  "quiz": [
    {{
      "question": "Question 1",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0
    }}
  ]
}}"""

        response = await chat(
            api_key=EMERGENT_LLM_KEY,
            model="gpt-4o",
            messages=[UserMessage(content=prompt)]
        )
        
        import json
        content = response.content
        json_match = re.search(r'\{[\s\S]*\}', content)
        if json_match:
            result = json.loads(json_match.group())
            return result
        
        raise HTTPException(status_code=500, detail="Format de réponse invalide")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur génération: {str(e)}")

# Main
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
