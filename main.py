import os
import json
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from src.matching import evaluate_matching
from src.scraper import search_online_opportunities

app = FastAPI(
    title="Buscador Inteligente de Financiamiento - Corrientes",
    description="Aplicación para buscar y evaluar oportunidades de financiamiento nacionales e internacionales enfocadas en Corrientes.",
    version="1.0.0"
)

# Permitir CORS para facilitar desarrollo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ruta del archivo de datos
DATA_FILE = os.path.join(os.path.dirname(__file__), "data", "convocatorias.json")

def load_convocatorias() -> List[dict]:
    """Carga las convocatorias locales de la base de datos JSON."""
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error cargando convocatorias.json: {e}")
        return []

class ProjectMatchRequest(BaseModel):
    project_description: str

@app.get("/api/convocatorias")
def get_convocatorias(
    tematica: Optional[str] = None,
    ambito: Optional[str] = None,
    destinatario: Optional[str] = None
):
    """Devuelve las convocatorias guardadas aplicando filtros opcionales."""
    convocatorias = load_convocatorias()
    
    if tematica:
        convocatorias = [c for c in convocatorias if c["tematica"].lower() == tematica.lower()]
    if ambito:
        convocatorias = [c for c in convocatorias if c["ambito"].lower() == ambito.lower()]
    if destinatario:
        convocatorias = [
            c for c in convocatorias 
            if any(destinatario.lower() in d.lower() for d in c["destinatarios"])
        ]
        
    return convocatorias

@app.post("/api/match")
def match_project(request: ProjectMatchRequest):
    """Evalúa la descripción de un proyecto contra las convocatorias usando IA o Heurísticas."""
    convocatorias = load_convocatorias()
    if not convocatorias:
        raise HTTPException(status_code=404, detail="No hay convocatorias cargadas para evaluar.")
        
    try:
        results = evaluate_matching(request.project_description, convocatorias)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error evaluando el proyecto: {str(e)}")

@app.get("/api/search-web")
def search_web(query: str = Query(..., description="Términos de búsqueda para financiamiento")):
    """Realiza una búsqueda web en tiempo real de nuevas oportunidades."""
    try:
        results = search_online_opportunities(query)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en la búsqueda web: {str(e)}")

# Ruta del archivo de noticias
NOTICIAS_FILE = os.path.join(os.path.dirname(__file__), "data", "noticias.json")

def load_noticias() -> List[dict]:
    """Carga las noticias y novedades locales."""
    if not os.path.exists(NOTICIAS_FILE):
        return []
    try:
        with open(NOTICIAS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error cargando noticias.json: {e}")
        return []

@app.get("/api/noticias")
def get_noticias():
    """Devuelve las noticias y novedades de inversión."""
    return load_noticias()

# Montar los archivos estáticos para la interfaz de usuario
# Nota: La carpeta 'static' debe existir
static_dir = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)

app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
def read_root():
    """Sirve la página web principal."""
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {
        "status": "online",
        "message": "Buscador de Financiamiento API está activo. Crea static/index.html para ver el Frontend."
    }
