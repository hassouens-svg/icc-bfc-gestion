"""Configuration de l'application, lue depuis les variables d'environnement (.env)."""
import os

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./icc.db")
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-a-changer")
TOKEN_EXPIRE_MINUTES = int(os.getenv("TOKEN_EXPIRE_MINUTES", "720"))
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
SEED_DEMO_DATA = os.getenv("SEED_DEMO_DATA", "true").lower() == "true"
