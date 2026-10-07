"""
Point d'entrée de l'API.

Lancer en local :  uvicorn app.main:app --reload
Documentation interactive : http://localhost:8000/docs
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ORIGINS, SEED_DEMO_DATA
from .database import Base, SessionLocal, engine
from .routers import admin, affectations, agenda, auth, discipolat, familles, fideles, meta, public, stats
from .seed import seed


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed(db, demo=SEED_DEMO_DATA)
    yield


app = FastAPI(
    title="My Church ICC App",
    description="Plateforme centralisée — une seule base de données : les fidèles au cœur du système.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 👉 Pour ajouter un module : créer app/routers/mon_module.py puis l'ajouter ici.
for module in (auth, meta, fideles, familles, discipolat, affectations, agenda, stats, admin, public):
    app.include_router(module.router)


@app.get("/api/health", tags=["Système"])
def health():
    return {"status": "ok"}
