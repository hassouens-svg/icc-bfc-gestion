"""
Routes pour le module My Events Church / Gestion de Projets
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import List, Optional
from datetime import datetime, timezone
import os

# Import des modèles et dépendances depuis server.py (à faire après)
# Les imports seront ajoutés dans server.py directement

events_router = APIRouter(prefix="/api/events", tags=["events"])

# Les endpoints seront ajoutés directement dans server.py pour éviter les problèmes d'imports circulaires
